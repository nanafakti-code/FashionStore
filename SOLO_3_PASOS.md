# 🚀 SOLO 3 PASOS PARA TERMINAR

## PASO 1️⃣: Crear Webhook en Stripe (5 minutos)

### A. Login en Stripe
- URL: https://dashboard.stripe.com/
- User: fashionstorerbv3@gmail.com
- Password: [Tu contraseña de Stripe]

### B. Ve a Webhooks
1. Menu izquierdo → **Developers**
2. Submenu → **Webhooks**
3. Click **Add endpoint**

### C. Configura el Endpoint
- URL del endpoint: `https://fashionstorerbv3.victoriafp.online/api/stripe/webhook`
- Events to send: Busca `checkout.session.completed`
- Click **Add endpoint**

### D. Copia el Secret
1. Te aparecerá una pantalla de éxito
2. En la sección "Signing secret" verás: `whsec_test_...`
3. Click el botón **Reveal** o el icono de ojo
4. **Copia el valor completo** (incluyendo `whsec_`)

---

## PASO 2️⃣: Actualizar Coolify (2 minutos)

### A. Login en Coolify
- URL: https://coolify.io/ (o tu Coolify local/server)
- Ve a tu aplicación FashionStore

### B. Abre Settings → Environment Variables

### C. Busca la variable: `STRIPE_WEBHOOK_SECRET`

### D. Reemplaza el valor:
```
ANTES:  whsec_test_local_placeholder
DESPUÉS: [EL QUE COPIASTE DE STRIPE]
```

### E. Guarda y Redeploy
- Click **Save**
- Espera a que diga "Deployed" (2-3 minutos)

---

## PASO 3️⃣: Verifica que Funciona (5 minutos)

### Test 1: ¿El servidor está vivo?
```
Abre: https://fashionstorerbv3.victoriafp.online/api/health

Deberías ver (en verde):
- ✓ Supabase configured
- ✓ Products count: XX
- ✓ Status: Healthy
```

### Test 2: ¿Los correos funcionan?
```
Abre: https://fashionstorerbv3.victoriafp.online/api/test/send-email?to=TU-EMAIL@gmail.com

Deberías:
- Ver mensaje de "Email sent successfully"
- Recibir un email en la bandeja (espera 10 segundos)
```

### Test 3: ¿El webhook funciona?
```
1. Ve a tu tienda: https://fashionstorerbv3.victoriafp.online/
2. Añade algo al carrito
3. Checkout
4. Usa esta tarjeta de prueba:
   - Número: 4242 4242 4242 4242
   - Fecha: 12/25
   - CVC: 123
   - Email: cualquiera@test.com
5. Completa el pago

Deberías:
- Ver página de éxito con "Order successful"
- Recibir email de confirmación (espera 15 segundos)
- Ver en Stripe Dashboard → Webhooks → Events: "checkout.session.completed" con status 200
```

---

## ¿QUÉ PASA SI ALGO FALLA?

### Error 404 en `/api/health`
❌ El código no está actualizado en Coolify
✅ Solución: Espera a que el redeploy termine

### `/api/health` muestra error de Supabase
❌ Las credenciales de Supabase están mal
✅ Solución: Verifica en Coolify que `PUBLIC_SUPABASE_ANON_KEY` sea correcta

### Email test falla
❌ Las credenciales de SMTP están mal
✅ Solución: Verifica `SMTP_USER` y `SMTP_PASS` en Coolify

### Pago se completa pero no recibo email
❌ El webhook secret sigue siendo el placeholder
✅ Solución: Verifica que copiaste bien el `whsec_` de Stripe

### Webhook muestra error 401
❌ El `STRIPE_WEBHOOK_SECRET` en Coolify no es correcto
✅ Solución: Copia de nuevo desde Stripe, con cuidado

---

## ARCHIVO DE REFERENCIA DETALLADA

Si necesitas más información:
- Ver: `GUIA_WEBHOOK_STRIPE.md`
- Ver: `RESUMEN_TRABAJO_COMPLETADO.md`
- Ver: `.env.coolify.example`

---

## RESUMEN DE LO QUE YA ESTÁ HECHO

✅ Supabase: Conectado
✅ Productos: Se cargan
✅ Carrito: Funciona
✅ Stripe: Crea sesiones
✅ Código: Todo actualizado en producción
✅ Email: Configurado (esperando webhook)

**Lo único que falta: El Webhook Secret de Stripe en Coolify**

---

**Estos 3 pasos son TODO lo que necesitas. 100% factible. 15 minutos máximo.**
