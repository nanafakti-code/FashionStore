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
import { supabase as supabaseAuth } from '@/lib/supabase';

import { randomInt } from 'crypto';

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

// Generar número de orden único con crypto random
function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = randomInt(10000).toString().padStart(4, '0');
  return `FS-${year}${month}${day}-${random}`;
}

export const POST: APIRoute = async (context) => {
  try {
    // Verificar configuración
    if (!stripeKey || !supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: 'Configuración del servidor incompleta' }),
        { status: 500 }
      );
    }

    const body = await context.request.json();

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
      guestSessionId,
    } = body;

    // ============================================================
    // 0. VERIFICAR AUTENTICACIÓN
    // ============================================================
    if (userId) {
      // Usuario autenticado: verificar token
      let token = context.cookies.get('sb-access-token')?.value;
      if (!token) {
        const authHeader = context.request.headers.get('Authorization');
        if (authHeader?.startsWith('Bearer ')) {
          token = authHeader.slice(7);
        }
      }

      if (!token) {
        return new Response(
          JSON.stringify({ error: 'Autenticación requerida' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
      if (authError || !user || user.id !== userId) {
        return new Response(
          JSON.stringify({ error: 'No autorizado' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } else if (!guestSessionId) {
      // Ni usuario autenticado ni sesión de invitado
      return new Response(
        JSON.stringify({ error: 'Se requiere userId o guestSessionId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

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
      console.error('[CREATE-SESSION] Email inválido:');
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
    const supabase = createClient(supabaseUrl, supabaseKey);
    const numeroOrden = generateOrderNumber();

    // Calcular impuestos (sin IVA)
    // totalAmount ya viene CON DESCUENTO APLICADO del cliente
    // Para obtener el subtotal original: totalAmount + descuento
    const subtotal = totalAmount + descuento;
    const impuestos = 0; // Sin impuestos

    const orderData: any = {
      numero_orden: numeroOrden,
      estado: 'Pendiente', // ← Estado inicial: esperando pago
      subtotal,
      impuestos,
      descuento,
      coste_envio: 0,
      total: totalAmount,
      // cupon_id is tracked in coupon_usages table, not here (ordenes.cupon_id is UUID type, incompatible with coupons.id BIGINT)
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
      console.error('[CREATE-SESSION] Error creando pedido:');
      return new Response(
        JSON.stringify({ error: 'Error al crear el pedido' }),
        { status: 500 }
      );
    }
    // ============================================================
    // 2.5 REGISTRAR USO DEL CUPÓN (si aplica)
    // ============================================================
    if (cuponId && userId && descuento > 0) {
      try {
        // Insert usage record (using service role client to bypass RLS)
        // NOTE: order_id omitted because coupon_usages FK references pedidos, not ordenes
        const { error: usageError } = await supabase
          .from('coupon_usages')
          .insert({
            coupon_id: cuponId,
            user_id: userId,
            discount_amount: descuento,
          });

        if (usageError) {
        } else {
          // Check if coupon should be deactivated
          const { data: couponData } = await supabase
            .from('coupons')
            .select('assigned_user_id, max_uses_global, max_uses_per_user')
            .eq('id', cuponId)
            .single();

          if (couponData) {
            let shouldDeactivate = false;

            // EXCLUSIVE coupon (assigned to specific user) → deactivate after use
            if (couponData.assigned_user_id) {
              shouldDeactivate = true;
            }

            // GLOBAL coupon with explicit total usage limit → deactivate ONLY when limit reached
            // If max_uses_global is NULL → unlimited, NEVER deactivate
            // Per-user limits are handled via coupon_usages checks, NOT by deactivating the coupon
            if (!shouldDeactivate && couponData.max_uses_global !== null && couponData.max_uses_global > 0) {
              const { count } = await supabase
                .from('coupon_usages')
                .select('id', { count: 'exact', head: true })
                .eq('coupon_id', cuponId);

              if ((count || 0) >= couponData.max_uses_global) {
                shouldDeactivate = true;
              } else {
              }
            }

            if (shouldDeactivate) {
              const { error: deactivateError } = await supabase
                .from('coupons')
                .update({ is_active: false })
                .eq('id', cuponId);

              if (deactivateError) {
              } else {
              }
            } else if (!couponData.assigned_user_id) {
            }
          }
        }
      } catch (couponError) {
      }
    }

    // ============================================================
    // 3. CREAR ITEMS DEL PEDIDO EN BD
    // ============================================================
    let insertedItems = 0;
    const itemErrors: string[] = [];

    for (const item of items) {
      // Validar que el item tenga los campos requeridos
      if (!item.producto_id) {
        console.error('[CREATE-SESSION] Item sin producto_id:');
        itemErrors.push(`Item sin producto_id: ${JSON.stringify(item)}`);
        continue;
      }

      const itemData = {
        orden_id: order.id,
        producto_id: item.producto_id,
        producto_nombre: item.nombre || 'Producto',
        producto_imagen: item.imagen || null,
        cantidad: item.cantidad || 1,
        talla: item.talla || null,
        color: item.color || null,
        precio_unitario: item.precio_unitario || 0,
        subtotal: (item.precio_unitario || 0) * (item.cantidad || 1),
      };
      const { error: itemError } = await supabase
        .from('items_orden')
        .insert(itemData);

      if (itemError) {
        console.error('[CREATE-SESSION] Error creando item:');
        itemErrors.push(`Error en ${item.producto_id}: ${itemError.message}`);
      } else {
        insertedItems++;
      }
    }
    if (itemErrors.length > 0) {
    }

    // ============================================================
    // 4. CREAR SESIÓN EN STRIPE (con order_id en metadata)
    // ============================================================
    // Preparar items de forma compacta para metadata (límite 500 chars por valor)
    const itemsSummary = items.map((i: any) => ({
      id: i.producto_id,
      q: i.cantidad
    }));

    // Si el JSON es demasiado largo, solo guardar IDs
    let itemsMetadata = JSON.stringify(itemsSummary);
    if (itemsMetadata.length > 400) {
      itemsMetadata = items.map((i: any) => i.producto_id).join(',').substring(0, 400);
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map((item: any) => ({
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.nombre || 'Producto',
            description: [
              item.talla && `Talla: ${item.talla}`,
              item.color && `Color: ${item.color}`,
            ]
              .filter(Boolean)
              .join(' | ') || undefined,
            images: item.imagen ? [item.imagen] : [],
          },
          unit_amount: item.precio_unitario,
        },
        quantity: item.cantidad,
      })),
      mode: 'payment',
      customer_email: userEmail,
      success_url:
        `${import.meta.env.APP_URL || import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:
        `${import.meta.env.APP_URL || import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321'}/checkout/cancel`,

      // ⭐ METADATA CRÍTICA ⭐
      // Nota: Cada valor de metadata tiene límite de 500 caracteres
      metadata: {
        order_id: order.id, // ← CAMPO CRÍTICO para webhook
        numero_orden: numeroOrden,
        user_id: userId || '',
        is_guest: isGuest ? 'true' : 'false',
        guest_session_id: guestSessionId || '',
        email: userEmail,
        nombre: (nombre || '').substring(0, 100),
        telefono: (telefono || '').substring(0, 50),
        direccion: direccion ? JSON.stringify(direccion).substring(0, 400) : '',
        descuento: descuento.toString(),
        cupon_id: cuponId || '',
        items_count: items.length.toString(),
        items: itemsMetadata,
      },
    });
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
    console.error('[CREATE-SESSION] ❌ Error completo:');

    // Detectar tipo de error
    let errorMessage = 'Error al crear la sesión de pago';

    if (error instanceof Error) {
      // Errores específicos de Stripe
      if (error.message.includes('Invalid API Key')) {
        errorMessage = 'Error de configuración de Stripe';
      } else if (error.message.includes('No such')) {
        errorMessage = 'Error de Stripe';
      }
    }

    return new Response(
      JSON.stringify({
        error: errorMessage,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
