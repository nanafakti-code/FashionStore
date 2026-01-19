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

    // Verificar si ya existe
    const { data: existing } = await supabase
      .from('newsletter_subscriptions')
      .select('codigo_descuento')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Este email ya está registrado en nuestra newsletter' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generar código único
    const codigo = 'WELCOME' + Math.random().toString(36).substring(2, 8).toUpperCase();

    // Insertar suscripción
    const { error: insertError } = await supabase
      .from('newsletter_subscriptions')
      .insert({ 
        email: email.toLowerCase(), 
        codigo_descuento: codigo 
      });

    if (insertError) {
      console.error('Error inserting newsletter subscription:', insertError);
      return new Response(
        JSON.stringify({ success: false, message: 'Error al procesar la suscripción' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Crear el cupón correspondiente (10% descuento, válido 30 días)
    const fechaFin = new Date();
    fechaFin.setDate(fechaFin.getDate() + 30);

    await supabase
      .from('cupones_descuento')
      .insert({
        codigo: codigo,
        descripcion: 'Cupón bienvenida newsletter - 10% descuento',
        tipo: 'Porcentaje',
        valor: 10,
        minimo_compra: 0,
        maximo_uses: 1,
        usos_actuales: 0,
        activo: true,
        fecha_inicio: new Date().toISOString(),
        fecha_fin: fechaFin.toISOString()
      });

    // TODO: Enviar email con el código (integrar con Resend, SendGrid, etc.)
    // Por ahora solo devolvemos el código

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: '¡Gracias por suscribirte! Te hemos enviado un email con tu código de descuento.',
        codigo: codigo 
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
