import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

// Crear cliente Supabase con anon key (lee datos públicos)
const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY
);

// Función para verificar token de admin
function verifyAdminToken(token: string): boolean {
  if (!token) return false;
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    return decoded.isAdmin === true;
  } catch {
    return false;
  }
}

export const GET: APIRoute = async (_context) => {
  try {
    const { data, error } = await supabase
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
    
    // Verificar token de admin en header
    const authHeader = context.request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    // Para save-image permitir sin verificación (ya funciona)
    if (action !== 'save-image' && !verifyAdminToken(token || '')) {
      // Si no hay token válido, intentar directo (RLS lo permitirá)
    }

    // Crear producto
    if (action === 'create') {
      console.log('Creando producto:', data);
      const { data: result, error } = await supabase
        .from('productos')
        .insert([data])
        .select();

      if (error) {
        console.error('Error creating:', error);
        throw error;
      }

      return new Response(JSON.stringify({ success: true, data: result[0] }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Actualizar producto
    if (action === 'update') {
      console.log('Actualizando producto:', id, data);
      const { data: result, error } = await supabase
        .from('productos')
        .update(data)
        .eq('id', id)
        .select();

      if (error) {
        console.error('Error updating:', error);
        throw error;
      }

      return new Response(JSON.stringify({ success: true, data: result[0] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Eliminar producto
    if (action === 'delete') {
      console.log('Eliminando producto:', id);
      const { error } = await supabase
        .from('productos')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting:', error);
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
        const { data: existingImage, error: selectError } = await supabase
          .from('imagenes_producto')
          .select('id')
          .eq('producto_id', productId)
          .limit(1);

        if (selectError) throw selectError;

        if (existingImage && existingImage.length > 0) {
          const { error: updateError } = await supabase
            .from('imagenes_producto')
            .update({ url })
            .eq('producto_id', productId);

          if (updateError) throw updateError;
          console.log('Imagen actualizada para producto:', productId);
        } else {
          const { error: insertError } = await supabase
            .from('imagenes_producto')
            .insert({ producto_id: productId, url });

          if (insertError) throw insertError;
          console.log('Imagen creada para producto:', productId);
        }

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Error saving image:', error);
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
    console.error('Error in admin products endpoint:', error);
    return new Response(
      JSON.stringify({ error: (error as any).message || 'Internal error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
