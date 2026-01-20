# 🔧 SOLUCIÓN: Emails No Recibidos

## El Problema

El servicio de email no funciona porque **faltan credenciales de configuración en el archivo `.env`**.

### Variables Faltantes:
- ❌ `SMTP_USER` - Tu email de Gmail
- ❌ `SMTP_PASS` - Tu app password de Gmail  
- ❌ `ADMIN_EMAIL` - Tu email para recibir notificaciones
- ❌ `SUPABASE_SERVICE_ROLE_KEY` - Clave privada de Supabase
- ❌ `STRIPE_SECRET_KEY` - Clave secreta de Stripe
- ❌ `STRIPE_WEBHOOK_SECRET` - Secret del webhook de Stripe
- ❌ `PUBLIC_STRIPE_PUBLIC_KEY` - Clave pública de Stripe

---

## Solución: 4 Pasos Simples

### PASO 1: Configurar Gmail (5 minutos)

**Opción A: Si tienes Gmail con 2FA ya activado**

1. Ve a: https://myaccount.google.com/apppasswords
2. Selecciona "Mail" → "Windows (o tu dispositivo)"
3. Copia el código de 16 caracteres generado
   - Ejemplo: `qmec xtfw dsoq inbi`
4. Abre tu archivo `.env` y actualiza:

```env
SMTP_USER=tu-email@gmail.com
SMTP_PASS=qmecxtfwdsoqinbi
ADMIN_EMAIL=tu-email@gmail.com
```

**Opción B: Si NO tienes 2FA activado**

1. Ve a: https://myaccount.google.com/security
2. En la sección "How you sign in to Google" → "2-Step Verification"
3. Sigue los pasos para activar 2FA
4. Una vez activado, ve a https://myaccount.google.com/apppasswords
5. Sigue los pasos de Opción A

---

### PASO 2: Obtener credenciales de Stripe

1. Ve a: https://dashboard.stripe.com/apikeys
2. Si ves "Viewing test data" en la parte superior, estás en modo TEST (correcto para desarrollo)
3. Copia y pega en tu `.env`:

```env
PUBLIC_STRIPE_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
```

4. Para el webhook secret:
   - Ve a: https://dashboard.stripe.com/webhooks
   - Haz clic en "Add endpoint"
   - URL: `https://tu-dominio.com/api/stripe/webhook`
     - En desarrollo: `http://localhost:4321/api/stripe/webhook`
   - Selecciona los eventos: `checkout.session.completed`, `charge.dispute.created`, `charge.failed`
   - Haz clic en "Reveal" en el "Signing secret"
   - Copia a tu `.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

---

### PASO 3: Obtener credenciales de Supabase

1. Ve a: https://app.supabase.com
2. Selecciona tu proyecto
3. Ve a: Settings → API
4. Busca "Service Role Key" (debajo de "Project API keys")
5. Copia a tu `.env`:

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### PASO 4: Verificar la Configuración

Una vez que hayas completado todos los pasos anteriores:

1. **Compila el proyecto:**
   ```bash
   npm run build
   ```

2. **Inicia el servidor en desarrollo:**
   ```bash
   npm run dev
   ```

3. **Prueba el email:**
   - Ve a: `http://localhost:4321/api/test/send-email?to=tu-email@gmail.com`
   - Si ves `"success": true`, el email está configurado correctamente
   - Revisa tu bandeja de entrada (incluyendo SPAM)

4. **Verifica que recibas el email de prueba**

---

## ¿Qué pasará después?

### Cuando completes un pedido:

1. **Haces el pago en Stripe** → Stripe confirma el pago
2. **Stripe envía webhook** → Tu servidor procesa el evento
3. **Se envía email al cliente** con:
   - ✅ Confirmación del pedido
   - ✅ Número de pedido
   - ✅ Detalles de productos
   - ✅ **PDF de factura** adjunto
4. **Se envía email al admin** (ADMIN_EMAIL) con:
   - ✅ Notificación de nueva venta
   - ✅ Detalles del cliente
   - ✅ Total de la venta

---

## Estructura Actual del Código

### Archivos que manejan emails:

```
src/lib/
├── emailService.ts          ← Servicio principal de emails
├── invoiceService.ts        ← Generador de PDF de facturas
└── cartService.ts           ← Gestión del carrito

src/pages/api/
├── stripe/webhook.ts        ← Procesa pagos y envía emails
├── order/by-session/[sessionId].ts
└── test/send-email.ts       ← Endpoint de prueba (NUEVO)

src/pages/
├── checkout/success.astro   ← Página de éxito (limpia el carrito)
```

### Flujo de emails:

```
Pago Completado en Stripe
         ↓
    Webhook Stripe
    (stripe/webhook.ts)
         ↓
    Validar Firma
    Obtener Datos Pedido
         ↓
    Actualizar BD a "Pagado"
    Limpiar Carrito
         ↓
   ┌─────┴─────┐
   ↓           ↓
Email Cliente  Email Admin
   ↓           ↓
+ PDF Factura  Notificación
```

---

## Troubleshooting

### Si recibe el email pero SIN PDF:
- Probablemente hay un error generando el PDF
- El email se envía igualmente (sin factura)
- Revisa los logs del servidor

### Si no recibe ningún email:
1. ✅ Verifica las variables de `.env` están correctas
2. ✅ Prueba con `/api/test/send-email`
3. ✅ Revisa la carpeta SPAM/No deseado
4. ✅ Revisa los logs del servidor (busca `[EMAIL]` o `[WEBHOOK]`)

### Si SMTP_PASS tiene espacios:
- En el `.env` puedes incluir espacios: `xxxx xxxx xxxx xxxx`
- Si copia/pega sin espacios también funciona: `xxxxxxxxxxxxxxxx`

### Si Stripe webhook no se llama:
1. Verifica que el `STRIPE_WEBHOOK_SECRET` sea el correcto
2. Verifica que la URL del webhook esté registrada en Stripe
3. En desarrollo, usa ngrok o similar para que Stripe pueda alcanzar `localhost`

---

## Comandos Útiles

```bash
# Compilar el proyecto
npm run build

# Iniciar servidor de desarrollo
npm run dev

# Probar endpoint de email
curl "http://localhost:4321/api/test/send-email?to=tu-email@gmail.com"

# Ver logs en tiempo real
npm run dev | grep -E "\[EMAIL\]|\[WEBHOOK\]"
```

---

## ✅ Checklist de Configuración

- [ ] SMTP_USER = tu email de Gmail
- [ ] SMTP_PASS = app password de 16 caracteres
- [ ] ADMIN_EMAIL = tu email para notificaciones
- [ ] SUPABASE_SERVICE_ROLE_KEY = completado
- [ ] PUBLIC_STRIPE_PUBLIC_KEY = completado
- [ ] STRIPE_SECRET_KEY = completado
- [ ] STRIPE_WEBHOOK_SECRET = completado
- [ ] Prueba con `/api/test/send-email` exitosa
- [ ] Realiza un pedido de prueba
- [ ] Recibes email de confirmación con PDF
- [ ] Admin recibe email de notificación

---

**Una vez completes todo esto, los emails funcionarán automáticamente en cada pedido. 🎉**
