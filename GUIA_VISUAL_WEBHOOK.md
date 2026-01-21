# 🔐 GUÍA VISUAL: CREAR WEBHOOK EN STRIPE

## ¿Dónde estoy?
- Dashboard de Stripe
- URL: https://dashboard.stripe.com/

---

## PASO 1: Menu Developers

```
STRIPE DASHBOARD
├─ Developers  ← CLICK AQUÍ
│  ├─ API Keys
│  ├─ Webhooks ← LUEGO AQUÍ
│  └─ Logs
└─ [otros menus]
```

**Visual:**
```
En la parte IZQUIERDA del dashboard, hacia abajo verás:
┌─────────────────┐
│   Developers    │
└─────────────────┘
  │
  └─ Webhooks  ← CLICK AQUÍ
```

---

## PASO 2: Webhooks

Cuando clickees "Webhooks" verás:

```
┌──────────────────────────────┐
│ Webhooks                     │
├──────────────────────────────┤
│ Nombre    │ Status │ Eventos │
├──────────────────────────────┤
│ (vacío si es la primera)     │
└──────────────────────────────┘

         ┌─────────────────┐
         │ Add endpoint    │  ← CLICK AQUÍ
         └─────────────────┘
```

---

## PASO 3: Add Endpoint

Se abrirá una ventana:

```
┌──────────────────────────────┐
│ Create a webhook endpoint    │
├──────────────────────────────┤
│                              │
│ Endpoint URL:                │
│ ┌──────────────────────────┐ │
│ │ https://fashionstorerbv │ │
│ │ 3.victoriafp.online/api │ │
│ │ /stripe/webhook          │ │
│ └──────────────────────────┘ │
│                              │
│ [Next]  [Buscar eventos]     │
│                              │
└──────────────────────────────┘
```

**Copia y Pega:**
```
https://fashionstorerbv3.victoriafp.online/api/stripe/webhook
```

**IMPORTANTE:**
- Nada de espacios al principio o final
- Debe ser exactamente como arriba
- Incluye el `/api/stripe/webhook` al final

Click **Next** o **Search for events** (depende de la versión de Stripe)

---

## PASO 4: Seleccionar Evento

Verás una lista de eventos:

```
┌──────────────────────────────┐
│ Select which events to send  │
├──────────────────────────────┤
│                              │
│ Buscar: [input box]          │
│                              │
│ ☐ account.created           │
│ ☐ account.deleted           │
│ ☐ account.external_account  │
│ ... (muchos más)             │
│ ☑ checkout.session.completed │ ← ESTE
│ ... (más)                    │
│                              │
└──────────────────────────────┘
```

**¿QUÉ HACER?**

Opción 1 (fácil): Usa Buscar
- Busca por: `checkout.session.completed`
- Cuando aparezca, clickea el checkbox

Opción 2 (si no hay buscar):
- Desplázate hasta ver `checkout.session.completed`
- Marca el checkbox

**RESULTADO:**
```
☑ checkout.session.completed
```

Ahora click **Add endpoint** o **Create endpoint**

---

## PASO 5: Copia el Signing Secret

```
┌──────────────────────────────┐
│ Endpoint created successfully│
├──────────────────────────────┤
│ https://fashionstorerbv...   │
│                              │
│ Signing secret:              │
│ ┌──────────────────────────┐ │
│ │ whsec_test_XXXXXX...    │ │ ← AQUÍ ESTÁ
│ │ [👁 Mostrar]  [Copiar]   │ │
│ └──────────────────────────┘ │
│                              │
│ [Hecho]                      │
└──────────────────────────────┘
```

**¿QUÉ HACER?**

Si ves el botón **[Copiar]**:
1. Click **[Copiar]**
2. Listo, ya tienes en el portapapeles

Si ves **[👁 Mostrar]**:
1. Click el icono del ojo
2. Se mostrará el texto completo
3. Selecciona todo (Ctrl+A o Cmd+A)
4. Copia (Ctrl+C o Cmd+C)
5. Pega después en Coolify

**EL VALOR SERÁ ALGO COMO:**
```
whsec_test_51SrGYbGfkZLMq5NoMxY9Z8E5V6R7S2Q1
```

**IMPORTANTE:**
- Incluye `whsec_` al inicio
- Es una cadena larga de caracteres
- No pierdas nada por el medio

---

## PASO 6: IR A COOLIFY

Abre otra pestaña:

**URL:**
```
https://coolify.io
```

O si tu Coolify es local/self-hosted, usa tu URL.

---

## PASO 7: Abre FashionStore Settings

```
COOLIFY DASHBOARD
├─ Projects
│  └─ FashionStore
│     └─ [Abre]
│        └─ Settings ← CLICK AQUÍ
│           └─ Environment Variables ← LUEGO AQUÍ
```

---

## PASO 8: Encuentra STRIPE_WEBHOOK_SECRET

En Environment Variables verás una lista:

```
Nombre                          Valor
─────────────────────────────────────────
PUBLIC_SUPABASE_URL             https://...
PUBLIC_SUPABASE_ANON_KEY        eyJhbGc...
STRIPE_SECRET_KEY               sk_test...
STRIPE_WEBHOOK_SECRET           whsec_test_local_placeholder ← ESTA
SMTP_USER                       fashio...
SMTP_PASS                       [hidden]
... más ...
```

**Busca por:** `STRIPE_WEBHOOK_SECRET`

Haz click en el campo de valor para editarlo.

---

## PASO 9: Reemplaza el Valor

```
ANTES:
┌──────────────────────────────┐
│ whsec_test_local_placeholder │ ← BORRA ESTO
└──────────────────────────────┘

DESPUÉS:
┌──────────────────────────────┐
│ whsec_test_51SrGYbGfkZLMq5No │ ← PEGA ESTO (del paso anterior)
│ ...MxY9Z8E5V6R7S2Q1          │
└──────────────────────────────┘
```

**¿CÓMO HACERLO?**

1. Selecciona todo lo que hay en el campo (Ctrl+A)
2. Bórralo
3. Pega el valor que copiaste de Stripe (Ctrl+V)

---

## PASO 10: Guarda

```
En Coolify verás un botón:
┌─────────────────┐
│ Save Changes    │ ← CLICK AQUÍ
└─────────────────┘

O:

┌──────────────────┐
│ Deploy           │ ← O ESTO (hace redeploy automático)
└──────────────────┘
```

**IMPORTANTE:**
- Si clickeas Save, verás un botón Deploy que debes hacer después
- Si clickeas Deploy, se hace todo automático
- Espera a que diga "Deployed ✓" (2-3 minutos)

---

## PASO 11: Verifica

Espera **3 minutos** a que Coolify redeploye.

Luego abre:

```
https://fashionstorerbv3.victoriafp.online/api/health
```

Deberías ver:

```json
{
  "status": "healthy",
  "supabase": {
    "configured": true,
    "url": "https://spzvtjybxpaxpnpfxbqv.s...",
    "...": "..."
  }
}
```

Si ves `"status": "healthy"`, **¡LISTO!** 🎉

---

## VIDEO CHEAT SHEET

En caso de dudas, estos son los 3 valores CLAVE:

```
ENDPOINT URL (de Stripe):
https://fashionstorerbv3.victoriafp.online/api/stripe/webhook

EVENTO (en Stripe):
checkout.session.completed

SIGNING SECRET (copiar de Stripe a Coolify):
whsec_test_[mucho_caracteres_aqui]
```

---

## ¿PROBLEMAS?

Si algo no funciona:

### "No veo Webhooks en el menú"
- ¿Estás en https://dashboard.stripe.com ?
- ¿Has clickado "Developers"?
- Scroll down en el menu izquierdo

### "El endpoint URL es inválido"
- Copia EXACTAMENTE: `https://fashionstorerbv3.victoriafp.online/api/stripe/webhook`
- Sin espacios al principio/final
- Asegúrate de incluir `/api/stripe/webhook`

### "No encuentro checkout.session.completed"
- Usa la opción Buscar/Search
- Escribe: `checkout`
- Debería aparecer

### "El webhook secret no se copia"
- Clickea el icono del ojo primero para verlo
- Luego selecciona todo (Ctrl+A)
- Copia (Ctrl+C)
- Pega en Coolify (Ctrl+V)

### "El redeploy en Coolify no termina"
- Espera 5 minutos más
- Si sigue sin terminar, haz refresh de la página (F5)
- Verifica en la pestaña "Deployments" si hay algo en progreso

---

**¡Eso es todo! Esta es la guía visual completa para criar el webhook.**
