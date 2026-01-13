# 🛒 Carrito Personalizado por Usuario - Implementación Completada

## ✅ Cambios Realizados

### 1. **Nuevo Servicio de Carrito** (`src/lib/cartService.ts`)
- Servicio centralizado para todas las operaciones del carrito
- Integración con Supabase para almacenamiento persistente
- Fallback a localStorage para usuarios no autenticados
- Funciones principales:
  - `getCartForCurrentUser()` - Obtiene el carrito del usuario actual
  - `addToCart()` - Añade productos al carrito
  - `updateCartItemQuantity()` - Actualiza cantidades
  - `removeFromCart()` - Elimina productos
  - `clearCart()` - Vacía el carrito completo

### 2. **API Endpoint** (`src/pages/api/carrito.ts`)
- GET: Obtiene el carrito del usuario autenticado
- POST: Añade productos al carrito
- DELETE: Elimina productos o vacía el carrito
- Autenticación requerida para todas las operaciones

### 3. **Componentes Actualizados**

#### `AddToCartButton.tsx`
- Ahora usa `addToCart()` del servicio
- Sincronización automática con Supabase
- Evento `cartUpdated` para actualizar la UI

#### `Cart.tsx`
- Carga el carrito desde `getCartForCurrentUser()`
- Actualización en tiempo real desde la BD
- Sincronización con todos los cambios del usuario
- Indicador de carga mientras se obtienen datos

#### `CartIcon.tsx`
- Muestra el contador de items desde el carrito del usuario
- Se actualiza reactivamente en cada cambio
- Calcula la cantidad total considerando cantidades

### 4. **Sistema de Migración** (`src/lib/cartMigration.ts`)
- `migrateLocalCartToDatabase()` - Migra carrito local al iniciar sesión
- Sincroniza automáticamente items del localStorage
- Elimina carrito local después de la migración
- Se ejecuta automáticamente en `AuthButtons.tsx`

## 📊 Estructura de Base de Datos Utilizada

### Tabla: `carrito`
```sql
- id: UUID (PK)
- usuario_id: UUID (FK usuarios)
- creado_en: TIMESTAMPTZ
- actualizado_en: TIMESTAMPTZ
- UNIQUE(usuario_id) -- Un carrito por usuario
```

### Tabla: `carrito_items`
```sql
- id: UUID (PK)
- carrito_id: UUID (FK carrito)
- producto_id: UUID (FK productos)
- cantidad: INT
- talla: TEXT (opcional)
- color: TEXT (opcional)
- precio_unitario: INTEGER
- anadido_en: TIMESTAMPTZ
```

## 🔄 Flujo de Funcionamiento

### Para Usuarios NO Autenticados
1. Los productos se guardan en `localStorage` con clave `fashionstore_cart_local`
2. El carrito se mantiene entre sesiones
3. Si el usuario cierra sesión, el carrito local se preserva

### Para Usuarios Autenticados
1. Los productos se guardan en `carrito` y `carrito_items` en Supabase
2. El carrito es único por usuario (UNIQUE constraint)
3. Al iniciar sesión, se migra automáticamente el carrito local a la BD
4. Al cerrar sesión, se limpia el carrito local

### Sincronización
- El evento `cartUpdated` se dispara cada vez que hay cambios
- Los componentes escuchan este evento y se actualizan
- Los datos siempre vienen de `getCartForCurrentUser()`

## 🚀 Uso en Componentes

### Añadir al carrito
```tsx
import { addToCart } from '@/lib/cartService';

await addToCart(
  productId,
  productName,
  price,
  image,
  quantity,
  talla,
  color
);
```

### Obtener carrito actual
```tsx
import { getCartForCurrentUser } from '@/lib/cartService';

const cartItems = await getCartForCurrentUser();
```

### Actualizar cantidad
```tsx
import { updateCartItemQuantity } from '@/lib/cartService';

await updateCartItemQuantity(carritoItemId, newQuantity);
```

### Eliminar producto
```tsx
import { removeFromCart } from '@/lib/cartService';

await removeFromCart(carritoItemId);
```

## 🔐 Seguridad

- Todas las operaciones requieren autenticación
- Los carritos están asociados a usuarios específicos
- Las operaciones de BD se validan en el servidor (API endpoint)
- Fallback a localStorage si hay error en Supabase

## 📱 Características

✅ Carrito persistente por usuario  
✅ Sincronización automática al iniciar sesión  
✅ Fallback a localStorage para usuarios no autenticados  
✅ Actualización en tiempo real de la UI  
✅ API RESTful para operaciones del carrito  
✅ Manejo de errores y recuperación  
✅ Contador dinámico de items en el header  

## 🧪 Testing

Para probar la funcionalidad:

1. **Sin autenticar:**
   - Añade productos al carrito
   - Recarga la página - el carrito se mantiene
   - Abre en otra pestaña - el carrito se sincroniza

2. **Autenticado:**
   - Añade productos
   - Los datos se guardan en Supabase
   - Cierra sesión y vuelve a iniciar - el carrito se mantiene
   - En otra cuenta, verás un carrito diferente

3. **Migración:**
   - Añade productos sin autenticar
   - Inicia sesión
   - Los productos migran automáticamente al carrito del usuario
