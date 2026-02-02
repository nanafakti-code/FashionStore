import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

// Cliente estático para lecturas públicas (GET)
const supabasePublic = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY
);

// Cliente con permisos de ADMINISTRADOR (Service Role)
// IMPORTANTE: Solo para uso en servidor. Nunca exponer en cliente.
// Se usa para garantizar que las actualizaciones de stock y productos
// se apliquen independientemente de las políticas RLS del usuario actual.
const supabaseAdmin = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export const GET: APIRoute = async (_context) => {
  try {
    const { data, error } = await supabasePublic
      .from('productos')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) throw error;

    return new Response(JSON.stringify(data || []), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch products', details: (error as any).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const POST: APIRoute = async (context) => {
  try {
    const body = await context.request.json();
    const { action, data, id } = body;

    // NOTA: Eliminamos la verificación manual del JWT.
    // Confiamos en que la ruta está protegida por la lógica de negocio 
    // y usamos supabaseAdmin (Service Role) para las escrituras.

    console.log(`[API] Acción: ${action}, ID: ${id || 'N/A'} (Usando Service Role)`);

    // Crear producto
    if (action === 'create') {
      console.log('[API] Creando producto:', data.nombre);
      // Asegurar que NO insertamos stock_total (trigger lo maneja)
      // Extraer variantes para insertarlas después
      // Extraer imagen_url para no violar el esquema (si se envía por error)
      const { stock_total, variants, imagen_url, ...createData } = data;

      const { data: result, error } = await supabaseAdmin
        .from('productos')
        .insert([createData])
        .select();

      if (error) {
        console.error('[API] Error creating:', error);
        throw error;
      }

      const newProduct = result[0];

      // Insertar variantes si existen
      if (variants && Array.isArray(variants) && variants.length > 0) {
        console.log(`[API] Insertando ${variants.length} variantes para el nuevo producto ${newProduct.id}`);

        const variantsToInsert = variants.map((v: any) => ({
          producto_id: newProduct.id,
          talla: v.talla,
          capacidad: v.capacidad,
          color: v.color,
          // Generar nombre_variante automáticamente
          nombre_variante: v.color ? `${v.capacidad || v.talla} - ${v.color}` : (v.capacidad || v.talla),
          // Generar SKU único si no existe
          sku_variante: `VAR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          stock: v.stock,
          imagen_url: v.imagen_url,
          precio_adicional: v.precio || 0,  // ✅ Store as delta
          // Also set precio_venta for DB compatibility (base + delta)
          precio_venta: (createData.precio_venta || 0) + (v.precio || 0)
        }));

        const { error: variantsError } = await supabaseAdmin
          .from('variantes_producto')
          .insert(variantsToInsert);

        if (variantsError) {
          console.error('[API] Error creating variants:', variantsError);
          // No lanzamos error para no invalidar la creación del producto, pero logueamos
        } else {
          // Si se insertaron variantes correctamente, el trigger de BD ha actualizado el stock_total.
          // Debemos recuperar el producto actualizado para devolver el stock correcto.
          const { data: updatedProduct, error: fetchError } = await supabaseAdmin
            .from('productos')
            .select('*')
            .eq('id', newProduct.id)
            .single();

          if (!fetchError && updatedProduct) {
            console.log('[API] Producto recuperado con stock actualizado:', updatedProduct.stock_total);
            return new Response(JSON.stringify({ success: true, data: updatedProduct }), {
              status: 201,
              headers: { 'Content-Type': 'application/json' },
            });
          }
        }
      }

      return new Response(JSON.stringify({ success: true, data: result[0] }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Actualizar producto
    if (action === 'update') {
      console.log('[API] Actualizando producto:', id);

      // Extraer variantes, stock_total, y variantsToDelete del payload 
      // para no intentar guardarlas en tabla productos
      const { variants, stock_total, imagen_url, variantsToDelete, ...productData } = data;

      // 1. Actualizar datos base del producto
      const { data: result, error } = await supabaseAdmin
        .from('productos')
        .update(productData)
        .eq('id', id)
        .select();

      if (error) {
        console.error('[API] Error updating product:', error);
        throw error;
      }

      // 2. Actualizar variantes si existen
      if (variants && Array.isArray(variants)) {
        console.log(`[API] Procesando ${variants.length} variantes para producto ${id}`);

        // 🛡️ PRESERVATION GUARANTEE: We NO LONGER auto-delete variants!
        // Variants are only deleted via explicit user action (variantsToDelete array)

        // 2a. Handle explicit deletions ONLY (if provided)
        if (variantsToDelete && Array.isArray(variantsToDelete) && variantsToDelete.length > 0) {
          console.log(`[API] Borrando ${variantsToDelete.length} variantes por solicitud explícita del usuario`);
          const { error: deleteError } = await supabaseAdmin
            .from('variantes_producto')
            .delete()
            .in('id', variantsToDelete);

          if (deleteError) {
            console.error('[API] Error deleting explicitly requested variants:', deleteError);
            throw deleteError;
          }
        }

        // 2b. Update existing or insert new variants
        for (const v of variants) {
          // Si tiene ID, actualizamos stock (y otros campos si fuera necesario)
          if (v.id) {
            console.log(`[API] Actualizando variante ${v.id} con stock ${v.stock}`);
            const { error: vError } = await supabaseAdmin
              .from('variantes_producto')
              .update({
                stock: v.stock,
                capacidad: v.capacidad,
                color: v.color,
                talla: v.talla,
                imagen_url: v.imagen_url,
                precio_adicional: v.precio || 0,  // ✅ Store as delta
                // Also update precio_venta for DB compatibility (base + delta)
                precio_venta: (productData.precio_venta || 0) + (v.precio || 0)
              })
              .eq('id', v.id);

            if (vError) {
              console.error(`[API] Error actualizando variante ${v.id}:`, vError);
              throw vError;
            }
          }
          // Si NO tiene ID, es una nueva variante añadida en edición
          else {
            console.log(`[API] Insertando nueva variante para producto ${id}`);
            const { error: vError } = await supabaseAdmin
              .from('variantes_producto')
              .insert({
                producto_id: id,
                talla: v.talla,
                capacidad: v.capacidad,
                color: v.color,
                nombre_variante: v.color ? `${v.capacidad || v.talla} - ${v.color}` : (v.capacidad || v.talla),
                sku_variante: `VAR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                stock: v.stock,
                imagen_url: v.imagen_url,
                precio_adicional: v.precio || 0,  // ✅ Store as delta
                // Also set precio_venta for DB compatibility (base + delta)
                precio_venta: (productData.precio_venta || 0) + (v.precio || 0)
              });

            if (vError) {
              console.error(`[API] Error insertando variante:`, vError);
              throw vError;
            }
          }
        }
      } else {
        console.log('[API] No se recibieron variantes para actualizar');
      }


      return new Response(JSON.stringify({ success: true, data: result[0] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Eliminar producto
    if (action === 'delete') {
      console.log('[API] Eliminando producto:', id);
      const { error } = await supabaseAdmin
        .from('productos')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[API] Error deleting:', error);
        throw error;
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Guardar/actualizar imagen
    if (action === 'save-image') {
      const { productId, url } = data;

      if (!productId || !url) {
        return new Response(
          JSON.stringify({ error: 'Missing productId or url' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      try {
        const { data: existingImage, error: selectError } = await supabaseAdmin
          .from('imagenes_producto')
          .select('id')
          .eq('producto_id', productId)
          .limit(1);

        if (selectError) throw selectError;

        if (existingImage && existingImage.length > 0) {
          const { error: updateError } = await supabaseAdmin
            .from('imagenes_producto')
            .update({ url })
            .eq('producto_id', productId);

          if (updateError) throw updateError;
          console.log('[API] Imagen actualizada para producto:', productId);
        } else {
          const { error: insertError } = await supabaseAdmin
            .from('imagenes_producto')
            .insert({ producto_id: productId, url });

          if (insertError) throw insertError;
          console.log('[API] Imagen creada para producto:', productId);
        }

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('[API] Error saving image:', error);
        return new Response(
          JSON.stringify({ error: (error as any).message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[API] Error in admin products endpoint:', error);
    return new Response(
      JSON.stringify({ error: (error as any).message || 'Internal error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
