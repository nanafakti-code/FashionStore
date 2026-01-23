/**
 * GET CSRF TOKEN
 * Para obtener token de CSRF antes de hacer POST al login
 */

import type { APIRoute } from 'astro';

export const GET: APIRoute = async (context) => {
  try {
    // Generar un token CSRF simple basado en timestamp y random
    const csrfToken = Buffer.from(
      Date.now().toString() + Math.random().toString()
    ).toString('base64').substring(0, 40);
    
    console.log('[CSRF-API] Sending CSRF token');
    
    return new Response(
      JSON.stringify({
        csrfToken
      }),
      {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }
    );
  } catch (error) {
    console.error('[CSRF-API] Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to generate CSRF token'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
