# ⚠️ SOLUCIÓN RÁPIDA: ERR_TOO_MANY_REDIRECTS

## El Problema
El servidor redirige infinitamente entre páginas. Mensaje de error: "La página localhost te ha redirigido demasiadas veces"

## ✅ SOLUCIONES INMEDIATAS (Prueba en este Orden)

### 1️⃣ Verifica la URL Correcta
**ASEGÚRATE de usar la URL CORRECTA:**
```
❌ INCORRECTO:    http://localhost:3323/admin/login
✅ CORRECTO:       http://localhost:4321/admin-secret-login
```

El archivo se llama `admin-secret-login.astro`, NO `admin/login.astro`

### 2️⃣ Limpia el Navegador
- Abre DevTools (F12)
- Ve a **Storage** o **Application**
- Elimina todas las cookies de `localhost`
- Limpia el caché del sitio

### 3️⃣ Reinicia el Servidor
```bash
# En la terminal donde corre Astro:
1. Presiona Ctrl+C para detener
2. Espera a que se detenga completamente
3. Ejecuta: npm run dev
4. Espera a que diga "Server running at http://localhost:4321/"
```

### 4️⃣ Intenta en Modo Incógnito
Abre una ventana de incógnito y accede a:
```
http://localhost:4321/admin-secret-login
```

### 5️⃣ Verifica la Conexión a Supabase (Opcional)
Si el dashboard no carga después de login, verifica el archivo `.env`:
```
VITE_SUPABASE_URL=tu_url_aqui
VITE_SUPABASE_KEY=tu_key_aqui
```

---

## 📋 Checklist del Flujo Correcto

Después de acceder a `/admin-secret-login`, deberías ver:

- [ ] Página de login con logo y formulario
- [ ] Campo "Usuario" (predefinido: admin@fashionstore.com)
- [ ] Campo "Contraseña" (predefinido: 1234)
- [ ] Botón "Iniciar Sesión"

Después de hacer click en "Iniciar Sesión":

- [ ] Desaparece el formulario (se envía POST)
- [ ] Se redirige a `/admin/dashboard`
- [ ] Ve la página del dashboard
- [ ] Carga los productos desde Supabase
- [ ] Muestra estadísticas (Total Productos, Stock Total, etc.)

---

## 🔍 Debugging Manual

Si persiste el problema, sigue estos pasos:

### Paso A: Inspecciona las Cookies
```
1. Abre DevTools (F12)
2. Ve a "Application" → "Cookies" → "http://localhost:4321"
3. Después de intentar login, busca una cookie llamada "admin_session"
4. Si NO está, el POST no se procesó correctamente
```

### Paso B: Inspecciona la Consola del Navegador
```
1. DevTools (F12) → Console
2. Deberías ver un mensaje como:
   "Login attempt: { username: 'admin@fashionstore.com', password: '1234' }"
3. Si NO ves nada, el formulario no se está enviando
```

### Paso C: Inspecciona Network Tab
```
1. DevTools (F12) → Network
2. Recarga la página
3. Haz click en "Iniciar Sesión"
4. Busca una solicitud POST a "/admin-secret-login"
5. Verifica que la respuesta sea "302" (redirección)
6. Verifica que tenga "Set-Cookie" en los headers
```

### Paso D: Revisa los Logs del Servidor
```
En la terminal donde corre 'npm run dev', verifica que veas:
- Los logs del servidor
- Ningún error en rojo
- Si hay errores, comparte el mensaje completo
```

---

## 🆘 Si Nada Funciona

1. **Detén todo** (Ctrl+C en la terminal)
2. **Limpia todo**:
   ```bash
   rm -r .astro
   rm -r dist
   rm -r node_modules/.vite
   ```
3. **Reinicia**:
   ```bash
   npm run dev
   ```
4. **Espera** a que el servidor diga "Server running at"
5. **Accede** nuevamente a: `http://localhost:4321/admin-secret-login`

---

## 📋 Información de Referencia

**Credenciales Correctas:**
- Email: `admin@fashionstore.com`
- Password: `1234`

**Archivos Clave:**
- Login: `src/pages/admin-secret-login.astro`
- Dashboard: `src/pages/admin/dashboard.astro`
- Auth Logic: `src/lib/admin-auth.ts`
- Config: `astro.config.mjs`

**Puerto Correcto:** `4321`

---

## 💡 Notas Técnicas

La aplicación funciona así:
1. Accedes a `/admin-secret-login`
2. Ingresas credenciales y haces submit
3. El servidor valida las credenciales
4. Si son correctas, crea un token base64 y lo envía en una cookie HTTPOnly
5. La cookie se guarda en el navegador
6. Se redirige a `/admin/dashboard`
7. El dashboard verifica la cookie
8. Si es válida, muestra el panel de control

Si en cualquier paso falla, tu navegador "piensa" que no estás autenticado y te vuelve a enviar al login. Por eso ves el bucle de redirecciones.
