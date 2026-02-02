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
        // No lanzar error, solo loguear - el pedido ya está pagado en Stripe
      } else {
        console.log(`[ORDER-BY-SESSION] ✅ Pedido actualizado a PAGADO: ${order.numero_orden}`);
        // Actualizar el objeto order con el nuevo estado
        order.estado = 'Pagado';
        order.fecha_pago = new Date().toISOString();

        // ============================================================
        // ENVIAR EMAILS (RESPALDO SI WEBHOOK NO SE EJECUTÓ)
        // ============================================================
        console.log(`[ORDER-BY-SESSION] 📧 Enviando emails de confirmación...`);

        // Obtener items para los emails
        const { data: itemsForEmail } = await supabase
          .from('items_orden')
          .select('*')
          .eq('orden_id', orderId);

        // Preparar datos para emails - formato OrderData
        // CRITICAL: ALL values must be INTEGER CENTS - emailService handles formatting
        const orderDataForEmail = {
          numero_orden: order.numero_orden,
          email: order.email_cliente,
          nombre: order.nombre_cliente || 'Cliente',
          telefono: order.telefono_cliente || '',
          direccion: order.direccion_envio ?
            (typeof order.direccion_envio === 'string'
              ? JSON.parse(order.direccion_envio)
              : order.direccion_envio)
            : undefined,
          items: (itemsForEmail || []).map((item: any) => ({
            nombre: item.producto_nombre,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario, // INTEGER CENTS - NO DIVISION
            precio_original: item.precio_original, // INTEGER CENTS - NO DIVISION
            talla: item.talla,
            color: item.color,
            imagen: item.producto_imagen,
          })),
          subtotal: order.subtotal,           // INTEGER CENTS - NO DIVISION
          impuestos: order.impuestos || 0,    // INTEGER CENTS - NO DIVISION
          descuento: order.descuento || 0,    // INTEGER CENTS - NO DIVISION
          envio: order.coste_envio || 0,      // INTEGER CENTS - NO DIVISION
          total: order.total,                 // INTEGER CENTS - NO DIVISION
        };

        try {
          // Email al cliente
          await sendOrderConfirmationEmail(orderDataForEmail);
          console.log(`[ORDER-BY-SESSION] ✅ Email de confirmación enviado a: ${order.email_cliente}`);

          // Email al administrador - uses same OrderData structure
          await sendAdminNotificationEmail({
            numero_orden: order.numero_orden,
            email: ADMIN_EMAIL,
            nombre: order.nombre_cliente || 'Cliente',
            items: orderDataForEmail.items,
            subtotal: order.subtotal,
            impuestos: order.impuestos || 0,
            descuento: order.descuento || 0,
            envio: order.coste_envio || 0,
            total: order.total,
            direccion: orderDataForEmail.direccion,
          });
          console.log(`[ORDER-BY-SESSION] ✅ Email de notificación enviado a admin: ${ADMIN_EMAIL}`);

          emailsSent = true;
        } catch (emailError) {
          console.error('[ORDER-BY-SESSION] ❌ Error enviando emails:', emailError);
        }

        // ============================================================
        // LIMPIAR CARRITO DEL USUARIO EN BD
        // ============================================================
        if (order.usuario_id) {
          console.log(`[ORDER-BY-SESSION] 🛒 Limpiando carrito del usuario ${order.usuario_id}...`);

          const { error: cartError } = await supabase
            .from('carrito')
            .delete()
            .eq('usuario_id', order.usuario_id);

          if (cartError) {
            console.error('[ORDER-BY-SESSION] Error limpiando carrito:', cartError);
          } else {
            console.log(`[ORDER-BY-SESSION] ✅ Carrito limpiado correctamente`);
          }
        }
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
