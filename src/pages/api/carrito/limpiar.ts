import type { APIRoute } from 'astro';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

/**
 * DELETE: Vacía completamente el carrito del usuario
 */
export const DELETE: APIRoute = async (_context) => {
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
        JSON.stringify({ error: 'Carrito no encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Eliminar todos los items del carrito
    const { error } = await supabase
      .from('carrito_items')
      .delete()
      .eq('carrito_id', carritoData.id);

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, message: 'Carrito vaciado correctamente' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error clearing cart:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
