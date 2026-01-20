# 🛒 SISTEMA DE EXPIRACIÓN DE CARRITO PARA USUARIOS SIN SESIÓN

## 📋 Problema Resuelto

**Problema**: Los carritos de usuarios NO autenticados (invitados) NO se eliminaban después de 10 minutos.

**Causa**: El carrito de invitados se guardaba en `localStorage` sin ningún mecanismo de expiración, a diferencia del carrito autenticado que usaba reservas con timestamp de expiración.

## ✅ Solución Implementada

### 1. **Modificación del Tipo `GuestCartItem`**
**Archivo**: `src/lib/cartService.ts` (línea 40)

Se agregó un campo `created_at` a cada item del carrito invitado para rastrear cuándo fue añadido:

```typescript
export interface GuestCartItem {
  product_id: string;
  product_name: string;
  quantity: number;
  talla?: string;
  color?: string;
  precio_unitario: number;
  product_image?: string;
  created_at?: number; // ← NUEVO: Timestamp de creación para expiración
}
```

### 2. **Nueva Función de Limpieza**
**Archivo**: `src/lib/cartService.ts` (línea 173)

Se creó la función `cleanupExpiredGuestCartItems()`:

```typescript
export function cleanupExpiredGuestCartItems(): void {
  // Limpia items que llevan más de 10 minutos en el carrito
  // Se ejecuta automáticamente cada 30 segundos
  // Y también al cargar la página
}
```

**Cómo funciona**:
- Obtiene todos los items del carrito invitado
- Verifica si cada item ha pasado más de **10 minutos** desde su creación
- Elimina los items expirados
- Guarda el carrito actualizado

### 3. **Actualización de `addToGuestCart()`**
**Archivo**: `src/lib/cartService.ts` (línea 462)

Al añadir un nuevo item, ahora se guarda el timestamp:

```typescript
cart.push({
  product_id: productId,
  product_name: productName,
  quantity,
  talla,
  color,
  precio_unitario: price,
  product_image: image,
  created_at: Date.now(), // ← NUEVO: Se guarda el timestamp
});
```

### 4. **Integración en el Componente Cart**
**Archivo**: `src/components/islands/Cart.tsx`

Se realizaron 3 cambios:

#### a) Importación de la función
```typescript
import { ..., cleanupExpiredGuestCartItems } from '@/lib/cartService';
```

#### b) Limpieza al cargar la página
```typescript
const loadCart = async () => {
  setIsLoading(true);
  setError(null);
  try {
    cleanupExpiredGuestCartItems(); // ← Se ejecuta primero
    const cart = await getCartForCurrentUser();
    // ...
```

#### c) Limpieza periódica (cada 30 segundos)
```typescript
const cleanupInterval = setInterval(() => {
  cleanupExpiredReservations();
  cleanupExpiredGuestCartItems(); // ← Ahora limpia invitados también
}, 30000);
```

## 🔄 Flujo Completo

### Para Usuarios SIN Sesión

```
1. Usuario abre la tienda
   ↓
2. Añade productos al carrito (localStorage)
   ├─ Cada producto se guarda con created_at = NOW()
   ↓
3. Usuario navega o recarga la página
   ├─ Se ejecuta cleanupExpiredGuestCartItems()
   ├─ Si pasaron > 10 min → Items eliminados
   ↓
4. Cada 30 segundos
   ├─ Se ejecuta automáticamente la limpieza
   ↓
5. Después de 10 minutos
   ├─ El carrito se vacía automáticamente
   └─ Sin necesidad de sesión
```

### Para Usuarios CON Sesión

```
1. Usuario autenticado añade al carrito
   ├─ Se crea cart_items en BD
   ├─ Se crea reserva de 10 minutos en cart_reservations
   ↓
2. Sistema limpia cada 30 segundos
   ├─ cleanupExpiredReservations() (BD)
   ├─ cleanupExpiredGuestCartItems() (localStorage)
   ↓
3. Después de 10 minutos
   ├─ Reserva expira automáticamente
   ├─ Stock se restaura
   └─ Item se elimina del carrito
```

## 📊 Comportamiento de Expiración

| Acción | Con Sesión | Sin Sesión |
|--------|-----------|-----------|
| Tiempo de expiración | 10 minutos | 10 minutos |
| Almacenamiento | BD Supabase | localStorage |
| Validación de stock | Sí (RLS) | No (solo visual) |
| Sincronización | Automática | Local |
| Persistencia al logout | Sí (queda en BD) | No (se pierde) |

## 🧪 Cómo Testear

### Test 1: Carrito de Invitado Expira
```bash
1. Abre http://localhost:3000
2. SIN iniciar sesión, añade productos al carrito
3. Guarda los tiempos:
   - Producto A: 00:00
   - Producto B: 00:05
4. Espera 10 minutos 5 segundos
5. Recarga la página
✓ Carrito debe estar VACÍO
```

### Test 2: Limpieza Parcial
```bash
1. Abre el navegador consola (F12)
2. SIN sesión, añade 3 productos
3. Espera 5 minutos
4. Añade 1 producto más
5. Espera otros 6 minutos (total: 11 min desde primer producto)
6. Recarga la página
✓ Los primeros 3 productos deben desaparecer
✓ El 4to producto debe permanecer (6 min después)
```

### Test 3: Limpieza Automática Cada 30s
```bash
1. Abre consola (F12 → Console)
2. Filtra logs por "cleanup"
3. Añade producto sin sesión
4. Observa los logs
✓ Debe ver "Limpieza de carrito invitado" cada 30 segundos
✓ Después de 10 minutos: "Item expirado eliminado"
```

### Test 4: No Afecta a Usuarios Autenticados
```bash
1. Inicia sesión
2. Añade productos al carrito
3. Espera 5 minutos
4. Recarga la página
✓ Los productos deben permanecer (máximo 10 min)
✓ Ver reservas en el carrito: "⏱️ Expira en XXs"
```

## 🔍 Debugging

Si el carrito no se elimina después de 10 minutos:

### Verificar que localStorage tiene timestamps:
```javascript
// En consola (F12)
JSON.parse(localStorage.getItem('fashionstore_guest_cart'))
// Debe tener: created_at: 1234567890123
```

### Ver logs de limpieza:
```javascript
// En consola, filtrar por "cleanup"
// Debe ver: "Limpieza de carrito invitado: 3 → 2 items"
// Debe ver: "Item expirado eliminado: product-123"
```

### Verificar tiempo de expiración:
```javascript
const cart = JSON.parse(localStorage.getItem('fashionstore_guest_cart'));
const item = cart[0];
const createdAt = item.created_at;
const now = Date.now();
const ageMs = now - createdAt;
const ageMin = Math.round(ageMs / 60000);
console.log(`Item tiene ${ageMin} minutos`);
```

## ⚙️ Configuración

El tiempo de expiración está definido en `src/lib/cartService.ts`:

```typescript
const EXPIRATION_TIME = 10 * 60 * 1000; // 10 minutos en milisegundos
```

Para cambiar a otro tiempo (ej: 5 minutos):
```typescript
const EXPIRATION_TIME = 5 * 60 * 1000; // 5 minutos
```

## 📝 Resumen de Cambios

| Archivo | Cambio | Línea |
|---------|--------|-------|
| `cartService.ts` | Tipo GuestCartItem: +created_at | 40 |
| `cartService.ts` | Nueva función cleanupExpiredGuestCartItems() | 173 |
| `cartService.ts` | addToGuestCart(): +created_at al guardar | 462 |
| `Cart.tsx` | Importar cleanupExpiredGuestCartItems | 2 |
| `Cart.tsx` | loadCart(): ejecutar limpieza al cargar | 86 |
| `Cart.tsx` | useEffect: añadir limpieza al intervalo | 66 |

## ✨ Beneficios

- ✅ Carritos de invitados se limpian automáticamente después de 10 minutos
- ✅ Libera memoria en el localStorage
- ✅ Mejora el rendimiento del navegador
- ✅ Comportamiento consistente con usuarios autenticados
- ✅ Sin requerir cambios en la base de datos
- ✅ Sin impacto en la experiencia del usuario

---

**Estado**: ✅ IMPLEMENTADO Y TESTEADO  
**Fecha**: 20 de enero de 2026  
**Impacto**: 🟢 Bajo riesgo (solo afecta localStorage de invitados)
