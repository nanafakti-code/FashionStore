/**
 * ADMIN AUTH GUARD — Helper reutilizable
 * ========================================
 * Función centralizada para verificar autenticación admin
 * en todos los endpoints de /api/admin/*
 */

import { getAdminTokenFromCookie, verifyAdminSessionToken } from './admin-auth';

const UNAUTHORIZED_RESPONSE = () =>
  new Response(JSON.stringify({ error: 'No autorizado' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });

/**
 * Verifica que el request venga de un admin autenticado.
 * Devuelve `null` si es válido, o un Response 401 si no.
 *
 * Uso:
 * ```ts
 * const denied = requireAdmin(request);
 * if (denied) return denied;
 * ```
 */
export function requireAdmin(request: Request): Response | null {
  const cookie = request.headers.get('cookie') || '';
  const token = getAdminTokenFromCookie(cookie);

  console.log('[DEBUG-GUARD] Cookie header:', cookie);
  console.log('[DEBUG-GUARD] Extracted token:', token ? token.substring(0, 10) + '...' : 'null');

  if (!token) {
    console.log('[DEBUG-GUARD] No token found in cookies');
    return UNAUTHORIZED_RESPONSE();
  }

  const session = verifyAdminSessionToken(token);

  if (!session) {
    console.log('[DEBUG-GUARD] Token verification failed');
    return UNAUTHORIZED_RESPONSE();
  }

  if (!session.isAdmin) {
    console.log('[DEBUG-GUARD] User is not admin');
    return UNAUTHORIZED_RESPONSE();
  }

  return null; // Autenticado correctamente
}
