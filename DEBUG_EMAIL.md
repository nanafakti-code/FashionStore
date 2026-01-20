# DEBUG - PROBLEMA DE EMAILS NO RECIBIDOS

## Diagnosis del Problema

### 1. Verificación de Credenciales SMTP

**Ubicación:** `src/lib/emailService.ts` (líneas 12-16)

```typescript
const SMTP_HOST = 'smtp.gmail.com';
const SMTP_PORT = 587;
const SMTP_USER = import.meta.env.SMTP_USER || 'fashionstore@gmail.com';
const SMTP_PASS = import.meta.env.SMTP_PASS || 'qmec xtfw dsoq inbi';
const ADMIN_EMAIL = import.meta.env.ADMIN_EMAIL || 'admin@fashionstore.com';
```

**Problema potencial:**
- ❓ ¿La contraseña SMTP es válida?
- ❓ ¿El email SMTP está verificado en Gmail?
- ❓ ¿Las credenciales están en el archivo `.env`?

### 2. Flujo de Ejecución

**Proceso esperado:**
1. Usuario completa checkout en Stripe
2. Stripe envía webhook `checkout.session.completed` → `src/pages/api/stripe/webhook.ts`
3. Se valida la firma del webhook ✓
4. Se obtienen datos del pedido de BD ✓
5. Se actualiza estado a "Pagado" en BD ✓
6. Se llama `sendOrderConfirmationEmail()` → envía email al cliente ❌
7. Se llama `sendAdminNotificationEmail()` → envía email al admin ❌

### 3. Posibles Causas

#### A. SMTP no autenticado correctamente
- La contraseña puede estar expirada
- Gmail requiere "app password" (no la contraseña normal)
- La aplicación no tiene permisos para enviar emails

#### B. Variables de entorno no establecidas
- No hay valores en `.env` para `SMTP_USER`, `SMTP_PASS`, `ADMIN_EMAIL`
- Se usan valores por defecto que son inválidos

#### C. Email del admin es incorrecto
- `sendAdminNotificationEmail()` usa `'admin@fashionstore.com'` como defecto
- Este email probablemente no existe

#### D. Webhook no se está ejecutando
- El webhook podría no estar siendo llamado por Stripe
- Los logs del servidor no muestran que se procesó el evento

## Soluciones a Implementar

### ✓ Paso 1: Verificar `.env`
```bash
# Revisar qué variables de entorno están establecidas
cat .env | grep SMTP
cat .env | grep ADMIN
```

**Expected output:**
```
SMTP_USER=fashionstore@gmail.com
SMTP_PASS=<app-password-de-16-caracteres>
ADMIN_EMAIL=tu-email-admin@gmail.com
```

### ✓ Paso 2: Validar Credenciales Gmail

**Proceso:**
1. Ir a https://myaccount.google.com/
2. Activar autenticación de 2 factores
3. Generar "app password" en Settings → Security → App passwords
4. Usar esa contraseña en SMTP_PASS (16 caracteres, sin espacios)

### ✓ Paso 3: Registrar Logs Detallados

Agregar logs en:
- `sendEmail()` - antes de intentar enviar
- `sendOrderConfirmationEmail()` - cuando se llama
- `sendAdminNotificationEmail()` - cuando se llama
- Webhook - cuando recibe el evento

### ✓ Paso 4: Probar Manualmente

Crear endpoint de prueba para enviar email sin pasar por Stripe.

## Verificación Rápida

Para verificar si el problema es SMTP o lógica:
1. Ejecutar: `npm run build`
2. Ver si hay errores de compilación
3. Revisar console.logs en servidor (si está en dev)
4. Hacer un test order y revisar los logs
5. Buscar en los logs: `[EMAIL]` y `[WEBHOOK]`

