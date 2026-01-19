import type { APIRoute } from 'astro';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

/**
 * PUT: Actualiza la cantidad de un item en el carrito
 * Body: { item_id, cantidad }
 */
export const PUT: APIRoute = async (context) => {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'No autenticado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await context.request.json();
    const { item_id, cantidad } = body;

    if (!item_id || !cantidad || cantidad <= 0) {
      return new Response(
        JSON.stringify({ error: 'Campos requeridos: item_id, cantidad (> 0)' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar que el item pertenece al usuario
    const { data: itemData } = await supabase
      .from('carrito_items')
      .select(`
        id,
        carrito:carrito_id (
          usuario_id
        )
      `)
      .eq('id', item_id)
      .single();

    if (!itemData || itemData.carrito.usuario_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'No tienes permisos para actualizar este item' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validar stock
    const { data: stockData } = await supabase
      .from('carrito_items')
      .select('producto_id, productos!inner(stock_total)')
      .eq('id', item_id)
      .single();

    if (stockData && stockData.productos.stock_total < cantidad) {
      return new Response(
        JSON.stringify({ error: 'Stock insuficiente. Disponible: ' + stockData.productos.stock_total }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Actualizar cantidad
    const { error } = await supabase
      .from('carrito_items')
      .update({ cantidad })
      .eq('id', item_id);

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, message: 'Cantidad actualizada' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating cart item:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
