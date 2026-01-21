# ✅ CHECKLIST INTERACTIVO: COMPLETAR SETUP

## Antes de Empezar
- [ ] Tienes acceso a https://dashboard.stripe.com (admin de la cuenta)
- [ ] Tienes acceso a Coolify (contraseña guardada)
- [ ] Tienes 20 minutos disponibles sin interrupciones
- [ ] Lees SOLO_3_PASOS.md o GUIA_VISUAL_WEBHOOK.md

---

## FASE 1: CREAR WEBHOOK EN STRIPE

### Entrada a Stripe
- [ ] Abre https://dashboard.stripe.com
- [ ] ¿Te pidió login? Login con tu cuenta
- [ ] ¿Ves el dashboard? ¡Bien!

### Navegar a Webhooks
- [ ] Menu izquierdo → Busca "Developers" o "Development"
- [ ] Click "Developers"
- [ ] Submenu → Click "Webhooks"
- [ ] ¿Ves "Add endpoint"? ✓

### Crear Endpoint
- [ ] Click "Add endpoint"
- [ ] Copiar esto en "Endpoint URL":
  ```
  https://fashionstorerbv3.victoriafp.online/api/stripe/webhook
  ```
  - [ ] Pegado sin espacios al principio/final
  - [ ] Incluye `/api/stripe/webhook` al final

- [ ] Click "Next" o "Search for events"

### Seleccionar Evento
- [ ] Busca por: `checkout.session.completed`
- [ ] ☑ Marca el checkbox de `checkout.session.completed`
- [ ] ¿Ves que está marcado? Sí ✓
- [ ] Click "Add endpoint" o "Create webhook"

### Copiar Signing Secret
- [ ] Ve a la pantalla de "Endpoint created successfully"
- [ ] Ves "Signing secret:" con un campo tipo `whsec_test_...`
- [ ] Si ves 👁, clickea para mostrar
- [ ] Click botón "Copy" o selecciona+copia manualmente
- [ ] Pega el valor en un Notepad temporal (importante no perderlo)
- [ ] Formato esperado: `whsec_test_[muchos_caracteres]`

**Tu Signing Secret:**
```
[PÉGALO AQUÍ PARA REFERENCIA]
___________________________________________
```

---

## FASE 2: ACTUALIZAR COOLIFY

### Abrir Coolify
- [ ] Abre https://coolify.io (o tu Coolify)
- [ ] ¿Te pidió login? Login
- [ ] ¿Ves el dashboard? ✓

### Navegar a FashionStore
- [ ] Busca "FashionStore" en Projects
- [ ] Click para abrirlo
- [ ] Tab/Menú → Settings
- [ ] Opción → Environment Variables

### Encontrar Variable
- [ ] En Environment Variables, busca: `STRIPE_WEBHOOK_SECRET`
- [ ] ¿La encontraste? El valor actual es `whsec_test_local_placeholder`
- [ ] Click en el campo de valor para editar

### Reemplazar Valor
- [ ] Selecciona todo lo que hay (Ctrl+A)
- [ ] Bórralo
- [ ] Pega el signing secret de Stripe (Ctrl+V)
- [ ] Resultado esperado: `whsec_test_[caracteres]` (sin espacios)

### Guardar y Desplegar
- [ ] Click "Save" o "Deploy"
- [ ] Si clickeaste "Save", ahora click "Deploy"
- [ ] **ESPERA 2-3 MINUTOS** hasta que diga "Deployed" ✓

**Status del Redeploy:**
```
Hora inicio: ________________
Hora fin: ________________
¿Muestra "Deployed"? SÍ ☐  NO ☐
```

---

## FASE 3: VERIFICAR QUE FUNCIONA

### Test 1: Health Check
- [ ] Abre en el navegador:
  ```
  https://fashionstorerbv3.victoriafp.online/api/health
  ```
  
- [ ] ¿Ves una respuesta JSON? SÍ ☐  NO ☐
- [ ] ¿Dice `"status": "healthy"`? SÍ ☐  NO ☐
- [ ] ¿Dice `"supabase": { "configured": true }`? SÍ ☐  NO ☐

**Si alguno es NO:** 
El redeploy probablemente no terminó. Espera otros 2 minutos y refresh.

### Test 2: Email Test
- [ ] Abre en el navegador:
  ```
  https://fashionstorerbv3.victoriafp.online/api/test/send-email?to=TU-EMAIL@gmail.com
  ```
  (reemplaza TU-EMAIL con tu correo real)

- [ ] ¿Ves un JSON con "success": true? SÍ ☐  NO ☐
- [ ] ¿Recibiste un email en TU-EMAIL? Espera 15 segundos SÍ ☐  NO ☐

**Si ambos son SÍ:** SMTP está correctamente configurado ✓

### Test 3: Pago de Prueba (Stripe Test Card)
- [ ] Abre https://fashionstorerbv3.victoriafp.online
- [ ] Añade un producto al carrito
- [ ] Click "Checkout"

**En el formulario de Stripe Checkout:**
- [ ] Email: `test@example.com` (o cualquiera)
- [ ] Tarjeta:
  ```
  Número: 4242 4242 4242 4242
  Mes/Año: 12/25 (o más adelante)
  CVC: 123
  Nombre: Test User
  ```

- [ ] Click "Pay"
- [ ] ¿Te redirige a una página de éxito (success page)? SÍ ☐  NO ☐
- [ ] ¿Dice algo como "Order successful" o "gracias"? SÍ ☐  NO ☐

### Test 4: Email de Confirmación
- [ ] Después de completar el pago (del test anterior)
- [ ] Abre tu email que usaste en la compra
- [ ] **Espera 20 segundos**
- [ ] ¿Recibiste un email de confirmación de pedido? SÍ ☐  NO ☐

### Test 5: Webhook en Stripe
- [ ] Vuelve a https://dashboard.stripe.com
- [ ] Developers → Webhooks
- [ ] Click en tu webhook (el que creaste)
- [ ] Tab "Events"
- [ ] ¿Ves `checkout.session.completed`? SÍ ☐  NO ☐
- [ ] ¿Dice "Responded" con status `200`? SÍ ☐  NO ☐

**Si Status es 200:** El webhook está funcionando perfecto ✓
**Si Status es 401/403:** El signing secret está mal, repite FASE 2
**Si Status es 500:** Hay error en la app, checa `/api/health`

---

## RESUMEN FINAL

### Todos los Tests Pasaron? 
```
☐ Health Check → "healthy"
☐ Email Test → recibiste email
☐ Pago Test → página de éxito
☐ Email Confirmación → recibiste email
☐ Webhook → Status 200 en Stripe
```

### Si TODO es ☑:
**¡🎉 CONFIGURACIÓN COMPLETADA! 🎉**

Tu FashionStore está 100% funcional:
- ✓ Productos se cargan
- ✓ Carrito funciona
- ✓ Pagos se procesan
- ✓ Confirmación por email funciona
- ✓ Webhook de Stripe está activo

**Siguiente (Opcional, después de funcionar todo):**
- [ ] Cambiar modo de prueba a Producción (claves reales de Stripe)
- [ ] Cambiar email de SMTP a tu propio servidor
- [ ] Configurar webhook para actualizar stock

---

## ¿ALGO FALLÓ?

### ❌ Health Check falla
```
Checklist:
[ ] ¿El redeploy en Coolify dice "Deployed"?
[ ] ¿Pasaron al menos 3 minutos desde que clickeaste Deploy?
[ ] ¿Hiciste F5 (refresh) en el navegador?
[ ] ¿La URL es exactamente: https://fashionstorerbv3.victoriafp.online/api/health ?

Acción: Espera 5 minutos más y vuelve a intentar
```

### ❌ Email Test falla
```
Checklist:
[ ] ¿Pusiste bien el email en el parámetro ?to=
[ ] ¿El email es real (no test@test.com)?
[ ] ¿El redeploy finalizó correctamente?

Acción: Abre /api/health y verifica que muestre credenciales SMTP
```

### ❌ Pago no completa
```
Checklist:
[ ] ¿Usaste exactamente: 4242 4242 4242 4242?
[ ] ¿La fecha es futura (12/25)?
[ ] ¿El CVC es 123?
[ ] ¿Esperaste a que cargue (pueden ser 5 segundos)?

Acción: Abre DevTools (F12) → Network → busca "create-session" → mira el error
```

### ❌ Email de confirmación no llega
```
Checklist:
[ ] ¿Completaste el pago hasta la página de éxito?
[ ] ¿Esperaste al menos 30 segundos?
[ ] ¿Lo buscaste en Spam/Junk?
[ ] ¿El Status del webhook en Stripe es 200?

Acción: Si el webhook dice 200, es problema del email. Si no, es del webhook.
```

### ❌ Webhook Status no es 200
```
Checklist:
[ ] Si Status = 401/403: El STRIPE_WEBHOOK_SECRET está mal o corrupto
  → Solución: Copia de nuevo de Stripe, con CUIDADO
[ ] Si Status = 500: Hay error en la app
  → Solución: Abre /api/health y verifica
[ ] Si Status = Responded (pero no 200): Mira el error específico

Acción: Re-haz FASE 2 con el signing secret correcto
```

---

## PREGUNTAS FRECUENTES

**P: ¿Puedo usar otra tarjeta de prueba?**
R: Stripe proporciona otras, pero 4242 4242 4242 4242 es la más confiable

**P: ¿Cuánto tardan los emails?**
R: Normalmente 5-15 segundos. Si pasan 2 minutos, es problema de SMTP

**P: ¿Puedo usar una tarjeta real?**
R: NO, estamos en modo test de Stripe. Stripe rechazará tarjetas reales

**P: ¿Qué pasa después de esto?**
R: Puedes cambiar a modo Producción cuando todo funcione perfectamente

**P: ¿Y si olvido el signing secret?**
R: Puedes crear otro webhook o ir a Stripe → Webhooks → click en tu webhook → Signing secret → Reveal

---

## DOCUMENTOS DE REFERENCIA

Si necesitas más detalles:
- `SOLO_3_PASOS.md` - Resumen rápido
- `GUIA_VISUAL_WEBHOOK.md` - Guía paso a paso con instrucciones de dónde clickear
- `RESUMEN_TRABAJO_COMPLETADO.md` - Información técnica completa

---

**TIEMPO ESTIMADO: 20-30 minutos**

**DIFICULTAD: Muy Fácil (solo seguir pasos)**

**RIESGO: CERO (modo test, dinero no real)**

---

**¡Adelante! Puedes hacerlo. 💪**
