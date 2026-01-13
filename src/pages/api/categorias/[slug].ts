import type { APIRoute } from 'astro';
import { supabase } from '@/lib/supabase';

export const GET: APIRoute = async ({ params }) => {
  try {
    const slug = params.slug;

    // Obtener categoría
    const { data: categoria, error: catError } = await supabase
      .from('categorias')
      .select('id, nombre, slug, descripcion')
      .eq('slug', slug)
      .eq('activa', true)
      .single();

    if (catError || !categoria) {
      return new Response(
        JSON.stringify({ error: 'Categoría no encontrada' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener productos de esa categoría
    const { data: productos, error: prodError } = await supabase
      .from('productos')
      .select(`
        id, 
        nombre, 
        slug, 
        precio_venta, 
        precio_original, 
        descripcion, 
        stock_total,
        imagenes_producto(url)
      `)
      .eq('categoria_id', categoria.id)
      .eq('activo', true)
      .order('nombre', { ascending: true });

    if (prodError) {
      return new Response(
        JSON.stringify({ error: 'Error al obtener productos' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const productosFormato = (productos || []).map((p) => ({
      id: p.id,
      nombre: p.nombre,
      slug: p.slug,
      precio_venta: p.precio_venta,
      precio_original: p.precio_original,
      descripcion: p.descripcion,
      stock_total: p.stock_total,
      imagen: p.imagenes_producto?.[0]?.url || null,
    }));

    return new Response(
      JSON.stringify({
        categoria,
        productos: productosFormato,
        total: productosFormato.length,
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
