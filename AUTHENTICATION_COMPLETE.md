# 🔐 SISTEMA DE AUTENTICACIÓN - GUÍA COMPLETA

## 📍 Estado Actual del Sistema

### ✅ Completado
- [x] Sistema de autenticación con tokens base64
- [x] Página de login (`/admin-secret-login`)
- [x] Dashboard protegido (`/admin/dashboard`)
- [x] CRUD completo de productos
- [x] API REST endpoints
- [x] Integración con Supabase
- [x] Verificación de sesión con HTTPOnly cookies

### 🔄 En Prueba
- [ ] Validación del flujo completo de login → dashboard
- [ ] Persistencia de cookies
- [ ] Carga de productos desde BD

---

## 🚀 CÓMO USAR

### Inicio del Servidor
```bash
npm run dev
```
Espera hasta ver: `Server running at http://localhost:4321/`

### Acceso al Login
```
http://localhost:4321/admin-secret-login
```

### Credenciales
```
Email:    admin@fashionstore.com
Password: 1234
```

### Flujo Esperado
1. ✅ Accedes a `/admin-secret-login`
2. ✅ Ves el formulario de login
3. ✅ Ingresas email y contraseña
4. ✅ Haces click en "Iniciar Sesión"
5. ✅ Te redirige a `/admin/dashboard`
6. ✅ Ves el panel de control con productos

---

## 🔍 ESTRUCTURA DEL CÓDIGO

### 1. Página de Login
**Archivo:** `src/pages/admin-secret-login.astro`

```astro
// Procesa POST request
if (Astro.request.method === 'POST') {
  const formData = await Astro.request.formData();
  const username = formData.get('username')?.toString().trim();
  const password = formData.get('password')?.toString().trim();
  
  if (validateAdminCredentials(username, password)) {
    const token = createAdminSessionToken(username);
    Astro.response.headers.set('Set-Cookie', 
      `admin_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400; Secure=false`
    );
    return Astro.redirect('/admin/dashboard', 302);
  }
}
```

**Qué hace:**
- Recibe credenciales via POST
- Las valida
- Crea un token base64 codificado
- Lo envía en una cookie HTTPOnly
- Redirige al dashboard

### 2. Dashboard Protegido
**Archivo:** `src/pages/admin/dashboard.astro`

```astro
// Protección de ruta
const cookies = Astro.request.headers.get('cookie');
const token = getAdminTokenFromCookie(cookies);
const session = verifyAdminSessionToken(token);

if (!token || !session) {
  return Astro.redirect('/admin-secret-login', 302);
}
```

**Qué hace:**
- Verifica si existe cookie de sesión
- Valida el token
- Si es inválido/expirado, redirige al login
- Si es válido, carga productos y muestra dashboard

### 3. Librerías de Autenticación
**Archivo:** `src/lib/admin-auth.ts`

**Funciones:**

| Función | Descripción |
|---------|-------------|
| `validateAdminCredentials(user, pass)` | Verifica credenciales contra BD |
| `createAdminSessionToken(user)` | Crea token base64 con timestamp |
| `verifyAdminSessionToken(token)` | Decodifica y valida token |
| `isAdminFromCookie(cookieStr)` | Extrae y verifica admin cookie |
| `getAdminTokenFromCookie(cookieStr)` | Extrae solo el token de la cookie |

---

## 🍪 COOKIES

### Cookie de Sesión
```
Name:     admin_session
Value:    base64-encoded-json-with-expiry
Path:     /
HttpOnly: true (no accesible desde JavaScript)
SameSite: Strict (solo con requests del mismo sitio)
Max-Age:  86400 (24 horas)
Secure:   false (permitir HTTP en localhost)
```

### Contenido del Token
```json
{
  "username": "admin@fashionstore.com",
  "isAdmin": true,
  "createdAt": 1234567890123
}
```

---

## 🛡️ FLUJO DE SEGURIDAD

### Acceso al Login
```
GET /admin-secret-login
    ↓
Renderiza formulario HTML
    ↓
Usuario ingresa credenciales
    ↓
Form POST a /admin-secret-login
```

### Validación
```
POST /admin-secret-login
    ↓
Extrae username y password
    ↓
Compara con ADMIN_CREDENTIALS
    ↓
Si coincide:
  - Crea token base64
  - Envía Set-Cookie header
  - Redirige con 302
```

### Acceso al Dashboard
```
GET /admin/dashboard
    ↓
Lee cookie del request
    ↓
Extrae token
    ↓
Verifica validez (no expirado)
    ↓
Si válido: Renderiza dashboard
Si inválido: Redirige a login
```

---

## 🐛 TROUBLESHOOTING

### Error: ERR_TOO_MANY_REDIRECTS

**Causas Posibles:**
1. URL incorrecta (usar `/admin/login` en lugar de `/admin-secret-login`)
2. Cookie no se establece correctamente
3. Token no se valida en el dashboard
4. Servidor en puerto incorrecto (3323 vs 4321)

**Soluciones:**
```bash
# 1. Verifica la URL
http://localhost:4321/admin-secret-login

# 2. Limpia cookies
DevTools → Application → Cookies → Elimina todo

# 3. Reinicia servidor
Ctrl+C
npm run dev

# 4. Intenta en incógnito
```

### Error: "Usuario o contraseña incorrectos"

**Verificación:**
- Email debe ser exactamente: `admin@fashionstore.com`
- Contraseña debe ser exactamente: `1234`
- Sin espacios en blanco
- Mayúsculas/minúsculas importan

### Dashboard No Carga Productos

**Verificación:**
- ¿Está configurado el `.env` con Supabase?
- ¿La tabla `productos` existe en la BD?
- ¿Hay productos activos (`activo = true`)?

```bash
# Revisa la consola del servidor para errores
npm run dev  # Verifica output
```

---

## 📊 API ENDPOINTS

### Obtener Productos
```
GET /api/admin/productos
Headers: Cookie: admin_session=...
Response: JSON array de productos
```

### Crear Producto
```
POST /api/admin/productos
Headers: Cookie: admin_session=...
Body: {
  nombre: string,
  precio_venta: number,
  descripcion: string,
  stock_total: number
}
```

### Actualizar Producto
```
PUT /api/admin/productos/[id]
Headers: Cookie: admin_session=...
Body: Mismo que POST
```

### Eliminar Producto
```
DELETE /api/admin/productos/[id]
Headers: Cookie: admin_session=...
```

---

## 🔧 CONFIGURACIÓN

### Variables de Entorno (.env)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your-anon-key
```

### Config de Astro (astro.config.mjs)
```javascript
export default defineConfig({
  output: 'server',  // SSR mode
  site: 'http://localhost:4321/',
  integrations: [
    tailwind(),
    preact({ compat: true })
  ]
});
```

---

## 🧪 TESTING

### Test Manual
```
1. npm run dev
2. Abre http://localhost:4321/admin-secret-login
3. Ingresa: admin@fashionstore.com / 1234
4. Haz click en "Iniciar Sesión"
5. Deberías ver el dashboard
6. Intenta crear/editar/eliminar un producto
```

### Test Automático
```bash
node src/tests/auth-test.mjs
```

---

## 📝 CREDENCIALES DE PRODUCCIÓN

⚠️ **IMPORTANTE:** Actualmente usa credenciales hardcodeadas. Para producción:

1. Guardar en variable de entorno
2. Hashear contraseña (bcrypt)
3. Validar contra tabla de usuarios en BD
4. Implementar 2FA
5. Rate limiting para login

Ejemplo mejorado:
```typescript
// ❌ Actual (solo para desarrollo)
const ADMIN_CREDENTIALS = {
  email: 'admin@fashionstore.com',
  password: '1234'
};

// ✅ Futuro (producción)
async function validateAdminCredentials(email: string, password: string) {
  const user = await supabase
    .from('admin_users')
    .select('password_hash')
    .eq('email', email)
    .single();
    
  return await bcrypt.compare(password, user.password_hash);
}
```

---

## 📞 SOPORTE

Si algo no funciona:
1. Revisa el log del servidor
2. Abre DevTools (F12)
3. Ve a Console y Network
4. Comparte los mensajes de error

**Archivos Clave:**
- `src/pages/admin-secret-login.astro`
- `src/pages/admin/dashboard.astro`
- `src/lib/admin-auth.ts`
- `astro.config.mjs`
