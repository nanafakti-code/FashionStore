import type { APIRoute } from 'astro';
import Stripe from 'stripe';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY);

export const POST: APIRoute = async (context) => {
  try {
    const body = await context.request.json();
    const { totalAmount, userEmail, successUrl, cancelUrl } = body;

    if (!totalAmount || !userEmail) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
      );
    }

    // Crear sesión de Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Pedido FashionStore',
              description: 'Compra de productos electrónicos'
            },
            unit_amount: totalAmount // Ya viene en céntimos
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      customer_email: userEmail,
      success_url: successUrl || 'http://localhost:4322/checkout/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: cancelUrl || 'http://localhost:4322/checkout',
      metadata: {
        total_amount: totalAmount.toString()
      }
    });

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
        clientSecret: session.client_secret,
        publishableKey: import.meta.env.PUBLIC_STRIPE_PUBLIC_KEY
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating Stripe session:', error);
    return new Response(
      JSON.stringify({ error: 'Error creating checkout session' }),
      { status: 500 }
    );
  }
};
