import type { APIRoute } from 'astro';
import { supabase } from '@/lib/supabase';

export const GET: APIRoute = async ({ params }) => {
  try {
    const slug = params.slug;

    // Obtener producto por slug
    const { data: producto, error } = await supabase
      .from('productos')
      .select(`
        id, 
        nombre, 
        slug, 
        descripcion,
        descripcion_larga,
        precio_venta, 
        precio_original, 
        costo,
        stock_total,
        destacado,
        activo,
        valoracion_promedio,
        total_resenas,
        imagenes_producto(id, url, alt_text, es_principal),
        marca:marcas(nombre, slug),
        categoria:categorias(nombre, slug)
      `)
      .eq('slug', slug)
      .eq('activo', true)
      .single();

    if (error || !producto) {
      return new Response(
        JSON.stringify({ error: 'Producto no encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener reseñas aprobadas
    const { data: resenas } = await supabase
      .from('resenas')
      .select('id, calificacion, titulo, comentario, usuario:usuarios(nombre), creada_en')
      .eq('producto_id', producto.id)
      .eq('estado', 'Aprobada')
      .order('creada_en', { ascending: false })
      .limit(5);

    return new Response(
      JSON.stringify({
        producto,
        resenas: resenas || [],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
