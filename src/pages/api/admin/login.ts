/**
 * ADMIN LOGIN API ENDPOINT
 * ========================
 * Procesa las solicitudes de login del panel de administración
 */

import type { APIRoute } from 'astro';
import { validateAdminCredentials, createAdminSessionToken } from '@/lib/admin-auth';

export const POST: APIRoute = async (context) => {
  try {
    console.log('[ADMIN-LOGIN-API] POST request received');
    
    // Obtener datos del formulario
    const body = await context.request.text();
    const params = new URLSearchParams(body);
    
    const username = params.get('username')?.toString().trim() || '';
    const password = params.get('password')?.toString().trim() || '';

    console.log('[ADMIN-LOGIN-API] Username:', username);

    // Validaciones
    if (!username) {
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
    if (validateAdminCredentials(username, password)) {
      console.log('[ADMIN-LOGIN-API] ✓ Credenciales válidas');
      const token = createAdminSessionToken(username);
      
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
};
