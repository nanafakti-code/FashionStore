# Configuración de Stripe Webhook - Guía de Implementación

## ⚠️ CRÍTICO PARA PRODUCCIÓN

Este documento explica cómo configuraStipe Webhook para que FashionStore funcione correctamente en producción.

---

## 🔧 Configuración Requerida

### 1. Variables de Entorno (.env.local)

```env
# Stripe - Credenciales API
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx  # Public key de Stripe
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx               # Secret key de Stripe
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx             # Webhook signing secret

# Supabase
PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxxx
PUBLIC_SUPABASE_ANON_KEY=xxxxx

# Admin Email
ADMIN_EMAIL=raafaablanco@gmail.com

# URL del sitio (para webhook callback)
PUBLIC_SITE_URL=https://fashionstore.com
```

### 2. Obtener Credenciales de Stripe

1. **Ir a Stripe Dashboard**: https://dashboard.stripe.com
2. **Developers → API Keys**:
   - Copiar `Publishable Key` → `PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Copiar `Secret Key` → `STRIPE_SECRET_KEY`
3. **Developers → Webhooks**:
   - Click en "Add Endpoint"
   - URL Endpoint: `https://fashionstore.com/api/stripe/webhook`
   - Events to Send:
     - `checkout.session.completed` ✅
     - `charge.dispute.created` ✅
     - `charge.failed` ✅
   - Copiar "Signing Secret" → `STRIPE_WEBHOOK_SECRET`

---

## 🚀 Deployment Steps

### Local Development
```bash
# 1. Instalar Stripe CLI (para testear webhooks locales)
# https://stripe.com/docs/stripe-cli

# 2. Crear tunnel local a Stripe
stripe listen --forward-to localhost:4321/api/stripe/webhook

# 3. Copiar el signing secret y asignarlo a env
# Mostrará: whsec_xxxxx

# 4. Ejecutar el proyecto
npm run dev

# 5. Testear con Stripe CLI
stripe trigger checkout.session.completed
```

### Producción (Vercel/Netlify)
```bash
# 1. Desplegar a producción
git push

# 2. Ir a Stripe Dashboard
# 3. Crear endpoint webhook:
#    URL: https://fashionstore.com/api/stripe/webhook
#    Events: checkout.session.completed, charge.dispute.created, charge.failed
# 4. Copiar signing secret
# 5. Agregar a variables de entorno:
#    STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

---

## 🔒 Flujo de Seguridad

```
[Cliente Paga en Stripe]
         ↓
[Stripe Completa checkout.session]
         ↓
[Stripe Envía webhook a /api/stripe/webhook]
         ↓
[1. Validar firma (whsec_xxxxx)] ← CRÍTICO
         ↓
[2. Obtener order_id de BD]
         ↓
[3. Validar monto (anti-fraude)] ← CRÍTICO
         ↓
[4. Actualizar estado a "Pagado"]
         ↓
[5. Limpiar carrito]
         ↓
[6. Enviar emails]
         ↓
[7. Responder 200 OK a Stripe]
```

---

## ✅ Testing Checklist

### Antes de Producción

- [ ] Variables de entorno configuradas correctamente
- [ ] Stripe webhook creado y activo
- [ ] Signing secret es correcto
- [ ] Email al admin configurado (raafaablanco@gmail.com)
- [ ] Emails de Gmail/Mailer funcionan
- [ ] Testing local con Stripe CLI
- [ ] Testing en staging (pre-prod)

### Testing Local

```bash
# Terminal 1: Escuchar webhooks
stripe listen --forward-to localhost:4321/api/stripe/webhook

# Terminal 2: Trigger evento
stripe trigger checkout.session.completed

# Verificar:
# 1. Logs en terminal del proyecto
# 2. Orden creada en Supabase
# 3. Email enviado al cliente
# 4. Email enviado al admin
```

### Testing Producción

1. **Ir a Stripe Dashboard**
2. **Testing → Create test payment**
3. **Usar tarjeta de prueba**:
   - Número: `4242 4242 4242 4242`
   - Fecha: `12/34`
   - CVC: `567`
4. **Completar pago**
5. **Verificar**:
   - Pedido en Supabase con estado `Pagado`
   - Email en bandeja de entrada (cliente + admin)

---

## 🚨 Troubleshooting

### "Webhook Failed"

**Problema**: Stripe muestra error al enviar webhook
**Solución**:
1. Revisar logs en Stripe Dashboard → Webhooks → Events
2. Verificar que `/api/stripe/webhook` responde con `200 OK`
3. Verificar `STRIPE_WEBHOOK_SECRET` es correcto
4. Revisar logs del servidor (Vercel, Netlify, etc.)

### "Pedido no actualizado"

**Problema**: Pago realizado pero orden sigue en "Pendiente"
**Solución**:
1. Verificar que webhook recibió evento (Stripe Dashboard)
2. Revisar logs del servidor
3. Verificar que `order_id` está en metadata de sesión Stripe
4. Verificar Supabase RLS policies

### "Email no enviado"

**Problema**: Cliente no recibe confirmación de pago
**Solución**:
1. Verificar credenciales SMTP (Gmail/Mailer)
2. Verificar `ADMIN_EMAIL` es correcto
3. Revisar logs de emailService
4. Revisar spam del cliente

### "Monto no coincide"

**Problema**: Webhook rechaza pedido por monto diferente
**Solución** (Anti-fraude):
1. Revisar que el cliente pagó el monto correcto
2. Revisar que no hay descuentos aplicados incorrectamente
3. Intentar nuevamente desde cero

---

## 📊 Monitoreo en Producción

### Stripe Dashboard
- **Webhooks**: Ver estado de entregas
- **Events**: Ver logs detallados
- **Disputes**: Monitorear disputas de pago

### Supabase
- **Table `ordenes`**: Verificar estado de pedidos
- **Logs**: Verificar función RPC se ejecuta correctamente

### Application Monitoring (Vercel/Netlify)
- Ver logs de `/api/stripe/webhook`
- Alertas si función falla

---

## 🔄 Estados de Pedido (Flujo Completo)

```
Pendiente
    ↓ [Webhook recibe checkout.session.completed]
Pagado
    ↓ [Admin marca como "En Preparación"]
En Preparación
    ↓ [Admin marca como "Enviado" + genera tracking]
Enviado
    ↓ [Sistema de tracking actualiza]
Entregado
    ↓ [Cliente puede solicitar devolución]
Devolucion_Solicitada (optional)
    ↓ [Admin procesa devolución]
Devuelto
```

---

## 📞 Contacto Soporte

Si hay problemas con el webhook:

1. **Revisar logs de Stripe Dashboard**
2. **Revisar logs del servidor**
3. **Contactar Stripe Support**: https://support.stripe.com
4. **Contactar admin**: raafaablanco@gmail.com

---

**Última actualización**: 19 de Enero de 2026
**Estado**: 🟢 Listo para Producción
