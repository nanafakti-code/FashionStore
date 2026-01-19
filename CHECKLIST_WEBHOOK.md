# ✅ CHECKLIST - WEBHOOK DE STRIPE

## Antes de Producción

### Configuración Stripe
- [ ] Credenciales API obtenidas de Stripe Dashboard
- [ ] `STRIPE_SECRET_KEY` = sk_live_xxxxx (nunca compartir)
- [ ] `PUBLIC_STRIPE_PUBLISHABLE_KEY` = pk_live_xxxxx
- [ ] Webhook creado en Stripe Dashboard
- [ ] `STRIPE_WEBHOOK_SECRET` = whsec_xxxxx
- [ ] URL del webhook correcto: `https://fashionstore.com/api/stripe/webhook`
- [ ] Eventos seleccionados:
  - [ ] checkout.session.completed
  - [ ] charge.dispute.created
  - [ ] charge.failed

### Configuración Supabase
- [ ] `PUBLIC_SUPABASE_URL` configurado
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurado
- [ ] `PUBLIC_SUPABASE_ANON_KEY` configurado
- [ ] Tabla `ordenes` existe con columnas:
  - [ ] id (UUID PK)
  - [ ] numero_orden (TEXT UNIQUE)
  - [ ] estado (TEXT)
  - [ ] stripe_session_id (TEXT)
  - [ ] stripe_payment_intent (TEXT)
  - [ ] email_cliente (TEXT)
  - [ ] nombre_cliente (TEXT)
  - [ ] total (INTEGER)
  - [ ] fecha_pago (TIMESTAMPTZ)
- [ ] Tabla `items_orden` existe
- [ ] RLS policies configuradas

### Configuración Email
- [ ] `ADMIN_EMAIL` = raafaablanco@gmail.com
- [ ] `SMTP_USER` = correo válido
- [ ] `SMTP_PASS` = contraseña app (NO contraseña general)
- [ ] Conexión SMTP testada
- [ ] Emails test enviados correctamente

### Código
- [ ] `/src/pages/api/stripe/webhook.ts` implementado
- [ ] `/src/pages/api/stripe/create-session.ts` mejorado
- [ ] `sendAdminNotificationEmail()` existe en emailService
- [ ] Logs implementados en webhook
- [ ] Manejo de errores robusto

---

## Testing Local

### Setup
```bash
# 1. Instalar Stripe CLI
curl https://files.stripe.com/stripe-cli/releases/latest/linux/stripe_linux_x86_64.tar.gz | tar -xz

# 2. Autenticar
stripe login

# 3. En Terminal 1: Escuchar webhooks
stripe listen --forward-to localhost:4321/api/stripe/webhook

# 4. Copiar el whsec_xxxxx y agregarlo a .env.local
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### Verificar Webhook
- [ ] Webhook se conecta sin errores
- [ ] Logs muestran: "Listening for live events..."

### Crear Test Payment
```bash
# Terminal 2: Ejecutar proyecto
npm run dev

# Terminal 3: Trigger un evento
stripe trigger checkout.session.completed
```

### Verificar Logs
- [ ] Log en terminal del webhook: "[WEBHOOK] === Procesando Checkout Completado ==="
- [ ] Log: "Firma validada"
- [ ] Log: "Pedido encontrado"
- [ ] Log: "Pedido actualizado"
- [ ] Log: "Email enviado"
- [ ] Log: "===✅ COMPLETADO"

### Verificar Base de Datos
```sql
SELECT * FROM ordenes ORDER BY fecha_creacion DESC LIMIT 1;
-- Debe tener:
-- estado = 'Pagado'
-- stripe_session_id = populated
-- stripe_payment_intent = populated
-- fecha_pago = recent timestamp
```

### Verificar Emails
- [ ] Email cliente: Recibido (revisar spam)
- [ ] Email admin (raafaablanco@gmail.com): Recibido
- [ ] Contienen número de orden
- [ ] Contienen total pagado
- [ ] Contienen datos del cliente

---

## Testing en Staging

### Desplegar
- [ ] Código mergeado a main
- [ ] Despliegue completado (Vercel/Netlify)
- [ ] Variables de entorno configuradas en hosting
- [ ] No errores en build

### Crear Webhook en Stripe (Staging)
- [ ] URL: https://staging.fashionstore.com/api/stripe/webhook
- [ ] Signing secret agregado a env

### Test End-to-End
1. [ ] Ir a https://staging.fashionstore.com/carrito
2. [ ] Agregar productos al carrito
3. [ ] Completar checkout
4. [ ] Usar tarjeta test: 4242 4242 4242 4242
5. [ ] Completar pago
6. [ ] Ver en Supabase:
   - [ ] Orden creada
   - [ ] Estado = "Pagado"
   - [ ] Items en la orden
   - [ ] Email enviado
7. [ ] Verificar Stripe Dashboard:
   - [ ] Event en webhook log
   - [ ] Webhook marked as delivered

---

## Pre-Producción

### Code Review
- [ ] Código review completado
- [ ] No TODOs pendientes
- [ ] Error handling robusto
- [ ] Logging adecuado

### Security Review
- [ ] Firma de Stripe validada siempre
- [ ] Service Role Key NUNCA en cliente
- [ ] Anti-fraude implementado
- [ ] RLS policies activas
- [ ] No SQL injection posible
- [ ] Validaciones en servidor y cliente

### Performance
- [ ] Webhook responde en < 5 segundos
- [ ] Database queries optimizadas
- [ ] Logs no demasiado verbosos
- [ ] Email service es async

### Monitoring
- [ ] Logs configurados (Vercel/Netlify)
- [ ] Alertas configuradas si webhook falla
- [ ] Admin email alertas si hay disputas
- [ ] Error tracking (Sentry/Rollbar) configurado

---

## Producción

### Pre-Deploy
- [ ] Crear webhook en Stripe (modo live)
- [ ] URL: https://fashionstore.com/api/stripe/webhook
- [ ] Copiar signing secret a env
- [ ] Variables de entorno finales configuradas
- [ ] Database migrations ejecutadas
- [ ] Backup de BD antes de deploy

### Deploy
- [ ] Código desplegado
- [ ] Variables de entorno activadas
- [ ] SSL/HTTPS funciona
- [ ] Webhook accesible desde Stripe

### Post-Deploy
- [ ] Webhook activo en Stripe Dashboard
- [ ] Test payment con tarjeta real (Stripe test mode)
- [ ] Orden creada en BD
- [ ] Estado = "Pagado"
- [ ] Email enviado a cliente
- [ ] Email enviado a admin
- [ ] Logs limpios (sin errores)

---

## Monitoreo Continuo

### Diario
- [ ] Revisar logs de webhook
- [ ] Verificar órdenes en BD (estado correcto)
- [ ] Revisar inbox admin (sin rebotes)
- [ ] Verificar Stripe Dashboard (no disputes no resueltas)

### Semanal
- [ ] Revisar métricas de pagos
- [ ] Revisar tasa de éxito de webhooks
- [ ] Revisar emails entregados vs rebotados
- [ ] Revisar disputes abiertas

### Mensual
- [ ] Revisar logs de errores
- [ ] Revisar performance
- [ ] Actualizar documentación
- [ ] Prueba de recuperación de desastres

---

## Solución de Problemas Rápida

### Webhook no recibe eventos
**Solución**:
1. Verificar URL en Stripe Dashboard es correcta
2. Verificar HTTPS funciona: `curl -I https://fashionstore.com/api/stripe/webhook`
3. Revisar logs del servidor
4. Verificar firewall no bloquea Stripe IPs

### Pago completado pero orden no se actualiza
**Solución**:
1. Verificar `order_id` está en metadata de sesión
2. Verificar order existe en BD
3. Revisar logs del webhook
4. Verificar Supabase RLS policies

### Emails no enviados
**Solución**:
1. Verificar SMTP credentials
2. Verificar ADMIN_EMAIL es correcto
3. Revisar logs de emailService
4. Revisar spam/junk del destinatario

### Monto no coincide error
**Solución**:
1. Verificar cliente pagó el monto correcto
2. Verificar descuentos aplicados correctamente
3. Verificar impuestos calculados correctamente
4. Revisar logs de webhook

---

**Última actualización**: 19 de Enero de 2026
**Estado**: 🟢 LISTO PARA PRODUCCIÓN
