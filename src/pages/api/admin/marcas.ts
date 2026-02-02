import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

// Use Service Role for admin operations (bypasses RLS)
const supabaseAdmin = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

export const POST: APIRoute = async ({ request }) => {
    try {
        const data = await request.json();
        const { action, id, ...brandData } = data;

        console.log(`[API Brands] Acción: ${action}, ID: ${id || 'N/A'}`);

        // CREATE
        if (action === 'create') {
            const { data: result, error } = await supabaseAdmin
                .from('marcas')
                .insert([brandData])
                .select();

            if (error) {
                console.error('[API Brands] Error creating:', error);
                throw error;
            }

            return new Response(JSON.stringify({ success: true, data: result[0] }), {
                status: 201,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // UPDATE
        if (action === 'update') {
            const { data: result, error } = await supabaseAdmin
                .from('marcas')
                .update(brandData)
                .eq('id', id)
                .select();

            if (error) {
                console.error('[API Brands] Error updating:', error);
                throw error;
            }

            return new Response(JSON.stringify({ success: true, data: result[0] }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // DELETE
        if (action === 'delete') {
            const { error } = await supabaseAdmin
                .from('marcas')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('[API Brands] Error deleting:', error);
                throw error;
            }

            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify({ error: 'Invalid action' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('[API Brands] Error:', error);
        return new Response(JSON.stringify({ error: (error as Error).message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
