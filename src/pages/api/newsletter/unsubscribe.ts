import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const GET: APIRoute = async ({ url }) => {
  try {
    const email = url.searchParams.get('email');

    if (!email) {
      return new Response(renderPage('Error', 'No se proporcionó un email válido.', false), {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase
      .from('newsletter_subscriptions')
      .update({ activo: false, updated_at: new Date().toISOString() })
      .eq('email', email.toLowerCase());

    if (error) {
      console.error('[NEWSLETTER] Unsubscribe error:', error);
      return new Response(renderPage('Error', 'Hubo un problema al cancelar tu suscripción. Inténtalo de nuevo.', false), {
        status: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    return new Response(renderPage('Suscripción cancelada', 'Tu suscripción a la newsletter de FashionStore ha sido cancelada correctamente. No recibirás más correos promocionales.', true), {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });

  } catch (error) {
    console.error('[NEWSLETTER] Unsubscribe error:', error);
    return new Response(renderPage('Error', 'Error del servidor. Inténtalo más tarde.', false), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
};

function renderPage(title: string, message: string, success: boolean): string {
  const color = success ? '#00aa45' : '#dc2626';
  const icon = success ? '✅' : '❌';
  
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - FashionStore</title>
  <style>
    body { margin:0; padding:0; background:#f5f5f7; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh; }
    .card { background:#fff; border-radius:16px; padding:48px; text-align:center; max-width:420px; box-shadow:0 4px 20px rgba(0,0,0,0.08); }
    .icon { font-size:48px; margin-bottom:16px; }
    h1 { color:#111827; font-size:24px; margin:0 0 12px; }
    p { color:#6b7280; font-size:16px; line-height:1.5; margin:0 0 24px; }
    a { display:inline-block; background:${color}; color:#fff; text-decoration:none; padding:12px 28px; border-radius:8px; font-weight:600; transition:opacity .2s; }
    a:hover { opacity:0.9; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="https://fashionstorerbv3.victoriafp.online">Volver a FashionStore</a>
  </div>
</body>
</html>`;
}
