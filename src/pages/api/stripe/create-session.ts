/**
 * CREAR SESIÓN DE STRIPE - Endpoint de Checkout
 * =============================================
 * 
 * FLUJO CORRECTO:
 * 1. Cliente envía items + datos
 * 2. CREAR PEDIDO EN BD con estado "Pendiente_Pago"
 * 3. CREAR SESIÓN STRIPE con order_id en metadata
 * 4. Cliente paga en Stripe
 * 5. Webhook recibe checkout.session.completed
 * 6. Webhook actualiza estado a "Pagado"
 * 
 * IMPORTANTE: El order_id DEBE estar en metadata
 * para que el webhook sepa qué pedido actualizar
 */

import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripeKey = import.meta.env.STRIPE_SECRET_KEY;
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

// Verificar configuración
if (!stripeKey) {
  console.error('[CREATE-SESSION] ❌ STRIPE_SECRET_KEY no configurada');
}
if (!supabaseUrl) {
  console.error('[CREATE-SESSION] ❌ PUBLIC_SUPABASE_URL no configurada');
}
if (!supabaseKey) {
  console.error('[CREATE-SESSION] ❌ SUPABASE_SERVICE_ROLE_KEY no configurada');
}

const stripe = new Stripe(stripeKey || '');

// Generar número de orden único
function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `FS-${year}${month}${day}-${random}`;
}

export const POST: APIRoute = async (context) => {
  try {
    console.log('[CREATE-SESSION] Iniciando creación de sesión de Stripe');
    
    // Verificar configuración
    if (!stripeKey || !supabaseUrl || !supabaseKey) {
      console.error('[CREATE-SESSION] ❌ Variables de entorno faltantes:', {
        stripe: !!stripeKey,
        supabaseUrl: !!supabaseUrl,
        supabaseKey: !!supabaseKey
      });
      return new Response(
        JSON.stringify({ error: 'Configuración del servidor incompleta' }),
        { status: 500 }
      );
    }

    const body = await context.request.json();
    console.log('[CREATE-SESSION] Body recibido:', JSON.stringify(body, null, 2));
    
    const {
      totalAmount,
      userEmail,
      nombre,
      telefono,
      direccion,
      descuento = 0,
      cuponId,
      items = [],
      userId,
      isGuest = false,
    } = body;

    // ============================================================
    // 1. VALIDACIONES
    // ============================================================
    if (!totalAmount || !userEmail) {
      console.error('[CREATE-SESSION] Parámetros obligatorios faltando');
      return new Response(
        JSON.stringify({ error: 'Email y total son obligatorios' }),
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      console.error('[CREATE-SESSION] Email inválido:', userEmail);
      return new Response(
        JSON.stringify({ error: 'Email no válido' }),
        { status: 400 }
      );
    }

    if (items.length === 0) {
      console.error('[CREATE-SESSION] Carrito vacío');
      return new Response(
        JSON.stringify({ error: 'El carrito está vacío' }),
        { status: 400 }
      );
    }

    // ============================================================
    // 2. CREAR PEDIDO EN BD (con estado "Pendiente_Pago")
    // ============================================================
    console.log('[CREATE-SESSION] Creando pedido en BD...');

    const supabase = createClient(supabaseUrl, supabaseKey);
    const numeroOrden = generateOrderNumber();

    // Calcular impuestos (21% en España)
    const subtotal = totalAmount - descuento;
    const impuestos = Math.round((totalAmount * 21) / 121); // Incluido en el total

    const orderData: any = {
      numero_orden: numeroOrden,
      estado: 'Pendiente', // ← Estado inicial: esperando pago
      subtotal,
      impuestos,
      descuento,
      coste_envio: 0,
      total: totalAmount,
      cupon_id: cuponId || null,
      email_cliente: userEmail,
      nombre_cliente: nombre || userEmail.split('@')[0],
      telefono_cliente: telefono || null,
      direccion_envio: direccion || null,
      fecha_creacion: new Date().toISOString(),
    };

    // Solo agregar usuario_id si está autenticado
    if (userId) {
      orderData.usuario_id = userId;
    }

    const { data: order, error: orderError } = await supabase
      .from('ordenes')
      .insert(orderData)
      .select()
      .single();

    if (orderError || !order) {
      console.error('[CREATE-SESSION] Error creando pedido:', orderError);
      return new Response(
        JSON.stringify({ error: 'Error al crear el pedido' }),
        { status: 500 }
      );
    }

    console.log(`[CREATE-SESSION] ✅ Pedido creado: ${numeroOrden} (ID: ${order.id})`);

    // ============================================================
    // 3. CREAR ITEMS DEL PEDIDO EN BD
    // ============================================================
    console.log('[CREATE-SESSION] Creando items del pedido...');

    for (const item of items) {
      const { error: itemError } = await supabase
        .from('items_orden')
        .insert({
          orden_id: order.id,
          producto_id: item.producto_id,
          producto_nombre: item.nombre,
          producto_imagen: item.imagen || null,
          cantidad: item.cantidad,
          talla: item.talla || null,
          color: item.color || null,
          precio_unitario: item.precio_unitario,
          subtotal: item.precio_unitario * item.cantidad,
        });

      if (itemError) {
        console.error('[CREATE-SESSION] Error creando item:', itemError);
      }
    }

    console.log(`[CREATE-SESSION] ✅ ${items.length} items creados`);

    // ============================================================
    // 4. CREAR SESIÓN EN STRIPE (con order_id en metadata)
    // ============================================================
    console.log('[CREATE-SESSION] Creando sesión de Stripe...');

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Pedido ${numeroOrden}`,
              description: `${items.length} producto(s) de FashionStore`,
            },
            unit_amount: totalAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: userEmail,
      success_url:
        `${import.meta.env.APP_URL || import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:
        `${import.meta.env.APP_URL || import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321'}/checkout/cancel`,

      // ⭐ METADATA CRÍTICA ⭐
      metadata: {
        order_id: order.id, // ← CAMPO CRÍTICO para webhook
        numero_orden: numeroOrden,
        user_id: userId || '',
        is_guest: isGuest ? 'true' : 'false',
        email: userEmail,
        nombre: nombre || '',
        telefono: telefono || '',
        direccion: direccion ? JSON.stringify(direccion) : '',
        descuento: descuento.toString(),
        cupon_id: cuponId || '',
        items: JSON.stringify(items),
      },
    });

    console.log(`[CREATE-SESSION] ✅ Sesión Stripe creada: ${session.id}`);
    console.log(
      `[CREATE-SESSION] === LISTO PARA PAGO: ${numeroOrden} ===\n`
    );

    // ============================================================
    // 5. RESPONDER AL CLIENTE
    // ============================================================
    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
        clientSecret: session.client_secret,
        publishableKey: import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY,
        orderId: order.id, // Para tracking en cliente
        orderNumber: numeroOrden,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[CREATE-SESSION] ❌ Error completo:', error);
    
    // Detectar tipo de error
    let errorMessage = 'Error al crear la sesión de pago';
    let errorDetails = 'Unknown error';
    
    if (error instanceof Error) {
      errorDetails = error.message;
      
      // Errores específicos de Stripe
      if (error.message.includes('Invalid API Key')) {
        errorMessage = 'Error de configuración de Stripe';
        errorDetails = 'La clave de API de Stripe es inválida';
      } else if (error.message.includes('No such')) {
        errorMessage = 'Error de Stripe';
      }
    }
    
    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: errorDetails,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
