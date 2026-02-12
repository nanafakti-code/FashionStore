import type { APIRoute } from 'astro';
import { supabase } from '@/lib/supabase';

export const POST: APIRoute = async ({ request, cookies }) => {
    try {
        const { cartItemId } = await request.json();

        if (!cartItemId) {
            return new Response(JSON.stringify({ error: 'ID de item requerido (cartItemId)' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        let token = cookies.get('sb-access-token')?.value;
        if (!token) {
            const authHeader = request.headers.get('Authorization');
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }

        // 1. AUTHENTICATED USER
        if (token) {
            const { data: { user } } = await supabase.auth.getUser(token);
            if (user) {
                const { createClient } = await import('@supabase/supabase-js');
                const userSupabase = createClient(
                    import.meta.env.PUBLIC_SUPABASE_URL,
                    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
                    { global: { headers: { Authorization: `Bearer ${token}` } } }
                );

                const { data, error } = await userSupabase.rpc('remove_from_cart_restore_stock', {
                    p_cart_item_id: cartItemId
                });

                if (error) {
                    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
                }

                return new Response(JSON.stringify({ success: true, authenticated: true }), {
                    status: 200, headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // 2. GUEST USER
        const guestSessionId = request.headers.get('x-guest-session-id');
        if (guestSessionId) {
            const { error } = await supabase.rpc('remove_from_guest_cart', {
                p_session_id: guestSessionId,
                p_cart_item_id: cartItemId
            });

            if (error) {
                return new Response(JSON.stringify({ error: error.message }), { status: 500 });
            }

            return new Response(JSON.stringify({ success: true, authenticated: false }), {
                status: 200, headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ error: 'No autorizado / Sesión no encontrada' }), { status: 401 });

    } catch (error) {
        console.error('Error removing cart item:', error);
        return new Response(JSON.stringify({ error: 'Server Error' }), { status: 500 });
    }
};
