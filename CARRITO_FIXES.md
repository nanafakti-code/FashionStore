# 🛒 Soluciones Implementadas - Carrito de Compras

## Problemas Identificados

El carrito no funcionaba correctamente al intentar añadir productos. Los problemas fueron:

### 1. **user_id Nullable en BD**
- **Problema**: La tabla permitía `user_id NULL`, causando conflictos con las políticas RLS
- **Solución**: Cambiar a `user_id UUID NOT NULL` - cada usuario debe estar autenticado para usar el carrito
- **Línea SQL**: Línea 22-23

### 2. **Índice de Unicidad Incorrecto**
- **Problema**: No había constraint que evitara duplicados del mismo producto
- **Solución**: Crear índice UNIQUE que considere `(user_id, product_id, talla, color)`
  ```sql
  CREATE UNIQUE INDEX idx_cart_items_unique 
    ON cart_items(user_id, product_id, COALESCE(talla, ''), COALESCE(color, ''));
  ```
- **Beneficio**: Un usuario no puede tener el MISMO producto dos veces con las mismas características

### 3. **Queries con NULL en cartService.ts**
- **Problema**: Usar `.match()` con valores NULL no funciona en Supabase
- **Solución**: Usar `.eq()` para valores no-null e `.is()` para NULL
  ```typescript
  if (talla) {
    query = query.eq('talla', talla);
  } else {
    query = query.is('talla', null);  // ✅ Correcto
  }
  ```

### 4. **Uso de .single() sin guardar resultado**
- **Problema**: El código esperaba un item con `.single()` pero luego usaba `existingItem` directamente
- **Solución**: Usar array y tomar el primer elemento: `existingItems?.[0]`

### 5. **Políticas RLS Redundantes**
- **Problema**: Crear y recrear políticas sin eliminar las antiguas
- **Solución**: Agregar `DROP POLICY IF EXISTS` antes de crear cada una

## Cambios en Archivos

### `supabase/cart-rls-setup.sql`
✅ **Actualizado:**
- Línea 20: user_id ahora es NOT NULL
- Línea 26-28: Índice UNIQUE mejorado
- Línea 37-59: DROP POLICY antes de CREATE
- Línea 177: Comentario actualizado

### `src/lib/cartService.ts`
✅ **Actualizado:**
- Línea 165-188: Nueva lógica para buscar items considerando NULL
- Línea 189-205: Validación correcta de talla y color
- Línea 210-215: Inserción correcta con valores NULL

## Cómo Funciona Ahora

### Flujo de Añadir Producto:
```
1. Usuario autenticado intenta añadir producto
2. ✅ Sistema busca si existe el producto CON LAS MISMAS talla/color
3. Si existe: Suma cantidad
4. Si no existe: Crea nuevo item
5. RLS valida que user_id = auth.uid()
6. ✅ Evento 'authCartUpdated' se dispara
```

### Carrito es Único:
```
Gracias al índice UNIQUE:
- Usuario A + Producto X + Talla M + Color Rojo = 1 item (max)
- Usuario A + Producto X + Talla L + Color Rojo = otro item ✅
- Usuario A + Producto X + Talla M + Color Azul = otro item ✅
```

## Pasos para Aplicar los Cambios

### 1. Ejecutar SQL en Supabase
```bash
# En Supabase Dashboard > SQL Editor
# Copiar y ejecutar el contenido de: supabase/cart-rls-setup.sql
```

### 2. Verificar que la tabla se creó correctamente:
```sql
SELECT * FROM information_schema.columns 
WHERE table_name = 'cart_items';
```

### 3. Probar desde la aplicación:
- Autenticarse con un usuario
- Ir a un producto
- Intentar añadir al carrito
- ✅ Debería funcionar sin errores

## Variables de Entorno Necesarias

```env
VITE_SUPABASE_URL=tu-url
VITE_SUPABASE_ANON_KEY=tu-key
```

## Debugging

Si aún no funciona:

### Ver logs de error:
```typescript
// En cartService.ts línea 220
console.error('Error adding to authenticated cart:', error);
// Esto te dirá exactamente qué falló
```

### Verificar RLS:
```sql
-- En Supabase, Authentication > Policies
-- Asegurar que existan las 4 políticas
-- Que user_id en cart_items NO sea nullable
```

### Verificar autenticación:
```typescript
// En useCart.ts línea 50
const user = await getCurrentUser();
console.log('Current user:', user);
// Debe mostrar el usuario autenticado
```

## Estado Actual ✅

- ✅ Tabla `cart_items` con `user_id NOT NULL`
- ✅ Índice UNIQUE para evitar duplicados
- ✅ Políticas RLS correctas
- ✅ Queries en TypeScript manejando NULL correctamente
- ✅ Carrito es único por usuario
- ✅ Cantidad se suma si existe el producto

---

**Última actualización**: 15 de enero de 2026
