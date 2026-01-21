# 📚 DOCUMENTACIÓN FINAL - CONFIGURACIÓN DE WEBHOOK

## ✅ ESTADO DEL PROYECTO

Todas las variables necesarias **YA ESTÁN CONFIGURADAS** en Coolify. 

El código está actualizado y deployado.

**LO ÚNICO QUE FALTA:** Crear el Webhook en Stripe y copiar su Signing Secret a Coolify.

---

## 🚀 TUTORIAL: CREAR WEBHOOK (20 MINUTOS)

### PASO 1: Abre Stripe Dashboard
```
URL: https://dashboard.stripe.com/
Login: Usa tu cuenta
```

### PASO 2: Navega a Webhooks
```
Menu izquierdo:
  Developers 
    → Webhooks
      → Click "Add endpoint"
```

### PASO 3: Configura el Endpoint
```
Endpoint URL:
https://fashionstorerbv3.victoriafp.online/api/stripe/webhook

Events: checkout.session.completed
```

### PASO 4: Copia el Signing Secret
```
Stripe te mostrará un valor tipo:
whsec_test_51SrGYbGfkZLMq5NoMxY9Z...

Cópialo completo (incluye whsec_ al inicio)
```

### PASO 5: Actualiza Coolify
```
1. Abre Coolify
2. FashionStore → Settings → Environment Variables
3. Busca: STRIPE_WEBHOOK_SECRET
4. Pega el valor copiado de Stripe
5. Click Deploy
6. Espera 3 minutos a que termine
```

### PASO 6: Verifica
```
Abre: https://fashionstorerbv3.victoriafp.online/api/health
Deberías ver: "status": "healthy"
```

---

## ✅ PRUEBAS FINALES

### Test 1: Email
```
https://fashionstorerbv3.victoriafp.online/api/test/send-email?to=tu-email@gmail.com
Resultado: Deberías recibir un email en 15 segundos
```

### Test 2: Pago Completo
```
1. Ve a https://fashionstorerbv3.victoriafp.online/
2. Añade producto al carrito
3. Checkout
4. Tarjeta: 4242 4242 4242 4242
5. Mes/Año: 12/25
6. CVC: 123
7. Completa pago

Resultado: Recibirás email de confirmación en 15 segundos
```

---

## 📋 RESUMEN DE LO QUE SE HIZO

### ✅ Código Actualizado
- `src/lib/supabase.ts` - Mejor logging
- `src/lib/emailService.ts` - Lee variables de entorno correctamente
- `src/pages/index.astro` - Muestra errores
- `src/pages/api/stripe/create-session.ts` - URLs correctas
- `src/pages/api/health.ts` - Endpoint de diagnóstico

### ✅ Configurado en Coolify
- Supabase (URL y claves)
- Stripe (clave secreta)
- Email (SMTP)
- Variables de aplicación

### ✅ Git
- Todos los cambios pusheados a GitHub

---

## 🔍 VARIABLES EN COOLIFY

Todas presentes y correctas. Necesitas cambiar SÓLO:

```
STRIPE_WEBHOOK_SECRET: [cambiar a whsec_... de Stripe]
```

---

## 🎯 PRÓXIMOS PASOS

1. Crea webhook en Stripe (20 minutos)
2. Copia signing secret
3. Actualiza STRIPE_WEBHOOK_SECRET en Coolify
4. Redeploy
5. Verifica con /api/health
6. Prueba pagos

---

**¡Todo está listo! Solo necesitas el webhook de Stripe.**
