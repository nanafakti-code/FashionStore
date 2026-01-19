# 🛒 Explicación: Carrito Único por Usuario

## ¿Qué significa "Carrito Único"?

Significa que cada usuario autenticado tiene **UN SOLO carrito**, pero ese carrito puede contener **múltiples items** del mismo producto con **diferentes características** (talla, color).

## Estructura Actual

### Tabla: cart_items

```
┌─────────────────────────────────────────────────────────┐
│ cart_items                                              │
├─────────┬─────────┬────────────┬──────┬────────┬────────┤
│ id      │ user_id │ product_id │ qty  │ talla  │ color  │
├─────────┼─────────┼────────────┼──────┼────────┼────────┤
│ uuid-1  │ user-A  │ prod-X     │ 2    │ M      │ Rojo   │
│ uuid-2  │ user-A  │ prod-X     │ 1    │ L      │ Rojo   │
│ uuid-3  │ user-A  │ prod-Y     │ 3    │ null   │ null   │
└─────────┴─────────┴────────────┴──────┴────────┴────────┘
```

**Usuario A tiene:**
- 2 unidades del Producto X en talla M color Rojo
- 1 unidad del Producto X en talla L color Rojo
- 3 unidades del Producto Y (sin talla/color)

## Constraint de Unicidad

```sql
CREATE UNIQUE INDEX idx_cart_items_unique 
  ON cart_items(user_id, product_id, COALESCE(talla, ''), COALESCE(color, ''));
```

**Esto GARANTIZA que:**
- Un usuario NO puede tener la MISMA combinación 2 veces
- `user-A + prod-X + M + Rojo` = máximo 1 item
- Pero `user-A + prod-X + L + Rojo` = OTRO item diferente ✅

## Ejemplos de Comportamiento

### Caso 1: Añadir Mismo Producto, Misma Talla/Color

```
Acción: Usuario añade 2x Producto X (Talla M, Color Rojo)
Resultado: SE SUMA cantidad
┌─────────┬─────────┬────────────┬─────┐
│ id      │ user_id │ product_id │ qty │
├─────────┼─────────┼────────────┼─────┤
│ uuid-1  │ user-A  │ prod-X     │ 3   │ ← Cambió de 1 a 3
└─────────┴─────────┴────────────┴─────┘
```

**Código:**
```typescript
if (existingItem) {
  // Producto existe con mismas características
  quantity = existingItem.quantity + nuevaCantidad;  // suma
  UPDATE cart_items SET quantity = 3 WHERE id = uuid-1;
}
```

### Caso 2: Añadir Mismo Producto, Diferente Talla

```
Acción: Usuario añade 1x Producto X (Talla L, Color Rojo)
Resultado: SE CREA nuevo item
┌─────────┬─────────┬────────────┬─────┬────────┬────────┐
│ id      │ user_id │ product_id │ qty │ talla  │ color  │
├─────────┼─────────┼────────────┼─────┼────────┼────────┤
│ uuid-1  │ user-A  │ prod-X     │ 3   │ M      │ Rojo   │
│ uuid-2  │ user-A  │ prod-X     │ 1   │ L      │ Rojo   │ ← Nuevo
└─────────┴─────────┴────────────┴─────┴────────┴────────┘
```

**Código:**
```typescript
if (!existingItem) {
  // No existe esta combinación
  INSERT INTO cart_items (...) VALUES (...);
}
```

### Caso 3: Intentar Duplicado (Bloqueado por BD)

```
Acción: Usuario intenta hacer INSERT con los mismos valores
Resultado: ERROR de constraint UNIQUE VIOLATION
┌──────────────────────────────────────────────┐
│ ERROR: duplicate key value violates unique   │
│ constraint "idx_cart_items_unique"           │
│                                              │
│ Este error NO DEBERÍA pasar porque el código │
│ verifica primero si existe (Caso 1)           │
└──────────────────────────────────────────────┘
```

## Flujo Completo: Añadir Producto

```
┌─────────────────────────────────────────┐
│ Usuario hace clic en "Añadir al carrito"│
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ ¿Usuario autenticado?                   │
├─────────────────────────────────────────┤
│ NO  ──► Mostrar error "Inicia sesión"   │
│ SÍ  ──► Continuar ✓                     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ BUSCAR en BD:                           │
│ WHERE user_id = auth.uid() AND          │
│       product_id = ? AND                │
│       talla = ? AND color = ?           │
└──────────────┬──────────────────────────┘
               │
               ▼
         ¿Existe?
         /        \
        /          \
       SÍ           NO
       │            │
       ▼            ▼
   UPDATE      INSERT
   qty += n    new row
       │            │
       └─────┬──────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ Disparar evento: authCartUpdated        │
│ (Actualizar UI)                         │
└─────────────────────────────────────────┘
```

## Políticas RLS: Seguridad

```sql
-- SELECT: Solo ves tu carrito
CREATE POLICY "Users can view their own cart items"
  USING (auth.uid() = user_id);

-- INSERT: Solo añades a tu carrito
CREATE POLICY "Users can insert their own cart items"
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Solo actualizas tu carrito
CREATE POLICY "Users can update their own cart items"
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Solo eliminas de tu carrito
CREATE POLICY "Users can delete their own cart items"
  USING (auth.uid() = user_id);
```

**Resultado:** User A NO PUEDE ver/editar el carrito de User B ✅

## Ejemplo Real: Tienda de Ropa

```
Usuario: Rafael (user-id: abc-123)
```

| Producto | Talla | Color | Cantidad | Acción |
|----------|-------|-------|----------|--------|
| Camiseta | M | Rojo | 2 | ✅ |
| Camiseta | L | Rojo | 1 | ✅ |
| Camiseta | M | Azul | 3 | ✅ |
| Pantalón | 32 | Negro | 1 | ✅ |

**Explicación:**
- 3 ITEMS del mismo PRODUCTO (camiseta) porque varían talla/color
- 1 ITEM del pantalón
- **Total: 4 items en el carrito**
- **Total: 7 unidades**

Si Rafael intenta añadir OTRA camiseta M Roja:
- Se encuentra el item existente
- Se suma: 2 + 1 = 3 (ahora tiene 3 camisetas M Rojo)
- **Total: 4 items en el carrito (mismo número)**
- **Total: 8 unidades (aumentó)**

## Archivos Relevantes

- `supabase/cart-rls-setup.sql` - Definición de tabla y RLS
- `src/lib/cartService.ts` - Lógica de negocio (buscar, sumar, insertar)
- `src/hooks/useCart.ts` - React hook que usa cartService
- `src/components/islands/Cart.tsx` - Componente que muestra el carrito

## Conclusión

El "carrito único" NO significa que solo puedas tener 1 producto.
Significa que:
- ✅ Cada usuario tiene UN carrito
- ✅ El carrito puede tener múltiples ITEMS
- ✅ Los ITEMS se agrupan por producto + talla + color
- ✅ Si repites la misma combinación, se suma cantidad
- ✅ Las políticas RLS previenen acceso de otros usuarios

---

**Diagrama actualizado**: 15 de enero de 2026
