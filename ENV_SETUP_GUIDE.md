# 🔑 Guía: Dónde Obtener Credenciales para FashionStore

## 1️⃣ EMAIL - NODEMAILER (Contraseña de Gmail)

### Para Gmail:
1. Ve a https://myaccount.google.com/security
2. Habilita "Verificación en dos pasos" (si no lo está)
3. Busca "Contraseñas de aplicación" en el mismo menú
4. Selecciona:
   - App: Mail
   - Device: Windows Computer (o tu dispositivo)
5. Google generará una contraseña de 16 caracteres
6. Copia en `.env.local`:
   ```
   SMTP_USER=tu-email@gmail.com
   SMTP_PASS=xxxx xxxx xxxx xxxx
   ```

### Para otros proveedores (Outlook, Hotmail, etc.):
- **Outlook/Hotmail**: Habilita "autenticación de aplicación" en seguridad
- **SendGrid**: https://app.sendgrid.com/settings/api_keys
- **Mailgun**: https://app.mailgun.com/app/account/security/api_keys

---

## 2️⃣ STRIPE - Claves de Pago

### Obtener claves Stripe:
1. Ve a https://dashboard.stripe.com/apikeys
2. Verifica que estés en **modo TEST** (arriba a la izquierda)
3. Copia:
   - **Publishable key** → `PUBLIC_STRIPE_PUBLIC_KEY`
   - **Secret key** → `STRIPE_SECRET_KEY`

### Configurar Webhook (para procesar pagos):
1. Ve a https://dashboard.stripe.com/webhooks
2. Haz clic en "Add endpoint"
3. URL del endpoint:
   ```
   https://tu-dominio.com/api/stripe/webhook
   ```
   Para desarrollo local: https://ngrok.io → redirige a http://localhost:4321
4. Eventos a recibir:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
5. Copia el **Signing secret** → `STRIPE_WEBHOOK_SECRET`

---

## 3️⃣ SUPABASE - Base de Datos

### Obtener credenciales Supabase:
1. Ve a https://app.supabase.com
2. Selecciona proyecto **FashionStore**
3. Ve a **Settings > API**
4. Copia:
   - **Project URL** → `PUBLIC_SUPABASE_URL`
   - **anon public** → `PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **IMPORTANTE**: 
- `anon` es pública (segura para el cliente)
- `service_role` es privada (NUNCA en el navegador)
- En producción, coloca `SUPABASE_SERVICE_ROLE_KEY` en las variables secretas del hosting

---

## 4️⃣ Variables de Entorno Completas

Tu `.env.local` debe tener:

```env
# EMAIL
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=contraseña-de-aplicacion
ADMIN_EMAIL=admin@fashionstore.com

# STRIPE
PUBLIC_STRIPE_PUBLIC_KEY=pk_test_51SLL...
STRIPE_SECRET_KEY=sk_test_51SLL...
STRIPE_WEBHOOK_SECRET=whsec_test_...

# SUPABASE
PUBLIC_SUPABASE_URL=https://spzvi....supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# OTROS
CRON_SECRET=d7e4f9c2b1a8...
APP_URL=http://localhost:4321
```

---

## ✅ Checklist de Configuración

- [ ] Gmail: 2FA habilitado
- [ ] Gmail: Contraseña de aplicación generada
- [ ] Stripe: Claves copiadas (PUBLIC_STRIPE_PUBLIC_KEY, STRIPE_SECRET_KEY)
- [ ] Stripe: Webhook configurado en https://dashboard.stripe.com/webhooks
- [ ] Supabase: Credenciales copiadas (URL, anon key, service_role key)
- [ ] Supabase: SQL_GUEST_CHECKOUT.sql ejecutado ✓
- [ ] `.env.local` actualizado con todas las variables
- [ ] `.env.local` está en `.gitignore` (IMPORTANTE)

---

## 🚀 Después de Configurar

1. Reinicia el servidor: `npm run dev`
2. Prueba el flujo de checkout:
   - Añade un producto como invitado
   - Ve a checkout sin hacer login
   - Completa con tarjeta de prueba Stripe: `4242 4242 4242 4242`
   - Verifica que recibas email de confirmación

---

## 🐛 Troubleshooting

### No recibo emails:
- Verifica `SMTP_USER` y `SMTP_PASS`
- Verifica que 2FA esté habilitado en Gmail
- Revisa logs en `/src/lib/emailService.ts`

### Webhook no funciona:
- Verifica la URL en Stripe Dashboard
- Usa ngrok para redirigir localhost a internet
- Verifica `STRIPE_WEBHOOK_SECRET` en `.env.local`

### Variables no se cargan:
- Reinicia el servidor: `npm run dev`
- Verifica que `.env.local` esté en la raíz del proyecto
- No incluyas comillas alrededor de los valores

---

## 📝 Notas de Seguridad

🔒 **NUNCA**:
- Commitees `.env.local` a Git
- Compartas `STRIPE_SECRET_KEY`
- Compartas `SUPABASE_SERVICE_ROLE_KEY`
- Expongas `SMTP_PASS`

✅ **SIEMPRE**:
- Guarda `.env.local` en `.gitignore`
- Usa variables secretas en tu hosting (Vercel, Netlify, etc.)
- Rotaa contraseñas regularmente
- Usa modo TEST de Stripe para desarrollo

