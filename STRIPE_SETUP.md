# 💳 CONFIGURACIÓN DE STRIPE - FashionStore

## 📋 Variables de Entorno Necesarias

Copia esto en tu archivo `.env.local`:

```env
# Stripe Keys (obtener de Stripe Dashboard)
PUBLIC_STRIPE_PUBLIC_KEY=pk_test_tu_clave_aqui
STRIPE_SECRET_KEY=sk_test_tu_clave_aqui
STRIPE_WEBHOOK_SECRET=whsec_test_tu_clave_aqui
```

## 🔑 Cómo Obtener las Claves

### 1. **Crear Cuenta en Stripe**
- Ve a [stripe.com](https://stripe.com)
- Crea una cuenta y verifica tu email

### 2. **Obtener Claves API**
- En Stripe Dashboard: **Developers** → **API Keys**
- Copia:
  - **Publishable key** (pk_test_...)
  - **Secret key** (sk_test_...)

### 3. **Configurar Webhook**
- En Stripe Dashboard: **Developers** → **Webhooks**
- Clic **Add endpoint**
- URL: `http://localhost:4321/api/stripe/webhook` (local con Stripe CLI)
- Eventos a escuchar:
  - ✅ checkout.session.completed
  - ✅ payment_intent.succeeded
  - ✅ charge.failed
- Copia el **Signing secret** (whsec_...)

## 🧪 Testing Local

### 1. **Instala Stripe CLI**
```bash
# Windows: Descarga desde https://stripe.com/docs/stripe-cli
# O usa Chocolatey:
choco install stripe-cli
```

### 2. **Conecta tu cuenta**
```bash
stripe login
```

### 3. **Inicia el listener (en una terminal separada)**
```bash
stripe listen --forward-to localhost:4321/api/stripe/webhook
```

Esto mostrará tu webhook secret - cópialo en `.env.local`

### 4. **Inicia tu servidor**
```bash
npm run dev
```

### 5. **Prueba un pago**
1. Ve a `/carrito`
2. Haz clic "Tramitar pedido"
3. Completa todos los datos
4. Haz clic "Ir a Pagar con Stripe"
5. En Stripe Checkout, usa tarjeta de prueba: **4242 4242 4242 4242**
6. Fecha: Cualquiera futura (ej: 12/25)
7. CVC: Cualquier 3 dígitos (ej: 123)
8. Completa el pago

## 🔍 Flujo Completamente Implementado

```
1. Usuario completa datos en /checkout
2. Clic "Ir a Pagar con Stripe"
   ↓
3. Frontend envía: POST /api/stripe/create-session
   - Monto total en céntimos
   - Email del usuario
   - URL de éxito y cancelación
   ↓
4. Backend crea sesión de Stripe
   - Retorna: sessionId
   ↓
5. Frontend redirige a Stripe Checkout
   - URL: https://checkout.stripe.com/pay/{sessionId}
   ↓
6. Usuario entra datos de tarjeta
   - Tarjeta de prueba: 4242 4242 4242 4242
   ↓
7. Usuario completa pago
   ↓
8. Stripe envía webhook: POST /api/stripe/webhook
   - Evento: checkout.session.completed
   ↓
9. Backend procesa webhook
   - Log del pago completado
   - (Aquí puedes crear órdenes en BD, enviar emails, etc.)
   ↓
10. Stripe redirige a usuario a /checkout/success?session_id={ID}
    ↓
11. Página de éxito muestra:
    - ID del pedido
    - Monto pagado
    - Próximos pasos
    - Carrito se limpia automáticamente
```

## 📝 Archivos Creados/Modificados

### APIs de Stripe:
- `/src/pages/api/stripe/create-session.ts` - Crea sesión de pago
- `/src/pages/api/stripe/webhook.ts` - Recibe eventos de Stripe
- `/src/pages/api/stripe/session/[sessionId].ts` - Obtiene detalles de sesión

### Páginas:
- `/src/pages/checkout.astro` - Formulario de checkout (ACTUALIZADO)
- `/src/pages/checkout/success.astro` - Página de éxito (NUEVO)

## 🧪 Tarjetas de Prueba

| Tarjeta | Resultado | Uso |
|---------|-----------|-----|
| 4242 4242 4242 4242 | ✅ Éxito | Testing normal |
| 4000 0000 0000 0002 | ❌ Rechazado | Testing errores |
| 5555 5555 5555 4444 | ✅ Éxito | Mastercard |

Fecha: Cualquiera futura (12/25)
CVC: Cualquier 3 dígitos (123)

## ✅ Checklist

- [ ] Crear cuenta en Stripe
- [ ] Obtener claves API (test)
- [ ] Pegar claves en `.env.local`
- [ ] Instalar Stripe CLI
- [ ] Ejecutar `stripe login`
- [ ] Ejecutar `stripe listen --forward-to localhost:4321/api/stripe/webhook`
- [ ] Copiar webhook secret a `.env.local`
- [ ] Ejecutar `npm run dev`
- [ ] Ir a `/carrito` → `/checkout`
- [ ] Hacer clic "Ir a Pagar con Stripe"
- [ ] Usar tarjeta 4242 4242 4242 4242
- [ ] Completar pago
- [ ] Ver página de éxito `/checkout/success`
- [ ] Ver webhook procesado en terminal

## 🚀 Migrar a Producción

1. En Stripe Dashboard, obtén las claves **Live** (no test)
2. Actualiza `.env.local`:
   ```env
   PUBLIC_STRIPE_PUBLIC_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_live_...
   ```
3. Configura webhook en producción (URL real de tu dominio)
4. Despliega tu aplicación

## 💬 Soporte

Si tienes problemas:
1. Verifica que las claves estén bien copiadas
2. Revisa la consola del navegador (F12) para errores
3. Revisa la terminal de desarrollo para logs
4. Verifica en Stripe Dashboard que el webhook está conectado
5. Consulta la documentación: https://stripe.com/docs

¡Tu sistema de pagos con Stripe está completamente operativo! 🎉
