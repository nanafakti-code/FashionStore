# 🛒 Carrito Único por Usuario - BD Pura

## ✅ Características Implementadas

### 1. **Carrito 100% Basado en Base de Datos**
- ✅ Sin fallback a localStorage
- ✅ Cada usuario tiene un carrito único
- ✅ Datos persistentes y seguros
- ✅ Validación de stock en tiempo real
- ✅ Sincronización automática

### 2. **Operaciones Completamente Funcionales**
- ✅ Agregar productos al carrito
- ✅ Actualizar cantidades
- ✅ Eliminar productos individuales
- ✅ Vaciar carrito completo
- ✅ Obtener resumen con totales

---

## 📁 Archivos Principales

### **1. `src/lib/cartService.ts`** ⭐
Servicio centralizado con todas las operaciones del carrito.

**Funciones disponibles:**

```typescript
// Obtener carrito actual
const items = await getCartForCurrentUser();

// Agregar producto
await addToCart(
  productId,
  productName,
  price,
  image,
  quantity,
  talla,
  color
);

// Actualizar cantidad
await updateCartItemQuantity(carritoItemId, newQuantity);

// Eliminar producto
await removeFromCart(carritoItemId);

// Vaciar carrito
await clearCart();

// Obtener totales
const { items, subtotal, tax, total, itemCount } = await getCartTotal();

// Obtener cantidad de items
const count = await getCartItemCount();
```

---

### **2. `src/components/islands/Cart.tsx`** 
Componente React con interfaz completa del carrito.

**Características:**
- ✅ Carga automática de carrito
- ✅ Manejo de errores de autenticación
- ✅ Actualización de cantidades
- ✅ Eliminación de productos
- ✅ Vaciar carrito
- ✅ Cálculo de totales con IVA
- ✅ Estado de carga y procesamiento
- ✅ Validación de stock

**Props:** Ninguna (obtiene datos del usuario autenticado)

---

### **3. `src/hooks/useCart.ts`** 🪝
Hook personalizado para usar en componentes React.

```typescript
import { useCart } from '@/hooks/useCart';

export default function MiComponente() {
  const {
    items,           // CartItem[]
    summary,         // CartSummary
    isLoading,       // boolean
    error,          // string | null
    isProcessing,   // boolean
    loadCart,       // () => Promise<void>
    updateQuantity, // (id, qty) => Promise<boolean>
    removeItem,     // (id) => Promise<boolean>
    clear,          // () => Promise<boolean>
    getItemCount,   // () => Promise<number>
  } = useCart();

  return (
    <>
      {summary && <div>Total: {summary.total}</div>}
      {items.map(item => <div>{item.name}</div>)}
    </>
  );
}
```

---

### **4. API Endpoints**

#### **GET `/api/carrito`**
Obtiene todos los items del carrito actual.

```bash
curl -H "Authorization: Bearer TOKEN" \
  https://fashionstore.com/api/carrito
```

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "carrito_item_id": "uuid",
      "producto_id": "uuid",
      "name": "Producto",
      "price": 15999,
      "image": "url",
      "quantity": 2,
      "talla": "M",
      "color": "Negro",
      "stock": 10
    }
  ]
}
```

---

#### **POST `/api/carrito`**
Añade un producto al carrito.

```bash
curl -X POST https://fashionstore.com/api/carrito \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "producto_id": "uuid",
    "cantidad": 1,
    "talla": "M",
    "color": "Negro",
    "precio": 15999
  }'
```

**Response:**
```json
{
  "success": true
}
```

---

#### **PUT `/api/carrito/actualizar`**
Actualiza la cantidad de un producto.

```bash
curl -X PUT https://fashionstore.com/api/carrito/actualizar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "item_id": "uuid",
    "cantidad": 3
  }'
```

---

#### **DELETE `/api/carrito/eliminar`**
Elimina un producto específico.

```bash
curl -X DELETE "https://fashionstore.com/api/carrito/eliminar?item_id=uuid" \
  -H "Authorization: Bearer TOKEN"
```

---

#### **DELETE `/api/carrito/limpiar`**
Vacía completamente el carrito.

```bash
curl -X DELETE https://fashionstore.com/api/carrito/limpiar \
  -H "Authorization: Bearer TOKEN"
```

---

#### **GET `/api/carrito/resumen`**
Obtiene el resumen con totales.

```bash
curl -H "Authorization: Bearer TOKEN" \
  https://fashionstore.com/api/carrito/resumen
```

**Response:**
```json
{
  "itemCount": 3,
  "subtotal": 47997,
  "tax": 10079,
  "total": 58076,
  "items": [...]
}
```

---

## 📊 Estructura de Base de Datos

### **Tabla: carrito**
```sql
- id (UUID) - ID único
- usuario_id (UUID FK) - Referencia al usuario
- creado_en (TIMESTAMPTZ)
- actualizado_en (TIMESTAMPTZ)
- UNIQUE(usuario_id) - Un carrito por usuario
```

### **Tabla: carrito_items**
```sql
- id (UUID) - ID único
- carrito_id (UUID FK) - Referencia al carrito
- producto_id (UUID FK) - Referencia al producto
- cantidad (INT) - Cantidad ordenada
- talla (TEXT) - Talla seleccionada
- color (TEXT) - Color seleccionado
- precio_unitario (INTEGER) - Precio en céntimos
- anadido_en (TIMESTAMPTZ) - Fecha de adición
```

---

## 🔐 Seguridad

✅ **Autenticación obligatoria** - Requiere usuario autenticado
✅ **Validación de propiedad** - Solo acceso al carrito propio
✅ **Validación de stock** - No permite cantidades superiores al stock
✅ **Transacciones atómicas** - Operaciones consistentes
✅ **Manejo de errores** - Mensajes claros al usuario

---

## 🚀 Uso en Productos

Para agregar un producto al carrito desde la página de producto:

```typescript
import { addToCart } from '@/lib/cartService';

async function handleAddToCart() {
  try {
    const success = await addToCart(
      productId,
      productName,
      price,
      imageUrl,
      quantity,
      selectedSize,
      selectedColor
    );
    if (success) {
      console.log('✅ Producto agregado al carrito');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}
```

---

## 📱 Eventos y Sincronización

El sistema dispara eventos para sincronización en tiempo real:

```typescript
// Escuchar cambios en carrito
window.addEventListener('cartUpdated', () => {
  console.log('Carrito actualizado');
  loadCart(); // Recargar datos
});

// El evento se dispara automáticamente después de:
// - Agregar producto
// - Actualizar cantidad
// - Eliminar producto
// - Vaciar carrito
```

---

## ⚠️ Manejo de Errores

Los errores comunes y sus soluciones:

| Error | Causa | Solución |
|-------|-------|----------|
| "Usuario no autenticado" | No hay sesión | Iniciar sesión |
| "Stock insuficiente" | Cantidad > disponible | Reducir cantidad |
| "No tienes permisos" | Carrito de otro usuario | Usar carrito propio |
| "Error interno" | Problema en servidor | Reintentar más tarde |

---

## 🧪 Pruebas

Para probar manualmente:

```bash
# 1. Iniciar sesión
# 2. Ir a página de producto
# 3. Agregar al carrito
# 4. Ir a /carrito
# 5. Modificar cantidades
# 6. Eliminar productos
# 7. Vaciar carrito
```

---

## 📈 Próximas Mejoras

- [ ] Carrito compartido entre dispositivos
- [ ] Persistencia de carrito abandonado
- [ ] Recomendaciones de productos similares
- [ ] Guardado de favoritos (wishlist)
- [ ] Cupones y códigos de descuento
- [ ] Notificaciones de cambios en stock

---

## 👥 Soporte

Para reportar problemas o sugerencias sobre el carrito:
- Revisar logs en consola del navegador
- Verificar autenticación en Supabase
- Comprobar estado de BD en Supabase Dashboard
