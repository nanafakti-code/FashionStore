import type { APIRoute } from 'astro';
import { createServerClient } from '@/lib/supabase';

/**
 * Verifica si el usuario está autenticado en el servidor
 * Usa la sesión de Supabase del servidor (más confiable)
 */
export const GET: APIRoute = async (_context) => {
  try {
    // Crear cliente server-side con sesión
    const supabaseServer = createServerClient();
    
    // Obtener el usuario actual desde Supabase en servidor
    const { data: { user }, error } = await supabaseServer.auth.getUser();
    
    if (error || !user) {
      return new Response(
        JSON.stringify({ 
          authenticated: false,
          user: null
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          user_metadata: user.user_metadata
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error checking auth:', error);
    return new Response(
      JSON.stringify({ 
        authenticated: false,
        error: 'Error al verificar autenticación',
        user: null
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
