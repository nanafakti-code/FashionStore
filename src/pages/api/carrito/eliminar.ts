import type { APIRoute } from 'astro';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

/**
 * DELETE: Elimina un item específico del carrito
 * Query: ?item_id=xxx
 */
export const DELETE: APIRoute = async (context) => {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'No autenticado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { searchParams } = new URL(context.request.url);
    const itemId = searchParams.get('item_id');

    if (!itemId) {
      return new Response(
        JSON.stringify({ error: 'Parámetro requerido: item_id' }),
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
      .eq('id', itemId)
      .single();

    if (!itemData || itemData.carrito.usuario_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'No tienes permisos para eliminar este item' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Eliminar item
    const { error } = await supabase
      .from('carrito_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, message: 'Producto eliminado del carrito' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error deleting cart item:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
