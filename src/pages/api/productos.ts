import type { APIRoute } from 'astro';
import { supabase } from '@/lib/supabase';

export const OPTIONS: APIRoute = () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-guest-session-id',
      'Access-Control-Max-Age': '86400',
    }
  });
};


export const GET: APIRoute = async () => {
  try {
    // Obtener todos los productos activos ordenados por nombre
    const { data: productos, error } = await supabase
      .from('productos')
      .select(`
        id, 
        nombre, 
        slug, 
        precio_venta, 
        precio_original, 
        descripcion, 
        stock_total,
        destacado,
        imagenes_producto(url)
      `)
      .eq('activo', true)
      .order('nombre', { ascending: true });

    if (error) {
      return new Response(
        JSON.stringify({ error: 'Error al obtener productos' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const productosFormato = (productos || []).map((p: any) => ({
      id: p.id,
      nombre: p.nombre,
      slug: p.slug,
      precio_venta: p.precio_venta,
      precio_original: p.precio_original,
      descripcion: p.descripcion,
      stock_total: p.stock_total,
      destacado: p.destacado,
      imagen: p.imagenes_producto?.[0]?.url || null,
    }));

    return new Response(
      JSON.stringify({
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
