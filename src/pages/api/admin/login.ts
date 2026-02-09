/**
 * ADMIN LOGIN API ENDPOINT
 * ========================
 * Procesa las solicitudes de login del panel de administración
 * Soporta tanto GET como POST para evitar problemas de CSRF
 */

import type { APIRoute } from 'astro';
import { validateAdminCredentials, createAdminSessionToken } from '@/lib/admin-auth';

export const POST: APIRoute = async (context) => {
  return handleLogin(context);
};

export const GET: APIRoute = async (context) => {
  // También permitir GET para evitar problemas de CSRF
  return handleLogin(context);
};

async function handleLogin(context: any) {
  try {
    console.log('[ADMIN-LOGIN-API] Request received');

    let username = '';
    let password = '';

    // Obtener datos del query string o body
    const url = new URL(context.request.url);

    // Intentar primero con query string
    username = url.searchParams.get('username')?.trim() || '';
    password = url.searchParams.get('password')?.trim() || '';

    // Si no hay en query string, intentar con body
    if (!username || !password) {
      const contentType = context.request.headers.get('content-type');

      if (contentType?.includes('form-data')) {
        const formData = await context.request.formData();
        username = formData.get('username')?.toString().trim() || '';
        password = formData.get('password')?.toString().trim() || '';
      } else if (context.request.method === 'POST') {
        const body = await context.request.text();
        const params = new URLSearchParams(body);
        username = params.get('username')?.toString().trim() || '';
        password = params.get('password')?.toString().trim() || '';
      }
    }

    console.log('[ADMIN-LOGIN-API] Username:', username);
    console.log('[ADMIN-LOGIN-API] Password length:', password.length);
    console.log('[ADMIN-LOGIN-API] Method:', context.request.method);

    // Validaciones
    if (!username) {
      console.log('[ADMIN-LOGIN-API] ✗ Username vacío');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Por favor ingresa tu correo electrónico'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!password) {
      console.log('[ADMIN-LOGIN-API] ✗ Password vacío');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Por favor ingresa tu contraseña'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!username.includes('@')) {
      console.log('[ADMIN-LOGIN-API] ✗ Email inválido');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'El correo electrónico no es válido'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validar credenciales
    console.log('[ADMIN-LOGIN-API] Validando credenciales...');
    if (await validateAdminCredentials(username, password)) {
      console.log('[ADMIN-LOGIN-API] ✓ Credenciales válidas - Generando token');
      const token = createAdminSessionToken(username);

      console.log('[ADMIN-LOGIN-API] ✓ Token generado exitosamente');
      return new Response(
        JSON.stringify({
          success: true,
          token,
          username
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } else {
      console.log('[ADMIN-LOGIN-API] ✗ Credenciales inválidas');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Correo electrónico o contraseña incorrectos'
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('[ADMIN-LOGIN-API] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Error al procesar el login'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
