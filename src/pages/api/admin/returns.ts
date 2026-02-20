import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/admin-guard';

const supabaseAdmin = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export const POST: APIRoute = async ({ request }) => {
    const denied = requireAdmin(request);
    if (denied) return denied;

    try {
        const body = await request.json();
        const { action, id, estado } = body;

        if (action === 'update-status') {
            const updateData: any = { estado };
            if (estado === 'aprobada') {
                updateData.fecha_aprobacion = new Date().toISOString();
            } else if (estado === 'recibida') {
                updateData.fecha_recepcion = new Date().toISOString();
            } else if (estado === 'reembolsada') {
                updateData.fecha_reembolso = new Date().toISOString();
            }
            updateData.actualizado_en = new Date().toISOString();

            // Update return record and get linked order info
            const { data: returnData, error: returnError } = await supabaseAdmin
                .from('devoluciones')
                .update(updateData)
                .eq('id', id)
                .select('*, orden:ordenes(*)')
                .single();

            if (returnError) throw returnError;

            // Trigger email if status is reembolsada
            if (estado === 'reembolsada' && returnData?.orden) {
                try {
                    const { sendOrderStatusUpdateEmail } = await import('@/lib/emailService');
                    const order = returnData.orden;

                    // Map order data for email service
                    const orderDataForEmail = {
                        numero_orden: order.numero_orden,
                        email: order.email_cliente,
                        nombre: order.nombre_cliente,
                        telefono: order.telefono_cliente,
                        direccion: order.direccion_envio,
                        items: order.items || [],
                        subtotal: order.subtotal || 0,
                        impuestos: order.impuestos || 0,
                        envio: order.envio || 0,
                        descuento: order.descuento || 0,
                        total: order.total || 0
                    };

                    // Note:nuevo_estado passed as 'Reembolsada' to match emailService mapping
                    await sendOrderStatusUpdateEmail(
                        order.email_cliente,
                        order.nombre_cliente,
                        order.numero_orden,
                        'Reembolsada', // Use title case as per emailService
                        undefined,
                        orderDataForEmail
                    );
                    console.log(`[API] Email de factura de abono enviado para: ${order.numero_orden}`);
                } catch (emailError) {
                    console.error('[API] Error sending return invoice email:', emailError);
                }
            }

            return new Response(JSON.stringify({ success: true, data: returnData }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        return new Response(
            JSON.stringify({ error: 'Acción no válida' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        console.error('[API] Error in admin returns endpoint:', error);
        return new Response(
            JSON.stringify({ error: 'Error interno del servidor' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
