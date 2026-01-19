# 🛒 SISTEMA DE CARRITO - IMPLEMENTACIÓN COMPLETA

## 📋 RESUMEN EJECUTIVO

Se ha implementado un sistema de carrito de compra **completo y profesional** para FashionStore con:

✅ **Soporte para usuarios autenticados** - Carrito en Base de Datos (Supabase) con RLS  
✅ **Soporte para usuarios invitados** - Carrito en localStorage  
✅ **Migración automática** - Al hacer login, carrito invitado se fusiona con el usuario  
✅ **Seguridad** - Row Level Security (RLS) garantiza privacidad  
✅ **Funcionalidades completas** - Añadir, eliminar, actualizar cantidad, vaciar  
✅ **Manejo de errores** - Validación y feedback al usuario  

---

## 🗄️ 1. ESTRUCTURA DE BASE DE DATOS

### Tabla: `cart_items`

```sql
CREATE TABLE cart_items (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),  -- NULL para invitados
  product_id UUID REFERENCES productos(id),
  quantity INT CHECK (quantity > 0),
  talla TEXT,
  color TEXT,
  precio_unitario INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Características:**
- `user_id` nullable: permite tanto usuarios autenticados como invitados
- Índices optimizados para búsquedas rápidas
- Eliminación en cascada cuando se borra usuario o producto

---

## 🔐 2. ROW LEVEL SECURITY (RLS)

### Políticas implementadas:

```sql
-- SELECT: Usuario solo ve su carrito
CREATE POLICY "Users can view their own cart items"
  ON cart_items FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: Usuario solo puede insertar en su carrito
CREATE POLICY "Users can insert their own cart items"
  ON cart_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Usuario solo puede actualizar su carrito
CREATE POLICY "Users can update their own cart items"
  ON cart_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Usuario solo puede eliminar de su carrito
CREATE POLICY "Users can delete their own cart items"
  ON cart_items FOR DELETE
  USING (auth.uid() = user_id);
```

**Beneficio:** Un usuario NO puede acceder, ver o modificar el carrito de otro usuario.

---

## 🛠️ 3. FUNCIONES SQL EN SUPABASE

### Función: `migrate_guest_cart_to_user(guest_items JSONB)`

Migra items del carrito invitado al usuario autenticado:

```sql
CREATE OR REPLACE FUNCTION migrate_guest_cart_to_user(guest_items JSONB)
RETURNS void AS $$
DECLARE
  item JSONB;
  user_id_var UUID;
BEGIN
  user_id_var := auth.uid();
  
  -- Para cada item del carrito invitado
  FOR item IN SELECT jsonb_array_elements(guest_items) LOOP
    
    -- Si existe con mismo producto + talla + color
    IF EXISTS (...) THEN
      UPDATE cart_items
      SET quantity = quantity + (item->>'quantity')::INT,
          updated_at = NOW()
      WHERE ...
    ELSE
      -- Si no existe, insertar
      INSERT INTO cart_items (...) VALUES (...)
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Función: `get_user_cart()`

Obtiene el carrito actual con datos del producto:

```sql
CREATE OR REPLACE FUNCTION get_user_cart()
RETURNS TABLE (
  id UUID,
  product_id UUID,
  product_name TEXT,
  quantity INT,
  ...
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ci.id,
    ci.product_id,
    p.nombre,
    ci.quantity,
    ...
  FROM cart_items ci
  JOIN productos p ON ci.product_id = p.id
  WHERE ci.user_id = auth.uid()
  ORDER BY ci.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Función: `clear_user_cart()`

Vacía el carrito del usuario:

```sql
CREATE OR REPLACE FUNCTION clear_user_cart()
RETURNS void AS $$
BEGIN
  DELETE FROM cart_items
  WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 📦 4. SERVICIO: `cartService.ts`

Ubicación: `src/lib/cartService.ts`

### Interfaces

```typescript
// Carrito autenticado (BD)
interface CartItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  talla?: string;
  color?: string;
  precio_unitario: number;
  product_image?: string;
  product_stock?: number;
}

// Carrito invitado (localStorage)
interface GuestCartItem {
  product_id: string;
  product_name: string;
  quantity: number;
  talla?: string;
  color?: string;
  precio_unitario: number;
  product_image?: string;
}
```

### Funciones principales

#### **Para carrito autenticado (Supabase):**

```typescript
// Obtener carrito
async getAuthenticatedCart(): CartItem[]

// Añadir producto
async addToAuthenticatedCart(
  productId, productName, price, image, 
  quantity, talla, color
): boolean

// Actualizar cantidad
async updateAuthenticatedCartItem(itemId, quantity): boolean

// Eliminar item
async removeFromAuthenticatedCart(itemId): boolean

// Vaciar
async clearAuthenticatedCart(): boolean
```

#### **Para carrito invitado (localStorage):**

```typescript
// Obtener carrito
getGuestCartItems(): GuestCartItem[]

// Añadir producto
addToGuestCart(productId, productName, price, ...): boolean

// Actualizar cantidad
updateGuestCartItem(productId, quantity, talla, color): boolean

// Eliminar item
removeFromGuestCart(productId, talla, color): boolean

// Vaciar
clearGuestCart(): boolean
```

#### **Funciones inteligentes (detectan autenticación):**

```typescript
// Obtiene carrito (BD si autenticado, localStorage si no)
async getCart(): CartItem[] | GuestCartItem[]

// Añade a carrito (automático)
async addToCart(productId, ...): boolean

// Actualiza cantidad (automático)
async updateCartItem(itemId, quantity): boolean

// Elimina item (automático)
async removeFromCart(itemId): boolean

// Vacía carrito (automático)
async clearCart(): boolean
```

#### **Migración:**

```typescript
// Migra carrito invitado → usuario autenticado
async migrateGuestCartToUser(): boolean
```

#### **Cálculos:**

```typescript
// Subtotal
calculateSubtotal(items): number

// Total items
calculateItemCount(items): number

// Impuestos (21% IVA)
calculateTax(subtotal): number

// Total final
calculateTotal(subtotal, tax): number

// Resumen completo
async getCartSummary(): CartSummary
```

---

## ⚛️ 5. HOOK: `useCart.ts`

Ubicación: `src/hooks/useCart.ts`

### Uso en componentes React:

```typescript
const { 
  items,           // CartItem[]
  summary,         // { items, subtotal, tax, total, itemCount }
  isLoading,       // boolean
  error,           // string | null
  isProcessing,    // boolean (durante operaciones)
  isAuthenticated, // boolean
  
  // Métodos
  loadCart,        // () => Promise<void>
  addItem,         // (productId, name, price, ...) => Promise<boolean>
  updateQuantity,  // (itemId, quantity) => Promise<boolean>
  removeItem,      // (itemId) => Promise<boolean>
  clear,           // () => Promise<boolean>
  getItemCount,    // () => Promise<number>
  migrateCart,     // () => Promise<boolean>
} = useCart();
```

### Ejemplo de uso:

```typescript
export function ProductCard({ productId, name, price, image }) {
  const { addItem, isProcessing } = useCart();
  
  const handleClick = async () => {
    const success = await addItem(productId, name, price, image);
    if (success) alert('Añadido al carrito');
  };
  
  return (
    <button onClick={handleClick} disabled={isProcessing}>
      Añadir
    </button>
  );
}
```

---

## 🔄 6. FLUJO: GUEST → USUARIO AUTENTICADO

### **Fase 1: Usuario sin sesión (Guest)**

1. Usuario navega a la tienda
2. Hace clic en "Añadir al carrito" en un producto
3. Sistema detecta que NO está autenticado
4. Se llama a `addToGuestCart()`
5. Item se guarda en **localStorage** con key `fashionstore_guest_cart`

```json
{
  "product_id": "uuid-123",
  "product_name": "Camiseta Premium",
  "quantity": 1,
  "talla": "M",
  "color": "Azul",
  "precio_unitario": 2999,
  "product_image": "url-imagen"
}
```

### **Fase 2: Usuario hace login**

1. Usuario hace clic en "Iniciar Sesión"
2. Se autentica exitosamente
3. Hook `useCart` detecta autenticación via `getCurrentUser()`
4. Automáticamente llama a `migrateGuestCartToUser()`

### **Fase 3: Migración de datos**

1. Se obtiene carrito invitado del localStorage
2. Se serializa a JSON y se envía a función RPC `migrate_guest_cart_to_user`
3. En Supabase:
   - Para cada item del carrito invitado
   - Busca si existe en cart_items con user_id + product_id + talla + color
   - **Si existe:** suma cantidades
   - **Si no existe:** crea nuevo item
4. Se limpian datos del localStorage
5. Se dispara evento `authCartUpdated` para recargar componentes

### **Fase 4: Usuario autenticado**

1. Todo el carrito ahora está en **Base de Datos**
2. RLS garantiza que solo ve su carrito
3. Las operaciones se sincronizan automáticamente
4. Si cierra sesión, vuelve a carrito invitado vacío (nuevo)

---

## 📝 7. INSTALACIÓN Y SETUP

### Paso 1: Crear tabla y políticas en Supabase

```bash
# Copiar contenido de:
supabase/cart-rls-setup.sql

# Y ejecutar en Supabase SQL Editor
```

### Paso 2: Verificar columnas en tabla productos

```sql
-- Asegurar que productos tiene estas columnas:
- id (UUID)
- nombre (TEXT)
- imagen_principal (TEXT)
- stock_total (INT)
```

### Paso 3: Implementar en componentes

Ver ejemplos en: `CARRITO_IMPLEMENTACION_GUIA.ts`

### Paso 4: Probar en desarrollo

```bash
# 1. Abrir navegador en localhost
# 2. Añadir productos sin sesión
# 3. Ver items en localStorage (DevTools > Storage > localStorage)
# 4. Iniciar sesión
# 5. Verificar que carrito se migra a BD
# 6. Verificar en Supabase que tabla cart_items tiene items
```

---

## 🔐 8. SEGURIDAD

### Garantías de RLS:

| Operación | Usuario A | Usuario B |
|-----------|-----------|-----------|
| Ver carrito | ✅ Solo su carrito | ✅ Solo su carrito |
| Modificar carrito | ✅ Solo el suyo | ✅ Solo el suyo |
| Eliminar carrito | ✅ Solo el suyo | ✅ Solo el suyo |

### Validaciones del cliente:

```typescript
// En cartService.ts
- Verificar user_id coincida con auth.uid()
- Validar product_id existe
- Validar cantidad > 0
- Validar stock disponible
```

### Validaciones del servidor (RLS):

```sql
-- En Supabase
- user_id debe ser auth.uid() (forzado en RLS)
- product_id debe ser FK válido
- Cantidad debe ser > 0 (CHECK constraint)
```

---

## 🚀 9. BUENAS PRÁCTICAS

### Código limpio:

- ✅ Funciones pequeñas y reutilizables
- ✅ Manejo de errores consistente
- ✅ Comentarios claros
- ✅ TypeScript con tipos definidos

### Performance:

- ✅ localStorage para carrito invitado (sin latencia)
- ✅ Índices en BD para búsquedas rápidas
- ✅ RPC functions en lugar de múltiples queries
- ✅ Event listeners en lugar de polling

### UX:

- ✅ Eventos para actualización en tiempo real
- ✅ Mensajes de error claros
- ✅ Estados de carga (isLoading, isProcessing)
- ✅ Confirmación antes de acciones destructivas

---

## 📊 10. TESTING

### Casos de prueba recomendados:

```typescript
// 1. Usuario invitado
✓ Añadir producto al carrito
✓ Ver items en localStorage
✓ Actualizar cantidad
✓ Eliminar item
✓ Vaciar carrito

// 2. Migración
✓ Iniciar sesión con items en carrito
✓ Verificar items migrados a BD
✓ Verificar no duplicados
✓ Verificar localStorage limpio

// 3. Usuario autenticado
✓ Añadir producto a BD
✓ Actualizar cantidad en BD
✓ Eliminar item de BD
✓ RLS: No ver carrito de otros usuarios
✓ RLS: No modificar carrito de otros

// 4. Edge cases
✓ Stock agotado
✓ Producto eliminado
✓ Múltiples pestañas sincronizadas
✓ Session expirada durante operación
```

---

## 📚 11. ARCHIVOS CREADOS/MODIFICADOS

| Archivo | Cambios |
|---------|---------|
| `supabase/cart-rls-setup.sql` | ✨ NUEVO - Schema, RLS, funciones |
| `src/lib/cartService.ts` | 🔄 MEJORADO - Sistema completo |
| `src/hooks/useCart.ts` | 🔄 MEJORADO - Hook inteligente |
| `CARRITO_IMPLEMENTACION_GUIA.ts` | ✨ NUEVO - Ejemplos de uso |

---

## 🎯 12. PRÓXIMOS PASOS

### Implementación en componentes:

1. Actualizar Header para mostrar badge del carrito
2. Crear/actualizar página `/cart` con lista de items
3. Implementar validación de stock antes de checkout
4. Integrar con servicio de pagos (Stripe/PayPal)
5. Crear confirmación de pedido

### Mejoras futuras:

- [ ] Guardar carrito invitado en IndexedDB (más datos)
- [ ] Sincronización en tiempo real con WebSockets
- [ ] Descuentos y cupones por item
- [ ] Wishlist (lista de deseos)
- [ ] Análisis de comportamiento de compra

---

## 📞 SOPORTE

Para dudas o problemas:
1. Revisar consola del navegador (Errores)
2. Verificar que tabla `cart_items` existe
3. Verificar que RLS está habilitado
4. Probar conexión a Supabase
5. Verificar variables de entorno

---

**Implementado:** 15 de enero de 2026  
**Stack:** Astro 5.0 + React + Supabase + TypeScript  
**Versión:** 1.0 - Producción lista
