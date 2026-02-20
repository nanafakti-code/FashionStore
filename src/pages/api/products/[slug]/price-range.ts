import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY
);

export const GET: APIRoute = async ({ params }) => {
    const { slug } = params;

    if (!slug) {
        return new Response(JSON.stringify({ error: 'Product slug is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        // Llamar a la función RPC de Supabase
        const { data, error } = await supabase
            .rpc('get_product_price_range', { product_slug: slug });

        if (error) {
            console.error('Error fetching price range:', error);
            return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // La función RPC devuelve un array con un solo objeto
        const priceRange = data && data.length > 0 ? data[0] : null;

        return new Response(JSON.stringify(priceRange), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=60'
            }
        });
    } catch (err) {
        console.error('Unexpected error:', err);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
