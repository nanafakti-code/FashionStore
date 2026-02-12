import type { APIRoute } from 'astro';
import { supabase } from '@/lib/supabase';

export const OPTIONS: APIRoute = () => {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-guest-session-id',
            'Access-Control-Max-Age': '86400',
        }
    });
};


export const POST: APIRoute = async ({ request, cookies }) => {
    try {
        const { cartItemId, quantity } = await request.json();

        if (!cartItemId || quantity === undefined) {
            return new Response(JSON.stringify({ error: 'Datos incompletos' }), {
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

                const { data, error } = await userSupabase.rpc('update_cart_item_quantity_with_stock_check', {
                    p_cart_item_id: cartItemId,
                    p_new_quantity: quantity
                });

                if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
                if (data && !data.success) return new Response(JSON.stringify({ error: data.message }), { status: 400 });

                return new Response(JSON.stringify({ success: true, authenticated: true }), {
                    status: 200, headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // 2. GUEST USER
        const guestSessionId = request.headers.get('x-guest-session-id');
        if (guestSessionId) {
            const { data, error } = await supabase.rpc('update_guest_cart_item', {
                p_session_id: guestSessionId,
                p_cart_item_id: cartItemId,
                p_quantity: quantity
            });

            if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
            if (data && !data.success) return new Response(JSON.stringify({ error: data.message }), { status: 400 });

            return new Response(JSON.stringify({ success: true, authenticated: false }), {
                status: 200, headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ error: 'No autorizado / Sesión no encontrada' }), { status: 401 });

    } catch (error) {
        console.error('Error updating cart item:', error);
        return new Response(JSON.stringify({ error: 'Server Error' }), { status: 500 });
    }
};
