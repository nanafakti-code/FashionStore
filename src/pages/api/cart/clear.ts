/**
 * LIMPIAR CARRITO DEL USUARIO
 * ===========================
 * Endpoint para vaciar el carrito de un usuario autenticado
 * Se llama desde la página de confirmación de pedido
 * 
 * La tabla real es "cart_items" con columna "user_id"
 * También existe la función RPC "clear_user_cart()"
 */

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

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


const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

export const POST: APIRoute = async (context) => {
  try {
    // Verificar variables de entorno
    if (!supabaseUrl || !supabaseKey) {
      console.error('[CART-CLEAR] ❌ Variables de entorno faltantes:', {
        supabaseUrl: !!supabaseUrl,
        supabaseKey: !!supabaseKey
      });
      return new Response(
        JSON.stringify({ error: 'Configuración del servidor incompleta' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

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

    let itemsRemoved = 0;
    let method = 'none';

    // MÉTODO 1: Usar la tabla cart_items (estructura actual)
    try {
      const { data: cartItems, error: getError } = await supabase
        .from('cart_items')
        .select('id')
        .eq('user_id', userId);

      if (!getError && cartItems && cartItems.length > 0) {
        console.log(`[CART-CLEAR] Encontrados ${cartItems.length} items en 'cart_items'`);

        const { error: deleteError } = await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', userId);

        if (deleteError) {
          console.error('[CART-CLEAR] Error eliminando de cart_items:', deleteError);
        } else {
          itemsRemoved += cartItems.length;
          method = 'cart_items';
          console.log(`[CART-CLEAR] ✅ Eliminados ${cartItems.length} items de 'cart_items'`);
        }
      } else if (getError) {
        console.log('[CART-CLEAR] Tabla cart_items no accesible:', getError.message);
      }
    } catch (e) {
      console.log('[CART-CLEAR] Error con cart_items:', e);
    }

    // MÉTODO 2 (Fallback): Tabla 'carrito' con 'usuario_id'
    if (itemsRemoved === 0) {
      try {
        const { data: carritoItems, error: getError } = await supabase
          .from('carrito')
          .select('id')
          .eq('usuario_id', userId);

        if (!getError && carritoItems && carritoItems.length > 0) {
          console.log(`[CART-CLEAR] Encontrados ${carritoItems.length} items en 'carrito'`);

          const { error: deleteError } = await supabase
            .from('carrito')
            .delete()
            .eq('usuario_id', userId);

          if (deleteError) {
            console.error('[CART-CLEAR] Error eliminando de carrito:', deleteError);
          } else {
            itemsRemoved += carritoItems.length;
            method = 'carrito';
            console.log(`[CART-CLEAR] ✅ Eliminados ${carritoItems.length} items de 'carrito'`);
          }
        }
      } catch (e) {
        console.log('[CART-CLEAR] Tabla carrito no disponible');
      }
    }

    // Limpiar reservas de carrito si existen
    try {
      const { error: reserveError } = await supabase
        .from('cart_reservations')
        .delete()
        .eq('user_id', userId);

      if (!reserveError) {
        console.log('[CART-CLEAR] ✅ Reservas de carrito limpiadas');
      }
    } catch (e) {
      // Tabla puede no existir, ignorar
    }

    console.log(`[CART-CLEAR] ✅ Resultado: ${itemsRemoved} items eliminados (método: ${method})`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Carrito limpiado correctamente',
        userId,
        itemsRemoved,
        method,
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
