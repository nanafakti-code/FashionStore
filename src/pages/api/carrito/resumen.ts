import type { APIRoute } from 'astro';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

/**
 * GET: Obtiene el resumen del carrito (totales, cantidad de items, etc.)
 */
export const GET: APIRoute = async (_context) => {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'No autenticado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener carrito del usuario
    const { data: carritoData } = await supabase
      .from('carrito')
      .select('id')
      .eq('usuario_id', user.id)
      .single();

    if (!carritoData) {
      return new Response(
        JSON.stringify({
          itemCount: 0,
          subtotal: 0,
          tax: 0,
          total: 0,
          items: []
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener items del carrito
    const { data: itemsData } = await supabase
      .from('carrito_items')
      .select(`
        id,
        cantidad,
        precio_unitario,
        productos!inner (
          id,
          nombre,
          imagen_principal,
          stock_total
        )
      `)
      .eq('carrito_id', carritoData.id);

    const items = (itemsData || []).map((item: any) => ({
      id: item.id,
      producto_id: item.productos.id,
      nombre: item.productos.nombre,
      cantidad: item.cantidad,
      precio: item.precio_unitario,
      total: item.precio_unitario * item.cantidad,
    }));

    // Calcular totales
    const subtotal = items.reduce((sum: number, item: any) => sum + item.total, 0);
    const tax = Math.round(subtotal * 0.21); // 21% IVA
    const total = subtotal + tax;
    const itemCount = items.reduce((sum: number, item: any) => sum + item.cantidad, 0);

    return new Response(
      JSON.stringify({
        itemCount,
        subtotal,
        tax,
        total,
        items,
        success: true
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error getting cart summary:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
