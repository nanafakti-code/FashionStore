import type { APIRoute } from 'astro';
import { verifyAdminSessionToken } from '@/lib/admin-auth';

/**
 * Verificar si el usuario está autenticado
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return new Response(JSON.stringify({ authenticated: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const session = verifyAdminSessionToken(token);
    
    if (session?.username) {
      return new Response(JSON.stringify({
        authenticated: true,
        username: session.username
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ authenticated: false }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[AUTH-CHECK] Error:', error);
    return new Response(JSON.stringify({ authenticated: false }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
