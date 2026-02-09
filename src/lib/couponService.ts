/**
 * COUPON VALIDATION & REDEMPTION SERVICE
 * ======================================
 * Handles all coupon logic: validation, redemption, and tracking
 * Features: Global limits, per-user limits, expiration, minimum order values
 */

import { supabase } from '@/lib/supabase';

export interface CouponData {
  id: number;
  code: string;
  discount_type: "PERCENTAGE" | "FIXED";
  value: number;
  min_order_value: number | null;
  max_uses_global: number | null;
  max_uses_per_user: number;
  expiration_date: string;
  is_active: boolean;
  assigned_user_id: string | null; // NULL = todos, UUID = solo ese usuario
}

export interface CouponValidationResult {
  valid: boolean;
  error?: string;
  coupon?: CouponData;
  discountAmount?: number; // Final discount in cents
}

export interface RedemptionResult {
  success: boolean;
  error?: string;
  usageId?: number;
}

/**
 * MAIN VALIDATION FUNCTION
 * Validates coupon against all constraints before applying
 * @param code - Coupon code to validate
 * @param userId - Current user ID
 * @param cartTotal - Total cart value in CENTS
 * @returns CouponValidationResult
 */
export async function validateCoupon(
  code: string,
  userId: string,
  cartTotal: number
): Promise<CouponValidationResult> {
  try {
    // 1. FETCH COUPON
    const { data: coupon, error: fetchError } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", code.toUpperCase())
      .eq("is_active", true)
      .single();

    if (fetchError || !coupon) {
      return {
        valid: false,
        error: "Cupón no encontrado o inactivo",
      };
    }

    // 2. CHECK USER ASSIGNMENT (if coupon is for a specific user)
    if (coupon.assigned_user_id && coupon.assigned_user_id !== userId) {
      return {
        valid: false,
        error: "Este cupón no está disponible para tu cuenta",
      };
    }

    // 3. CHECK EXPIRATION DATE
    const now = new Date();
    const expirationDate = new Date(coupon.expiration_date);
    if (now > expirationDate) {
      return {
        valid: false,
        error: "Este cupón ha expirado",
      };
    }

    // 3. CHECK MINIMUM ORDER VALUE
    if (coupon.min_order_value && cartTotal < coupon.min_order_value) {
      const minInEuros = (coupon.min_order_value / 100).toFixed(2);
      return {
        valid: false,
        error: `Compra mínima requerida: €${minInEuros}`,
      };
    }

    // 4. CHECK GLOBAL USAGE LIMIT
    if (coupon.max_uses_global !== null) {
      const { count: globalUsageCount, error: globalError } = await supabase
        .from("coupon_usages")
        .select("id", { count: "exact", head: true })
        .eq("coupon_id", coupon.id);

      if (globalError) throw globalError;

      if ((globalUsageCount || 0) >= coupon.max_uses_global) {
        return {
          valid: false,
          error: "Este cupón ha alcanzado su límite de usos",
        };
      }
    }

    // 5. CHECK USER-SPECIFIC LIMIT (CRITICAL CHECK)
    const { count: userUsageCount, error: userError } = await supabase
      .from("coupon_usages")
      .select("id", { count: "exact", head: true })
      .eq("coupon_id", coupon.id)
      .eq("user_id", userId);

    if (userError) throw userError;

    if ((userUsageCount || 0) >= coupon.max_uses_per_user) {
      return {
        valid: false,
        error: `Ya has usado este cupón (máximo: ${coupon.max_uses_per_user} ${coupon.max_uses_per_user === 1 ? "vez" : "veces"})`,
      };
    }

    // 6. CALCULATE DISCOUNT AMOUNT
    const discountAmount =
      coupon.discount_type === "PERCENTAGE"
        ? Math.round(cartTotal * (coupon.value / 100))
        : Math.round(coupon.value * 100); // Convert euros to cents if needed

    // Ensure discount doesn't exceed cart total
    const finalDiscount = Math.min(discountAmount, cartTotal);

    return {
      valid: true,
      coupon,
      discountAmount: finalDiscount,
    };
  } catch (error) {
    console.error("[COUPON] Validation error:", error);
    return {
      valid: false,
      error: "Error al validar el cupón",
    };
  }
}

/**
 * REDEMPTION FUNCTION
 * Called after order is successfully created
 */
export async function redeemCoupon(
  couponId: number,
  userId: string,
  orderId: number,
  discountAmount: number
): Promise<RedemptionResult> {
  try {
    // 1. Insert usage record
    const { data, error } = await supabase
      .from("coupon_usages")
      .insert({
        coupon_id: couponId,
        user_id: userId,
        order_id: orderId,
        discount_amount: discountAmount,
      })
      .select();

    if (error) throw error;

    console.log(`[COUPON] Redeemed for user ${userId} on order ${orderId}`);

    // 2. Fetch coupon details to decide if we should deactivate
    const { data: coupon } = await supabase
      .from("coupons")
      .select("assigned_user_id, max_uses_global, max_uses_per_user")
      .eq("id", couponId)
      .single();

    if (coupon) {
      let shouldDeactivate = false;

      // EXCLUSIVE coupon (assigned to a specific user) → deactivate after use
      if (coupon.assigned_user_id) {
        shouldDeactivate = true;
        console.log(`[COUPON] Exclusive coupon ${couponId} used by assigned user → deactivating`);
      }

      // GLOBAL coupon with explicit total usage limit → deactivate ONLY when limit reached
      // If max_uses_global is NULL → unlimited, NEVER deactivate
      // Per-user limits are handled via coupon_usages checks, NOT by deactivating the coupon
      if (!shouldDeactivate && coupon.max_uses_global !== null && coupon.max_uses_global > 0) {
        const { count } = await supabase
          .from("coupon_usages")
          .select("id", { count: "exact", head: true })
          .eq("coupon_id", couponId);

        if ((count || 0) >= coupon.max_uses_global) {
          shouldDeactivate = true;
          console.log(`[COUPON] Global limit reached (${count}/${coupon.max_uses_global}) → deactivating`);
        } else {
          console.log(`[COUPON] Global coupon ${couponId}: ${count}/${coupon.max_uses_global} uses, still active`);
        }
      }

      if (shouldDeactivate) {
        await supabase
          .from("coupons")
          .update({ is_active: false })
          .eq("id", couponId);
      } else if (!coupon.assigned_user_id) {
        console.log(`[COUPON] Global coupon ${couponId} remains active for other users`);
      }
    }

    return { success: true, usageId: data?.[0]?.id };
  } catch (error) {
    console.error("[COUPON] Redemption error:", error);
    return { success: false, error: "Error al aplicar el cupón" };
  }
}

/**
 * GET USER'S COUPON HISTORY
 */
export async function getUserCouponHistory(userId: string) {
  try {
    const { data, error } = await supabase
      .from("coupon_usages")
      .select("id, used_at, discount_amount, coupon_id, coupons(code, discount_type, value)")
      .eq("user_id", userId)
      .order("used_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("[COUPON] History fetch error:", error);
    return [];
  }
}

/**
 * GET COUPON STATS (for Admin)
 */
export async function getCouponStats(couponId?: number) {
  try {
    let query = supabase.from("coupon_stats").select("*");
    if (couponId) query = query.eq("id", couponId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("[COUPON] Stats fetch error:", error);
    return [];
  }
}

/**
 * CHECK IF USER CAN USE COUPON
 */
export async function canUserUseCoupon(couponId: number, userId: string): Promise<boolean> {
  try {
    const { data: coupon, error: fetchError } = await supabase
      .from("coupons")
      .select("max_uses_per_user")
      .eq("id", couponId)
      .single();

    if (fetchError || !coupon) return false;

    const { count, error: countError } = await supabase
      .from("coupon_usages")
      .select("id", { count: "exact", head: true })
      .eq("coupon_id", couponId)
      .eq("user_id", userId);

    if (countError) return false;
    return (count || 0) < coupon.max_uses_per_user;
  } catch (error) {
    console.error("[COUPON] Check error:", error);
    return false;
  }
}

/**
 * CALCULATE TOTALS WITH COUPON
 */
export function calculateTotalsWithCoupon(
  subtotal: number,
  discount: number
): { subtotal: number; descuento: number; impuestos: number; total: number } {
  const subtotalConDescuento = subtotal - discount;
  const impuestos = Math.round(subtotalConDescuento * 0.21);
  const total = subtotalConDescuento + impuestos;
  return { subtotal, descuento: discount, impuestos, total };
}
