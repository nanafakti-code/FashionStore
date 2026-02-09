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

    // Si ya estaba suscrito (success=true pero mensaje diferente) o registro nuevo
    if (result && result.success) {
      return new Response(
        JSON.stringify({
          success: true,
          message: result.message,
          codigo: result.codigo
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          message: result?.message || 'Error desconocido'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Error del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
