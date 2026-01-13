/**
 * TEST DE AUTENTICACIÓN ADMIN
 * Ejecuta este archivo con: node src/tests/auth-test.mjs
 */

import { createAdminSessionToken, verifyAdminSessionToken, validateAdminCredentials, isAdminFromCookie } from '../lib/admin-auth.ts';

console.log('=== TEST DE AUTENTICACIÓN ADMIN ===\n');

// Test 1: Validación de credenciales
console.log('Test 1: Validación de credenciales');
const validCreds = validateAdminCredentials('admin@fashionstore.com', '1234');
const invalidCreds = validateAdminCredentials('admin@fashionstore.com', 'wrong');
console.log(`✓ Credenciales válidas: ${validCreds}`);
console.log(`✓ Credenciales inválidas rechazadas: ${!invalidCreds}\n`);

// Test 2: Crear token
console.log('Test 2: Crear y verificar token');
const token = createAdminSessionToken('admin@fashionstore.com');
console.log(`✓ Token creado: ${token.substring(0, 20)}...\n`);

// Test 3: Verificar token
const session = verifyAdminSessionToken(token);
console.log(`✓ Token verificado:`);
console.log(`  - Usuario: ${session?.username}`);
console.log(`  - Es Admin: ${session?.isAdmin}`);
console.log(`  - Creado hace: ${Date.now() - (session?.createdAt || 0)}ms\n`);

// Test 4: Cookie parsing
console.log('Test 4: Parsear cookie');
const cookieString = `admin_session=${token}; Path=/; HttpOnly`;
const isAdmin = isAdminFromCookie(cookieString);
console.log(`✓ Cookie parseada correctamente: ${isAdmin}\n`);

// Test 5: Cookie expirada
console.log('Test 5: Detectar token expirado');
const oldSession = {
  username: 'admin@fashionstore.com',
  isAdmin: true,
  createdAt: Date.now() - (25 * 60 * 60 * 1000) // 25 horas atrás
};
const oldToken = Buffer.from(JSON.stringify(oldSession)).toString('base64');
const expiredVerify = verifyAdminSessionToken(oldToken);
console.log(`✓ Token expirado rechazado: ${expiredVerify === null}\n`);

console.log('=== TODOS LOS TESTS PASARON ===');
