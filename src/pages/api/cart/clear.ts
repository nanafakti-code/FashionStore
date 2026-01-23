/**
 * LIMPIAR CARRITO DEL USUARIO
 * ===========================
 * Endpoint para vaciar el carrito de un usuario autenticado
 * Se llama desde la página de confirmación de pedido
 */

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

export const POST: APIRoute = async (context) => {
  try {
    const body = await context.request.json();
    const { userId } = body;

    if (!userId) {
      console.error('[CART-CLEAR] User ID no proporcionado');
      return new Response(
        JSON.stringify({ error: 'User ID requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[CART-CLEAR] Limpiando carrito para usuario: ${userId}`);

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Obtener items actuales del carrito (para logging)
    const { data: currentItems, error: getError } = await supabase
      .from('carrito')
      .select('id, producto_id, cantidad')
      .eq('usuario_id', userId);

    if (getError) {
      console.error('[CART-CLEAR] Error obteniendo carrito:', getError);
    } else if (currentItems && currentItems.length > 0) {
      console.log(`[CART-CLEAR] ${currentItems.length} items encontrados`);
      currentItems.forEach(item => {
        console.log(`  - Producto ${item.producto_id}: ${item.cantidad} unidades`);
      });
    }

    // Eliminar todos los items del carrito del usuario
    const { error: deleteError } = await supabase
      .from('carrito')
      .delete()
      .eq('usuario_id', userId);

    if (deleteError) {
      console.error('[CART-CLEAR] Error eliminando carrito:', deleteError);
      return new Response(
        JSON.stringify({ 
          error: 'Error eliminando carrito',
          details: deleteError.message 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar que se eliminó
    const { data: verifyItems, error: verifyError } = await supabase
      .from('carrito')
      .select('id')
      .eq('usuario_id', userId);

    if (verifyError) {
      console.error('[CART-CLEAR] Error verificando carrito:', verifyError);
    } else {
      const remainingItems = verifyItems?.length || 0;
      if (remainingItems === 0) {
        console.log(`[CART-CLEAR] ✅ Carrito limpiado correctamente - 0 items restantes`);
      } else {
        console.warn(`[CART-CLEAR] ⚠️ Aún hay ${remainingItems} items en el carrito`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Carrito limpiado correctamente',
        userId,
        itemsRemoved: currentItems?.length || 0,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[CART-CLEAR] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
