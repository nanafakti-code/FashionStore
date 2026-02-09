/**
 * ADMIN AUTHENTICATION UTILITIES
 * Sistema de autenticación con contraseña desde BD (admin_credentials)
 * Fallback a hardcoded si la tabla no existe
 */

import { supabase } from './supabase';

// Credenciales por defecto (fallback si no hay tabla)
const ADMIN_EMAIL = 'admin@fashionstore.com';
const FALLBACK_PASSWORD = '1234';

console.log('[ADMIN-AUTH] Sistema inicializado');
console.log('[ADMIN-AUTH] Email:', ADMIN_EMAIL);

export interface AdminSession {
  username: string;
  isAdmin: boolean;
  createdAt: number;
}

/**
 * Validar credenciales de login — lee contraseña de admin_credentials (Supabase)
 * Fallback a FALLBACK_PASSWORD si la tabla no existe
 */
export async function validateAdminCredentials(username: string, password: string): Promise<boolean> {
  // Normalizar email (lowercase y trim)
  const normalizedUsername = username.toLowerCase().trim();
  const normalizedAdminEmail = ADMIN_EMAIL.toLowerCase().trim();

  console.log('[ADMIN-AUTH] ==========================================');
  console.log('[ADMIN-AUTH] VALIDACIÓN DE CREDENCIALES');
  console.log('[ADMIN-AUTH] ==========================================');
  console.log('[ADMIN-AUTH] Username recibido:', `"${username}"`);
  console.log('[ADMIN-AUTH] Username normalizado:', `"${normalizedUsername}"`);
  console.log('[ADMIN-AUTH] Email esperado:', `"${normalizedAdminEmail}"`);

  // 1. Verificar email primero
  if (normalizedUsername !== normalizedAdminEmail) {
    console.log('[ADMIN-AUTH] ✗ Email no coincide');
    return false;
  }

  // 2. Intentar obtener la contraseña de la BD
  let storedPassword = FALLBACK_PASSWORD;
  try {
    const { data, error } = await supabase
      .from('admin_credentials')
      .select('password')
      .eq('email', ADMIN_EMAIL)
      .limit(1)
      .single();

    if (!error && data?.password) {
      storedPassword = data.password;
      console.log('[ADMIN-AUTH] Usando contraseña de BD');
    } else {
      console.log('[ADMIN-AUTH] Tabla admin_credentials no disponible, usando fallback');
    }
  } catch {
    console.log('[ADMIN-AUTH] Error accediendo a BD, usando fallback');
  }

  const isValid = password === storedPassword;

  console.log('[ADMIN-AUTH] Password match:', isValid);
  console.log('[ADMIN-AUTH] ==========================================');
  console.log('[ADMIN-AUTH] RESULTADO:', isValid ? '✓ VÁLIDO' : '✗ INVÁLIDO');
  console.log('[ADMIN-AUTH] ==========================================');

  return isValid;
}

/**
 * Crear token de sesión (simple base64)
 */
export function createAdminSessionToken(username: string): string {
  const session: AdminSession = {
    username,
    isAdmin: true,
    createdAt: Date.now()
  };
  return Buffer.from(JSON.stringify(session)).toString('base64');
}

/**
 * Verificar token de sesión
 */
export function verifyAdminSessionToken(token: string): AdminSession | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const session = JSON.parse(decoded) as AdminSession;

    // Verificar que la sesión no expire (24 horas)
    const expiryTime = 24 * 60 * 60 * 1000;
    if (Date.now() - session.createdAt > expiryTime) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Extraer token de las cookies
 */
export function getAdminTokenFromCookie(cookieString: string | undefined): string | null {
  if (!cookieString) return null;

  try {
    const cookies = cookieString.split('; ');
    const sessionCookie = cookies.find(c => c.startsWith('admin_session='));

    if (!sessionCookie) return null;

    const token = sessionCookie.replace('admin_session=', '').trim();
    return token || null;
  } catch {
    return null;
  }
}

/**
 * Verificar si usuario es admin desde cookies
 */
export function isAdminFromCookie(cookieString: string | undefined): boolean {
  if (!cookieString) return false;

  try {
    // Buscar el token en las cookies
    const cookies = cookieString.split('; ');
    const sessionCookie = cookies.find(c => c.startsWith('admin_session='));

    if (!sessionCookie) return false;

    const token = sessionCookie.replace('admin_session=', '');
    const session = verifyAdminSessionToken(token);

    return session?.isAdmin ?? false;
  } catch {
    return false;
  }
}

