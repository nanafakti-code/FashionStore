import type { APIContext } from 'astro';
import { supabase } from '@/lib/supabase';

/**
 * Obtiene el usuario autenticado en contexto server-side
 * Lee las cookies de la sesión desde el contexto HTTP
 */
export async function getServerUser(context: APIContext) {
  try {
    // Obtener el token de la cookie de Supabase
    const authToken = context.cookies.get('sb-access-token')?.value;
    const refreshToken = context.cookies.get('sb-refresh-token')?.value;
    
    if (!authToken || !refreshToken) {
      // No hay tokens en las cookies - usuario no autenticado
      return null;
    }
    
    // Crear cliente de Supabase con los tokens
    const { data: { user }, error } = await supabase.auth.getUser(authToken);
    
    if (error) {
      console.warn('Error getting server user:', error.message);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Error getting server user:', error);
    return null;
  }
}
