# 🚀 GUÍA COMPLETA: CONFIGURAR WEBHOOK DE STRIPE

## PASO 1: Obtener el Webhook Secret de Stripe

### 1.1 - Entra al Dashboard de Stripe
- Ve a: https://dashboard.stripe.com/
- Login con tu cuenta

### 1.2 - Navega a Webhooks
- Click en **Developers** (arriba a la derecha)
- Click en **Webhooks** (en el menú izquierdo)

### 1.3 - Crear un Nuevo Webhook
- Click en **Add endpoint**
- En "Endpoint URL" pega:
  ```
  https://fashionstorerbv3.victoriafp.online/api/stripe/webhook
  ```

### 1.4 - Seleccionar Eventos
- Click en **Select events**
- Busca `checkout.session`
- Marca: **checkout.session.completed**
- Click en **Add events**

### 1.5 - Crear el Webhook
- Click en **Add endpoint**
- ¡Listo! Se creará el webhook

### 1.6 - Copiar el Signing Secret
- Verás una lista de webhooks
- Encuentra el que acabas de crear (con URL ...victoriafp.online/api/stripe/webhook)
- Click en él para abrir los detalles
- Verás **Signing secret**: comienza con `whsec_`
- **COPIA ESTE VALOR COMPLETO**

---

## PASO 2: Actualizar Coolify con el Webhook Secret

### 2.1 - Entra a Coolify
- Ve a: https://app.coolify.io/
- Abre tu aplicación FashionStore

### 2.2 - Ir a Environment Variables
- Click en **Settings**
- Click en **Environment Variables** o **Production Environment Variables**

### 2.3 - Actualizar STRIPE_WEBHOOK_SECRET
- Busca la variable `STRIPE_WEBHOOK_SECRET`
- **Reemplaza** el valor `whsec_test_local_placeholder` 
- **Por el valor que copiaste de Stripe** (que comienza con `whsec_`)
- Ejemplo:
  ```
  STRIPE_WEBHOOK_SECRET=whsec_test_1234567890abcdef_es_un_ejemplo
  ```

### 2.4 - Guardar y Redeploy
- Click en **Save** o **Deploy**
- Espera a que termine el redeploy (2-3 minutos)

---

## PASO 3: Verificar que Funciona

### 3.1 - Hacer una Compra de Prueba
- Ve a: https://fashionstorerbv3.victoriafp.online/
- Añade un producto al carrito
- Intenta hacer el checkout y pagar
- Usa tarjeta de prueba Stripe:
  ```
  Número: 4242 4242 4242 4242
  Mes: 12
  Año: 25 (o posterior)
  CVC: 123
  ```

### 3.2 - Verificar que Se Completó
- Después de pagar, deberías llegar a la página de success
- El carrito debe limpiarse
- Deberías recibir un correo de confirmación

### 3.3 - Verificar en Stripe Dashboard
- Ve a https://dashboard.stripe.com/webhooks
- Encuentra tu webhook
- Click en **Events**
- Verás `checkout.session.completed` 
- Debe mostrar **Responded** con status **200** (éxito)

---

## TROUBLESHOOTING

### Si ves "Responded" con status 401 o 500:
- El webhook secret está MAL copiado
- Vuelve a Stripe, copia exactamente el valor completo de Signing secret
- Actualiza en Coolify
- Haz redeploy

### Si el webhook no se ejecuta:
- Verifica que la URL sea exacta: `https://fashionstorerbv3.victoriafp.online/api/stripe/webhook`
- Verifica que `checkout.session.completed` esté marcado
- Prueba a crear el webhook nuevamente

### Si los correos no se envían:
- Verifica que SMTP_USER y SMTP_PASS estén en Coolify
- Ve a: https://fashionstorerbv3.victoriafp.online/api/test/send-email?to=tu-email@gmail.com
- Esto te dirá si los correos funcionan

---

## RESUMEN RÁPIDO

| Tarea | Estado |
|-------|--------|
| ✅ Crear webhook en Stripe | **MANUAL** |
| ✅ Copiar Signing Secret | **MANUAL** |
| ✅ Actualizar STRIPE_WEBHOOK_SECRET en Coolify | **MANUAL** |
| ✅ Haz Redeploy en Coolify | **MANUAL** |
| ✅ Prueba con pago de test | **MANUAL** |
| ✅ Verifica webhook en Stripe Dashboard | **MANUAL** |

---

## NOTAS IMPORTANTES

⚠️ **El webhook secret es diferente del API key**
- API Secret Key: `sk_test_...` (en Coolify como STRIPE_SECRET_KEY)
- Webhook Secret: `whsec_...` (en Coolify como STRIPE_WEBHOOK_SECRET)
- **NO confundas estos valores**

⚠️ **Los cambios en Coolify requieren Redeploy**
- Después de cambiar cualquier variable de entorno, debes hacer redeploy
- Espera a que termine (verás "Success" o "Deployed")

⚠️ **Los webhooks de test vs producción**
- En modo test (claves con `_test_`), los webhooks de test funcionan
- En modo producción, necesitas webhooks de producción
- Actualmente estás en mode TEST, eso está bien para desarrollar
