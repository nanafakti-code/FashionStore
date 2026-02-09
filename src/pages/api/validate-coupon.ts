/**
 * API: /api/validate-coupon
 * ========================
 * Validates coupon for user and cart
 * Called from checkout before order creation
 */

import type { APIRoute } from 'astro';
import { validateCoupon } from '@/lib/couponService';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { code, userId, cartTotal } = await request.json();

    if (!code || !userId || cartTotal === undefined) {
      return new Response(
        JSON.stringify({ error: 'Parámetros requeridos: code, userId, cartTotal' }),
        { status: 400 }
      );
    }

    const result = await validateCoupon(code, userId, cartTotal);

    return new Response(
      JSON.stringify(result),
      { status: result.valid ? 200 : 400 }
    );
  } catch (error) {
    console.error('[VALIDATE COUPON API]', error);
    return new Response(
      JSON.stringify({ 
        valid: false,
        error: 'Error al validar cupón' 
      }),
      { status: 500 }
    );
  }
};
