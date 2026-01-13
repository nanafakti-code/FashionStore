# 🔧 Troubleshooting y Solución de Problemas

## 🚨 Problemas Comunes

### 1️⃣ "No puedo acceder al login"

**Error**: Página en blanco o 404 en `/admin-secret-login`

**Causas Posibles:**
- El servidor no está corriendo
- Ruta mal configurada
- Archivo no existe

**Solución:**
```bash
# Paso 1: Verifica que el servidor está corriendo
npm run dev

# Paso 2: Verifica que el archivo existe
ls src/pages/admin-secret-login.astro

# Paso 3: Intenta acceder nuevamente
# http://localhost:4323/admin-secret-login

# Paso 4: Si aún falla, revisa la consola del servidor
# Debería haber un mensaje de error
```

---

### 2️⃣ "Credenciales inválidas" pero estoy usando admin/FashionStore2026!"

**Error**: Siempre muestra "Credenciales inválidas"

**Causas Posibles:**
- Espacios adicionales en la contraseña
- Mayúsculas/minúsculas incorrectas
- Cookie del navegador corrupta

**Solución:**
```javascript
// Paso 1: Abre DevTools (F12)
// Paso 2: Ve a Consola y ejecuta:
console.log(JSON.stringify({
  username: "admin",
  password: "FashionStore2026!"
}))

// Paso 3: Verifica que no haya espacios:
// {"username":"admin","password":"FashionStore2026!"}

// Paso 4: Limpia cookies del navegador
// Consola de Desarrollador → Application → Cookies → Elimina admin_session

// Paso 5: Intenta nuevamente
```

---

### 3️⃣ "Después del login me redirige a login nuevamente"

**Error**: No puedo acceder al dashboard, vuelvo al login

**Causas Posibles:**
- Cookie no se está creando correctamente
- Token expirado
- localStorage corrupto

**Solución:**
```javascript
// Paso 1: Verifica que la cookie se creó
document.cookie // Debería contener "admin_session="

// Paso 2: Verifica localStorage
localStorage.getItem('admin_session')
// Si existe y no está vacío, está guardado

// Paso 3: Limpia todo y intenta de nuevo
localStorage.clear()
document.cookie = "admin_session=; Max-Age=0"

// Paso 4: Abre navegador en incógnito
// (Ninguna cookie antigua)

// Paso 5: Intenta login nuevamente
```

---

### 4️⃣ "Los productos no aparecen en la tabla"

**Error**: La tabla está vacía aunque haya creado productos

**Causas Posibles:**
- localStorage está deshabilitado
- Datos no se están guardando
- Error en el componente React

**Solución:**
```javascript
// Paso 1: Verifica que localStorage está habilitado
try {
  localStorage.setItem('test', 'valor')
  localStorage.removeItem('test')
  console.log("localStorage HABILITADO")
} catch {
  console.log("localStorage DESHABILITADO")
}

// Paso 2: Verifica los datos guardados
console.log(localStorage.getItem('admin_products'))
// Debería mostrar JSON o null

// Paso 3: Si está vacío, intenta crear un producto
// El componente debería actualizar automáticamente

// Paso 4: Abre DevTools → Aplicación → Storage → localStorage
// Busca "admin_products"

// Paso 5: Si sigue vacío, revisa la consola de errores (F12)
```

---

### 5️⃣ "Me aparece 'Acceso Denegado' aunque estoy logueado"

**Error**: Ves la página de error 403 aunque hayas hecho login

**Causas Posibles:**
- Cookie expirada
- Token inválido
- Timestamp del servidor vs cliente desincronizado

**Solución:**
```javascript
// Paso 1: Verifica la cookie
console.log(document.cookie)
// Debe contener "admin_session="

// Paso 2: Decodifica el token
function decodeToken(token) {
  return JSON.parse(atob(token))
}
const token = document.cookie
  .split('; ')
  .find(row => row.startsWith('admin_session='))
  ?.split('=')[1]
if (token) console.log(decodeToken(token))

// Paso 3: Verifica si ha expirado (createdAt + 24h)
const session = decodeToken(token)
const expiryTime = session.createdAt + (24 * 60 * 60 * 1000)
const now = Date.now()
console.log('Expirado:', now > expiryTime)

// Paso 4: Si ha expirado, haz logout y login nuevamente

// Paso 5: Si no ha expirado, limpia cookies e intenta
document.cookie = "admin_session=; Max-Age=0"
```

---

### 6️⃣ "Error al crear/editar/eliminar producto"

**Error**: Acción no realizada, mensaje de error genérico

**Causas Posibles:**
- Validación fallida
- localStorage lleno
- Error en el componente React

**Solución:**
```javascript
// Paso 1: Abre DevTools → Consola (F12)
// Debería haber un mensaje de error específico

// Paso 2: Verifica que localStorage no está lleno
try {
  localStorage.setItem('test', new Array(1024*1024).join('x'))
  localStorage.removeItem('test')
} catch(e) {
  console.log("localStorage LLENO")
}

// Paso 3: Limpia localStorage si está lleno
localStorage.clear()
// ADVERTENCIA: Esto eliminará todos los productos

// Paso 4: Para crear productos:
// - Nombre: NO vacío
// - Precio: Número válido > 0
// - Categoría: Seleccionada

// Paso 5: Si el error persiste, revisa:
// DevTools → Network → POST /admin/dashboard
// Para ver si hay error en la solicitud
```

---

### 7️⃣ "El botón Logout no funciona"

**Error**: Hago clic en Logout pero sigo en el dashboard

**Causas Posibles:**
- POST no se está enviando
- Cookie no se está eliminando
- Redireccionamiento falla

**Solución:**
```javascript
// Paso 1: Verifica que el formulario existe
document.querySelector('button:contains("Salir")')

// Paso 2: Intenta eliminar cookie manualmente
document.cookie = "admin_session=; Path=/; Max-Age=0"

// Paso 3: Recarga la página
location.reload()

// Paso 4: Deberías ser redirigido a login
// Si no, limpia caché:
// DevTools → Application → Cache → Limpiar todo

// Paso 5: Intenta en modo incógnito
```

---

### 8️⃣ "Recibo error 'TypeError' en la consola"

**Error**: Consola muestra errores de JavaScript

**Ejemplos comunes:**
```
TypeError: Cannot read property 'split' of undefined
TypeError: products is not iterable
TypeError: Cannot read property 'getItem' of null
```

**Solución:**
```javascript
// Paso 1: Copia el error completo
// (Incluye línea y archivo)

// Paso 2: Intenta reproducir:
// 1. Actualiza la página
// 2. Haz logout
// 3. Login nuevamente
// 4. Intenta la acción que causa el error

// Paso 3: Revisa si el error es consistente
// (Aparece siempre en el mismo lugar)

// Paso 4: Si es consistente, podría ser un bug
// Documenta:
// - Pasos exactos para reproducir
// - El error completo
// - Navegador y versión
// - OS (Windows/Mac/Linux)

// Paso 5: Contacta al equipo de desarrollo
```

---

## 🔍 Debugging Avanzado

### DevTools - Consola
```javascript
// Ver todas las cookies
document.cookie

// Ver localStorage
localStorage
Object.keys(localStorage)

// Ver datos de productos
JSON.parse(localStorage.getItem('admin_products'))

// Buscar errores de red
// DevTools → Network → Filtrar por tipo
```

### DevTools - Aplicación
```
1. F12 → Application
2. Cookies (lado izquierdo)
3. Busca: admin_session
4. Verifica:
   - Value (token)
   - Path (debe ser /)
   - HttpOnly (debe ser ✓)
   - Secure (si HTTPS)
   - SameSite (Strict)
   - Expiry (fecha futura)
```

### DevTools - Storage
```
1. F12 → Storage
2. Local Storage → Tu sitio
3. Busca: admin_products
4. Debería mostrar JSON de productos
```

### DevTools - Network
```
1. F12 → Network
2. Realiza una acción (login, crear producto)
3. Busca POST requests
4. Haz clic en la solicitud
5. Revisa:
   - Status: 200 (OK)
   - Response: Contiene datos
   - Headers: Cookie presente
```

---

## 🧪 Tests Manuales

### Test 1: Login Correcto
```
PASOS:
1. Ve a /admin-secret-login
2. Usuario: admin
3. Contraseña: FashionStore2026!
4. Click "Acceder al Panel"

ESPERADO:
- Redirección a /admin/dashboard
- URL cambia a http://localhost:4323/admin/dashboard
- Ver dashboard con "Bienvenido, admin"

SI NO FUNCIONA:
- Revisa consola para errores (F12)
- Verifica que admin-auth.ts está correctamente importado
- Comprueba los valores de credenciales
```

### Test 2: Login Incorrecto
```
PASOS:
1. Ve a /admin-secret-login
2. Usuario: usuario_falso
3. Contraseña: contraseña_falsa
4. Click "Acceder al Panel"

ESPERADO:
- Se queda en la misma página
- Ver mensaje rojo: "Credenciales inválidas"
- No se redirecciona

SI NO FUNCIONA:
- Revisa que validación está activa
- Verifica mensaje de error en HTML
```

### Test 3: Crear Producto
```
PASOS:
1. En dashboard, click "Crear Nuevo Producto"
2. Nombre: Test Product
3. Precio: 99.99
4. Categoría: moviles
5. Click "Crear Producto"

ESPERADO:
- Formulario desaparece
- Mensaje verde: "Producto creado exitosamente"
- Nuevo producto aparece en tabla

SI NO FUNCIONA:
- Abre consola (F12)
- Busca errores de validación
- Verifica que AdminCRUD está cargado
- Comprueba localStorage.getItem('admin_products')
```

### Test 4: Editar Producto
```
PASOS:
1. En tabla, click "Editar" en un producto
2. Cambia el nombre a "Product Edited"
3. Click "Actualizar"

ESPERADO:
- Formulario desaparece
- Tabla se actualiza
- Nuevo nombre aparece en la tabla
- localStorage actualizado

SI NO FUNCIONA:
- Verifica ID del producto
- Revisa que la búsqueda por ID funciona
- Comprueba console para errores
```

### Test 5: Eliminar Producto
```
PASOS:
1. En tabla, click "Eliminar" en un producto
2. Confirmación: ¿Estás seguro?
3. Click "Sí" o "OK"

ESPERADO:
- Producto desaparece de tabla
- Mensaje: "Producto eliminado"
- localStorage actualizado

SI NO FUNCIONA:
- Verifica diálogo de confirmación
- Revisa que el filtrado funciona
- Comprueba localStorage después
```

---

## 📋 Checklist de Diagnóstico

Si algo no funciona, sigue este checklist:

```
1. Servidor
   [ ] npm run dev está ejecutándose
   [ ] No hay errores en terminal
   [ ] Puerto 4323 es accesible

2. Archivos
   [ ] admin-secret-login.astro existe
   [ ] admin/dashboard.astro existe
   [ ] admin-auth.ts existe
   [ ] AdminCRUD.tsx existe

3. Navegador
   [ ] Abre en navegador fresco (incógnito)
   [ ] Cookies habilitadas
   [ ] JavaScript habilitado
   [ ] localStorage habilitado

4. DevTools
   [ ] F12 → Consola (sin errores rojo)
   [ ] F12 → Network (POST 200 OK)
   [ ] F12 → Application → Cookies (admin_session existe)
   [ ] F12 → Storage → localStorage (admin_products existe)

5. Datos
   [ ] Usuario: admin
   [ ] Contraseña: FashionStore2026!
   [ ] Token válido (no expirado)
   [ ] localStorage no lleno

6. Lógica
   [ ] Login funciona
   [ ] Dashboard se carga
   [ ] CRUD responde
   [ ] Logout limpia sesión
```

---

## 🚀 Verificación Rápida

Ejecuta esto en la consola (F12) para diagnóstico completo:

```javascript
// Verificación de sistema
const diagnosis = {
  localStorage: (() => {
    try { localStorage.setItem('test', '1'); localStorage.removeItem('test'); return 'OK' }
    catch { return 'DESHABILITADO' }
  })(),
  
  cookie: document.cookie ? 'EXISTE' : 'NO EXISTE',
  
  admin_session: localStorage.getItem('admin_session') ? 'GUARDADA' : 'VACÍA',
  
  admin_products: (() => {
    const p = localStorage.getItem('admin_products')
    try { return JSON.parse(p).length + ' productos' }
    catch { return 'INVÁLIDO o VACÍO' }
  })(),
  
  url: window.location.href,
  
  timestamp: new Date().toISOString()
}

console.table(diagnosis)
```

---

## 📞 Reportar un Bug

Si encontras un problema que no está aquí:

**Información Necesaria:**
1. ¿Qué intentaste hacer?
2. ¿Qué esperabas que pasara?
3. ¿Qué pasó realmente?
4. Pasos para reproducir (1, 2, 3...)
5. Error en consola (copiar completo)
6. Navegador y versión
7. Sistema operativo

**Ejemplo de reporte:**

```
TÍTULO: No puedo editar productos

DESCRIPCIÓN:
Cuando intento editar un producto, la tabla no se actualiza.

PASOS:
1. Login con admin/FashionStore2026!
2. Click "Editar" en un producto
3. Cambio el nombre
4. Click "Actualizar"

ESPERADO:
Tabla debe mostrar nombre actualizado

ACTUAL:
Tabla muestra nombre antiguo

ERROR:
TypeError: products.map is not a function (línea 245 en AdminCRUD.tsx)

NAVEGADOR:
Chrome 120.0.0 en Windows 11
```

---

**Última actualización**: 9 de enero de 2026  
**Versión**: 1.0
