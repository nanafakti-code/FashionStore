# ❓ Preguntas Frecuentes (FAQ) - Sistema de Reservas

## General

### P: ¿Por qué un sistema de reservas de 1 minuto?
**R:** 
- Tiempo suficiente para completar el checkout (promedio: 30-45 segundos)
- Evita bloquear stock indefinidamente
- Balancea experiencia de usuario vs protección de stock
- Configurable: puedes cambiar a 5 minutos, 1 hora, etc.

### P: ¿Funciona con usuarios sin sesión?
**R:** 
No actualmente. El sistema usa `auth.uid()` que requiere autenticación.

**Solución si necesitas:** Crear tabla `guest_carts` con session_id en lugar de user_id:
```sql
CREATE TABLE guest_cart_reservations (
  id UUID PRIMARY KEY,
  session_id VARCHAR UNIQUE,  -- En lugar de user_id
  product_id UUID,
  quantity INT,
  expires_at TIMESTAMPTZ
);
```

### P: ¿Qué pasa si hay dos usuarios con el mismo producto?
**R:** 
Cada usuario puede tener su propia reserva del mismo producto. El constraint es `UNIQUE(user_id, product_id)`, así que:

```
Usuario A: reserva producto 123 (qty: 2)
Usuario B: puede reservar producto 123 (qty: 3)

PERO el mismo Usuario A NO puede tener 2 reservas de 123
(La segunda actualiza la primera)
```

---

## Funcionalidad

### P: ¿Puedo cambiar la duración de 1 minuto?
**R:** Sí, es configurable. Opciones:

**Opción 1: Cambiar en SQL (permanente)**
```sql
-- En CART_RESERVATIONS.sql:
expires_at = NOW() + INTERVAL '5 minutes'   -- 5 minutos
expires_at = NOW() + INTERVAL '30 minutes'  -- 30 minutos
expires_at = NOW() + INTERVAL '2 hours'     -- 2 horas
```

**Opción 2: Parámetro dinámico**
```sql
CREATE OR REPLACE FUNCTION create_cart_reservation(
  p_product_id UUID,
  p_quantity INT,
  p_duration_minutes INT DEFAULT 1  -- ← Parámetro
)
...
expires_at = NOW() + INTERVAL '1 minute' * p_duration_minutes
```

### P: ¿Qué pasa si el usuario no completa la compra?
**R:**
1. **Después de 60 segundos:** La reserva expira automáticamente
2. **cleanup_expired_reservations() ejecutado:** Stock se restaura
3. **Usuario ve:** Carrito vacío, puede volver a comprar

### P: ¿Se puede forzar expiración antes de 1 minuto?
**R:** Sí, eliminando la reserva manualmente:

```typescript
// Frontend
await reservationClient.deleteReservation('product-id');
// Stock se restaura inmediatamente
```

### P: ¿Múltiples productos en el carrito?
**R:** 
Cada producto tiene su propia reserva independiente:

```
Carrito:
  iPhone 13 Pro (qty: 1) → reserva_1 (expira en 60s)
  AirPods Pro (qty: 2)  → reserva_2 (expira en 60s)
  iPad Air (qty: 1)     → reserva_3 (expira en 60s)

Si expira reserva_1:
  iPhone se elimina del carrito, stock se restaura
  AirPods y iPad permanecen si siguen activas
```

---

## Stock y Disponibilidad

### P: ¿Cómo se calcula el stock disponible real?
**R:**
```
STOCK DISPONIBLE = stock_total - SUM(cantidad reservada)

Ejemplo:
- Producto: iPhone 13
- stock_total: 10
- Usuario A: 2 reservadas
- Usuario B: 3 reservadas
- DISPONIBLE AHORA: 10 - 2 - 3 = 5

Si Usuario C intenta reservar 6:
  5 disponible < 6 solicitado → ERROR "Stock insuficiente"
```

### P: ¿Qué pasa si se actualiza stock mientras hay reservas?
**R:**
Suponiendo que aumentas stock manualmente:
```
Antes: stock_total = 10, reservadas = 5, disponible = 5
Aumentas stock: stock_total = 15
Después: disponible = 15 - 5 = 10 ✓

Funciona correctamente porque las reservas se restan del total.
```

### P: ¿Cómo evita la sobreventa simultánea?
**R:**
Por 3 mecanismos:

1. **Constraint UNIQUE:** Un usuario solo puede reservar 1 vez por producto
2. **Transacciones ACID:** Verificación y actualización atómica
3. **Índices:** Evita race conditions en búsquedas

```sql
-- No es posible esto:
Usuario A intenta reservar 5
Usuario B intenta reservar 6
Simultáneamente (misma transacción)

→ PostgreSQL ejecuta una primero
→ Si falta stock, la segunda falla
```

---

## Base de Datos

### P: ¿Dónde se almacenan las reservas?
**R:** 
En tabla `cart_reservations` en Supabase (PostgreSQL):

```sql
CREATE TABLE cart_reservations (
  id UUID PRIMARY KEY,
  user_id UUID,
  product_id UUID,
  quantity INT,
  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id, product_id)
);
```

**No es lo mismo que:** `carrito` o `carrito_items`
- Tabla `carrito`: Sesión de compra del usuario
- Tabla `carrito_items`: Items en el carrito
- Tabla `cart_reservations`: NUEVA - Control de stock temporal

### P: ¿Se puede ver el historial de reservas?
**R:** 
Actualmente no hay auditoría. Opcionalmente puedes agregar:

```sql
CREATE TABLE cart_reservations_history (
  id UUID PRIMARY KEY,
  reservation_id UUID,
  action VARCHAR,  -- 'created', 'updated', 'expired', 'deleted'
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID,
  product_id UUID,
  quantity INT
);

-- Crear trigger para registrar cambios
CREATE TRIGGER log_reservations
AFTER INSERT OR UPDATE OR DELETE ON cart_reservations
FOR EACH ROW
EXECUTE FUNCTION log_reservation_change();
```

### P: ¿Cuánto espacio ocupa la tabla?
**R:**
Muy poco. Cada registro ≈ 100 bytes:

```
100 bytes/registro × 100,000 registros = 10 MB

Incluso 1 millón de registros = 100 MB
(con índices puede llegar a 200 MB)

La tabla se va limpiando automáticamente (expiran).
```

### P: ¿Necesito hacer backup de reservas?
**R:**
No es crítico porque:
1. Se expiran automáticamente
2. No es información de negocio permanente
3. Si se pierden, solo se pierde estado transitorio

Pero sí, Supabase hace backups automáticos.

---

## APIs y Backend

### P: ¿Qué pasa si la API falla?
**R:**
Hay dos casos:

**Caso 1: Stock fue deducido pero respuesta no llega**
```
Usuario hace POST /api/reservas
Stock: 10 → 8
Red muere antes de respuesta

Usuario no ve confirmación pero stock está reservado
Al refrescar o después de 60s, stock se restaura
```

**Caso 2: Reserva no se creó**
```
POST /api/reservas falla
Stock: 10 (no cambia)
Usuario puede intentar de nuevo
```

Ambos casos son seguros. No hay corrupción de datos.

### P: ¿Es RESTful el API?
**R:** Sí:

```
GET     /api/reservas              → Obtener
POST    /api/reservas              → Crear
PUT     /api/reservas              → Actualizar
DELETE  /api/reservas              → Eliminar
GET     /api/cleanup-expired-reservations → Ver estado
POST    /api/cleanup-expired-reservations → Ejecutar
```

### P: ¿Se pueden paginar reservas?
**R:** 
Actualmente devuelve todas. Opcionalmente agregar:

```typescript
// En /api/reservas GET
const { limit = 20, offset = 0 } = context.url.searchParams;

const reservations = await supabase
  .rpc('get_user_cart_reservations')
  .range(offset, offset + limit - 1);
```

---

## Limpieza Automática

### P: ¿Cuándo se ejecuta la limpieza?
**R:**
Cada 1 minuto (configurable):

```
EasyCron: */1 * * * * (cada minuto)
GitHub Actions: 0 * * * * (cada hora, ajustable)
Manual: Cuando llames a POST /cleanup
```

### P: ¿Qué pasa si falla el cron job?
**R:**
No es catastrófico. Opciones:

1. **Próximo ciclo:** Se ejecuta en 1 minuto
2. **Stock no se restaura YET:** Pero cuando se restaure, será correcto
3. **Usuario intenta comprar:** Ve error "Stock insuficiente" aunque debería estar disponible

**Solución:** Configurar alertas en EasyCron/GitHub Actions para que te notifique si falla.

### P: ¿Ejecutar limpieza cada 10 segundos?
**R:** 
No recomendado (demasiado overhead). Pero es posible:

```yaml
# GitHub Actions
on:
  schedule:
    - cron: '*/10 * * * * *'  # No es sintaxis cron estándar
    
# Alternativa: usar un job que se ejecute frecuentemente
# O usar servicio externo con limitación
```

Mejor: Limpiar al hacer operaciones del carrito.

### P: ¿Token CRON_SECRET es seguro?
**R:**
Sí. Es solo para validar que el request viene de tu servicio:

```typescript
// Validación
if (token !== CRON_SECRET) {
  return 401 Unauthorized
}
```

Buenas prácticas:
1. Generar token fuerte: `openssl rand -base64 32`
2. No compartirlo
3. No hacer commit en repo
4. Guardar en variables de entorno
5. Rotar ocasionalmente

---

## Frontend y UX

### P: ¿Cómo mostrar el timer de expiración?
**R:**
```typescript
import { useEffect, useState } from 'react';
import { reservationClient } from '@/lib/cart-reservation-client';

function ReservationTimer({ productId }) {
  const [seconds, setSeconds] = useState(60);

  useEffect(() => {
    const interval = setInterval(async () => {
      const remaining = await reservationClient.getReservationTimeRemaining(productId);
      setSeconds(remaining > 0 ? remaining : 0);
    }, 1000);

    return () => clearInterval(interval);
  }, [productId]);

  return (
    <div className={seconds <= 10 ? 'text-red-600' : 'text-green-600'}>
      {seconds > 0 ? `Expira en ${seconds}s` : '⚠️ Reserva expirada'}
    </div>
  );
}
```

### P: ¿Qué hacer si la reserva expira mientras el usuario está en checkout?
**R:**
Verificar antes de procesar pago:

```typescript
async function handleCheckout(cartItems) {
  // 1. Verificar que TODAS las reservas siguen activas
  const reservations = await reservationClient.getReservations();
  
  for (const item of cartItems) {
    const reservation = reservations.find(r => r.product_id === item.id);
    
    if (!reservation || reservation.expires_in_seconds <= 0) {
      alert('⚠️ Una reserva expiró. Actualiza el carrito.');
      return;
    }
  }
  
  // 2. Proceder con pago si todas están OK
  processPayment();
}
```

### P: ¿Mostrar "Stock limitado" en producto?
**R:**
```typescript
function ProductStock({ product }) {
  const [reserved, setReserved] = useState(0);

  useEffect(() => {
    const qty = await reservationClient.getReservedQuantity(product.id);
    setReserved(qty);
  }, []);

  const available = product.stock_total - reserved;
  
  return (
    <div>
      {available <= 3 && available > 0 && (
        <span className="text-orange-600">
          ⚠️ Solo {available} disponible
        </span>
      )}
      {available === 0 && (
        <span className="text-red-600">❌ Agotado</span>
      )}
    </div>
  );
}
```

---

## Debugging

### P: "Stock insuficiente" pero hay stock
**R:**
Causas comunes:

1. **Otra reserva activa**
   ```sql
   SELECT * FROM cart_reservations 
   WHERE product_id = 'uuid' AND expires_at > NOW();
   ```

2. **Otra reserva tuya que no ves**
   ```sql
   SELECT * FROM cart_reservations 
   WHERE user_id = 'tu-id' AND product_id = 'uuid';
   ```

3. **Cron no se ejecutó** (reservas expiradas no limpiadas)
   ```
   POST /api/cleanup-expired-reservations manualmente
   ```

### P: Stock se restauró incorrectamente
**R:**
Verificar:

1. ¿cleanup se ejecutó?
   ```sql
   SELECT * FROM cart_reservations WHERE expires_at < NOW();
   ```

2. ¿Hay múltiples funciones cleanup?
   ```sql
   SELECT COUNT(*) FROM pg_proc WHERE proname = 'cleanup_expired_reservations';
   ```

3. ¿Stock total es negativo?
   ```sql
   SELECT stock_total FROM productos WHERE stock_total < 0;
   ```

---

## Escalabilidad

### P: ¿Funciona con millones de usuarios?
**R:** Sí. Optimizaciones:

1. **Índices:** O(log N) búsquedas
2. **Limpieza automática:** Evita acumular reservas expiradas
3. **Particionamiento (futuro):** Por fecha si crece mucho

```sql
-- Particionar por mes (si necesitas millones)
CREATE TABLE cart_reservations_2025_01 PARTITION OF cart_reservations
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

### P: ¿Impacto en performance con 100K reservas?
**R:**
Negligible (< 1ms extra por query):

```
Sin índices: ~5000ms (full table scan)
Con índices: ~5ms ✓

Limpieza de 1000 expiradas: ~50ms
```

### P: ¿Necesito caché (Redis)?
**R:**
No es necesario, pero opcional para UX:

```typescript
// Caché local en frontend
const reservationCache = new Map();

async function getReservations() {
  if (reservationCache.has('reservations')) {
    return reservationCache.get('reservations');
  }
  
  const data = await fetch('/api/reservas');
  reservationCache.set('reservations', data, 30000); // 30s TTL
  return data;
}
```

---

## Seguridad

### P: ¿Puede un usuario ver reservas de otro?
**R:** No. Cada función tiene:

```sql
WHERE user_id = auth.uid()  -- Solo el usuario autenticado
```

### P: ¿Puede un admin limpiar manualmente?
**R:** Sí, por eso existe:

```typescript
// Admin
await reservationClient.cleanupExpiredReservations(CRON_SECRET);

// O SQL directo
SELECT * FROM cleanup_expired_reservations();
```

### P: ¿Se pueden inyectar SQL?
**R:** No. Todos los inputs son paramétricos:

```typescript
// ✅ SEGURO
const { data } = await supabase
  .rpc('create_cart_reservation', {
    p_product_id: productId,   // Parámetro, no interpolado
    p_quantity: quantity
  });

// ❌ NUNCA hacer esto:
const query = `INSERT INTO ... WHERE id = '${productId}'`;
```

---

## Troubleshooting Avanzado

### P: API devuelve 500
**R:**
```typescript
// Revisar logs
console.error('Error:', error);

// Causas comunes:
// 1. Función SQL no existe
// 2. Usuario no autenticado
// 3. Base de datos no conectada
// 4. Parámetros inválidos
```

### P: Transacción se cuelga indefinidamente
**R:**
Puede pasar si hay deadlock:

```sql
-- Matar query colgada
SELECT pid, usename, pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'active' AND query ILIKE '%cart_reservations%';
```

---

## Soporte y Contacto

Si encuentras un problema no listado aquí:

1. Revisar logs en Supabase
2. Ejecutar tests en `CART_RESERVATIONS_TESTING.sql`
3. Verificar que todas las funciones existen
4. Probar con datos de ejemplo

---

**¿No encontraste tu respuesta?** Revisa:
- [CART_RESERVATION_SYSTEM.md](CART_RESERVATION_SYSTEM.md) - Guía técnica
- [CART_RESERVATIONS_QUICK_START.md](CART_RESERVATIONS_QUICK_START.md) - Setup rápido
- [CART_RESERVATIONS_DIAGRAMS.md](CART_RESERVATIONS_DIAGRAMS.md) - Diagramas visuales
