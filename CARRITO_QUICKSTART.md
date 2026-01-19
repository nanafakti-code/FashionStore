# ⚡ Guía Rápida - Carrito BD Pura

## 🚀 Instalación (Nada que hacer)
El carrito ya está completamente implementado. Solo tienes que usarlo.

---

## 📝 Uso Rápido

### **1. En Componentes de Producto**

```tsx
import { addToCart } from '@/lib/cartService';

// En tu manejador de evento
const handleAddToCart = async () => {
  try {
    await addToCart(
      productId,       // string
      productName,     // string
      price,          // number (en céntimos)
      imageUrl,       // string
      quantity,       // number (default: 1)
      size,           // string (opcional)
      color           // string (opcional)
    );
    console.log('✅ Agregado al carrito');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};
```

---

### **2. En Página de Carrito**

**Opción A: Usar componente existente**
```astro
---
import Cart from '@/components/islands/Cart.astro';
---

<Cart client:load />
```

**Opción B: Usar hook personalizado**
```tsx
import { useCart } from '@/hooks/useCart';

export default function MiCarrito() {
  const { items, summary, isLoading, updateQuantity, removeItem } = useCart();

  if (isLoading) return <div>Cargando...</div>;

  return (
    <>
      {items.map(item => (
        <div key={item.carrito_item_id}>
          <h3>{item.name}</h3>
          <p>{(item.price / 100).toFixed(2)}€</p>
          <button onClick={() => updateQuantity(item.carrito_item_id, item.quantity - 1)}>-</button>
          <span>{item.quantity}</span>
          <button onClick={() => updateQuantity(item.carrito_item_id, item.quantity + 1)}>+</button>
          <button onClick={() => removeItem(item.carrito_item_id)}>Eliminar</button>
        </div>
      ))}
      <div>Total: {(summary?.total ?? 0) / 100}€</div>
    </>
  );
}
```

---

### **3. Obtener Resumen del Carrito**

```typescript
import { getCartTotal } from '@/lib/cartService';

const summary = await getCartTotal();
console.log(`Items: ${summary.itemCount}`);
console.log(`Subtotal: ${summary.subtotal / 100}€`);
console.log(`IVA: ${summary.tax / 100}€`);
console.log(`Total: ${summary.total / 100}€`);
```

---

## 🎯 Funciones Disponibles

| Función | Descripción | Retorna |
|---------|-------------|---------|
| `getCartForCurrentUser()` | Obtiene todos los items | `CartItem[]` |
| `addToCart(...)` | Agrega un producto | `boolean` |
| `updateCartItemQuantity(id, qty)` | Actualiza cantidad | `boolean` |
| `removeFromCart(id)` | Elimina un producto | `boolean` |
| `clearCart()` | Vacía el carrito | `boolean` |
| `getCartTotal()` | Obtiene resumen | `CartSummary` |
| `getCartItemCount()` | Obtiene cantidad de items | `number` |

---

## 🔌 API Endpoints

```bash
# Obtener carrito
GET /api/carrito

# Agregar producto
POST /api/carrito
Body: { producto_id, cantidad, talla, color, precio }

# Actualizar cantidad
PUT /api/carrito/actualizar
Body: { item_id, cantidad }

# Eliminar producto
DELETE /api/carrito/eliminar?item_id=xxx

# Vaciar carrito
DELETE /api/carrito/limpiar

# Obtener resumen
GET /api/carrito/resumen
```

---

## 🧪 Ejemplos Completos

### **Agregar al Carrito desde Producto**

```tsx
import { addToCart } from '@/lib/cartService';

export default function ProductCard({ product }) {
  const handleBuy = async () => {
    try {
      await addToCart(
        product.id,
        product.nombre,
        product.precio_venta,
        product.imagen_principal,
        1
      );
      alert('✅ Agregado al carrito');
    } catch (error) {
      alert(`❌ ${error.message}`);
    }
  };

  return (
    <button onClick={handleBuy}>
      Comprar
    </button>
  );
}
```

---

### **Actualizar Cantidad en Carrito**

```tsx
import { updateCartItemQuantity } from '@/lib/cartService';

const incrementQuantity = async (itemId) => {
  try {
    const item = items.find(i => i.carrito_item_id === itemId);
    if (item) {
      await updateCartItemQuantity(itemId, item.quantity + 1);
    }
  } catch (error) {
    console.error(error.message);
  }
};
```

---

### **Hook en Componente**

```tsx
import { useCart } from '@/hooks/useCart';

export default function CartSummary() {
  const { summary, isLoading } = useCart();

  if (isLoading) return <span>...</span>;

  return (
    <div className="cart-badge">
      {summary?.itemCount} items - {(summary?.total ?? 0) / 100}€
    </div>
  );
}
```

---

## 📌 Requisitos

✅ Usuario **autenticado** en Supabase
✅ BD configurada (tablas `carrito` y `carrito_items` ya existen)
✅ RLS deshabilitado o configurado para permitir acceso

---

## ❌ Errores Comunes

### Error: "Usuario no autenticado"
```typescript
// ❌ Incorrecto - Ejecutar sin usuario
await addToCart(...); // Error

// ✅ Correcto - Verificar autenticación
const user = await getCurrentUser();
if (user) {
  await addToCart(...);
}
```

### Error: "Stock insuficiente"
```typescript
// ❌ Incorrecto - Cantidad mayor al stock
await updateCartItemQuantity(itemId, 999); // Error si stock < 999

// ✅ Correcto - Verificar stock disponible
if (item.quantity <= item.stock) {
  await updateCartItemQuantity(itemId, item.quantity + 1);
}
```

---

## 💡 Tips Útiles

1. **Sincronización automática**
   - Los eventos `cartUpdated` se disparan automáticamente
   - Los componentes se actualizan sin recargar

2. **Validación de stock**
   - El sistema valida stock automáticamente
   - No permite agregar más cantidad de la disponible

3. **Precios en céntimos**
   - Todos los precios están en céntimos (ej: 15999 = 159,99€)
   - Convertir a euros: `precio / 100`

4. **Manejo de errores**
   - Siempre usar try/catch
   - Los errores tienen mensajes claros para el usuario

---

## 📚 Documentación Completa

Ver: [CARRITO_BD_PURA.md](./CARRITO_BD_PURA.md)

---

## 🎬 Demo Completa

Ver archivo: [ProductPageExample.tsx](./src/components/examples/ProductPageExample.tsx)
