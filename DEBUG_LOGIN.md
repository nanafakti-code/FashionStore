# Guía de Depuración del Login - ERR_TOO_MANY_REDIRECTS

## El Problema
Recibes error `ERR_TOO_MANY_REDIRECTS` en `localhost:3323/admin/login`

## Diagnóstico

### Paso 1: Verifica la Ruta Correcta
- **CORRECTO**: `http://localhost:4321/admin-secret-login`
- **INCORRECTO**: `http://localhost:3323/admin/login`

El archivo de login está en `admin-secret-login.astro`, no en `admin/login`.

### Paso 2: Verificar el Puerto
El proyecto está configurado para correr en puerto `4321` según `astro.config.mjs`.

### Paso 3: Limpiar y Reiniciar
```bash
# En la terminal del proyecto:
1. Presiona Ctrl+C para detener el servidor actual
2. Borra la caché:
   rm -r .astro
   rm -r node_modules/.vite
3. Reinicia el servidor:
   npm run dev
```

### Paso 4: Acceder Correctamente
Abre en el navegador:
```
http://localhost:4321/admin-secret-login
```

### Paso 5: Credenciales de Login
```
Email:    admin@fashionstore.com
Password: 1234
```

## ¿Qué Debería Pasar?

1. ✅ Ves la página de login con formulario
2. ✅ Ingresas las credenciales
3. ✅ Haces click en "Iniciar Sesión"
4. ✅ Se establece la cookie `admin_session` (visible en DevTools > Cookies)
5. ✅ Te redirige a `/admin/dashboard`
6. ✅ Ves el dashboard con productos

## Debugging Manual

Si aún tienes el problema, abre **DevTools (F12)** y sigue estos pasos:

### 1. Verifica las Cookies
- Ve a DevTools > Application > Cookies
- Después de intentar login, debe haber una cookie llamada `admin_session`

### 2. Verifica la Consola
- Ve a DevTools > Console
- Deberías ver: `Login attempt: { username: '...', password: '...' }`

### 3. Verifica el Network Tab
- Ve a DevTools > Network
- Busca la solicitud POST a `/admin-secret-login`
- Verifica que:
  - La respuesta sea `302 Found`
  - El header `Set-Cookie` esté presente
  - Redirige a `/admin/dashboard`

### 4. Verifica la Protección del Dashboard
El dashboard debería verificar:
```
- Cookie 'admin_session' presente
- Token válido (no expirado)
- Si no cumple, redirigir a `/admin-secret-login`
```

## Archivos Clave
- **Login**: `src/pages/admin-secret-login.astro`
- **Dashboard**: `src/pages/admin/dashboard.astro`
- **Auth Lib**: `src/lib/admin-auth.ts`
- **Configuración**: `astro.config.mjs`

## Próximos Pasos si Persiste el Error

1. Verifica que el servidor esté corriendo en el puerto correcto
2. Revisa los logs del terminal donde corre `npm run dev`
3. Limpia el navegador (cookies, caché)
4. Intenta en una ventana de incógnito
5. Revisa la consola del servidor para mensajes de error
