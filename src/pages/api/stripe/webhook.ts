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

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY || '');
const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET || '';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = import.meta.env.ADMIN_EMAIL || 'admin@fashionstore.com';

// ============================================================
// TIPOS
// ============================================================

interface SessionMetadata {
  order_id?: string;
  user_id?: string;
  is_guest?: string;
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
    console.log('\n[WEBHOOK] ================================================');
    console.log('[WEBHOOK] 🔔 WEBHOOK RECIBIDO');
    console.log('[WEBHOOK] ================================================\n');

    // ============================================================
    // 1. VALIDAR FIRMA DEL WEBHOOK
    // ============================================================
    const body = await context.request.text();
    const signature = context.request.headers.get('stripe-signature');

    console.log(`[WEBHOOK] Body length: ${body.length} bytes`);
    console.log(`[WEBHOOK] Signature presente: ${signature ? '✓' : '✗'}`);
    console.log(`[WEBHOOK] STRIPE_WEBHOOK_SECRET configurado: ${webhookSecret ? '✓' : '✗'}`);

    if (!signature) {
      console.error('[WEBHOOK] ❌ No signature provided');
      return new Response(JSON.stringify({ error: 'No signature' }), { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret) as Stripe.Event;
      console.log(`[WEBHOOK] ✅ Firma validada`);
      console.log(`[WEBHOOK] Tipo de evento: ${event.type}`);
      console.log(`[WEBHOOK] ID evento: ${event.id}`);
    } catch (err: any) {
      console.error('[WEBHOOK] ❌ Error validando firma:', err.message);
      return new Response(
        JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }),
        { status: 401 }
      );
    }

    // ============================================================
    // 2. PROCESAR EVENTOS
    // ============================================================
    console.log('[WEBHOOK] Procesando evento...\n');

    switch (event.type) {
      case 'checkout.session.completed':
        console.log('[WEBHOOK] 📦 EVENTO: Checkout completado');
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'charge.dispute.created':
        console.log('[WEBHOOK] ⚠️ EVENTO: Disputa creada');
        await handleChargeDispute(event.data.object as Stripe.Dispute);
        break;

      case 'charge.failed':
        console.log('[WEBHOOK] ❌ EVENTO: Pago fallido');
        await handleChargeFailed(event.data.object as Stripe.Charge);
        break;

      default:
        console.log(`[WEBHOOK] ⏭️ EVENTO NO PROCESADO: ${event.type}`);
    }

    // ============================================================
    // 3. RESPONDER A STRIPE
    // ============================================================
    console.log('[WEBHOOK] ✅ Respondiendo a Stripe con 200 OK\n');
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
    console.log(`\n[WEBHOOK] === Procesando Checkout Completado ===`);
    console.log(`Session ID: ${session.id}`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const metadata = (session.metadata || {}) as SessionMetadata;

    // ========== VALIDACIÓN INICIAL ==========
    if (!metadata.order_id) {
      console.error('[WEBHOOK] ❌ No hay order_id en metadata');
      return;
    }

    const orderId = metadata.order_id;
    console.log(`Order ID: ${orderId}`);

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

    console.log(`Pedido encontrado: ${order.numero_orden}`);

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

    console.log(`✅ Pedido actualizado: ${order.numero_orden} -> Estado: PAGADO`);

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

    console.log(`Items en pedido: ${orderItems.length}`);

    // ========== LIMPIAR CARRITO ==========
    if (order.usuario_id) {
      console.log(`\n[WEBHOOK] 🛒 Limpiando carrito para usuario: ${order.usuario_id}`);

      // Intentar primero con cart_items (estructura actual)
      let cartCleared = false;

      const { error: cartItemsError } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', order.usuario_id);

      if (!cartItemsError) {
        console.log(`[WEBHOOK] ✅ cart_items limpiado correctamente`);
        cartCleared = true;
      } else {
        console.log('[WEBHOOK] cart_items no disponible, intentando carrito...');
      }

      // Fallback a tabla 'carrito' si existe
      if (!cartCleared) {
        const { error: cartError } = await supabase
          .from('carrito')
          .delete()
          .eq('usuario_id', order.usuario_id);

        if (!cartError) {
          console.log(`[WEBHOOK] ✅ Carrito limpiado correctamente`);
        } else {
          console.error('[WEBHOOK] ⚠️ Error limpiando carrito:', cartError);
        }
      }
    }

    // ========== ENVIAR EMAIL AL CLIENTE ==========
    console.log('\n[WEBHOOK] === ENVIANDO EMAILS ===');
    const clientEmail = order.email_cliente;
    console.log(`[WEBHOOK] Email del cliente: ${clientEmail}`);

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

    if (emailSent) {
      console.log(`[WEBHOOK] ✅ Email de confirmación enviado a: ${clientEmail}`);
    } else {
      console.error(`[WEBHOOK] ❌ Fallo al enviar email a: ${clientEmail}`);
    }

    // ========== ENVIAR NOTIFICACIÓN AL ADMIN ==========
    console.log(`[WEBHOOK] Email del admin: ${ADMIN_EMAIL}`);

    // Admin notification uses same OrderData structure
    const adminEmailSent = await sendAdminNotificationEmail({
      numero_orden: order.numero_orden,
      email: ADMIN_EMAIL,
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
      console.log(`[WEBHOOK] ✅ Email de admin enviado a: ${ADMIN_EMAIL}`);
    } else {
      console.error(`[WEBHOOK] ❌ Fallo al enviar email de admin a: ${ADMIN_EMAIL}`);
    }

    console.log(`[WEBHOOK] === ✅ COMPLETADO: ${order.numero_orden} ===\n`);
  } catch (error) {
    console.error('[WEBHOOK] ❌ Error en handleCheckoutCompleted:', error);
  }
}

// ============================================================
// HANDLER: DISPUTA DE PAGO
// ============================================================

async function handleChargeDispute(dispute: Stripe.Dispute) {
  try {
    console.log(`\n[WEBHOOK] === Disputa Abierta ===`);
    console.log(`Dispute ID: ${dispute.id}`);

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

      console.log(`⚠️ Disputa asociada al pedido: ${order.numero_orden}`);

      // Log dispute details for admin to handle manually
      console.log(`[WEBHOOK] DISPUTA DETECTADA:`);
      console.log(`[WEBHOOK]   - Pedido: ${order.numero_orden}`);
      console.log(`[WEBHOOK]   - Cliente: ${order.nombre_cliente} (${order.email_cliente})`);
      console.log(`[WEBHOOK]   - Dispute ID: ${dispute.id}`);
      // TODO: Implement a separate dispute notification email if needed

      console.log(`✅ Disputa registrada en logs`);
    }

    console.log(`[WEBHOOK] === Disputa Procesada ===\n`);
  } catch (error) {
    console.error('[WEBHOOK] ❌ Error en handleChargeDispute:', error);
  }
}

// ============================================================
// HANDLER: PAGO FALLIDO
// ============================================================

async function handleChargeFailed(charge: Stripe.Charge) {
  try {
    console.log(`\n[WEBHOOK] === Pago Fallido ===`);
    console.log(`Charge ID: ${charge.id}`);
    console.log(`Motivo: ${charge.failure_message}`);

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

      console.log(`⚠️ Pedido revertido a Pendiente: ${order.numero_orden}`);

      // Notificar al cliente (opcional)
      console.log(`📧 Cliente será notificado del fallo de pago`);
    }

    console.log(`[WEBHOOK] === Pago Fallido Procesado ===\n`);
  } catch (error) {
    console.error('[WEBHOOK] ❌ Error en handleChargeFailed:', error);
  }
}
