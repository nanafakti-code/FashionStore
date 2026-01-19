/**
 * FASHIONSTORE - COUPON SERVICE
 * =============================
 * Sistema completo de cupones de descuento
 */

import { supabase } from './supabase';

export interface CouponValidation {
  valid: boolean;
  message: string;
  tipo: string | null;
  valor: number | null;
  descuento_calculado: number;
  cupon_id: string | null;
}

export interface AppliedCoupon {
  codigo: string;
  tipo: string;
  valor: number;
  descuento: number;
  cupon_id: string;
}

/**
 * Validar un cupón de descuento
 */
export async function validateCoupon(codigo: string, subtotal: number): Promise<CouponValidation> {
  try {
    const { data, error } = await supabase
      .rpc('validate_coupon', { 
        p_codigo: codigo.toUpperCase(), 
        p_subtotal: subtotal 
      });

    if (error) {
      console.error('Error validating coupon:', error);
      return {
        valid: false,
        message: 'Error al validar el cupón',
        tipo: null,
        valor: null,
        descuento_calculado: 0,
        cupon_id: null
      };
    }

    // La RPC devuelve un array con un solo elemento
    const result = Array.isArray(data) ? data[0] : data;
    
    return {
      valid: result?.valid || false,
      message: result?.message || 'Cupón no válido',
      tipo: result?.tipo || null,
      valor: result?.valor || null,
      descuento_calculado: result?.descuento_calculado || 0,
      cupon_id: result?.cupon_id || null
    };
  } catch (error) {
    console.error('Error in validateCoupon:', error);
    return {
      valid: false,
      message: 'Error de conexión',
      tipo: null,
      valor: null,
      descuento_calculado: 0,
      cupon_id: null
    };
  }
}

/**
 * Guardar cupón aplicado en localStorage
 */
export function saveAppliedCoupon(coupon: AppliedCoupon): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('fashionstore_applied_coupon', JSON.stringify(coupon));
    window.dispatchEvent(new Event('couponUpdated'));
  }
}

/**
 * Obtener cupón aplicado del localStorage
 */
export function getAppliedCoupon(): AppliedCoupon | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const couponStr = localStorage.getItem('fashionstore_applied_coupon');
    return couponStr ? JSON.parse(couponStr) : null;
  } catch {
    return null;
  }
}

/**
 * Eliminar cupón aplicado
 */
export function removeAppliedCoupon(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('fashionstore_applied_coupon');
    window.dispatchEvent(new Event('couponUpdated'));
  }
}

/**
 * Calcular totales con cupón aplicado
 */
export function calculateTotalsWithCoupon(
  subtotal: number, 
  coupon: AppliedCoupon | null
): { subtotal: number; descuento: number; impuestos: number; total: number } {
  let descuento = 0;
  
  if (coupon) {
    descuento = coupon.descuento;
  }
  
  const subtotalConDescuento = subtotal - descuento;
  const impuestos = Math.round(subtotalConDescuento * 0.21); // 21% IVA
  const total = subtotalConDescuento + impuestos;
  
  return {
    subtotal,
    descuento,
    impuestos,
    total
  };
}
