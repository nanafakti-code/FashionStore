import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const POST: APIRoute = async ({ request }) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return new Response(
        JSON.stringify({ success: false, message: 'Email inválido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Llamar a la función RPC que maneja toda la lógica (Atomicidad)
    const { data, error } = await supabase
      .rpc('newsletter_signup', { p_email: email.toLowerCase() });

    if (error) {
      console.error('Error calling newsletter_signup RPC:', error);
      return new Response(
        JSON.stringify({ success: false, message: 'Error al procesar la suscripción' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // La RPC devuelve un array con un objeto
    const result = Array.isArray(data) ? data[0] : (data as any);

    if (!result || !result.success) {
      return new Response(
        JSON.stringify({ success: false, message: result?.message || 'Error desconocido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Detectar si ya estaba suscrito (la RPC devuelve 'YA_SUSCRITO' o mensaje 'Ya estás suscrito')
    const yaExiste = result.codigo === 'YA_SUSCRITO' || (result.message && result.message.includes('Ya estás'));

    if (yaExiste) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Este email ya está suscrito a nuestra newsletter.'
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Nuevo suscriptor con cupón generado
    // Nuevo suscriptor con cupón generado
    const { sendNewsletterWelcomeEmail } = await import('@/lib/emailService');
    // Enviamos el correo (no bloqueamos la respuesta al cliente)
    sendNewsletterWelcomeEmail(email.toLowerCase(), result.codigo).catch((e: Error) => {
      console.error('Error sending newsletter welcome email:', e);
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: result.message,
        codigo: result.codigo
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Error del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
