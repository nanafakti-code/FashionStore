/**
 * OBTENER PEDIDO POR SESSION ID DE STRIPE
 * ========================================
 * Endpoint para la página de confirmación de pago
 * Busca el pedido asociado a una sesión de Stripe
 * 
 * IMPORTANTE: Este endpoint también sirve como RESPALDO
 * para enviar emails si el webhook de Stripe no se ejecutó
 */

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import {
  sendOrderConfirmationEmail,
  sendAdminNotificationEmail,
} from '@/lib/emailService';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY || '');
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = import.meta.env.ADMIN_EMAIL || 'fashionstorerbv@gmail.com';

export const GET: APIRoute = async (context) => {
  try {
    const { sessionId } = context.params;

    if (!sessionId || typeof sessionId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Session ID es requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[ORDER-BY-SESSION] Buscando pedido para session: ${sessionId}`);

    // 1. Obtener la sesión de Stripe para verificar el pago
    let stripeSession;
    try {
      stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
    } catch (stripeError: any) {
      console.error('[ORDER-BY-SESSION] Error obteniendo sesión de Stripe:', stripeError.message);
      return new Response(
        JSON.stringify({ error: 'Sesión de Stripe no encontrada' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Verificar que el pago fue exitoso
    if (stripeSession.payment_status !== 'paid') {
      console.log(`[ORDER-BY-SESSION] Pago no completado: ${stripeSession.payment_status}`);
      return new Response(
        JSON.stringify({ error: 'El pago no ha sido completado' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Obtener order_id del metadata
    const orderId = stripeSession.metadata?.order_id;

    if (!orderId) {
      console.error('[ORDER-BY-SESSION] No se encontró order_id en metadata');
      return new Response(
        JSON.stringify({ error: 'Pedido no encontrado en la sesión' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Buscar el pedido en Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: order, error: orderError } = await supabase
      .from('ordenes')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('[ORDER-BY-SESSION] Pedido no encontrado en BD:', orderError);
      return new Response(
        JSON.stringify({ error: 'Pedido no encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4.5 ACTUALIZAR ESTADO A "PAGADO" SI STRIPE CONFIRMA PAGO
    // (Por si el webhook no se ejecutó aún)
    let emailsSent = false;

    if (order.estado !== 'Pagado' && stripeSession.payment_status === 'paid') {
      console.log(`[ORDER-BY-SESSION] Actualizando estado del pedido a PAGADO...`);

      const { error: updateError } = await supabase
        .from('ordenes')
        .update({
          estado: 'Pagado',
          stripe_payment_intent: stripeSession.payment_intent as string,
          fecha_pago: new Date().toISOString(),
          actualizado_en: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('[ORDER-BY-SESSION] Error actualizando estado:', updateError);
      } else {
        console.log(`[ORDER-BY-SESSION] ✅ Pedido actualizado a PAGADO: ${order.numero_orden}`);
        // Actualizar el objeto order con el nuevo estado para que el frontend lo vea reflejado
        order.estado = 'Pagado';
        order.fecha_pago = new Date().toISOString();

        // NOTA: El envío de emails y la limpieza del carrito se delegan al WEBHOOK de Stripe
        // para asegurar una respuesta rápida en este endpoint.
      }
    }

    // 5. Obtener items del pedido
    const { data: items, error: itemsError } = await supabase
      .from('items_orden')
      .select('*')
      .eq('orden_id', orderId);

    if (itemsError) {
      console.error('[ORDER-BY-SESSION] Error obteniendo items:', itemsError);
    }

    console.log(`[ORDER-BY-SESSION] Pedido encontrado: ${order.numero_orden}`);

    // 6. Responder con los datos (sin exponer información sensible)
    return new Response(
      JSON.stringify({
        order: {
          id: order.id,
          numero_orden: order.numero_orden,
          estado: order.estado,
          nombre_cliente: order.nombre_cliente,
          email_cliente: order.email_cliente,
          telefono_cliente: order.telefono_cliente,
          direccion_envio: order.direccion_envio,
          subtotal: order.subtotal,
          descuento: order.descuento || 0,
          impuestos: order.impuestos || 0,
          coste_envio: order.coste_envio || 0,
          total: order.total,
          fecha_creacion: order.fecha_creacion,
          fecha_pago: order.fecha_pago,
          usuario_id: order.usuario_id, // Para saber si es invitado
        },
        items: items || [],
        emailsSent, // Indica si se enviaron emails en este request
        cartCleared: order.usuario_id ? true : false, // Indica si se limpió el carrito
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[ORDER-BY-SESSION] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
