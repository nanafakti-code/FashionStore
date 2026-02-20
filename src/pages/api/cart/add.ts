import type { APIRoute } from 'astro';
import { supabase } from '@/lib/supabase';


export const POST: APIRoute = async ({ request, cookies }) => {
    try {
        const { variantId, variantName: _variantName, price: _price, imageUrl, quantity } = await request.json();

        if (!variantId || !quantity) {
            return new Response(JSON.stringify({ error: 'Datos incompletos' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
            return new Response(JSON.stringify({ error: 'Cantidad no válida' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        let token = cookies.get('sb-access-token')?.value;

        // If no cookie, check Authorization header
        if (!token) {
            const authHeader = request.headers.get('Authorization');
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }

        // Obtener información de la variante
        const { data: variant, error: variantError } = await supabase
            .from('variantes_producto')
            .select('producto_id, precio_venta, nombre_variante, capacidad, color, imagen_url')
            .eq('id', variantId)
            .single();

        if (variantError || !variant) {
            return new Response(JSON.stringify({ error: 'Variante no encontrada' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Validar token si existe
        if (token) {
            // ... (Existing Auth Logic) ...
            const { data: { user }, error: authError } = await supabase.auth.getUser(token);
            if (authError || !user) {
                // Token inválido/expirado → denegar acceso (no caer a guest)
                return new Response(JSON.stringify({ error: 'Token de autenticación inválido o expirado' }), {
                    status: 401, headers: { 'Content-Type': 'application/json' }
                });
            }
            // Usuario autenticado - guardar en BD usando RPC V2 (Estricto)
            const { createClient } = await import('@supabase/supabase-js');
            const userSupabase = createClient(
                import.meta.env.PUBLIC_SUPABASE_URL,
                import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
                { global: { headers: { Authorization: `Bearer ${token}` } } }
            );

            const { data: rpcData, error: rpcError } = await userSupabase.rpc('add_to_cart_v2', {
                p_product_id: variant.producto_id,
                p_quantity: quantity,
                p_variant_id: variantId
            });

            if (rpcError) {
                return new Response(JSON.stringify({ error: 'Error al añadir al carrito' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }

            if (rpcData && !rpcData.success) {
                return new Response(JSON.stringify({ error: rpcData.message || 'Sin stock' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            return new Response(JSON.stringify({ success: true, authenticated: true }), {
                status: 200, headers: { 'Content-Type': 'application/json' }
            });
        }

        // GUEST LOGIC (DB-BACKED)
        const guestSessionId = request.headers.get('x-guest-session-id');

        if (guestSessionId) {
            const { data: rpcData, error: rpcError } = await supabase.rpc('add_to_cart_v2', {
                p_product_id: variant.producto_id,
                p_quantity: quantity,
                p_variant_id: variantId,
                p_user_id: null, // Explicitly null for guest
                p_session_id: guestSessionId
            });

            if (rpcError) {
                return new Response(JSON.stringify({ error: 'Error al procesar la operaci�n' }), { status: 500 });
            }

            if (rpcData && !rpcData.success) {
                return new Response(JSON.stringify({ error: rpcData.message || 'No hay suficiente stock' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            return new Response(JSON.stringify({ success: true, authenticated: false, guestVideoSession: true }), {
                status: 200, headers: { 'Content-Type': 'application/json' }
            });
        }

        // FALLBACK: Legacy LocalStorage (Should be unreachable if frontend is updated, but kept for safety)
        return new Response(JSON.stringify({
            success: true,
            authenticated: false,
            guestItem: {
                product_id: variant.producto_id,
                variant_id: variantId,
                variant_name: variant.nombre_variante,
                capacity: variant.capacidad,
                color: variant.color,
                precio_unitario: variant.precio_venta,
                product_image: imageUrl || variant.imagen_url,
                quantity: quantity,
                created_at: Date.now()
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error adding to cart:', error);

        return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
