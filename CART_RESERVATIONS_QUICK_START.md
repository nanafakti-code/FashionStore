# 🚀 Guía Rápida de Instalación - Sistema de Reservas

## 5 Minutos para Implementar

### Paso 1: Copiar SQL (1 minuto)

```bash
# 1. Ir a Supabase Dashboard
# 2. SQL Editor → New Query
# 3. Copiar TODO el contenido de:
#    supabase/CART_RESERVATIONS.sql
# 4. Pegar y ejecutar
# 5. Esperar a que termine (sin errores)

✅ Tabla y funciones creadas
```

### Paso 2: Copiar Archivos TypeScript (1 minuto)

Los archivos ya están en el repositorio:

```
✅ src/pages/api/reservas.ts
✅ src/pages/api/cleanup-expired-reservations.ts
✅ src/lib/cart-reservation-client.ts
```

**No requiere copiar nada más.**

### Paso 3: Configurar Variables de Entorno (1 minuto)

```bash
# Abrir o crear .env.local
CRON_SECRET=eyJ0eXAiOiJKV1QiLCJhbGc... # Token secreto (usar openssl rand -base64 32)
```

### Paso 4: Configurar Limpieza Automática (1-2 minutos)

#### Opción A: EasyCron (Más fácil)

1. Ir a https://www.easycron.com/
2. Sign up (gratis)
3. **Add Cron Job**
   - URL: `https://tu-dominio.com/api/cleanup-expired-reservations`
   - Method: POST
   - Headers: `Authorization: Bearer ${CRON_SECRET}`
   - Cron Expression: `*/1 * * * *` (cada minuto)
   - Save ✅

#### Opción B: GitHub Actions

Crear `.github/workflows/cleanup.yml`:

```yaml
name: Cleanup Expired Reservations

on:
  schedule:
    - cron: '*/1 * * * *'

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Trigger cleanup
        run: |
          curl -X POST ${{ secrets.API_URL }}/api/cleanup-expired-reservations \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

Settings → Secrets → Agregar:
- `API_URL`: `https://tu-dominio.com`
- `CRON_SECRET`: Tu token secreto

### Paso 5: Integrar en Frontend (Variable)

Ejemplo básico en Componente de Producto:

```typescript
import { reservationClient } from '@/lib/cart-reservation-client';

async function handleAddToCart(productId, quantity) {
  const success = await reservationClient.createReservation(productId, quantity);
  
  if (success) {
    alert('✅ Reservado por 1 minuto');
  } else {
    alert('❌ Stock insuficiente');
  }
}
```

---

## ✅ Verificación Rápida

### Test 1: ¿SQL ejecutado correctamente?

```sql
-- Ejecutar en Supabase SQL Editor
SELECT COUNT(*) FROM cart_reservations;
-- Resultado: 0 (tabla vacía, pero existe)
```

### Test 2: ¿APIs funcionan?

```bash
# Terminal
curl -X GET http://localhost:3000/api/reservas \
  -H "Authorization: Bearer <token-usuario>"
# Debe retornar: {"success": true, "reservas": []}
```

### Test 3: ¿Limpieza funciona?

```bash
# Terminal con token CRON_SECRET
curl -X GET http://localhost:3000/api/cleanup-expired-reservations \
  -H "Authorization: Bearer <CRON_SECRET>"
# Debe retornar: {"success": true, "expired_reservations_count": 0}
```

---

## 🧪 Test Completo (5 minutos)

### Parte 1: Crear una reserva

```typescript
import { reservationClient } from '@/lib/cart-reservation-client';

// Obtener producto de prueba (reemplazar con real)
const testProductId = 'product-uuid-aqui';

// Crear reserva
const success = await reservationClient.createReservation(testProductId, 1);

console.log(success); // true o false
```

**Esperado:** `true` (reserva creada)

### Parte 2: Verificar que stock bajó

```sql
-- Ejecutar en Supabase
SELECT 
  stock_total,
  (SELECT SUM(quantity) FROM cart_reservations 
   WHERE product_id = 'product-uuid-aqui') as reserved
FROM productos
WHERE id = 'product-uuid-aqui';
```

**Esperado:** 
- `stock_total`: Número actual
- `reserved`: 1 (o cantidad que reservaste)

### Parte 3: Obtener reservas

```typescript
const reservations = await reservationClient.getReservations();
console.log(reservations);
```

**Esperado:** Array con tu reserva

### Parte 4: Esperar expiración

```typescript
// Esperar 65 segundos...
// (O ejecutar limpieza manual)

const cleanupSuccess = await reservationClient.cleanupExpiredReservations('CRON_SECRET');
console.log(cleanupSuccess); // true
```

### Parte 5: Verificar stock restaurado

```sql
-- Ejecutar en Supabase
SELECT 
  stock_total,
  (SELECT COUNT(*) FROM cart_reservations 
   WHERE product_id = 'product-uuid-aqui') as reservas_activas
FROM productos
WHERE id = 'product-uuid-aqui';
```

**Esperado:**
- `stock_total`: Volvió al valor original
- `reservas_activas`: 0

---

## 🐛 Errores Comunes y Soluciones

### Error: "PGRST116 - user_id not defined"

**Causa:** SQL se ejecutó pero funciones no están importando auth.uid()

**Solución:** 
```sql
-- Verificar que estas líneas existen en CART_RESERVATIONS.sql
user_id = auth.uid()
```

### Error: "No such table: cart_reservations"

**Causa:** SQL no se ejecutó correctamente

**Solución:**
```bash
# En Supabase, ir a Tables y verificar que existe
# Si no existe, copiar SQL de CART_RESERVATIONS.sql nuevamente
```

### Error: 401 Unauthorized en API

**Causa:** Usuario no autenticado

**Solución:**
```typescript
// Verificar que tienes sesión iniciada
const user = await getCurrentUser();
if (!user) {
  // Redirigir a login
}
```

### Error: "Stock insuficiente" pero hay stock

**Causa:** Stock ya fue reservado por otro usuario

**Solución:**
```bash
# Esperar 60 segundos a que expire la otra reserva
# O aumentar stock del producto
```

---

## 📊 Monitoreo Básico

### Ver todas las reservas activas

```sql
SELECT 
  user_id,
  product_id,
  quantity,
  EXTRACT(EPOCH FROM (expires_at - NOW())) as segundos_restantes
FROM cart_reservations
WHERE expires_at > NOW();
```

### Ver cúantos productos hay reservados

```sql
SELECT COUNT(DISTINCT product_id) as productos_reservados
FROM cart_reservations
WHERE expires_at > NOW();
```

### Ver cuanto stock está "congelado" por reservas

```sql
SELECT 
  p.id,
  p.nombre,
  p.stock_total,
  COALESCE(SUM(cr.quantity), 0) as cantidad_reservada,
  p.stock_total - COALESCE(SUM(cr.quantity), 0) as disponible_ahora
FROM productos p
LEFT JOIN cart_reservations cr ON p.id = cr.product_id AND cr.expires_at > NOW()
GROUP BY p.id
HAVING COALESCE(SUM(cr.quantity), 0) > 0;
```

---

## 🔧 Ajustes Comunes

### Cambiar duración de 1 minuto a otro valor

```sql
-- En CART_RESERVATIONS.sql, reemplazar:
expires_at = NOW() + INTERVAL '1 minute'

-- Por:
expires_at = NOW() + INTERVAL '5 minutes'   -- 5 minutos
expires_at = NOW() + INTERVAL '10 minutes'  -- 10 minutos
expires_at = NOW() + INTERVAL '1 hour'      -- 1 hora
```

### Ejecutar limpieza manualmente en cualquier momento

```typescript
// Frontend
await reservationClient.cleanupExpiredReservations('CRON_SECRET');

// O SQL directo
SELECT * FROM cleanup_expired_reservations();
```

### Eliminar reserva específica

```typescript
// Frontend
await reservationClient.deleteReservation('product-uuid');

// O SQL directo
DELETE FROM cart_reservations 
WHERE product_id = 'product-uuid' AND user_id = 'user-uuid';
```

---

## 📱 Integración en Componentes

### Botón "Añadir al Carrito" con Reserva

```typescript
import { reservationClient } from '@/lib/cart-reservation-client';
import { useState } from 'react';

export function AddToCartButton({ productId, productName }) {
  const [loading, setLoading] = useState(false);
  const [reserved, setReserved] = useState(false);

  const handleAddToCart = async () => {
    setLoading(true);
    try {
      const success = await reservationClient.createReservation(productId, 1);
      
      if (success) {
        setReserved(true);
        setTimeout(() => setReserved(false), 60000); // 60 segundos
      } else {
        alert('Stock insuficiente');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleAddToCart} 
      disabled={loading || reserved}
      className={reserved ? 'bg-green-500' : 'bg-blue-500'}
    >
      {reserved ? '✅ Reservado' : loading ? '...' : 'Añadir al Carrito'}
    </button>
  );
}
```

### Mostrar Contador de Tiempo

```typescript
import { reservationClient } from '@/lib/cart-reservation-client';
import { useEffect, useState } from 'react';

export function ReservationTimer({ productId }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(async () => {
      const remaining = await reservationClient.getReservationTimeRemaining(productId);
      setSeconds(remaining > 0 ? remaining : 0);
    }, 1000);

    return () => clearInterval(interval);
  }, [productId]);

  if (seconds <= 0) return null;

  return (
    <div className="text-red-600 font-bold">
      ⏱️ Expira en {seconds}s
    </div>
  );
}
```

---

## 🚨 Checklist Final

- [ ] SQL ejecutado en Supabase
- [ ] Variables de entorno configuradas
- [ ] Limpieza automática configurada (EasyCron o GitHub Actions)
- [ ] Test SQL exitoso (tabla existe)
- [ ] Test API GET exitoso (retorna JSON)
- [ ] Test creación de reserva exitoso
- [ ] Stock bajó después de reservar
- [ ] Stock se restauró después de expirar
- [ ] Frontend integrado (botón + timer)
- [ ] Test E2E completo funcionando

---

## 📞 Soporte Rápido

**¿SQL falla?**
→ Verificar que estás en Supabase, no en psql local

**¿API devuelve 401?**
→ Verificar que tienes token de autenticación válido

**¿Stock no se restaura?**
→ Verificar que cron job se ejecuta (ver logs en EasyCron)

**¿Componentes no se cargan?**
→ Verificar imports: `from '@/lib/cart-reservation-client'`

---

## ✨ ¡Listo!

Con estos pasos tu sistema está **100% funcional** en **~5 minutos**.

**Siguiente paso:** Integra los ejemplos en tus componentes frontend y ¡disfruta de un carrito sin sobreventa! 🎉
