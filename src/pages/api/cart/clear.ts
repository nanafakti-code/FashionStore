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
import { supabase as supabaseAuth } from '@/lib/supabase';


const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

export const POST: APIRoute = async (context) => {
  try {
    // Verificar variables de entorno
    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: 'Configuración del servidor incompleta' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await context.request.json();
    const { userId } = body;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar identidad del usuario autenticado
    let token = context.cookies.get('sb-access-token')?.value;
    if (!token) {
      const authHeader = context.request.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      }
    }

    if (token) {
      const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
      if (authError || !user || user.id !== userId) {
        return new Response(
          JSON.stringify({ error: 'No autorizado' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'Autenticación requerida' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    let itemsRemoved = 0;
    let method = 'none';

    // MÉTODO 1: Usar la tabla cart_items (estructura actual)
    try {
      const { data: deleted, error: deleteError } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', userId)
        .select('id');

      if (deleteError) {
        console.error('[CART-CLEAR] Error eliminando de cart_items:', deleteError);
      } else if (deleted && deleted.length > 0) {
        itemsRemoved += deleted.length;
        method = 'cart_items';
      }
    } catch (e) {
      console.error('[CART-CLEAR] Error en método 1 (cart_items):', e);
    }

    // MÉTODO 2 (Fallback): Tabla 'carrito' con 'usuario_id'
    if (itemsRemoved === 0) {
      try {
        const { data: deleted, error: deleteError } = await supabase
          .from('carrito')
          .delete()
          .eq('usuario_id', userId)
          .select('id');

        if (deleteError) {
          console.error('[CART-CLEAR] Error eliminando de carrito:', deleteError);
        } else if (deleted && deleted.length > 0) {
          itemsRemoved += deleted.length;
          method = 'carrito';
        }
      } catch (e) {
        console.error('[CART-CLEAR] Error en método 2 (carrito):', e);
      }
    }

    // Limpiar reservas de carrito si existen
    try {
      await supabase
        .from('cart_reservations')
        .delete()
        .eq('user_id', userId);
    } catch (e) {
      // Tabla puede no existir, ignorar
    }
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
    console.error('[CART-CLEAR] Error');
    return new Response(
      JSON.stringify({
        error: 'Error interno del servidor'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
