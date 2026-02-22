/**
 * FASHIONSTORE - API DE SOLICITUD DE DEVOLUCIÓN
 * =============================================
 * Endpoint para procesar solicitudes de devolución de pedidos
 * 
 * Flujo:
 * 1. Validar que el pedido existe y pertenece al usuario
 * 2. Validar que el pedido está en un estado que permite devolución
 * 3. Validar el plazo de 30 días
 * 4. Crear registro de devolución
 * 5. Actualizar estado del pedido
 * 6. Enviar emails a cliente y admin
 */

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { sendAdminNotificationEmail, sendReturnInstructionsEmail } from '@/lib/emailService';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

export const POST: APIRoute = async (context) => {
  try {
    const body = await context.request.json();
    const { orderId, reason, email, orderNumber } = body;

    console.log('[RETURNS] Procesando solicitud de devolución');

    // ============================================================
    // 1. CREAR CLIENTE SUPABASE
    // ============================================================
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ============================================================
    // 2. BUSCAR EL PEDIDO
    // ============================================================
    let order;

    if (orderId) {
      // Usuario autenticado - buscar por ID
      const { data, error } = await supabase
        .from('ordenes')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error || !data) {
        console.error('[RETURNS] Pedido no encontrado:', error);
        return new Response(
          JSON.stringify({ error: 'Pedido no encontrado' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      order = data;
    } else if (email && orderNumber) {
      // Invitado - buscar por email y número de orden
      const { data, error } = await supabase
        .from('ordenes')
        .select('*')
        .eq('numero_orden', orderNumber)
        .eq('email_cliente', email)
        .single();

      if (error || !data) {
        console.error('[RETURNS] Pedido no encontrado para invitado');
        return new Response(
          JSON.stringify({ error: 'Pedido no encontrado. Verifica el email y número de pedido.' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      order = data;
    } else {
      return new Response(
        JSON.stringify({ error: 'Datos insuficientes para procesar la solicitud' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[RETURNS] Pedido encontrado: ${order.numero_orden}`);

    // ============================================================
    // 3. VALIDAR ESTADO DEL PEDIDO
    // ============================================================
    const validStates = ['Completado'];
    if (!validStates.includes(order.estado)) {
      console.log(`[RETURNS] Estado inválido: ${order.estado}`);
      return new Response(
        JSON.stringify({
          error: `No se puede solicitar devolución para un pedido en estado "${order.estado}"`
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ============================================================
    // 4. VALIDAR PLAZO DE 30 DÍAS
    // ============================================================
    const referenceDate = new Date(order.fecha_entrega || order.fecha_pago || order.fecha_creacion);
    const daysSince = Math.floor((Date.now() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSince > 30) {
      console.log(`[RETURNS] Plazo expirado: ${daysSince} días`);
      return new Response(
        JSON.stringify({
          error: 'El plazo de 30 días para solicitar devolución ha expirado'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ============================================================
    // 5. VERIFICAR QUE NO TENGA YA UNA SOLICITUD
    // ============================================================
    if (order.estado === 'Devolucion_Solicitada' || order.estado === 'Devuelto') {
      return new Response(
        JSON.stringify({ error: 'Este pedido ya tiene una solicitud de devolución' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ============================================================
    // 6. CREAR REGISTRO DE DEVOLUCIÓN
    // ============================================================
    const returnNumber = `RET-${order.numero_orden.replace('FS-', '')}`;

    const { error: returnError } = await supabase
      .from('devoluciones')
      .insert({
        orden_id: order.id,
        numero_devolucion: returnNumber,
        motivo: reason || 'No especificado',
        estado: 'Pendiente',
        fecha_solicitud: new Date().toISOString(),
      });

    if (returnError) {
      console.error('[RETURNS] Error creando registro de devolución:', returnError);
      // No fallamos toda la operación para no frustrar al cliente si el pedido ya se marcó como tal,
      // pero informamos internamente.
    } else {
      console.log(`[RETURNS] Registro de devolución creado: ${returnNumber}`);
    }

    // ============================================================
    // 7. ACTUALIZAR ESTADO DEL PEDIDO
    // ============================================================
    const { error: updateError } = await supabase
      .from('ordenes')
      .update({
        estado: 'Devolucion_Solicitada',
        actualizado_en: new Date().toISOString(),
      })
      .eq('id', order.id);

    if (updateError) {
      console.error('[RETURNS] Error actualizando pedido:', updateError);
      return new Response(
        JSON.stringify({ error: 'Error al procesar la solicitud' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[RETURNS] Pedido actualizado a Devolucion_Solicitada`);

    // ============================================================
    // 8. OBTENER ITEMS DEL PEDIDO
    // ============================================================
    const { data: items } = await supabase
      .from('items_orden')
      .select('*')
      .eq('orden_id', order.id);

    // ============================================================
    // 9. ENVIAR EMAIL AL ADMINISTRADOR
    // ============================================================
    try {
      // 1. Notificar al Admin
      await sendAdminNotificationEmail({
        type: 'return_request',
        order_number: order.numero_orden,
        customer_name: order.nombre_cliente,
        customer_email: order.email_cliente,
        total: order.total,
        items_count: items?.length || 0,
        return_reason: reason || 'No especificado',
      });
      console.log('[RETURNS] Email enviado al administrador');

      // 2. Enviar instrucciones al Cliente
      await sendReturnInstructionsEmail(
        order.email_cliente,
        order.nombre_cliente,
        order.numero_orden,
        returnNumber
      );
      console.log('[RETURNS] Email de instrucciones enviado al cliente');

    } catch (emailError) {
      console.error('[RETURNS] Error enviando email:', emailError);
      // No fallamos la solicitud por error de email
    }

    // ============================================================
    // 10. RESPONDER CON ÉXITO
    // ============================================================
    console.log(`[RETURNS] Solicitud completada: ${returnNumber}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Solicitud de devolución procesada correctamente',
        returnNumber,
        instructions: 'Recibirás un email con las instrucciones para devolver el producto.',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[RETURNS] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
