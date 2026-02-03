/**
 * FASHIONSTORE - STRIPE WEBHOOK
 * =============================
 * Webhook para Stripe que procesa eventos de pago
 * 
 * IMPORTANTE: Este es el único lugar donde se confirman pagos en la BD
 * Nunca confiar en redirecciones del cliente
 * 
 * Eventos a procesar:
 * - checkout.session.completed: Pago completado
 * - charge.dispute.created: Disputa abierta
 */

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { sendOrderConfirmationEmail, sendAdminNotificationEmail } from '@/lib/emailService';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY || '');
const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET || '';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

// ============================================================
// TIPOS
// ============================================================

interface CheckoutSessionMetadata {
  order_id: string;
  user_email: string;
  user_name: string;
  phone?: string;
  [key: string]: string | undefined;
}

interface OrderItem {
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  precio_original?: number;
  imagen?: string;
  talla?: string;
  color?: string;
}

// ============================================================
// VALIDACIÓN DE FIRMA
// ============================================================

function verifyWebhookSignature(
  body: string,
  signature: string
): Stripe.Event | null {
  try {
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log(`[WEBHOOK] Evento validado: ${event.type}`);
    return event;
  } catch (error: any) {
    console.error('[WEBHOOK] Error validando firma:', error);
    return null;
  }
}

// ============================================================
// PROCESAR CHECKOUT COMPLETADO
// ============================================================

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    console.log(`[WEBHOOK] Procesando checkout completado: ${session.id}`);

    const supabase = createClient(supabaseUrl, supabaseKey);
    const metadata = session.metadata as CheckoutSessionMetadata;

    if (!metadata?.order_id) {
      console.error('[WEBHOOK] No hay order_id en metadata');
      return;
    }

    // ============================================================
    // 1. OBTENER DATOS DEL PEDIDO
    // ============================================================

    const { data: order, error: orderError } = await supabase
      .from('ordenes')
      .select('*')
      .eq('id', metadata.order_id)
      .single();

    if (orderError || !order) {
      console.error('[WEBHOOK] No se encontró el pedido:', metadata.order_id, orderError);
      return;
    }

    // Validar que el monto coincida (evitar fraude)
    const sessionTotal = Math.round((session.amount_total || 0) / 100); // Convertir centavos a euros
    if (order.total !== sessionTotal) {
      console.error(
        `[WEBHOOK] Monto no coincide - Esperado: ${order.total}, Recibido: ${sessionTotal}`
      );
      // NO actualizar el pedido - posible fraude
      return;
    }

    // ============================================================
    // 2. ACTUALIZAR PEDIDO EN BD
    // ============================================================

    const { error: updateError } = await supabase
      .from('ordenes')
      .update({
        estado: 'Pagado',
        stripe_payment_intent: session.payment_intent as string,
        fecha_pago: new Date().toISOString(),
        actualizado_en: new Date().toISOString(),
      })
      .eq('id', metadata.order_id);

    if (updateError) {
      console.error('[WEBHOOK] Error actualizando pedido:', updateError);
      return;
    }

    console.log(`[WEBHOOK] Pedido actualizado: ${order.numero_orden} -> Estado: Pagado`);

    // ============================================================
    // 3. OBTENER ITEMS DEL PEDIDO PARA EMAIL
    // ============================================================

    const { data: items, error: itemsError } = await supabase
      .from('items_orden')
      .select('*')
      .eq('orden_id', metadata.order_id);

    if (itemsError) {
      console.error('[WEBHOOK] Error obteniendo items:', itemsError);
    }

    const orderItems: OrderItem[] = items
      ? items.map((item) => ({
        nombre: item.producto_nombre,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        precio_original: item.precio_original,
        imagen: item.producto_imagen,
        talla: item.talla,
        color: item.color,
      }))
      : [];

    // ============================================================
    // 4. ENVIAR EMAIL AL CLIENTE
    // ============================================================

    const emailSent = await sendOrderConfirmationEmail({
      numero_orden: order.numero_orden,
      email: order.email_cliente,
      nombre: order.nombre_cliente,
      items: orderItems,
      subtotal: order.subtotal,
      impuestos: order.impuestos,
      descuento: order.descuento,
      envio: order.coste_envio,
      total: order.total,
      direccion: order.direccion_envio || {},
    });

    if (emailSent) {
      console.log(`[WEBHOOK] Email de confirmación enviado a ${order.email_cliente}`);
    } else {
      console.error(`[WEBHOOK] Fallo al enviar email a ${order.email_cliente}`);
    }

    // ============================================================
    // 5. ENVIAR NOTIFICACIÓN AL ADMIN
    // ============================================================

    const adminEmailSent = await sendAdminNotificationEmail({
      numero_orden: order.numero_orden,
      email: order.email_cliente,
      nombre: order.nombre_cliente,
      items: orderItems,
      subtotal: order.subtotal,
      impuestos: order.impuestos,
      descuento: order.descuento,
      envio: order.coste_envio,
      total: order.total,
      direccion: order.direccion_envio || {},
    });

    if (adminEmailSent) {
      console.log(`[WEBHOOK] Notificación enviada al admin`);
    }

    // ============================================================
    // 6. LIMPIAR RESERVAS Y CARRITO
    // ============================================================

    // Identificar el usuario (desde la orden o metadata)
    const userId = order.usuario_id || metadata.user_id;

    if (userId) {
      console.log(`[WEBHOOK] Intentando limpiar carrito para usuario: ${userId}`);

      const { error: cartError } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', userId);

      if (cartError) {
        console.error('[WEBHOOK] Error limpiando cart_items:', cartError);
      } else {
        console.log('[WEBHOOK] cart_items limpiado correctamente');
      }

      const { error: resError } = await supabase
        .from('cart_reservations')
        .delete()
        .eq('user_id', userId);

      if (resError) {
        console.error('[WEBHOOK] Error limpiando cart_reservations:', resError);
      }
    }

    // SIEMPRE intentar limpiar carrito de invitado si existe session_id
    // (Un usuario logueado podría tener una sesión de invitado remanente)
    if (metadata.guest_session_id) {
      console.log(`[WEBHOOK] Intentando limpiar carrito invitado: ${metadata.guest_session_id}`);

      const { error: deleteError } = await supabase
        .from('cart_items')
        .delete()
        .eq('session_id', metadata.guest_session_id);

      if (deleteError) {
        console.error('[WEBHOOK] Error limpiando carrito de invitado:', deleteError);
      } else {
        console.log(`[WEBHOOK] Carrito de invitado limpiado: ${metadata.guest_session_id}`);
      }
    }

    console.log(`[WEBHOOK] ✅ Pedido ${order.numero_orden} procesado exitosamente`);
  } catch (error: any) {
    console.error('[WEBHOOK] Error en handleCheckoutCompleted:', error);
  }
}

// ============================================================
// PROCESAR DISPUTA (Opcional pero importante)
// ============================================================

async function handleChargeDispute(dispute: Stripe.Dispute) {
  try {
    console.log(`[WEBHOOK] Disputa abierta: ${dispute.id}`);

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar la orden asociada a este charge
    const { data: order } = await supabase
      .from('ordenes')
      .select('*')
      .eq('stripe_payment_intent', dispute.payment_intent)
      .single();

    if (order) {
      // Cambiar estado del pedido a indicar disputa
      await supabase
        .from('ordenes')
        .update({
          notas: `Disputa abierta por Stripe: ${dispute.id}`,
          actualizado_en: new Date().toISOString(),
        })
        .eq('id', order.id);

      console.log(`[WEBHOOK] Disputa asociada al pedido: ${order.numero_orden}`);

      // Enviar email al admin
      await sendAdminNotificationEmail({
        type: 'payment_dispute',
        order_number: order.numero_orden,
        customer_email: order.email_cliente,
        customer_name: order.nombre_cliente,
        dispute_id: dispute.id,
      });
    }
  } catch (error: any) {
    console.error('[WEBHOOK] Error en handleChargeDispute:', error);
  }
}

// ============================================================
// ENDPOINT PRINCIPAL
// ============================================================

export const POST: APIRoute = async ({ request }) => {
  try {
    // Obtener firma del header
    const signature = request.headers.get('stripe-signature');
    if (!signature) {
      console.error('[WEBHOOK] No hay firma en el header');
      return new Response(JSON.stringify({ error: 'No signature' }), {
        status: 400,
      });
    }

    // Leer body como texto
    const body = await request.text();

    // Verificar firma
    const event = verifyWebhookSignature(body, signature);
    if (!event) {
      console.error('[WEBHOOK] Firma inválida');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
      });
    }

    // ============================================================
    // PROCESAR DIFERENTES TIPOS DE EVENTOS
    // ============================================================

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute;
        await handleChargeDispute(dispute);
        break;
      }

      default:
        console.log(`[WEBHOOK] Evento no procesado: ${event.type}`);
    }

    // Responder siempre 200 OK a Stripe
    return new Response(
      JSON.stringify({
        received: true,
        event_type: event.type,
        event_id: event.id,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('[WEBHOOK] Error en POST:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
};
