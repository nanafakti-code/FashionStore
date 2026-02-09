/**
 * COUPON SYSTEM - CHECKOUT INTEGRATION EXAMPLE
 * ============================================
 * Shows how to integrate coupon validation & redemption into checkout flow
 */

import { validateCoupon, redeemCoupon } from '@/lib/couponService';
import { supabase } from '@/lib/supabase';

/**
 * SCENARIO: User is at checkout, enters coupon code
 */
export async function handleApplyCoupon(
  couponCode: string,
  userId: string,
  cartTotal: number // in cents
) {
  try {
    // STEP 1: Validate coupon
    const validation = await validateCoupon(couponCode, userId, cartTotal);

    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
        storedCoupon: null,
      };
    }

    // STEP 2: Store in state/context for order creation
    const appliedCoupon = {
      couponId: validation.coupon.id,
      code: validation.coupon.code,
      discountAmount: validation.discountAmount,
      discountType: validation.coupon.discount_type,
      discountValue: validation.coupon.value,
    };

    return {
      success: true,
      error: null,
      storedCoupon: appliedCoupon,
    };
  } catch (error) {
    console.error('Coupon apply error:', error);
    return {
      success: false,
      error: 'Error al procesar el cupón',
      storedCoupon: null,
    };
  }
}

/**
 * SCENARIO: Order has been successfully created in database
 * Now we need to log the coupon usage
 */
export async function redeemCouponOnOrder(
  orderId: number,
  userId: string,
  appliedCoupon?: {
    couponId: number;
    discountAmount: number;
  }
) {
  try {
    if (!appliedCoupon) {
      // No coupon was used, just return success
      return { success: true };
    }

    // STEP 1: Insert coupon usage record
    const redemption = await redeemCoupon(
      appliedCoupon.couponId,
      userId,
      orderId,
      appliedCoupon.discountAmount
    );

    if (!redemption.success) {
      console.error('Failed to log coupon usage:', redemption.error);
      // Note: We don't throw error here because order was already created
      // The coupon failure is just a logging issue
      return { success: false, error: redemption.error };
    }

    return { success: true };
  } catch (error) {
    console.error('Coupon redemption error:', error);
    return { success: false, error: 'Error al registrar cupón' };
  }
}

/**
 * SCENARIO: Calculate order totals WITH coupon discount
 */
export function calculateOrderTotalsWithCoupon(
  subtotal: number, // in cents
  discountAmount: number = 0, // in cents
  taxRate: number = 0.21 // 21% IVA in Spain
): {
  subtotal: number;
  discount: number;
  subtotalAfterDiscount: number;
  taxes: number;
  total: number;
  summary: string;
} {
  const subtotalAfterDiscount = subtotal - discountAmount;
  const taxes = Math.round(subtotalAfterDiscount * taxRate);
  const total = subtotalAfterDiscount + taxes;

  return {
    subtotal,
    discount: discountAmount,
    subtotalAfterDiscount,
    taxes,
    total,
    summary: `€${(subtotal / 100).toFixed(2)} - €${(discountAmount / 100).toFixed(2)} = €${(subtotalAfterDiscount / 100).toFixed(2)} + €${(taxes / 100).toFixed(2)} tax = €${(total / 100).toFixed(2)}`,
  };
}

/**
 * EXAMPLE: React Component Usage (Copy this to .tsx file)
 * 
 * File: src/components/CouponInput.tsx
 */

/*
'use client';
import { useState } from 'react';

export default function CouponInput({ cartTotal, userId, onApply }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleApply = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, userId, cartTotal })
      });

      const data = await res.json();

      if (data.valid) {
        setMessage(`✅ Ahorras €${(data.discountAmount / 100).toFixed(2)}`);
        onApply(data);
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (err) {
      setMessage('❌ Error validating coupon');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleApply} className="space-y-2">
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Código de cupón..."
        className="w-full px-3 py-2 border border-gray-300 rounded"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#00aa45] text-white py-2 rounded hover:bg-green-700"
      >
        {loading ? 'Verificando...' : 'Aplicar Cupón'}
      </button>
      {message && (
        <p className={message.includes('✅') ? 'text-green-600' : 'text-red-600'}>
          {message}
        </p>
      )}
    </form>
  );
}
*/

/**
 * EXAMPLE: Complete Checkout Flow
 */
export async function completeCheckoutWithCoupon(
  cartItems: Array<{ id: number; quantity: number; price: number }>,
  userId: string,
  appliedCoupon?: { couponId: number; discountAmount: number }
) {
  // 1. Calculate subtotal
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // 2. Calculate totals with coupon
  const totals = calculateOrderTotalsWithCoupon(subtotal, appliedCoupon?.discountAmount || 0);

  // 3. Create order in database
  const { data: order, error: orderError } = await supabase
    .from('pedidos')
    .insert({
      usuario_id: userId,
      numero_orden: `ORD-${Date.now()}`,
      subtotal: totals.subtotalAfterDiscount,
      impuestos: totals.taxes,
      descuento: appliedCoupon?.discountAmount || 0,
      total: totals.total,
      estado: 'pendiente_pago',
      items: cartItems,
    })
    .select()
    .single();

  if (orderError || !order) {
    throw new Error('Failed to create order');
  }

  // 4. Redeem coupon (if applied)
  if (appliedCoupon) {
    await redeemCouponOnOrder(order.id, userId, appliedCoupon);
  }

  // 5. Send confirmation email
  // await sendOrderConfirmationEmail(order);

  // 6. Clear cart & redirect
  return {
    success: true,
    orderId: order.id,
    orderNumber: order.numero_orden,
  };
}

/**
 * EXAMPLE SQL: Query to see all coupon redemptions
 */
export const exampleQueries = {
  // Get all coupons used by a specific user
  getUserCouponsUsed: `
    SELECT 
      cu.id,
      cu.used_at,
      cu.discount_amount,
      c.code,
      c.discount_type,
      c.value,
      cu.order_id
    FROM coupon_usages cu
    JOIN coupons c ON cu.coupon_id = c.id
    WHERE cu.user_id = 'user-uuid'
    ORDER BY cu.used_at DESC
  `,

  // Get coupon redemption stats for admin
  getCouponStats: `
    SELECT 
      c.id,
      c.code,
      c.discount_type,
      c.value,
      COUNT(cu.id) as times_redeemed,
      COUNT(DISTINCT cu.user_id) as unique_users,
      SUM(cu.discount_amount) as total_discount_given,
      AVG(cu.discount_amount) as avg_discount,
      c.max_uses_global,
      c.max_uses_global - COUNT(cu.id) as remaining_uses
    FROM coupons c
    LEFT JOIN coupon_usages cu ON c.id = cu.coupon_id
    WHERE c.is_active = true
    GROUP BY c.id
    ORDER BY times_redeemed DESC
  `,

  // Find potential coupon abuse attempts
  findAbuseAttempts: `
    SELECT 
      cu.user_id,
      cu.coupon_id,
      c.code,
      COUNT(*) as attempt_count,
      c.max_uses_per_user,
      STRING_AGG(cu.order_id::text, ', ') as order_ids
    FROM coupon_usages cu
    JOIN coupons c ON cu.coupon_id = c.id
    GROUP BY cu.user_id, cu.coupon_id, c.code, c.max_uses_per_user
    HAVING COUNT(*) > c.max_uses_per_user
  `,
};

/**
 * EXAMPLE: React Component Status Display (Copy to .tsx file)
 * 
 * File: src/components/CouponStatus.tsx
 */

/*
'use client';
import { useEffect, useState } from 'react';
import { validateCoupon } from '@/lib/couponService';

export function CouponStatusComponent({ couponCode }: { couponCode: string }) {
  const [status, setStatus] = useState<'valid' | 'invalid' | 'expired' | 'loading'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    checkCoupon();
  }, [couponCode]);

  const checkCoupon = async () => {
    // Note: Get actual userId and cartTotal from context
    const result = await validateCoupon(couponCode, 'userId', 5000);

    if (result.valid) {
      setStatus('valid');
      setMessage(`✅ Cupón válido: ${result.coupon?.discount_type === 'PERCENTAGE' ? result.coupon?.value + '%' : '€' + result.coupon?.value} de descuento`);
    } else {
      setStatus('invalid');
      setMessage(`❌ ${result.error}`);
    }
  };

  return (
    <div
      className={`p-3 rounded-lg ${
        status === 'valid'
          ? 'bg-green-100 text-green-800'
          : 'bg-red-100 text-red-800'
      }`}
    >
      {message}
    </div>
  );
}
*/
