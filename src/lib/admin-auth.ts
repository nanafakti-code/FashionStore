/**
 * ADMIN AUTHENTICATION UTILITIES
 * Sistema simple de autenticación para el panel de administración
 */

// Credenciales de administrador - HARDCODED para máxima compatibilidad
const ADMIN_EMAIL = 'admin@fashionstore.com';
const ADMIN_PASSWORD = '1234';

console.log('[ADMIN-AUTH] Sistema inicializado');
console.log('[ADMIN-AUTH] Email:', ADMIN_EMAIL);

export interface AdminSession {
  username: string;
  isAdmin: boolean;
  createdAt: number;
}

/**
 * Validar credenciales de login
 */
export function validateAdminCredentials(username: string, password: string): boolean {
  // Normalizar email (lowercase y trim)
  const normalizedUsername = username.toLowerCase().trim();
  const normalizedAdminEmail = ADMIN_EMAIL.toLowerCase().trim();

  console.log('[ADMIN-AUTH] ==========================================');
  console.log('[ADMIN-AUTH] VALIDACIÓN DE CREDENCIALES');
  console.log('[ADMIN-AUTH] ==========================================');
  console.log('[ADMIN-AUTH] Username recibido:', `"${username}"`);
  console.log('[ADMIN-AUTH] Username normalizado:', `"${normalizedUsername}"`);
  console.log('[ADMIN-AUTH] Email esperado:', `"${normalizedAdminEmail}"`);
  console.log('[ADMIN-AUTH] Password recibido:', `"${password}"`);
  console.log('[ADMIN-AUTH] Password esperado:', `"${ADMIN_PASSWORD}"`);
  console.log('[ADMIN-AUTH] Email match:', normalizedUsername === normalizedAdminEmail);
  console.log('[ADMIN-AUTH] Password match:', password === ADMIN_PASSWORD);

  const isValid = (
    normalizedUsername === normalizedAdminEmail &&
    password === ADMIN_PASSWORD
  );

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

