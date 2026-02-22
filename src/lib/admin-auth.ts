/**
 * ADMIN AUTHENTICATION UTILITIES
 * ===============================
 * Sistema de autenticación con contraseña desde BD (admin_credentials)
 * Tokens firmados con HMAC-SHA256 para evitar manipulación
 */

import { supabase } from './supabase';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import bcrypt from 'bcryptjs';

// Rondas de bcrypt para hashing
const BCRYPT_ROUNDS = 12;

// Email de administrador
const ADMIN_EMAIL = 'admin@fashionstore.com';

// Clave secreta para firmar tokens — OBLIGATORIA en producción
const TOKEN_SECRET: string | null = (() => {
  const secret = import.meta.env.ADMIN_TOKEN_SECRET;
  if (secret) return secret as string;
  if (import.meta.env.PROD) {
    console.warn('[ADMIN-AUTH] WARNING: ADMIN_TOKEN_SECRET no está configurado en producción. Las sesiones no funcionarán.');
    return null;
  }
  // Solo en desarrollo: generar secreto efímero (sessions se pierden al reiniciar)
  return randomBytes(32).toString('hex');
})();

export interface AdminSession {
  username: string;
  isAdmin: boolean;
  createdAt: number;
}

/**
 * Validar credenciales de login — lee contraseña de admin_credentials (Supabase)
 * Si la tabla no existe o BD falla, rechaza el login (fail-secure)
 */
export async function validateAdminCredentials(username: string, password: string): Promise<boolean> {
  // Validar inputs
  if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
    return false;
  }

  // Normalizar email (lowercase y trim)
  const normalizedUsername = username.toLowerCase().trim();
  const normalizedAdminEmail = ADMIN_EMAIL.toLowerCase().trim();

  // 1. Verificar email primero
  if (normalizedUsername !== normalizedAdminEmail) {
    return false;
  }

  // 2. Obtener la contraseña de la BD (sin fallback inseguro)
  try {
    const { data, error } = await supabase
      .from('admin_credentials')
      .select('password')
      .eq('email', ADMIN_EMAIL)
      .limit(1)
      .single();

    if (error || !data?.password) {
      console.error('[ADMIN-AUTH] No se pudo obtener credenciales de BD. Login rechazado.');
      return false; // Fail-secure: si no hay BD, no hay acceso
    }

    const storedPassword = data.password;

    // Detectar si la contraseña está hasheada con bcrypt (empieza con $2b$ o $2a$)
    if (storedPassword.startsWith('$2b$') || storedPassword.startsWith('$2a$')) {
      // Contraseña hasheada → comparar con bcrypt
      return await bcrypt.compare(password, storedPassword);
    }

    // Contraseña en texto plano (legacy) → comparar y migrar automáticamente a bcrypt
    const storedPasswordBuf = Buffer.from(storedPassword, 'utf-8');
    const inputPasswordBuf = Buffer.from(password, 'utf-8');

    if (storedPasswordBuf.length !== inputPasswordBuf.length) {
      return false;
    }

    const isValid = timingSafeEqual(storedPasswordBuf, inputPasswordBuf);

    // Si la contraseña es correcta, migrar a bcrypt automáticamente
    if (isValid) {
      try {
        const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
        await supabase
          .from('admin_credentials')
          .update({ password: hashedPassword })
          .eq('email', ADMIN_EMAIL);
        console.log('[ADMIN-AUTH] Contraseña migrada a bcrypt automáticamente.');
      } catch {
        // No bloquear login si falla la migración
      }
    }

    return isValid;
  } catch {
    console.error('[ADMIN-AUTH] Error accediendo a BD. Login rechazado.');
    return false; // Fail-secure
  }
}

/**
 * Crear token de sesión firmado con HMAC-SHA256
 * Formato: base64(payload).signature
 */
export function createAdminSessionToken(username: string): string {
  if (!TOKEN_SECRET) {
    throw new Error('No se puede crear el token: ADMIN_TOKEN_SECRET no está configurado');
  }

  const session: AdminSession = {
    username,
    isAdmin: true,
    createdAt: Date.now()
  };

  const payload = Buffer.from(JSON.stringify(session)).toString('base64url');
  const signature = createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');

  return `${payload}.${signature}`;
}

/**
 * Verificar token de sesión firmado
 * Valida firma HMAC y expiración (24 horas)
 */
export function verifyAdminSessionToken(token: string): AdminSession | null {
  try {
    if (!token || typeof token !== 'string') return null;

    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const payload = parts[0]!;
    const signature = parts[1]!;

    if (!TOKEN_SECRET) return null;

    // Verificar firma HMAC
    const expectedSignature = createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
    const sigBuffer = Buffer.from(signature, 'utf-8');
    const expectedBuffer = Buffer.from(expectedSignature, 'utf-8');

    if (sigBuffer.length !== expectedBuffer.length || !timingSafeEqual(sigBuffer, expectedBuffer)) {
      return null; // Firma inválida
    }

    // Decodificar payload (se codifica con base64url en createAdminSessionToken)
    const decoded = Buffer.from(payload, 'base64url').toString('utf-8');
    const session = JSON.parse(decoded) as AdminSession;

    // Verificar que la sesión no haya expirado (24 horas)
    const expiryTime = 24 * 60 * 60 * 1000;
    if (Date.now() - session.createdAt > expiryTime) {
      return null;
    }

    // Validar estructura del payload
    if (!session.username || typeof session.isAdmin !== 'boolean') {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Hashear una contraseña con bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verificar una contraseña contra un hash (soporta bcrypt y plaintext legacy)
 */
export async function verifyPassword(password: string, storedPassword: string): Promise<boolean> {
  if (storedPassword.startsWith('$2b$') || storedPassword.startsWith('$2a$')) {
    return bcrypt.compare(password, storedPassword);
  }
  // Plaintext legacy comparison
  const storedBuf = Buffer.from(storedPassword, 'utf-8');
  const inputBuf = Buffer.from(password, 'utf-8');
  if (storedBuf.length !== inputBuf.length) return false;
  return timingSafeEqual(storedBuf, inputBuf);
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

