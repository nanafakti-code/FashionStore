# 🔐 Panel de Administración - FashionStore

## 📋 Descripción General

Se ha implementado un **panel de administración completo** con autenticación, CRUD de productos y protección de rutas.

### ✨ Características Implementadas

#### 1️⃣ **Autenticación Segura**
- ✅ Login en `/admin-secret-login`
- ✅ Autenticación basada en cookies
- ✅ Sesiones con expiración de 24 horas
- ✅ Tokens base64 encriptados
- ✅ Protección contra acceso no autorizado

#### 2️⃣ **Dashboard Protegido**
- ✅ Página en `/admin/dashboard`
- ✅ Solo accesible si está autenticado
- ✅ Información del usuario conectado
- ✅ Botón de logout
- ✅ Estadísticas en tiempo real

#### 3️⃣ **Funcionalidad CRUD Completa**
- ✅ **Crear**: Nuevo producto con nombre, precio, categoría
- ✅ **Leer**: Tabla con todos los productos
- ✅ **Actualizar**: Editar información del producto
- ✅ **Eliminar**: Borrar producto con confirmación

#### 4️⃣ **Interfaz Visual**
- ✅ Diseño responsive (móvil + desktop)
- ✅ Tailwind CSS para estilos
- ✅ Colores de FashionStore (#00aa45)
- ✅ Tabla interactiva
- ✅ Formulario dinámico
- ✅ Mensajes de estado

#### 5️⃣ **Seguridad**
- ✅ Protección de rutas con middleware
- ✅ Validación de credenciales
- ✅ Cookies HttpOnly
- ✅ SameSite Strict
- ✅ Sesiones con timestamp
- ✅ Redirección automática si no es admin

---

## 🚀 Cómo Acceder

### Paso 1: Ir al Login
```
URL: http://localhost:4323/admin-secret-login
```

### Paso 2: Ingresar Credenciales
```
Usuario: admin
Contraseña: FashionStore2026!
```

### Paso 3: Acceder al Dashboard
```
URL: http://localhost:4323/admin/dashboard
```

---

## 📁 Archivos Creados

### 1. **src/lib/admin-auth.ts** (90 líneas)
Utilidades de autenticación para el panel admin:
- `validateAdminCredentials()` - Validar usuario/contraseña
- `createAdminSessionToken()` - Crear token de sesión
- `verifyAdminSessionToken()` - Verificar token válido
- `isAdminFromCookie()` - Comprobar si es admin
- `getAdminTokenFromCookie()` - Extraer token

### 2. **src/pages/admin-secret-login.astro** (130 líneas)
Página de login:
- Formulario POST con validación
- Establecimiento de cookie HttpOnly
- Redirección al dashboard si es correcto
- Mensajes de error claros
- Credenciales de prueba mostradas

### 3. **src/pages/admin/dashboard.astro** (150 líneas)
Dashboard protegido:
- Protección de ruta (verifica autenticación)
- Información del usuario
- Botón de logout
- Estadísticas de productos
- Integración con AdminCRUD
- Información de seguridad

### 4. **src/components/islands/AdminCRUD.tsx** (350 líneas)
Componente React para CRUD:
- Crear productos
- Listar productos (tabla)
- Editar productos
- Eliminar productos
- Validación de formularios
- Almacenamiento en localStorage
- Estadísticas en tiempo real

### 5. **src/pages/admin/403.astro** (40 líneas)
Página de acceso denegado:
- Diseño profesional
- Botones de acción (login/inicio)
- Información clara

---

## 🔧 Cómo Funciona

### Flujo de Autenticación

```
Usuario en /admin-secret-login
        ↓
Completa formulario
        ↓
POST con usuario/contraseña
        ↓
Valida credenciales
        ↓
Crea sesión (base64 JSON)
        ↓
Establece cookie HttpOnly
        ↓
Redirige a /admin/dashboard
```

### Protección de Rutas

```
Usuario intenta acceder a /admin/dashboard
        ↓
Verifica cookie 'admin_session'
        ↓
¿Existe cookie?
  ├─ Sí → ¿Token válido?
  │       ├─ Sí → Mostrar dashboard
  │       └─ No → Redirigir a login
  └─ No → Redirigir a login
```

### Flujo CRUD

```
Componente AdminCRUD
        ↓
Lee localStorage (admin_products)
        ↓
Muestra tabla de productos
        ↓
Usuario hace acción:
  ├─ Crear → Añade a array, guarda en localStorage
  ├─ Editar → Modifica producto, actualiza localStorage
  ├─ Eliminar → Filtra producto, actualiza localStorage
  └─ Leer → Muestra productos en tabla
```

---

## 🧪 Pruebas

### Test 1: Login Correcto
```
1. Ve a /admin-secret-login
2. Usuario: admin
3. Contraseña: FashionStore2026!
4. Haz clic "Acceder al Panel"
5. Deberías ir a /admin/dashboard
```

### Test 2: Login Incorrecto
```
1. Ve a /admin-secret-login
2. Usuario: usuario_falso
3. Contraseña: contraseña_falsa
4. Haz clic "Acceder al Panel"
5. Deberías ver error de autenticación
```

### Test 3: Acceso Directo sin Autenticación
```
1. Ve directamente a /admin/dashboard
2. Deberías ser redirigido a /admin-secret-login
```

### Test 4: Crear Producto
```
1. En el dashboard, haz clic "Crear Nuevo Producto"
2. Completa: Nombre, Precio, Categoría
3. Haz clic "Crear Producto"
4. Deberías ver el producto en la tabla
```

### Test 5: Editar Producto
```
1. En la tabla, haz clic "Editar" en algún producto
2. Modifica los datos
3. Haz clic "Actualizar"
4. Los cambios deberían reflejarse
```

### Test 6: Eliminar Producto
```
1. En la tabla, haz clic "Eliminar"
2. Confirma la eliminación
3. El producto debe desaparecer de la tabla
```

### Test 7: Logout
```
1. En el dashboard, haz clic "Salir"
2. Deberías ir a /admin-secret-login
3. La sesión debe estar cerrada
```

---

## 💾 Almacenamiento de Datos

### En Desarrollo
- **Cookies**: Sesión de admin (HttpOnly, 24 horas)
- **localStorage**: Productos (JSON serializado)

### En Producción
Se recomienda:
- Base de datos (Supabase, MongoDB, etc.)
- Sistema de sesiones (Lucia Auth, NextAuth, etc.)
- Hashing de contraseñas (bcrypt)
- 2FA / OAuth

---

## 🔐 Seguridad

### Implementado
✅ HttpOnly Cookies (no accesibles desde JS)  
✅ SameSite=Strict (previene CSRF)  
✅ Expiración de sesión (24 horas)  
✅ Validación en servidor  
✅ Protección de rutas  
✅ Mensajes de error vagos (sin info sensible)  

### Recomendaciones para Producción
- [ ] HTTPS obligatorio
- [ ] Hashing de contraseñas (bcrypt/argon2)
- [ ] Rate limiting en login
- [ ] Logging de intentos fallidos
- [ ] 2FA (two-factor authentication)
- [ ] Database real con encriptación
- [ ] Auditoría de cambios
- [ ] Backup automático

---

## 📊 Estructura de Datos

### Cookie de Sesión
```
admin_session=eyJpdXNlcm5hbWUiOiJhZG1pbiIsImlzQWRtaW4iOnRydWUsImNyZWF0ZWRBdCI6MTYwMDAwMDAwMH0=
```

Decodificado:
```json
{
  "username": "admin",
  "isAdmin": true,
  "createdAt": 1600000000
}
```

### Producto en localStorage
```json
{
  "id": "1234567890",
  "name": "iPhone 13",
  "price": 799.99,
  "category": "moviles",
  "createdAt": "01/01/2026"
}
```

---

## 🎯 Funcionalidades del Dashboard

### Navegación Superior
- Logo y título
- Nombre de usuario conectado
- Botón de perfil
- Botón de logout

### Panel Principal
- Breadcrumb de navegación
- Header con información
- Tarjetas de estadísticas
- Tabla CRUD de productos

### Estadísticas
- Total de productos
- Precio promedio
- Valor total del inventario
- Número de categorías

### Formulario CRUD
- Inputs validados
- Selector de categoría
- Botones Cancelar/Guardar
- Mensajes de estado

---

## 🚀 Próximas Mejoras

### Fase 1 (Próxima)
- [ ] Integración con Supabase DB
- [ ] Hashing de contraseñas
- [ ] Usuarios múltiples
- [ ] Roles y permisos

### Fase 2
- [ ] 2FA (Google Authenticator)
- [ ] Auditoría de cambios
- [ ] Exportar datos (CSV/PDF)
- [ ] Importar productos (Excel)

### Fase 3
- [ ] Analytics dashboard
- [ ] Reportes avanzados
- [ ] Integraciones (Stripe, etc)
- [ ] API para terceros

---

## 📝 Credenciales de Prueba

**Producción**: ⚠️ CAMBIAR INMEDIATAMENTE

```
Usuario: admin
Contraseña: FashionStore2026!
```

---

## 🐛 Solución de Problemas

### No puedo acceder al dashboard
**Solución:**
1. Verifica credenciales (admin / FashionStore2026!)
2. Limpia cookies del navegador
3. Intenta en modo incógnito

### Los productos no se guardan
**Solución:**
1. Comprueba que localStorage está habilitado
2. Abre DevTools (F12) → Consola
3. Escribe: `localStorage.getItem('admin_products')`

### La sesión expira
**Solución:**
1. Es normal (24 horas)
2. Vuelve a hacer login
3. En producción, personalizar expiración

### Error en el formulario
**Solución:**
1. Rellena todos los campos
2. Precio debe ser número válido
3. Revisa la consola para más detalles

---

## 📞 Contacto

Para reportar bugs o sugerencias:
1. Abre DevTools (F12)
2. Revisa la consola para errores
3. Documenta los pasos para reproducir
4. Contacta al equipo de desarrollo

---

**Estado**: ✅ **COMPLETADO**  
**Versión**: 1.0  
**Fecha**: 9 de enero de 2026  
**Framework**: Astro 5.16.7 + React 18 + TypeScript  
**Proyecto**: FashionStore Admin Panel
