/**
 * API: /api/admin/users-list
 * Returns list of registered users (id, email, nombre)
 * Used by AdminCoupons to assign coupons to specific users
 */

import type { APIRoute } from 'astro';
import { supabase } from '@/lib/supabase';

export const GET: APIRoute = async () => {
  try {
    const { data: users, error } = await supabase
      .from('usuarios')
      .select('id, email, nombre')
      .order('email', { ascending: true });

    if (error) throw error;

    return new Response(
      JSON.stringify({ users: users || [] }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[USERS-LIST API]', error);
    return new Response(
      JSON.stringify({ error: 'Error al obtener usuarios', users: [] }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
