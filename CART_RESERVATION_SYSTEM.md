# Sistema de Reserva Temporal de Stock - Guía Completa

## 📋 Descripción General

Sistema de reserva temporal (1 minuto) que evita la sobreventa de productos en el carrito de compra. Cuando un usuario añade un producto:

1. **Se verifica** que hay stock disponible
2. **Se resta inmediatamente** del stock
3. **Se guarda la reserva** con expiración de 1 minuto
4. **Si expira** sin completar compra → se restaura el stock automáticamente

---

## 🗄️ Base de Datos

### Tabla: `cart_reservations`

```sql
CREATE TABLE IF NOT EXISTS cart_reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  quantity INT NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 minute'),
  UNIQUE(user_id, product_id)
);
```

**Campos clave:**
- `id`: Identificador único de la reserva
- `user_id`: Usuario que hace la reserva
- `product_id`: Producto reservado
- `quantity`: Cantidad reservada
- `created_at`: Timestamp de creación
- `expires_at`: Timestamp de expiración (NOW() + 1 minuto)
- `UNIQUE(user_id, product_id)`: Evita duplicados del mismo usuario-producto

### Índices para Optimización

```sql
CREATE INDEX idx_cart_reservations_user_id ON cart_reservations(user_id);
CREATE INDEX idx_cart_reservations_expires_at ON cart_reservations(expires_at);
```

---

## 🔧 Funciones SQL (Triggers & Procedures)

### 1. `cleanup_expired_reservations()`

Función que limpia reservas expiradas y restaura el stock.

```sql
CREATE OR REPLACE FUNCTION cleanup_expired_reservations()
RETURNS TABLE(items_cleaned INT, stock_restored INT) AS $$
-- Busca reservas con expires_at <= NOW()
-- Restaura el stock para cada producto
-- Elimina los registros de la tabla
```

**Retorna:**
- `items_cleaned`: Número de reservas eliminadas
- `stock_restored`: Stock total restaurado

**Uso:**
```sql
SELECT * FROM cleanup_expired_reservations();
```

### 2. `create_cart_reservation(p_product_id UUID, p_quantity INT)`

Crea o actualiza una reserva. Maneja automáticamente:
- Verificación de stock disponible
- Sustracción de stock
- Creación de reserva con expiración

**Flujo:**
1. Obtiene stock disponible del producto
2. Obtiene cantidad previamente reservada (si existe)
3. Calcula diferencia: `stock_diff = p_quantity - v_existing_qty`
4. Si `stock_diff > stock_available` → Error "Stock insuficiente"
5. Si OK → INSERT/UPDATE con `ON CONFLICT`
6. Si es nueva → Resta stock

**Retorna:**
```typescript
{
  success: BOOLEAN,
  message: TEXT
}
```

### 3. `delete_cart_reservation(p_product_id UUID)`

Elimina una reserva y restaura el stock.

**Flujo:**
1. Obtiene cantidad reservada
2. Elimina el registro
3. Restaura el stock

### 4. `get_user_cart_reservations()`

Obtiene todas las reservas del usuario autenticado con tiempo restante.

**Retorna:**
```typescript
{
  id: UUID,
  product_id: UUID,
  quantity: INT,
  created_at: TIMESTAMPTZ,
  expires_at: TIMESTAMPTZ,
  expires_in_seconds: INT
}[]
```

---

## 🔌 API Backend

### Endpoint: `/api/reservas`

#### GET - Obtener reservas

```bash
curl -X GET http://localhost:3000/api/reservas \
  -H "Authorization: Bearer <token>"
```

**Respuesta:**
```json
{
  "success": true,
  "reservas": [
    {
      "id": "uuid...",
      "product_id": "uuid...",
      "quantity": 2,
      "created_at": "2025-01-15T10:00:00Z",
      "expires_at": "2025-01-15T10:01:00Z",
      "expires_in_seconds": 45
    }
  ],
  "count": 1
}
```

#### POST - Crear reserva

```bash
curl -X POST http://localhost:3000/api/reservas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "producto_id": "uuid...",
    "quantity": 2
  }'
```

**Respuesta (éxito):**
```json
{
  "success": true,
  "message": "Reserva creada correctamente",
  "producto_id": "uuid...",
  "quantity": 2,
  "expires_in_minutes": 1
}
```

**Respuesta (error):**
```json
{
  "success": false,
  "error": "Stock insuficiente"
}
```

#### PUT - Actualizar reserva

```bash
curl -X PUT http://localhost:3000/api/reservas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "producto_id": "uuid...",
    "quantity": 5
  }'
```

#### DELETE - Eliminar reserva

```bash
curl -X DELETE http://localhost:3000/api/reservas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "producto_id": "uuid..."
  }'
```

### Endpoint: `/api/cleanup-expired-reservations`

#### POST - Ejecutar limpieza

```bash
curl -X POST http://localhost:3000/api/cleanup-expired-reservations \
  -H "Authorization: Bearer <CRON_SECRET>"
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Limpieza de reservas completada",
  "items_cleaned": 5,
  "stock_restored": 12,
  "timestamp": "2025-01-15T10:05:00Z"
}
```

#### GET - Verificar estado

```bash
curl -X GET http://localhost:3000/api/cleanup-expired-reservations \
  -H "Authorization: Bearer <CRON_SECRET>"
```

**Respuesta:**
```json
{
  "success": true,
  "expired_reservations_count": 3,
  "reservations": [
    {
      "id": "uuid...",
      "product_id": "uuid...",
      "quantity": 2,
      "user_id": "uuid...",
      "expires_at": "2025-01-15T10:00:30Z"
    }
  ]
}
```

---

## 💻 Cliente Frontend TypeScript

### Instalación

```typescript
import { reservationClient, CartReservation } from '@/lib/cart-reservation-client';
```

### Métodos disponibles

#### Obtener reservas

```typescript
const reservations = await reservationClient.getReservations();
console.log(reservations);
// Retorna: CartReservation[]
```

#### Crear reserva

```typescript
const success = await reservationClient.createReservation(
  'product-uuid',
  2 // cantidad
);
```

#### Actualizar reserva

```typescript
const success = await reservationClient.updateReservation(
  'product-uuid',
  5 // nueva cantidad
);
```

#### Eliminar reserva

```typescript
const success = await reservationClient.deleteReservation('product-uuid');
```

#### Verificar si producto está reservado

```typescript
const isReserved = await reservationClient.isProductReserved('product-uuid');
if (isReserved) {
  console.log('Producto ya en carrito');
}
```

#### Obtener cantidad reservada

```typescript
const quantity = await reservationClient.getReservedQuantity('product-uuid');
console.log(`Cantidad reservada: ${quantity}`);
```

#### Obtener tiempo restante

```typescript
const secondsLeft = await reservationClient.getReservationTimeRemaining('product-uuid');
console.log(`Expira en ${secondsLeft} segundos`);
```

---

## 🔄 Limpieza Automática

### Opción 1: EasyCron (Recomendado - Free)

1. Ir a https://www.easycron.com/
2. Crear nueva tarea cron:
   - **URL:** `https://tu-sitio.com/api/cleanup-expired-reservations`
   - **Method:** POST
   - **Headers:** `Authorization: Bearer <TU_CRON_SECRET>`
   - **Frecuencia:** Cada 1 minuto (*/1 * * * *)

### Opción 2: GitHub Actions

```yaml
# .github/workflows/cleanup-reservations.yml
name: Cleanup Expired Reservations

on:
  schedule:
    - cron: '*/1 * * * *'  # Cada minuto

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger cleanup
        run: |
          curl -X POST https://tu-sitio.com/api/cleanup-expired-reservations \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

### Opción 3: Vercel Cron Functions

```typescript
// api/cron/cleanup-reservations.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return response.status(401).json({ error: 'Unauthorized' });
  }

  // Ejecutar limpieza
  const result = await supabase.rpc('cleanup_expired_reservations');
  response.json(result);
}
```

### Opción 4: Trigger automático en operaciones

En `/api/carrito.ts`, antes de operaciones add/update:

```typescript
// Limpiar expiradas automáticamente
await supabase.rpc('cleanup_expired_reservations');
```

---

## 🔐 Seguridad y Validaciones

### Transacciones y RLS

- **RLS:** Deshabilitado en `cart_reservations` (tabla interna)
- **SECURITY DEFINER:** Funciones ejecutadas con privilegios del propietario
- **Constraints:** CHECK cantidad > 0, UNIQUE user-product

### Variables de Entorno

```env
# .env
CRON_SECRET=your-secret-token-here
```

Nunca commit secrets en el repo.

---

## 🧪 Flujo de Prueba Completo

### 1. Usuario añade producto al carrito

```typescript
// En componente de producto
const success = await reservationClient.createReservation(productId, 2);
// ✅ Reserva creada
// ✅ Stock -2 en base de datos
// ✅ Expira en 60 segundos
```

### 2. Stock se reduce

```sql
-- Antes
SELECT stock_total FROM productos WHERE id = 'product-uuid';
-- Resultado: 10

-- Después de reservar 2
SELECT stock_total FROM productos WHERE id = 'product-uuid';
-- Resultado: 8
```

### 3. Usuario no completa compra → Timeout

```typescript
// Esperar 61 segundos...
// Sistema ejecuta cleanup automáticamente

// Stock se restaura
SELECT stock_total FROM productos WHERE id = 'product-uuid';
// Resultado: 10 (restaurado)

// Reserva se elimina
SELECT * FROM cart_reservations WHERE product_id = 'product-uuid';
// Resultado: (vacío)
```

### 4. Usuario completa compra

```typescript
// Crear pedido (elimina reserva y crea orden)
const order = await createOrder(reservations);
// ✅ Pedido creado
// ✅ Stock permanece -X (no se restaura)
// ✅ Reserva eliminada
```

---

## 📊 Diagrama de Estados

```
┌─────────────────────────────────────────────────────────────┐
│                   USUARIO AÑADE PRODUCTO                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │ ¿Hay stock suficiente?       │
        └──────────────────────────────┘
                  │            │
         SÍ ──────┘            └───── NO
         │                           │
         ▼                           ▼
    ┌─────────────┐         ┌───────────────┐
    │ Crear       │         │ Error         │
    │ Reserva     │         │ "Stock        │
    │             │         │  insuficiente"│
    │ -stock      │         └───────────────┘
    └─────┬───────┘
          │
          ▼ (60 segundos)
    ┌──────────────────────────┐
    │ ¿Usuario completa orden? │
    └──────────────────────────┘
           │              │
      SÍ ──┘              └─── NO
      │                        │
      ▼                        ▼
  ┌────────┐          ┌──────────────────┐
  │ Crear  │          │ cleanup_expired  │
  │ Pedido │          │ _reservations()  │
  │        │          │                  │
  │ Eliminar           │ • Restaura stock │
  │ Reserva│          │ • Elimina reserva│
  └────────┘          └──────────────────┘
```

---

## 🚀 Integración en Componente React/Astro

```typescript
import { reservationClient } from '@/lib/cart-reservation-client';

export default function ProductCard({ product }) {
  const [quantity, setQuantity] = useState(1);
  const [isReserved, setIsReserved] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);

  const handleAddToCart = async () => {
    const success = await reservationClient.createReservation(
      product.id,
      quantity
    );

    if (success) {
      setIsReserved(true);
      setTimeLeft(60);

      // Timer visual
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsReserved(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  return (
    <div>
      <h3>{product.nombre}</h3>
      <p>Stock: {product.stock_total}</p>
      
      {isReserved && (
        <div className="alert alert-info">
          ✅ Reservado por {timeLeft}s
        </div>
      )}

      <button onClick={handleAddToCart}>
        Añadir al carrito
      </button>
    </div>
  );
}
```

---

## 🐛 Troubleshooting

### Problema: "Stock insuficiente"

**Causa:** Producto está reservado por otro usuario o no hay stock
**Solución:** 
- Esperar 1 minuto a que expiren otras reservas
- Aumentar stock del producto

### Problema: Stock no se restaura

**Causa:** Limpieza automática no se ejecuta
**Solución:**
- Verificar que cron job está activo: `GET /api/cleanup-expired-reservations`
- Ejecutar manualmente: `POST /api/cleanup-expired-reservations`
- Revisar logs en Supabase

### Problema: Usuarios diferentes compran el mismo stock

**Causa:** RLS o validaciones no configuradas correctamente
**Solución:**
- Verificar función `create_cart_reservation` está en SECURITY DEFINER
- Revisar constraint UNIQUE en tabla
- Usar transacciones en la lógica de compra

---

## 📝 Notas Importantes

1. **Tiempo de expiración:** Actualmente es 1 minuto (`INTERVAL '1 minute'`). Para cambiar:
   ```sql
   expires_at = NOW() + INTERVAL 'X minutes'
   ```

2. **Sin sesión:** Si `user_id` es NULL, no funciona. Requiere autenticación.

3. **RLS:** Está deshabilitado porque es tabla interna. No almacena datos sensibles.

4. **Índices:** Los índices en `user_id` y `expires_at` son críticos para performance.

---

## ✅ Checklist de Implementación

- [x] Crear tabla `cart_reservations`
- [x] Crear índices de optimización
- [x] Implementar función `cleanup_expired_reservations()`
- [x] Implementar función `create_cart_reservation()`
- [x] Implementar función `delete_cart_reservation()`
- [x] Implementar función `get_user_cart_reservations()`
- [x] Crear API `/api/reservas` (GET, POST, PUT, DELETE)
- [x] Crear API `/api/cleanup-expired-reservations` (GET, POST)
- [x] Crear cliente TypeScript `CartReservationClient`
- [x] Configurar limpieza automática (EasyCron/GitHub Actions)
- [x] Documentación completa
- [ ] Integración en componentes frontend
- [ ] Testing E2E
- [ ] Monitoreo y alertas

---

## 📚 Archivos Generados

1. **SQL:** `supabase/CART_RESERVATIONS.sql`
2. **APIs:** 
   - `src/pages/api/reservas.ts`
   - `src/pages/api/cleanup-expired-reservations.ts`
3. **Cliente:** `src/lib/cart-reservation-client.ts`
4. **Guía:** `CART_RESERVATION_SYSTEM.md` (este archivo)

---

**Última actualización:** 15 de enero de 2026
**Sistema:** FashionStore - Gestión de Carrito
