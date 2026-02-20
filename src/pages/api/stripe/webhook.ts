/**
 * FASHIONSTORE - STRIPE WEBHOOK (PRODUCCIÓN)
 * ===========================================
 * ESTE ES EL ÚNICO LUGAR DONDE SE CONFIRMAN PAGOS
 * Procesa eventos de Stripe y actualiza órdenes en BD
 * 
 * Flujo:
 * 1. Validar firma del webhook
 * 2. Obtener datos de la sesión
 * 3. Validar monto (anti-fraude)
 * 4. Marcar pedido como pagado
 * 5. Actualizar stock
 * 6. Enviar emails
 * 
 * IMPORTANTE: 
 * - NUNCA confiar en redirecciones del cliente
 * - SIEMPRE verificar firma
 * - SIEMPRE validar montos
 */

import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import {
  sendOrderConfirmationEmail,
  sendAdminNotificationEmail,
} from '@/lib/emailService';
import { notifyNewOrder } from '@/lib/notificationService';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY || '');
const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET || '';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

// ============================================================
// TIPOS
// ============================================================

interface SessionMetadata {
  order_id?: string;
  user_id?: string;
  is_guest?: string;
  guest_session_id?: string;
  email?: string;
  nombre?: string;
  telefono?: string;
  items?: string;
  direccion?: string;
  cupon_id?: string;
  descuento?: string;
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
// PROCESAR CHECKOUT COMPLETADO
// ============================================================

export const POST: APIRoute = async (context) => {
  try {
    // ============================================================
    // 1. VALIDAR FIRMA DEL WEBHOOK
    // ============================================================
    const body = await context.request.text();
    const signature = context.request.headers.get('stripe-signature');
    if (!signature) {
      console.error('[WEBHOOK] ❌ No signature provided');
      return new Response(JSON.stringify({ error: 'No signature' }), { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret) as Stripe.Event;
    } catch (err: any) {
      console.error('[WEBHOOK] ❌ Error validando firma');
      return new Response(
        JSON.stringify({ error: 'Webhook signature verification failed' }),
        { status: 401 }
      );
    }

    // ============================================================
    // 2. PROCESAR EVENTOS
    // ============================================================
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'charge.dispute.created':
        await handleChargeDispute(event.data.object as Stripe.Dispute);
        break;

      case 'charge.failed':
        await handleChargeFailed(event.data.object as Stripe.Charge);
        break;

      default:
    }

    // ============================================================
    // 3. RESPONDER A STRIPE
    // ============================================================
    return new Response(
      JSON.stringify({
        received: true,
        event_id: event.id,
        event_type: event.type,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[WEBHOOK] ❌ Error en POST:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
};

// ============================================================
// HANDLER: CHECKOUT COMPLETADO
// ============================================================

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const metadata = (session.metadata || {}) as SessionMetadata;

    // ========== VALIDACIÓN INICIAL ==========
    if (!metadata.order_id) {
      console.error('[WEBHOOK] ❌ No hay order_id en metadata');
      return;
    }

    // Validar formato UUID del order_id
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(metadata.order_id)) {
      console.error('[WEBHOOK] ❌ order_id con formato inválido');
      return;
    }

    const orderId = metadata.order_id;
    // ========== OBTENER DATOS DEL PEDIDO ==========
    const { data: order, error: orderError } = await supabase
      .from('ordenes')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('[WEBHOOK] ❌ Pedido no encontrado:', orderId);
      return;
    }
    // ========== VALIDACIÓN DE MONTO (ANTI-FRAUDE) ==========
    const sessionTotalCents = session.amount_total || 0; // STRICT: CENTS (INTEGER)
    const dbTotalCents = order.total; // STRICT: DB IS CENTS (INTEGER)

    if (dbTotalCents !== sessionTotalCents) {
      console.error(
        `[WEBHOOK] ❌ ALERTA: Monto no coincide (CENTS)\n` +
        `  - BD: ${dbTotalCents}\n` +
        `  - Stripe: ${sessionTotalCents}\n` +
        `  - ACCIÓN: Pedido NO actualizado (posible fraude)`
      );
      return;
    }

    // ========== ACTUALIZAR ESTADO DEL PEDIDO ==========
    const { error: updateError } = await supabase
      .from('ordenes')
      .update({
        estado: 'Pagado',
        stripe_payment_intent: session.payment_intent as string,
        fecha_pago: new Date().toISOString(),
        actualizado_en: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('[WEBHOOK] ❌ Error actualizando pedido:', updateError);
      return;
    }
    // ========== OBTENER ITEMS DEL PEDIDO ==========
    const { data: items, error: itemsError } = await supabase
      .from('items_orden')
      .select('*')
      .eq('orden_id', orderId);

    if (itemsError) {
      console.error('[WEBHOOK] Error obteniendo items:', itemsError);
    }

    const orderItems: OrderItem[] = (items || []).map((item) => ({
      nombre: item.producto_nombre,
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario,
      precio_original: item.precio_original,
      imagen: item.producto_imagen,
      talla: item.talla,
      color: item.color,
    }));
    // ========== LIMPIAR CARRITO ==========
    if (order.usuario_id) {
      // Intentar primero con cart_items (estructura actual)
      let cartCleared = false;

      const { error: cartItemsError } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', order.usuario_id);

      if (!cartItemsError) {
        cartCleared = true;
      }

      // Fallback a tabla 'carrito' si existe
      if (!cartCleared) {
        const { error: cartError } = await supabase
          .from('carrito')
          .delete()
          .eq('usuario_id', order.usuario_id);

        if (cartError) {
          console.error('[WEBHOOK] ⚠️ Error limpiando carrito:', cartError);
        }
      }

      // Limpiar reservas del carrito
      const { error: resError } = await supabase
        .from('cart_reservations')
        .delete()
        .eq('user_id', order.usuario_id);

      if (resError) {
        console.error('[WEBHOOK] ⚠️ Error limpiando cart_reservations:', resError);
      }
    }

    // Limpiar carrito de invitado si existe session_id
    if (metadata.guest_session_id) {
      const { error: guestDeleteError } = await supabase
        .from('cart_items')
        .delete()
        .eq('session_id', metadata.guest_session_id);

      if (guestDeleteError) {
        console.error('[WEBHOOK] ⚠️ Error limpiando carrito de invitado:', guestDeleteError);
      }
    }

    // ========== CONSUMIR CUPÓN ==========
    if (order.cupon_id) {
      // Marcar cupón como usado
      const { error: couponError } = await supabase
        .from('cupones')
        .update({
          estado: 'Usado',
          fecha_uso: new Date().toISOString(),
          pedido_id: orderId
        })
        .eq('id', order.cupon_id);

      if (couponError) {
        console.error('[WEBHOOK] ❌ Error marcando cupón como usado:', couponError);
      }
    }

    // ========== ENVIAR EMAIL AL CLIENTE ==========
    const clientEmail = order.email_cliente;
    const emailSent = await sendOrderConfirmationEmail({
      numero_orden: order.numero_orden,
      email: clientEmail,
      nombre: order.nombre_cliente,
      items: orderItems,
      subtotal: order.subtotal,
      impuestos: order.impuestos,
      descuento: order.descuento,
      envio: order.coste_envio,
      total: order.total,
      direccion: order.direccion_envio || {},
    });

    if (!emailSent) {
      console.error('[WEBHOOK] ❌ Fallo al enviar email de confirmación');
    }

    // ========== ENVIAR NOTIFICACIÓN AL ADMIN ==========
    // Admin notification uses same OrderData structure
    // NOTE: We pass clientEmail here so the admin sees the customer's email in the message body
    const adminEmailSent = await sendAdminNotificationEmail({
      numero_orden: order.numero_orden,
      email: clientEmail, // Corrected: Pass customer email
      nombre: order.nombre_cliente,
      items: orderItems,
      subtotal: order.subtotal,
      impuestos: order.impuestos,
      descuento: order.descuento,
      envio: order.coste_envio,
      total: order.total,
      direccion: order.direccion_envio || {},
    });

    if (!adminEmailSent) {
      console.error('[WEBHOOK] ❌ Fallo al enviar email de admin');
    }

    // ========== NOTIFICACIÓN CONDICIONAL (NotificationService) ==========
    // Uses the central event handler which checks admin_preferences BEFORE sending
    const notifResult = await notifyNewOrder({
      numero_orden: order.numero_orden,
      nombre_cliente: order.nombre_cliente,
      email_cliente: order.email_cliente || clientEmail,
      total: order.total,
    });

    console.log(
      `[WEBHOOK] 📬 NotificationService → sent=${notifResult.sent}, ` +
      `event=${notifResult.event}, reason=${notifResult.reason || 'ok'}`
    );
  } catch (error) {
    console.error('[WEBHOOK] ❌ Error en handleCheckoutCompleted:', error);
  }
}

// ============================================================
// HANDLER: DISPUTA DE PAGO
// ============================================================

async function handleChargeDispute(dispute: Stripe.Dispute) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar la orden asociada
    const { data: order } = await supabase
      .from('ordenes')
      .select('*')
      .eq('stripe_payment_intent', dispute.payment_intent)
      .single();

    if (order) {
      // Registrar la disputa en el pedido
      await supabase
        .from('ordenes')
        .update({
          notas: `ALERTA: Disputa de pago abierta en Stripe - ${dispute.id}`,
          actualizado_en: new Date().toISOString(),
        })
        .eq('id', order.id);
      // Log dispute details for admin to handle manually
      // TODO: Implement a separate dispute notification email if needed
    }
  } catch (error) {
    console.error('[WEBHOOK] ❌ Error en handleChargeDispute:', error);
  }
}

// ============================================================
// HANDLER: PAGO FALLIDO
// ============================================================

async function handleChargeFailed(charge: Stripe.Charge) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar la orden asociada
    const { data: orders } = await supabase
      .from('ordenes')
      .select('*')
      .eq('stripe_payment_intent', charge.payment_intent as string);

    for (const order of orders || []) {
      // Cambiar estado a pendiente de pago
      await supabase
        .from('ordenes')
        .update({
          estado: 'Pendiente',
          notas: `Error de pago: ${charge.failure_message || 'Desconocido'}`,
          actualizado_en: new Date().toISOString(),
        })
        .eq('id', order.id);
      // Notificar al cliente (opcional)
    }
  } catch (error) {
    console.error('[WEBHOOK] ❌ Error en handleChargeFailed:', error);
  }
}
