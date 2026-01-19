/**
 * OBTENER PEDIDO POR EMAIL Y NÚMERO (INVITADOS)
 * =============================================
 * Permite a clientes sin cuenta consultar sus pedidos
 */

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

export const GET: APIRoute = async (context) => {
  try {
    const url = new URL(context.request.url);
    const email = url.searchParams.get('email');
    const orderNumber = url.searchParams.get('orderNumber');

    if (!email || !orderNumber) {
      return new Response(
        JSON.stringify({ error: 'Email y número de pedido son requeridos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[ORDER-BY-GUEST] Buscando pedido: ${orderNumber} para ${email}`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar el pedido por número y email
    const { data: order, error: orderError } = await supabase
      .from('ordenes')
      .select('*')
      .eq('numero_orden', orderNumber)
      .eq('email_cliente', email)
      .single();

    if (orderError || !order) {
      console.log('[ORDER-BY-GUEST] Pedido no encontrado');
      return new Response(
        JSON.stringify({ error: 'No se encontró ningún pedido con esos datos. Verifica el email y número de pedido.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener items del pedido
    const { data: items, error: itemsError } = await supabase
      .from('items_orden')
      .select('*')
      .eq('orden_id', order.id);

    if (itemsError) {
      console.error('[ORDER-BY-GUEST] Error obteniendo items:', itemsError);
    }

    console.log(`[ORDER-BY-GUEST] Pedido encontrado: ${order.numero_orden}`);

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
          fecha_envio: order.fecha_envio,
          fecha_entrega: order.fecha_entrega,
        },
        items: items || [],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[ORDER-BY-GUEST] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
