/**
 * API: /api/admin/coupons
 * ========================
 * CRUD operations for coupon management
 * POST: Create new coupon
 * GET: List coupons (with stats)
 * PUT: Update coupon
 * DELETE: Delete/deactivate coupon
 */

import type { APIRoute } from 'astro';
import { supabase } from '@/lib/supabase';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { action, ...data } = await request.json();

    if (action === 'create') {
      const {
        code,
        description,
        discount_type,
        value,
        min_order_value,
        max_uses_global,
        max_uses_per_user,
        expiration_date,
      } = data;

      // Validate required fields
      if (!code || !discount_type || !value || !expiration_date) {
        return new Response(
          JSON.stringify({ error: 'Faltan campos requeridos' }),
          { status: 400 }
        );
      }

      // Insert new coupon
      const { data: coupon, error } = await supabase
        .from('coupons')
        .insert({
          code: code.toUpperCase(),
          description,
          discount_type,
          value: parseFloat(value),
          min_order_value: min_order_value ? parseFloat(min_order_value) : null,
          max_uses_global: max_uses_global ? parseInt(max_uses_global) : null,
          max_uses_per_user: max_uses_per_user ? parseInt(max_uses_per_user) : 1,
          expiration_date,
          is_active: true,
          assigned_user_id: data.assigned_user_id || null,
        })
        .select();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, coupon: coupon?.[0] }),
        { status: 201 }
      );
    }

    if (action === 'update') {
      const { id, ...updateData } = data;

      if (!id) {
        return new Response(
          JSON.stringify({ error: 'ID de cupón requerido' }),
          { status: 400 }
        );
      }

      // Build update object with proper types
      const updatePayload: any = {};
      if (updateData.expiration_date) updatePayload.expiration_date = updateData.expiration_date;
      if (updateData.max_uses_global !== undefined) updatePayload.max_uses_global = updateData.max_uses_global;
      if (updateData.is_active !== undefined) updatePayload.is_active = updateData.is_active;
      if (updateData.description !== undefined) updatePayload.description = updateData.description;
      if (updateData.value !== undefined) updatePayload.value = parseFloat(updateData.value);
      if (updateData.assigned_user_id !== undefined) updatePayload.assigned_user_id = updateData.assigned_user_id || null;

      const { data: coupon, error } = await supabase
        .from('coupons')
        .update(updatePayload)
        .eq('id', id)
        .select();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, coupon: coupon?.[0] }),
        { status: 200 }
      );
    }

    if (action === 'deactivate') {
      const { id } = data;

      if (!id) {
        return new Response(
          JSON.stringify({ error: 'ID de cupón requerido' }),
          { status: 400 }
        );
      }

      const { error } = await supabase
        .from('coupons')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Acción no válida' }),
      { status: 400 }
    );
  } catch (error) {
    console.error('[COUPONS API]', error);
    return new Response(
      JSON.stringify({ error: 'Error en el servidor' }),
      { status: 500 }
    );
  }
};

export const GET: APIRoute = async () => {
  try {
    // Get all coupons directly from coupons table (views can have RLS issues)
    const { data: coupons, error } = await supabase
      .from('coupons')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.error('[COUPONS GET] query error:', error);
      // Table may not exist yet – return empty list instead of 500
      return new Response(
        JSON.stringify({ success: true, coupons: [], warning: error.message }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // For each coupon, get usage stats (resilient – never let a sub-query crash)
    const couponsWithStats = await Promise.all(
      (coupons || []).map(async (c: any) => {
        let timesUsed = 0;
        let uniqueUsers = 0;

        try {
          const { count } = await supabase
            .from('coupon_usages')
            .select('id', { count: 'exact', head: true })
            .eq('coupon_id', c.id);
          timesUsed = count || 0;

          const { data: uniqueData } = await supabase
            .from('coupon_usages')
            .select('user_id')
            .eq('coupon_id', c.id);
          uniqueUsers = new Set((uniqueData || []).map((u: any) => u.user_id)).size;
        } catch (_e) {
          // coupon_usages table may not exist yet – ignore
        }

        const remaining = c.max_uses_global ? c.max_uses_global - timesUsed : null;

        // Get assigned user email if assigned
        let assigned_user_email = null;
        if (c.assigned_user_id) {
          try {
            const { data: userData } = await supabase
              .from('usuarios')
              .select('email')
              .eq('id', c.assigned_user_id)
              .single();
            assigned_user_email = userData?.email || null;
          } catch (_e) { /* ignore */ }
        }

        return {
          ...c,
          times_used: timesUsed,
          unique_users: uniqueUsers,
          remaining_uses: remaining,
          assigned_user_email,
        };
      })
    );

    return new Response(
      JSON.stringify({ success: true, coupons: couponsWithStats }),
      { status: 200 }
    );
  } catch (error) {
    console.error('[COUPONS GET API]', error);
    return new Response(
      JSON.stringify({ error: 'Error al obtener cupones', details: String(error) }),
      { status: 500 }
    );
  }
};
