import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { createAdminSessionToken } from '@/lib/admin-auth';

// Usar la clave de servicio para saltar RLS
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const username: string = (body.username || '').trim().toLowerCase();
    const password: string = body.password || '';

    if (!username || !password) {
      return new Response(JSON.stringify({ error: 'Faltan credenciales' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!serviceRoleKey) {
      console.error('[Admin Login] Falta SUPABASE_SERVICE_ROLE_KEY');
      return new Response(JSON.stringify({ error: 'Error de configuración del servidor' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Cliente con permisos de admin (bypass RLS)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Buscar usuario en la tabla admin_credentials
    const { data, error } = await supabaseAdmin
      .from('admin_credentials')
      .select('*')
      .ilike('email', username) // ilike = case-insensitive
      .single();

    if (error || !data) {
      console.log(`[Admin Login] Usuario no encontrado: ${username}`);
      return new Response(JSON.stringify({ error: 'Credenciales inválidas' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verificar contraseña (bcrypt o texto plano)
    let passwordValid = false;
    const storedPassword: string = data.password || '';

    if (storedPassword.startsWith('$2b$') || storedPassword.startsWith('$2a$')) {
      // Contraseña hasheada con bcrypt
      try {
        const bcrypt = (await import('bcryptjs')).default;
        passwordValid = await bcrypt.compare(password, storedPassword);
      } catch (e) {
        console.error('[Admin Login] Error al comparar bcrypt:', e);
        passwordValid = false;
      }
    } else {
      // Contraseña en texto plano
      passwordValid = storedPassword === password;
    }

    if (!passwordValid) {
      console.log('[Admin Login] Contraseña incorrecta');
      return new Response(JSON.stringify({ error: 'Credenciales inválidas' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generar token de sesión firmado con HMAC
    const sessionToken = createAdminSessionToken(data.email);

    console.log(`[Admin Login] Login exitoso para: ${data.email}`);

    return new Response(
      JSON.stringify({
        message: 'Login exitoso',
        username: data.email,
        token: sessionToken
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': `admin_session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`,
        },
      }
    );
  } catch (e: any) {
    console.error('[Admin Login] Error interno:', e);
    return new Response(JSON.stringify({
      error: 'Error interno del servidor',
      details: e.message || String(e)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
