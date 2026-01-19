/**
 * SERVICIO DE RESERVAS DE CARRITO
 * ================================
 * Maneja las reservas de 1 minuto para los productos del carrito
 */

import { supabase } from './supabase';

/**
 * Obtener tiempo restante de una reserva
 */
export async function getReservationTimeRemaining(productId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .rpc('get_reservation_time_remaining', {
        p_product_id: productId
      });

    if (error) throw error;
    return data?.[0]?.expires_in_seconds || 0;
  } catch (error) {
    console.error('Error getting reservation time:', error);
    return 0;
  }
}

/**
 * Limpiar reservas expiradas y restaurar stock
 */
export async function cleanupExpiredReservations(): Promise<{ cleaned: number; restored: number }> {
  try {
    const { data, error } = await supabase
      .rpc('cleanup_expired_reservations');

    if (error) throw error;
    return {
      cleaned: data?.[0]?.items_cleaned || 0,
      restored: data?.[0]?.stock_restored || 0
    };
  } catch (error) {
    console.error('Error cleaning up reservations:', error);
    return { cleaned: 0, restored: 0 };
  }
}

/**
 * Crear una reserva para un producto
 */
export async function createCartReservation(productId: string, quantity: number): Promise<boolean> {
  try {
    console.log('🔄 Llamando RPC create_cart_reservation con:', { p_product_id: productId, p_quantity: quantity });
    
    const { data, error } = await supabase
      .rpc('create_cart_reservation', {
        p_product_id: productId,
        p_quantity: quantity
      });

    console.log('📦 Respuesta RPC:', { data, error });

    if (error) {
      console.error('❌ Error en RPC:', error);
      throw error;
    }
    
    const success = data?.[0]?.success || false;
    console.log('✅ Reserva creada exitosamente:', success);
    return success;
  } catch (error) {
    console.error('❌ Error creating reservation:', error);
    return false;
  }
}
