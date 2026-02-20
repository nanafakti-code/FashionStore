import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/admin-guard';

const supabaseAdmin = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export const GET: APIRoute = async ({ request }) => {
    const denied = requireAdmin(request);
    if (denied) return denied;

    try {
        const url = new URL(request.url);
        const estado = url.searchParams.get('estado'); // filtro opcional
        const limit = parseInt(url.searchParams.get('limit') || '100');

        let query = supabaseAdmin
            .from('ordenes')
            .select('*')
            .order('creado_en', { ascending: false })
            .limit(limit);

        if (estado) {
            query = query.ilike('estado', estado);
        }

        const { data, error } = await query;

        if (error) throw error;

        return new Response(JSON.stringify(data || []), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('[API] Error fetching pedidos:', error);
        return new Response(
            JSON.stringify({ error: 'Error interno del servidor' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};

export const POST: APIRoute = async ({ request }) => {
    const denied = requireAdmin(request);
    if (denied) return denied;

    try {
        const body = await request.json();
        const { action, id, estado } = body;

        if (action === 'update-estado') {
            const updateData: any = { estado };
            if (estado === 'Pagado') {
                updateData.fecha_pago = new Date().toISOString();
            }
            updateData.actualizado_en = new Date().toISOString();

            const { data, error } = await supabaseAdmin
                .from('ordenes')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            // Enviar email de notificación de cambio de estado
            try {
                const { sendOrderStatusUpdateEmail } = await import('@/lib/emailService');
                if (data && data.email_cliente && data.nombre_cliente && data.numero_orden) {
                    await sendOrderStatusUpdateEmail(
                        data.email_cliente,
                        data.nombre_cliente,
                        data.numero_orden,
                        estado
                    );
                    console.log(`[API] Email de actualización enviado para: ${data.numero_orden} -> ${estado}`);
                }
            } catch (emailError) {
                console.error('[API] Error enviando email de actualización:', emailError);
                // No fallamos la request si falla el email
            }

            return new Response(JSON.stringify({ success: true, data }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        if (action === 'delete') {
            const { error } = await supabaseAdmin
                .from('ordenes')
                .delete()
                .eq('id', id);

            if (error) throw error;

            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        return new Response(
            JSON.stringify({ error: 'Acción no válida' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        console.error('[API] Error in pedidos endpoint:', error);
        return new Response(
            JSON.stringify({ error: 'Error interno del servidor' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
