# AUDITORÍA COMPLETA DE SEGURIDAD Y CALIDAD — FashionStore

> Fecha: Enero 2025  
> Alcance: Todos los archivos en `src/` excepto los 11 ya corregidos  
> Formato: Ruta → Descripción → Severidad (P0–P3) → Corrección sugerida

---

## RESUMEN EJECUTIVO

| Severidad | Cantidad | Descripción |
|-----------|----------|-------------|
| **P0 — Crítico** | 4 | Vulnerabilidades explotables de inmediato |
| **P1 — Alto** | 16 | Brechas de seguridad serias |
| **P2 — Medio** | 18 | Problemas de fiabilidad / expositión de datos |
| **P3 — Bajo** | 10 | Mejoras de calidad / higiene del código |

---

## P0 — CRÍTICO (requiere corrección inmediata)

### 1. Contraseña de admin almacenada en TEXTO PLANO

**Archivo:** `src/pages/api/admin/change-password.ts`  
**Líneas:** 42-90

**Descripción:** Las contraseñas se guardan y comparan como texto plano (`creds.password !== currentPassword`). No hay hashing (bcrypt/argon2). Además, existe una contraseña hardcoded de fallback `'1234'`.

**Impacto:** Cualquier acceso a la tabla `admin_credentials` (SQL injection, backup filtrado, insider) expone la contraseña real del admin.

**Corrección sugerida:**
```typescript
import bcrypt from 'bcrypt';
// Al guardar:
const hashed = await bcrypt.hash(newPassword, 12);
await supabase.from('admin_credentials').update({ password: hashed }).eq('id', creds.id);
// Al verificar:
const valid = await bcrypt.compare(currentPassword, creds.password);
```
Eliminar el `FALLBACK_PASSWORD = '1234'`.

---

### 2. El endpoint de admin login acepta GET con credenciales en la URL

**Archivo:** `src/pages/api/admin/login.ts`  
**Líneas:** 15-17, 28-33

**Descripción:** `export const GET: APIRoute` acepta username y password como query params (`?username=admin@fashionstore.com&password=1234`). Estas credenciales quedan en:
- Historial del navegador
- Logs del servidor web (access logs)
- Proxy/CDN logs
- Caché del navegador
- Header `Referer` de la siguiente navegación

**Archivo cliente:** `src/pages/admin-secret-login.astro` (línea ~205) confirma que el frontend **usa GET** para enviar credenciales.

**Corrección sugerida:** Eliminar `export const GET`. Usar solo POST con body JSON. Actualizar el formulario del frontend.

---

### 3. Endpoint de cambio de contraseña sin autenticación

**Archivo:** `src/pages/api/admin/change-password.ts`  
**Líneas:** 13-109

**Descripción:** No hay verificación de que quien llama sea un admin autenticado. Cualquier persona puede hacer `POST /api/admin/change-password` con `{ currentPassword: "1234", newPassword: "hackeado" }` y cambiar la contraseña del admin.

**Corrección sugerida:**
```typescript
import { verifyAdminSessionToken } from '@/lib/admin-auth';
const token = request.headers.get('Authorization')?.replace('Bearer ', '');
if (!token || !verifyAdminSessionToken(token)) {
  return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
}
```

---

### 4. CSRF token completamente ficticio

**Archivo:** `src/pages/api/admin/csrf.ts`  
**Líneas:** 1-42

**Descripción:** El token se genera con `Date.now() + Math.random()` (predecible) y **nunca se almacena ni se valida** en el servidor. Es security theater — da falsa confianza sin protección real.

**Corrección sugerida:** Si necesitas CSRF real:
```typescript
import crypto from 'crypto';
// Generar:
const token = crypto.randomBytes(32).toString('hex');
// Almacenar en sesión/cookie httpOnly para validar en la siguiente petición
```
O eliminar el endpoint por completo si usas tokens Bearer (que no necesitan CSRF).

---

## P1 — ALTO

### 5. ~10 endpoints admin sin verificación de autenticación

**Archivos afectados:**
| Archivo | Métodos expuestos |
|---------|-------------------|
| `src/pages/api/admin/productos.ts` | POST (crear producto) |
| `src/pages/api/admin/categorias.ts` | GET, POST, PUT, DELETE |
| `src/pages/api/admin/marcas.ts` | GET, POST, PUT, DELETE |
| `src/pages/api/admin/resenas.ts` | GET, PUT, DELETE |
| `src/pages/api/admin/coupons.ts` | GET, POST |
| `src/pages/api/admin/campaigns.ts` | GET, POST, PUT, DELETE |
| `src/pages/api/admin/company.ts` | GET, PUT |
| `src/pages/api/admin/upload-attachment.ts` | POST |
| `src/pages/api/admin/users-list.ts` | GET |
| `src/pages/api/admin/preferences.ts` | GET, PATCH |

**Descripción:** Ninguno de estos endpoints verifica que la petición provenga de un admin autenticado. Compárese con `admin/profile.ts` y `admin/productos/[id].ts`, que **sí** usan `requireAdmin()` / `verifyAdminAuth()`.

**Impacto:** Cualquier persona puede crear/editar/eliminar productos, categorías, marcas, cupones, campañas, ver la lista de usuarios, subir archivos, etc.

**Corrección sugerida:** Añadir la misma verificación que ya existe en profile.ts:
```typescript
import { verifyAdminSessionToken } from '@/lib/admin-auth';
const token = request.headers.get('Authorization')?.replace('Bearer ', '');
if (!token || !verifyAdminSessionToken(token)) {
  return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
}
```

---

### 6. Escritura de archivo de debug en producción

**Archivo:** `src/pages/api/cart/add.ts`  
**Líneas:** 43-44, 83, 115, 159

**Descripción:** Usa `fs.appendFileSync('debug_error.log', ...)` en 5 lugares distintos. Escribe tokens de usuario (parciales), errores y stack traces a un archivo en el filesystem del servidor.

**Impacto:**
- El archivo `debug_error.log` puede crecer sin límite (DoS por disco)
- Contiene información sensible (tokens, errores internos)
- Si el directorio `public/` sirve archivos estáticos, podría ser accesible vía HTTP

**Corrección sugerida:** Eliminar todas las llamadas a `fs.appendFileSync`. Usar un logger estructurado o, como mínimo, solo `console.error` en producción.

---

### 7. IDOR en cart/clear — cualquier usuario puede vaciar el carrito de otro

**Archivo:** `src/pages/api/cart/clear.ts`  
**Líneas:** 32-55

**Descripción:** Recibe `userId` del body de la petición sin verificar que el solicitante sea ese usuario. Usa Service Role Key para la operación, saltando RLS.

**Corrección sugerida:** Verificar el token JWT del solicitante y comparar con el userId enviado:
```typescript
const { data: { user } } = await supabase.auth.getUser(token);
if (!user || user.id !== userId) {
  return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 403 });
}
```

---

### 8. IDOR en cart/get — leer el carrito de cualquier usuario

**Archivo:** `src/pages/api/cart/get.ts`  
**Líneas:** 18-30

**Descripción:** Acepta `userId` como query param sin verificar identidad. Usa `createServerClient()` (Service Role Key) para hacer la consulta, saltando RLS. Cualquiera puede ver los items del carrito de otro usuario.

**Corrección sugerida:** Igual que P1 #7 — validar token y comparar con userId.

---

### 9. Test endpoint de envío de emails sin autenticación

**Archivo:** `src/pages/api/test/send-email.ts`  
**Líneas:** 1-153

**Descripción:** `GET /api/test/send-email?to=victima@email.com` envía un email desde la cuenta SMTP de la tienda a cualquier dirección. No requiere autenticación. Además, en la respuesta de error (líneas 40-47) expone información de configuración SMTP.

**Impacto:** Puede usarse para spam, phishing (emails legítimos desde el dominio de la tienda) o enumeración de configuración.

**Corrección sugerida:** Eliminar el endpoint o protegerlo con autenticación admin y restringirlo a `import.meta.env.DEV`.

---

### 10. Debug page accesible en producción

**Archivo:** `src/pages/debug-cart-insert.astro`

**Descripción:** Página accesible en `/debug-cart-insert` que inserta items de prueba en la BD, expone structure de tablas, errores de la BD (con códigos de error) y variantes de productos.

**Corrección sugerida:** Eliminar el archivo o protegerlo con `if (!import.meta.env.DEV) return Astro.redirect('/');`.

---

### 11. Test page en producción  

**Archivo:** `src/pages/test-variants.astro`

**Descripción:** Página de test accesible en `/test-variants`. Aunque es menos peligrosa (solo muestra un selector), no debería existir en producción.

**Corrección sugerida:** Eliminar o guardar detrás de flag `DEV`.

---

### 12. Admin login page en ruta predecible

**Archivo:** `src/pages/admin-secret-login.astro`

**Descripción:** La página de login admin está en `/admin-secret-login` — la ruta contiene "secret" pero es completamente accesible. El formulario revela credenciales de desarrollo (línea 52-60) con `import.meta.env.DEV`, lo cual es correcto, pero la contraseña `1234` es la misma contraseña real de producción (ver `change-password.ts` fallback).

**Corrección sugerida:** En producción, cambiar la contraseña a algo fuerte y usar rate limiting.

---

### 13. Login logs registran username y longitud de password

**Archivo:** `src/pages/api/admin/login.ts`  
**Líneas:** 50-52

```typescript
console.log('[ADMIN-LOGIN-API] Username:', username);
console.log('[ADMIN-LOGIN-API] Password length:', password.length);
```

**Descripción:** Los logs del login incluyen el username en texto claro y la longitud del password. Si los logs se comparten / centralizan, esto es un leak de información.

**Corrección sugerida:** Eliminar ambos `console.log` o usar un logger que no registre datos de autenticación.

---

### 14. CORS wildcard `Access-Control-Allow-Origin: *` en endpoints sensibles

**Archivos afectados:**
| Archivo | Tipo de dato expuesto |
|---------|-----------------------|
| `src/pages/api/cart/add.ts` | Escritura en carrito |
| `src/pages/api/cart/get.ts` | Lectura de carrito |
| `src/pages/api/cart/update.ts` | Modificación de carrito |
| `src/pages/api/cart/remove.ts` | Eliminación de items |
| `src/pages/api/cart/clear.ts` | Vaciado de carrito |
| `src/pages/api/productos.ts` | Catálogo de productos |

**Descripción:** `Access-Control-Allow-Origin: '*'` permite que cualquier sitio web haga peticiones a estos endpoints desde el navegador del usuario. Combinado con los IDORs de cart/get y cart/clear, un sitio malicioso podría leer/vaciar carritos.

**Nota:** El middleware.ts ya tiene una whitelist CORS correcta, pero estos endpoints **la sobreescriben** con `'*'` en sus headers de respuesta.

**Corrección sugerida:** Eliminar los headers CORS hardcodeados de estos endpoints para que el middleware global aplique la whitelist.

---

### 15. Regex-based HTML sanitization (bypassable)

**Archivo:** `src/pages/api/admin/campaigns.ts`

**Descripción:** Las campañas de email permiten contenido HTML que se sanitiza con regex. La sanitización por regex es fundamentalmente insegura y se puede evadir con payloads como `<img src=x onerror="alert(1)">` o codificación de entidades.

**Corrección sugerida:** Usar una librería de sanitización como `DOMPurify` (server-side con `jsdom`) o `sanitize-html`.

---

### 16. Error messages leak internal details

**Archivo:** `src/pages/api/cart/add.ts` (línea 165)

```typescript
error: 'Error interno del servidor: ' + (error instanceof Error ? error.message : String(error))
```

**Descripción:** El mensaje de error interno se concatena en la respuesta. Puede exponer stack traces, nombres de tablas, errores de SQL, etc.

**Corrección sugerida:** Devolver solo un mensaje genérico al cliente. Loguear el detalle internamente.

---

### 17. `allowedHosts: 'all'` en Vite/Astro config

**Archivo:** `astro.config.mjs` (línea 66)

```javascript
vite: { server: { allowedHosts: 'all' } }
```

**Descripción:** Desactiva la protección de host de Vite, lo que permite ataques de DNS rebinding en desarrollo. Si el servidor de producción reutiliza esta config, también se ve afectado.

**Corrección sugerida:** Especificar los hosts permitidos explícitamente:
```javascript
allowedHosts: ['localhost', 'fashionstore.com']
```

---

### 18. Upload sin auth puede escribir archivos al servidor

**Archivo:** `src/pages/api/admin/upload-attachment.ts`

**Descripción:** El endpoint acepta archivos sin verificar autenticación. Aunque el nombre de archivo se hardcodea a `invoice_attachment.pdf`, el archivo se escribe en `public/uploads/` — directamente servible por HTTP.

**Corrección sugerida:** Añadir verificación admin. Validar que el archivo sea realmente un PDF (magic bytes, no solo extensión). Considerar almacenar en Supabase Storage en lugar del filesystem local.

---

### 19. Service Role Key usado sin auth gate

**Archivos afectados:** Todos los admin endpoints sin auth (listados en P1 #5), más:
- `src/pages/api/cart/clear.ts` — crea `createClient(url, serviceRoleKey)` directamente
- `src/pages/api/newsletter/unsubscribe.ts`

**Descripción:** El Service Role Key bypasea todas las políticas RLS de Supabase. Cuando no hay verificación de auth antes de usarlo, cualquier petición anónima obtiene privilegios de superusuario sobre la BD.

**Corrección sugerida:** Nunca exponer endpoints públicos que usen el Service Role Key sin verificar la identidad del solicitante primero.

---

### 20. Unsubscribe via GET sin autenticación  

**Archivo:** `src/pages/api/newsletter/unsubscribe.ts`

**Descripción:** `GET /api/newsletter/unsubscribe?email=victim@email.com` desuscribe a cualquier email de la newsletter. No requiere ninguna verificación. Un atacante puede desuscribir a todos los usuarios de la newsletter.

**Corrección sugerida:** Usar tokens firmados (HMAC) en el enlace de desuscripción:
```
/api/newsletter/unsubscribe?email=x&token=HMAC(email, secret)
```

---

## P2 — MEDIO

### 21. Race condition en restauración de stock al cancelar pedido

**Archivo:** `src/pages/api/ordenes/cancel.ts`

**Descripción:** La restauración de stock hace `SELECT stock_total` seguido de `UPDATE set stock_total = stock_total + cantidad` en pasos separados. Además, hay doble restauración: primero intenta una RPC, luego hace la restauración manual. Esto puede duplicar el stock si la RPC funciona pero el código no lo detecta.

**Corrección sugerida:** Usar una sola transacción atómica (una RPC de PostgreSQL) para toda la cancelación.

---

### 22. `Math.random()` para RMA numbers

**Archivo:** `src/pages/api/ordenes/return.ts`

**Descripción:** `Math.random()` no es criptográficamente seguro. Los RMA numbers son predecibles.

**Corrección sugerida:** `crypto.randomInt()` (ya corregido en create-session.ts, aplicar el mismo patrón).

---

### 23. `Math.random()` para SKU generation

**Archivo:** `src/pages/api/admin/productos.ts`

**Descripción:** Genera SKUs con `Math.random().toString(36)`. Predecible y con riesgo de colisión.

**Corrección sugerida:** `crypto.randomUUID().slice(0, 8)` o un esquema secuencial.

---

### 24. Timing attack en comparación de secretos

**Archivo:** `src/pages/api/cleanup-expired-reservations.ts`

**Descripción:** `cron_secret === CRON_SECRET` es vulnerable a timing attacks. Además, si `CRON_SECRET` no está configurado, el endpoint es accesible sin secreto.

**Corrección sugerida:**
```typescript
import crypto from 'crypto';
if (!CRON_SECRET || !crypto.timingSafeEqual(Buffer.from(secret), Buffer.from(CRON_SECRET))) { ... }
```

---

### 25. CRON secret en query parameter

**Archivo:** `src/pages/api/cron/reports.ts`

**Descripción:** El secreto se pasa como `?secret=xxx` en la URL, visible en logs de servidor, proxies y CDNs.

**Corrección sugerida:** Pasar el secreto en header `Authorization: Bearer xxx`.

---

### 26. Health endpoint expone estructura de BD

**Archivo:** `src/pages/api/health.ts`

**Descripción:** `GET /api/health` muestra nombres de tablas y conteos de registros de la base de datos, accesible sin autenticación.

**Corrección sugerida:** Limitar la respuesta a `{ status: "ok" }` o proteger con autenticación admin.

---

### 27. Email preview endpoint en producción

**Archivo:** `src/pages/api/test/preview-email.ts`

**Descripción:** Renderiza HTML de emails de prueba. Aunque es solo lectura, no debería existir en producción.

**Corrección sugerida:** Guardar detrás de `import.meta.env.DEV` check.

---

### 28. Contact form sin rate-limiting ni validación de email

**Archivo:** `src/pages/api/contact.ts`

**Descripción:** El formulario de contacto no valida el formato del email ni tiene rate limiting. Puede usarse para spam al admin.

**Corrección sugerida:** Validar formato de email. Añadir rate limiting (IP-based) o captcha.

---

### 29. Return request sin verificación de ownership

**Archivo:** `src/pages/api/returns/request.ts`

**Descripción:** Acepta `orderId` sin verificar que el solicitante sea el dueño del pedido. Si se adivina/enumera el orderId, cualquiera puede solicitar una devolución de cualquier pedido.

**Corrección sugerida:** Verificar que el usuario autenticado sea el propietario del pedido antes de procesar.

---

### 30. Productos API sin paginación

**Archivo:** `src/pages/api/productos.ts`

**Descripción:** `GET /api/productos` devuelve TODOS los productos sin límite. Con miles de productos, esto causa timeouts, alto uso de memoria y posible DoS.

**Corrección sugerida:** Añadir parámetros `?page=1&limit=20` con un máximo de ~100 por página.

---

### 31. `console.log` masivo en producción

**Archivos afectados (>30 ocurrencias cada uno):**
- `src/pages/api/admin/login.ts` (12 console.log)
- `src/pages/api/cart/get.ts` (~10 console.log)
- `src/pages/api/cart/clear.ts` (~10 console.log)
- `src/pages/api/cart/add.ts` (~5 console.log + fs debug)
- `src/pages/api/admin/productos.ts`
- `src/pages/api/admin/categorias.ts`
- `src/pages/api/admin/marcas.ts`
- `src/pages/api/admin/campaigns.ts`
- `src/pages/api/admin/company.ts`
- `src/pages/api/order/by-session/[sessionId].ts`
- `src/lib/emailService.ts`
- `src/lib/notificationService.ts`
- `src/lib/reservationService.ts`
- `src/lib/cart-reservation-client.ts`

**Descripción:** Logs excesivos en producción degradan rendimiento, llenan discos, y pueden exponer información sensible (userIds, estados internos, errores SQL).

**Corrección sugerida:** Reemplazar con un logger con niveles (`debug`/`info`/`warn`/`error`) y configurar nivel mínimo por entorno. Eliminar todos los `console.log` de información de debug.

---

### 32. Hardcoded admin emails

**Archivos:**
- `src/lib/emailService.ts` — `ADMIN_EMAIL = 'fashionstorerbv@gmail.com'`  
- `src/lib/notificationService.ts` — `ADMIN_EMAIL = 'fashionstorerbv@gmail.com'`

**Descripción:** El email del admin está hardcodeado como fallback. Si la variable de entorno se olvida, los emails van a una dirección que podría dejar de estar bajo control.

**Corrección sugerida:** Lanzar error si `ADMIN_EMAIL` no está configurado en lugar de usar un fallback hardcodeado.

---

### 33. Hardcoded company details en invoices

**Archivo:** `src/lib/invoiceService.ts`

**Descripción:** Datos de la empresa (nombre, CIF, dirección) están hardcodeados en el código. Debería cargarse de la tabla `company_settings`.

**Corrección sugerida:** Leer de la BD o de variables de entorno.

---

### 34. `.env.reservations` y `.env.coolify.example` no están en .gitignore

**Archivos:** `.env.reservations`, `.env.coolify.example`

**Descripción:** El `.gitignore` solo excluye `.env`, `.env.local`, y `.env.production`. Los archivos `.env.reservations` y `.env.coolify.example` podrían comitearse accidentalmente al repositorio.

**Corrección sugerida:** Añadir `*.env.*` o `!.env.example` al .gitignore. Verificar que `.env.reservations` no contenga secretos reales (actualmente tiene placeholders, pero el riesgo existe si se editan).

---

### 35. Fallback payment confirmation fuera del webhook

**Archivo:** `src/pages/api/order/by-session/[sessionId].ts`

**Descripción:** Contiene lógica duplicada para confirmar pagos que debería ocurrir solo en el webhook de Stripe. Si la página `by-session` se carga antes que el webhook, puede crear inconsistencias (pedido confirmado sin webhook procesado).

**Corrección sugerida:** La confirmación de pago solo debe ocurrir en el webhook. El endpoint `by-session` debería solo consultar el estado.

---

### 36. Welcome email endpoint sin auth

**Archivo:** `src/pages/api/welcome-email.ts`

**Descripción:** Crea un nuevo `createClient(Supabase)` en cada petición (no reutiliza la instancia compartida). No tiene auth check. Leakea `error.message` en la respuesta.

**Corrección sugerida:** Proteger con auth. Reutilizar el cliente Supabase compartido. No exponer detalles de error.

---

### 37. Módulo-level Supabase client (not per-request)

**Archivo:** `src/pages/api/reviews/add.ts`

**Descripción:** Crea el cliente Supabase a nivel de módulo con la anon key. En SSR, un cliente de módulo se comparte entre todas las peticiones, lo que puede causar problemas de estado compartido si se modifica.

**Corrección sugerida:** Crear el cliente dentro del handler de la petición.

---

### 38. Guest order lookup con Service Role Key

**Archivo:** `src/pages/api/order/by-guest.ts`

**Descripción:** Usa Service Role Key para buscar pedidos de invitados. El endpoint acepta `sessionId` del body sin validación adicional. Un atacante que adivine/enumere sessionIds podría acceder a datos de pedidos.

**Corrección sugerida:** Añadir el `email` del invitado como segundo factor de verificación.

---

## P3 — BAJO

### 39. `shuffle()` usa `Math.random()`

**Archivo:** `src/lib/utils.ts` (línea ~176)

**Descripción:** La función `shuffle()` usa `Math.random()`. Para mezcla de productos en UI esto es aceptable, pero si se usara para algo de seguridad sería un problema.

**Corrección sugerida:** Documentar que la función no es criptográficamente segura. No usar para sorteos/premios.

---

### 40. OpenAI key fallback a string vacío

**Archivo:** `src/lib/openai.ts`

**Descripción:** `apiKey: import.meta.env.OPENAI_API_KEY || ''` — Si la key no está configurada, la instancia se crea con key vacía. Esto fallará silenciosamente en runtime en lugar de detectar el problema al arrancar.

**Corrección sugerida:**
```typescript
const key = import.meta.env.OPENAI_API_KEY;
if (!key) throw new Error('OPENAI_API_KEY no configurada');
```

---

### 41. CartService escanea todas las keys de localStorage

**Archivo:** `src/lib/cartService.ts` (~línea 140-160)

**Descripción:** Itera sobre **todas** las keys de localStorage buscando datos de carrito. Esto incluye keys de otros orígenes/aplicaciones almacenadas en el mismo dominio.

**Corrección sugerida:** Usar una key fija con prefijo (e.g., `fashionstore_cart_`) en lugar de escanear todo localStorage.

---

### 42. Emoji logs en services de producción

**Archivos:**
- `src/lib/reservationService.ts` — `console.log('🎫 ...', '✅ ...', '❌ ...')`
- `src/lib/notificationService.ts` — `console.log('📧 ...', '🔌 ...')`
- `src/lib/emailService.ts` — `console.log('[EMAIL] ✅ ...')`

**Descripción:** Logs con emojis son difíciles de parsear con herramientas de monitoreo (Datadog, CloudWatch). 

**Corrección sugerida:** Usar prefijos estructurados como `[RESERVATION:INFO]`, `[EMAIL:ERROR]`.

---

### 43. Test endpoint de debug API

**Archivo:** `src/pages/api/test-post.ts` (si existe)

**Descripción:** Endpoint de prueba que loguea headers y body de la petición. No debería existir en producción.

**Corrección sugerida:** Eliminar.

---

### 44. Subscriber store sin protección

**Archivo:** `src/stores/cart.ts` (línea ~255)

**Descripción:** El subscriber de debug solo está detrás de `import.meta.env.DEV` — esto es correcto. No hay issue real aquí, pero verificar que Astro realmente elimina el bloque en build de producción (debería con tree-shaking).

---

### 45. `Vite fs.strict: false`

**Archivo:** `astro.config.mjs` (línea 68)

```javascript
fs: { strict: false }
```

**Descripción:** Desactiva la restricción de rutas de Vite, permitiendo que el servidor de desarrollo sirva archivos fuera del root del proyecto. En producción esto no aplica (solo dev server), pero es mala práctica.

**Corrección sugerida:** Eliminar `fs: { strict: false }` o documentar por qué es necesario.

---

### 46. Newsletter subscribe usa Service Role Key como fallback

**Archivo:** `src/pages/api/newsletter/subscribe.ts`

**Descripción:** Si la anon key no funciona, cae al Service Role Key. Esto bypasea RLS innecesariamente.

**Corrección sugerida:** Usar solo anon key + RLS apropiado, o Service Role Key con validación estricta.

---

### 47. No hay Content-Type headers en algunas respuestas

**Archivo:** `src/pages/api/validate-coupon.ts`

**Descripción:** Algunas respuestas no incluyen `Content-Type: application/json`, lo que puede causar problemas de parsing en el cliente.

**Corrección sugerida:** Añadir `headers: { 'Content-Type': 'application/json' }` a todas las respuestas.

---

### 48. framer-motion en dependencias de producción

**Archivo:** `package.json`

**Descripción:** `framer-motion` (170KB+ gzipped) está en `dependencies` pero el proyecto usa Preact (no React). Puede que no sea compatible o que añada peso innecesario al bundle.

**Corrección sugerida:** Verificar si realmente se usa. Si no, eliminarlo. Si se usa, mover a un import dinámico o evaluar alternativas más ligeras.

---

---

## RESUMEN DE ACCIONES PRIORITARIAS

### Semana 1 — Bloqueo de seguridad (P0 + P1 críticos)
1. ⛔ Hash de contraseñas con bcrypt (`change-password.ts`)
2. ⛔ Eliminar GET del login, solo POST (`login.ts`) 
3. ⛔ Eliminar CSRF falso o implementar uno real (`csrf.ts`)
4. ⛔ Añadir `verifyAdminAuth()` a los ~10 admin endpoints sin auth
5. ⛔ Eliminar escritures `fs.appendFileSync` de `cart/add.ts`
6. ⛔ Verificar ownership en `cart/get.ts` y `cart/clear.ts`
7. ⛔ Eliminar/proteger `test/send-email.ts`, `debug-cart-insert.astro`

### Semana 2 — Hardening (P1 restantes + P2 importantes)
8. Eliminar CORS `'*'` de endpoints cart/* y productos
9. Proteger upload-attachment con auth admin
10. Firmar enlaces de unsubscribe con HMAC
11. Usar timing-safe comparison para secretos CRON
12. Eliminar console.log masivo
13. Añadir paginación a productos API

### Semana 3 — Calidad (P2 restantes + P3)
14. Usar crypto.randomInt() para RMA y SKUs
15. Mover hardcoded emails/company details a config
16. Añadir `.env*` genérico a .gitignore  
17. Limpiar test pages
18. Evaluar dependencia framer-motion
