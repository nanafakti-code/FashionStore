# 🔐 Guía: Configurar Autenticación con Google y Apple

Esta guía te mostrará cómo configurar OAuth de Google y Apple en tu proyecto FashionStore con Supabase.

---

## ✅ Paso 1: Acceder a Supabase

1. Ve a [console.supabase.com](https://console.supabase.com)
2. Selecciona tu proyecto
3. En el menú izquierdo, ve a **Authentication** → **Providers**

---

## 🔵 Paso 2: Configurar Google OAuth

### 2.1 Crear Proyecto en Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un nuevo proyecto
3. Ve a **APIs & Services** → **Credentials**
4. Haz clic en **Create Credentials** → **OAuth Client ID**
5. Selecciona **Web Application**
6. Bajo "Authorized redirect URIs", agrega:
   ```
   https://YOUR_PROJECT.supabase.co/auth/v1/callback?provider=google
   ```
   (Reemplaza `YOUR_PROJECT` con tu ID de proyecto de Supabase)

7. Copia tu:
   - **Client ID**
   - **Client Secret**

### 2.2 Agregar a Supabase

1. En Supabase, ve a **Authentication** → **Providers**
2. Busca **Google** y haz clic en él
3. Marca **Enable Sign up**
4. Pega tu **Client ID** y **Client Secret**
5. Haz clic en **Save**

---

## 🍎 Paso 3: Configurar Apple OAuth

### 3.1 Crear Identificador en Apple Developer

1. Ve a [Apple Developer](https://developer.apple.com)
2. Ve a **Certificates, Identifiers & Profiles**
3. En **Identifiers**, crea un nuevo **App ID**
   - Ejemplo: `com.fashionstore.app`
4. Habilita **Sign in with Apple**

### 3.2 Crear Service ID

1. En **Identifiers**, crea un nuevo **Services ID**
   - Ejemplo: `com.fashionstore.service`
2. En **Domains and Subdomains**, agrega:
   ```
   supabase.co
   ```
3. En **Return URLs**, agrega:
   ```
   https://YOUR_PROJECT.supabase.co/auth/v1/callback?provider=apple
   ```

### 3.3 Crear Clave Privada

1. Ve a **Keys**
2. Crea una nueva clave para "Sign in with Apple"
3. Descarga el archivo `.p8` (guárdalo en lugar seguro)
4. Anotarás:
   - **Key ID**
   - **Team ID** (en tu cuenta de Apple)

### 3.4 Agregar a Supabase

1. En Supabase, ve a **Authentication** → **Providers**
2. Busca **Apple** y haz clic en él
3. Marca **Enable Sign up**
4. Completa los campos:
   - **Service ID**: `com.fashionstore.service`
   - **Team ID**: Tu Team ID de Apple
   - **Key ID**: De la clave que creaste
   - **Private Key**: Contenido del archivo `.p8`
5. Haz clic en **Save**

---

## 🔧 Variables de Entorno

Crea archivo `.env.local` en la raíz del proyecto:

```env
PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

Para obtener estos valores:
1. En Supabase, ve a **Project Settings** → **API**
2. Copia:
   - **Project URL**
   - **anon public** (API Key)

---

## 🗄️ Ejecutar SQL en Supabase

1. Ve a **SQL Editor** en Supabase
2. Crea una nueva query
3. Copia el contenido de `supabase/auth-schema.sql`
4. Ejecuta el SQL
5. Verifica que se creen las tablas correctamente

---

## 🧪 Probar Autenticación

1. Inicia el servidor:
   ```bash
   npm run dev
   ```

2. Abre `http://localhost:3000`

3. Haz clic en **Iniciar sesión** en el header

4. Elige Google o Apple

5. Completa el flujo de autenticación

6. Deberías ser redirigido a `/auth/callback` y luego al inicio

---

## 🔍 Verificar Usuarios

En Supabase:
1. Ve a **Authentication** → **Users**
2. Deberías ver tus usuarios autenticados
3. Ve a **Database** → **public** → **users**
4. Verifica que se hayan creado los registros de usuario

---

## 🛠️ Estructura del Código

```
src/
├── lib/
│   └── auth.ts              ← Funciones de autenticación
├── components/islands/
│   ├── AuthButtons.tsx      ← Botones de login
│   ├── LoginModal.tsx       ← Modal de autenticación
│   └── UserMenu.tsx         ← Menú de usuario
├── pages/
│   ├── index.astro          ← Página de inicio
│   └── auth/
│       └── callback.astro   ← Callback de OAuth
└── supabase/
    └── auth-schema.sql      ← Tablas de BD
```

---

## 📱 Flujo de Autenticación

```
Usuario → Click "Iniciar sesión"
   ↓
LoginModal abre
   ↓
Usuario elige Google/Apple
   ↓
Redirige a proveedor de OAuth
   ↓
Usuario autoriza en Google/Apple
   ↓
Redirige a https://tu-app.com/auth/callback
   ↓
Supabase procesa el callback
   ↓
Usuario creado en tabla "users"
   ↓
Redirige al inicio
   ↓
UserMenu muestra datos del usuario
```

---

## 🔐 Seguridad

✅ **Row Level Security (RLS)** está configurado
- Cada usuario solo ve sus datos
- Las tablas están protegidas

✅ **Políticas de seguridad** incluidas
- INSERT, SELECT, UPDATE, DELETE controlados

✅ **Triggers automáticos**
- `updated_at` se actualiza automáticamente

---

## 🆘 Solución de Problemas

### Error: "Invalid redirect URI"
- Verifica que la URL en Google/Apple coincida exactamente con Supabase
- Formato: `https://YOUR_PROJECT.supabase.co/auth/v1/callback?provider=google`

### Error: "PKCE required"
- Supabase está configurado correctamente
- Limpia caché del navegador y reintenta

### Usuario no se crea en tabla "users"
- Verifica que el SQL se ejecutó correctamente
- Chequea los triggers y funciones

### Botones de login no funcionan
- Verifica `.env.local` con tus credenciales de Supabase
- Reinicia el servidor: `npm run dev`

### Error en Apple: "Invalid Team ID"
- Obtén tu Team ID de https://developer.apple.com/account
- Está en la esquina superior derecha

---

## 📚 Recursos Útiles

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Google OAuth Setup](https://supabase.com/docs/guides/auth/oauth2#google)
- [Apple OAuth Setup](https://supabase.com/docs/guides/auth/oauth2#apple)
- [Google Cloud Console](https://console.cloud.google.com)
- [Apple Developer](https://developer.apple.com)

---

## ✅ Checklist de Configuración

- [ ] Proyecto creado en Google Cloud
- [ ] Credenciales de Google obtenidas
- [ ] Google agregado a Supabase
- [ ] Service ID creado en Apple Developer
- [ ] Clave privada de Apple generada
- [ ] Apple agregado a Supabase
- [ ] Variables de entorno configuradas
- [ ] SQL ejecutado en Supabase
- [ ] Servidor iniciado
- [ ] Flujo de login probado
- [ ] Usuarios creados en BD
- [ ] Menu de usuario funcionando

---

**Última actualización:** 9 de enero de 2026
**Estado:** ✅ Listo para configurar
