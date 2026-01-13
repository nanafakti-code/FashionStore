import type { APIRoute } from 'astro';
import Stripe from 'stripe';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY);

export const GET: APIRoute = async (context) => {
  try {
    const { sessionId } = context.params;

    if (!sessionId || typeof sessionId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Session ID is required' }),
        { status: 400 }
      );
    }

    // Obtener detalles de la sesión
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return new Response(
      JSON.stringify({
        id: session.id,
        payment_status: session.payment_status,
        customer_email: session.customer_email,
        total_amount: session.amount_total,
        currency: session.currency,
        created: session.created,
        metadata: session.metadata
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error retrieving session:', error);
    return new Response(
      JSON.stringify({ error: 'Error retrieving session details' }),
      { status: 500 }
    );
  }
};
