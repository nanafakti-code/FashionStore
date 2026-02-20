import type { APIRoute } from 'astro';
import { supabase } from '@/lib/supabase';

/**
 * Endpoint para limpiar reservas expiradas
 * Se puede ejecutar vía:
 * 1. Cron job externo (ej: easycron, GitHub Actions)
 * 2. Llamada automática después de operaciones del carrito
 * 3. Invocación manual a través de una tarea administrativa
 * 
 * URL: POST /api/cleanup-expired-reservations
 * Headers: 
 *   - Authorization: Bearer <CRON_SECRET_TOKEN> (opcional pero recomendado)
 */

// Variable de entorno para validar llamadas de cron
const CRON_SECRET = import.meta.env.CRON_SECRET || process.env.CRON_SECRET;

export const POST: APIRoute = async (context) => {
  try {
    // Validar token de cron (opcional pero recomendado)
    if (CRON_SECRET) {
      const authHeader = context.request.headers.get('Authorization');
      const token = authHeader?.replace('Bearer ', '');
      
      if (token !== CRON_SECRET) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Ejecutar función de limpieza
    const { data: result, error } = await supabase
      .rpc('cleanup_expired_reservations');

    if (error) {
      console.error('Error cleaning up expired reservations:', error);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Error interno del servidor' 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // result es un array con {items_cleaned, stock_restored}
    const cleanupResult = result && result.length > 0 ? result[0] : { items_cleaned: 0, stock_restored: 0 };

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Limpieza de reservas completada',
        items_cleaned: cleanupResult.items_cleaned,
        stock_restored: cleanupResult.stock_restored,
        timestamp: new Date().toISOString()
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error in cleanup:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Error inesperado durante la limpieza' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// GET: Permite verificar el estado sin hacer cambios
export const GET: APIRoute = async (context) => {
  try {
    // Validar token de cron
    if (CRON_SECRET) {
      const authHeader = context.request.headers.get('Authorization');
      const token = authHeader?.replace('Bearer ', '');
      
      if (token !== CRON_SECRET) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Obtener información de reservas expiradas sin eliminarlas
    const { data: expiredReservations, error } = await supabase
      .from('cart_reservations')
      .select('id, product_id, quantity, user_id, expires_at')
      .lt('expires_at', new Date().toISOString());

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        expired_reservations_count: (expiredReservations || []).length,
        reservations: expiredReservations,
        timestamp: new Date().toISOString()
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error checking expired reservations:', error);
    return new Response(
      JSON.stringify({ error: 'Error al verificar reservas expiradas' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
