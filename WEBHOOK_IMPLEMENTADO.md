# ✅ WEBHOOK DE STRIPE - IMPLEMENTADO

## Resumen Ejecutivo

El webhook de Stripe ha sido **completamente implementado** y listo para producción.

**Ubicación**: `/src/pages/api/stripe/webhook.ts`
**Estado**: 🟢 FUNCIONAL
**Seguridad**: ✅ Validación de firma + Anti-fraude

---

## ¿Qué hace el Webhook?

Cuando un cliente completa el pago en Stripe, el webhook:

1. ✅ **Valida la firma** (verifica que sea de Stripe)
2. ✅ **Obtiene los datos del pedido** de la BD
3. ✅ **Valida el monto** (anti-fraude)
4. ✅ **Marca pedido como pagado**
5. ✅ **Limpia el carrito** del cliente
6. ✅ **Envía email de confirmación** al cliente
7. ✅ **Notifica al admin** (raafaablanco@gmail.com)
8. ✅ **Responde a Stripe** con 200 OK

---

## Seguridad Implementada

### 1. Validación de Firma
```typescript
event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
```
- Verifica que el webhook viene de Stripe
- Rechaza si la firma es inválida

### 2. Anti-Fraude
```typescript
if (order.total !== sessionTotalEUR) {
  // NO actualizar pedido
  return;
}
```
- Compara monto en BD vs monto pagado en Stripe
- Rechaza si no coinciden (posible fraude)

### 3. Validación de Datos
- Verifica que order_id existe
- Verifica que pedido existe en BD
- Verifica que usuario está autenticado (si aplica)

---

## Eventos Procesados

### ✅ checkout.session.completed
**Cuando**: Cliente completa el pago
**Acción**: Actualizar pedido a "Pagado" + enviar emails

### ✅ charge.dispute.created
**Cuando**: Cliente abre una disputa
**Acción**: Registrar disputa + notificar admin

### ✅ charge.failed
**Cuando**: El pago falla
**Acción**: Revertir pedido a "Pendiente"

---

## Emails Automáticos

El webhook dispara 2 emails:

### 1. Email al Cliente
- **Asunto**: "Confirmación de pedido"
- **Contenido**:
  - Número de pedido
  - Lista de productos
  - Totales (subtotal, descuento, impuestos, envío)
  - Dirección de envío
  - Links útiles

### 2. Email al Admin
- **Destinatario**: raafaablanco@gmail.com
- **Asunto**: "Nuevo pedido: FS-20260119-1234"
- **Contenido**:
  - Datos del cliente
  - Total pagado
  - Cantidad de productos
  - Link a admin panel

---

## Testing

### Local (con Stripe CLI)
```bash
# Terminal 1: Escuchar webhooks
stripe listen --forward-to localhost:4321/api/stripe/webhook

# Terminal 2: Trigger evento
stripe trigger checkout.session.completed

# Verificar:
# - Logs en terminal
# - Orden actualizada en Supabase
# - Emails enviados
```

### Producción (Stripe Dashboard)
1. Crear test payment con tarjeta `4242 4242 4242 4242`
2. Completar checkout
3. Verificar:
   - Orden estado = "Pagado" en BD
   - Email en bandeja de entrada

---

## Configuración Requerida

Antes de usar en producción:

```env
# .env.local
STRIPE_SECRET_KEY=sk_live_xxxxx           # Secret key
STRIPE_WEBHOOK_SECRET=whsec_xxxxx         # Webhook signing secret
ADMIN_EMAIL=raafaablanco@gmail.com        # Admin email
```

**Importante**: El `STRIPE_WEBHOOK_SECRET` debe ser configurado en Stripe Dashboard.

Ver: [STRIPE_WEBHOOK_SETUP.md](STRIPE_WEBHOOK_SETUP.md)

---

## Código Principal

```typescript
// Validar firma
event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

// Procesar evento
switch (event.type) {
  case 'checkout.session.completed':
    await handleCheckoutCompleted(session)
    break
  case 'charge.dispute.created':
    await handleChargeDispute(dispute)
    break
  case 'charge.failed':
    await handleChargeFailed(charge)
    break
}

// Responder a Stripe
return new Response(JSON.stringify({ received: true }), { status: 200 })
```

---

## Logs y Debugging

El webhook imprime logs detallados:

```
[WEBHOOK] === Procesando Checkout Completado ===
Session ID: cs_test_xxxxx
Order ID: xxxxxxxx-xxxx-xxxx
Pedido encontrado: FS-20260119-1234
✅ Pedido actualizado: FS-20260119-1234 -> Estado: PAGADO
Items en pedido: 2
✅ Carrito limpiado para usuario: xxxxxxxx
✅ Email de confirmación enviado a: cliente@example.com
✅ Notificación enviada al administrador
[WEBHOOK] === ✅ COMPLETADO: FS-20260119-1234 ===
```

---

## Próximos Pasos

1. **Crear página `/checkout/success`**
   - Mostrar confirmación de pago
   - Mostrar número de pedido
   - Link a historial de órdenes

2. **Crear página `/checkout/cancel`**
   - Mostrar que pago fue cancelado
   - Opción para intentar nuevamente

3. **Crear perfil de usuario (`/cuenta`)**
   - Ver historial de órdenes
   - Ver estado de cada pedido
   - Solicitar devolución

---

## Status

✅ **WEBHOOK**: Completamente funcional
⏳ **Páginas de éxito/error**: Pendiente
⏳ **Perfil de usuario**: Pendiente
⏳ **Sistema de devoluciones**: Pendiente

---

**Implementado**: 19 de Enero de 2026
**Responsable**: Ingeniero Senior Full-Stack
**Ambiente**: Producción
