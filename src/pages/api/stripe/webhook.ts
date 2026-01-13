import type { APIRoute } from 'astro';
import Stripe from 'stripe';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY);
const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;

export const POST: APIRoute = async (context) => {
  try {
    const body = await context.request.text();
    const signature = context.request.headers.get('stripe-signature');

    if (!signature) {
      return new Response(JSON.stringify({ error: 'No signature' }), { status: 400 });
    }

    // Verificar que el webhook es válido
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return new Response(
        JSON.stringify({ error: `Webhook Error: ${err.message}` }),
        { status: 400 }
      );
    }

    // Procesar eventos
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        console.log('✅ Pago completado:', {
          sessionId: session.id,
          email: session.customer_email,
          total: session.amount_total,
          status: session.payment_status
        });

        // Aquí puedes:
        // 1. Crear la orden en tu BD
        // 2. Enviar email de confirmación
        // 3. Actualizar el carrito (marcar como pagado)
        
        // Ejemplo:
        // await createOrder({
        //   stripe_session_id: session.id,
        //   customer_email: session.customer_email,
        //   total_amount: session.amount_total / 100,
        //   status: 'paid'
        // });

        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as any;
        console.log('💳 Intención de pago exitosa:', paymentIntent.id);
        break;
      }

      case 'charge.failed': {
        const charge = event.data.object as any;
        console.error('❌ Pago fallido:', charge.id);
        break;
      }

      default:
        console.log(`Evento no manejado: ${event.type}`);
    }

    // Retornar 200 para confirmar recepción a Stripe
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed' }),
      { status: 500 }
    );
  }
};
