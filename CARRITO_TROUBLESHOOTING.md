# 🔧 Troubleshooting: Problemas Comunes del Carrito

## Problema 1: "Error: User not authenticated"

### Síntomas
- Botón "Añadir al carrito" no funciona
- Consola muestra: `Error adding to authenticated cart: Usuario no autenticado`

### Causa
- Usuario no está autenticado en Supabase
- Session expirada
- Token inválido

### Solución
```typescript
// En la consola del navegador (F12):
const { data: { user } } = await supabaseClient.auth.getUser();
console.log('Usuario actual:', user);

// Debería mostrar:
// { id: "uuid-xxx", email: "user@example.com", ... }

// Si es NULL, necesitas iniciar sesión:
// 1. Recarga la página
// 2. Haz clic en "Inicia sesión"
// 3. Completa el formulario
// 4. Intenta nuevamente
```

---

## Problema 2: "Could not find a single row"

### Síntomas
- Consola muestra: `.single() error: Expected one row`
- Carrito no se actualiza

### Causa
- Usando `.single()` con múltiples resultados o ninguno
- El código antiguo tenía este error

### Solución
✅ **Ya está arreglado en el código nuevo:**
```typescript
// ANTES (incorrecto):
const { data: existingItem } = await query.single();

// AHORA (correcto):
const { data: existingItems } = await query;
const existingItem = existingItems?.[0];
```

---

## Problema 3: "Duplicate key value violates unique constraint"

### Síntomas
- Consola muestra: `duplicate key value violates unique constraint "idx_cart_items_unique"`
- Carrito se congela

### Causa
- Dos items idénticos (user + producto + talla + color)
- Significa que el código no buscó antes de insertar

### Solución
```typescript
// Asegúrate que siempre BUSCAS primero:
const existingItems = await query;  // Buscar
if (existingItems.length > 0) {
  // Actualizar (no insertar)
  update(...)
} else {
  // Insertar solo si NO existe
  insert(...)
}
```

---

## Problema 4: "Cannot read properties of null"

### Síntomas
- Error: `Cannot read property 'id' of null`
- Carrito no funciona

### Causa
- Intentando acceder a propiedades de un valor NULL
- User no está autenticado

### Solución
```typescript
const user = await getCurrentUser();
if (!user) {
  console.error('Usuario no autenticado');
  return false;  // ← Retornar temprano
}
// Ahora user está garantizado
console.log(user.id);  // ✅ Seguro
```

---

## Problema 5: "Items sin talla/color no se encuentran"

### Síntomas
- Añades un producto sin talla/color
- Intentas añadir el MISMO producto
- Se crea otro item en lugar de sumar cantidad

### Causa
- Usar `.eq('talla', null)` no funciona
- Debe ser `.is('talla', null)`

### Solución
```typescript
// INCORRECTO:
query = query.eq('talla', null);  // ❌ No funciona

// CORRECTO:
query = query.is('talla', null);  // ✅ Funciona
```

---

## Problema 6: "RLS violation: new row violates row level security policy"

### Síntomas
- Consola muestra: `violates row level security policy`
- No puedes insertar items

### Causa
- RLS policy requiere `auth.uid() = user_id`
- El `user_id` que estás enviando no coincide con `auth.uid()`

### Solución
```typescript
// Asegúrate de usar el user_id correcto:
const user = await getCurrentUser();

// CORRECTO:
insert({
  user_id: user.id,  // ← El ID del usuario autenticado
  product_id: productId,
  quantity: quantity,
  ...
})

// INCORRECTO:
insert({
  user_id: 'otro-id',  // ❌ User-id diferente
  ...
})
```

---

## Problema 7: "Carrito de un usuario ve carrito de otro usuario"

### Síntomas
- Usuario A ve los items de Usuario B
- Seguridad comprometida

### Causa
- RLS policy no está funcionando
- user_id podría ser NULL

### Solución
```sql
-- Verificar que RLS esté habilitado:
SELECT rowsecurity FROM pg_tables 
WHERE tablename = 'cart_items';
-- Debe mostrar: true

-- Verificar que user_id es NOT NULL:
SELECT data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'cart_items' AND column_name = 'user_id';
-- Debe mostrar: is_nullable = NO
```

---

## Problema 8: "Carrito vacío aunque agregué items"

### Síntomas
- Ves mensajes "Carrito vacío"
- Aunque acabas de añadir items

### Causa
- Items se insertaron pero con user_id NULL
- RLS los oculta

### Solución
```sql
-- Verificar qué hay en la BD:
SELECT * FROM cart_items 
WHERE product_id = 'el-producto-que-añadiste';

-- Si ves user_id = NULL:
-- Debe haber sido un error de una actualización anterior

-- Eliminar items con user_id NULL:
DELETE FROM cart_items WHERE user_id IS NULL;

-- Luego intentar nuevamente desde la app
```

---

## Problema 9: "Error en TypeScript: Type error"

### Síntomas
- Consola muestra errores de tipos TypeScript
- No compila

### Causa
- Tipos incorrectos o desalineados

### Solución
```typescript
// Asegurar que los tipos son correctos:
const existingItem: CartItem | undefined = existingItems?.[0];

// O usar type guards:
if (existingItem && 'id' in existingItem) {
  // Ahora TypeScript sabe que existingItem es válido
  console.log(existingItem.id);
}
```

---

## Problema 10: "Cantidad no se suma, siempre es 1"

### Síntomas
- Añades 3 unidades, luego 2 más
- El carrito muestra 2 (no 5)

### Causa
- UPDATE no está funcionando correctamente
- Podrías estar insertando en lugar de actualizar

### Solución
```typescript
// Asegurar que PRIMERO buscas:
const existing = await searchCart(user_id, product_id, talla, color);

if (existing) {
  // UPDATE: suma cantidades
  const newQty = existing.quantity + newQuantity;
  await update({
    id: existing.id,
    quantity: newQty  // ← Suma
  });
} else {
  // INSERT: nuevo item
  await insert({
    quantity: newQuantity  // ← Solo lo que agregaste
  });
}
```

---

## Checklist de Troubleshooting

Cuando algo no funcione:

- [ ] ¿Estoy autenticado? (`F12 > Console > getUser()`)
- [ ] ¿Ejecuté el SQL en Supabase?
- [ ] ¿Verifiqu é que la tabla tiene user_id NOT NULL?
- [ ] ¿Verifiqu é que existen los índices?
- [ ] ¿Verifiqu é que existen las 4 políticas RLS?
- [ ] ¿RLS está habilitado en la tabla?
- [ ] ¿El producto existe en la tabla `productos`?
- [ ] ¿Mis variables de entorno son correctas?
- [ ] ¿La aplicación está usando la última versión del código?
- [ ] ¿Reinicié el servidor (npm run dev)?

---

## Contacto y Soporte

Si después de estos pasos aún no funciona:

1. **Logs del Navegador (F12):**
   - Tab "Console"
   - Copia el error completo
   
2. **Logs de Supabase:**
   - Dashboard > Logs > Database
   - Busca errores relacionados a cart_items
   
3. **Verificación de BD:**
   ```sql
   -- En Supabase SQL Editor:
   SELECT * FROM cart_items LIMIT 5;
   SELECT * FROM pg_policies WHERE tablename = 'cart_items';
   ```

---

**Actualización**: 15 de enero de 2026
**Mantener este documento actualizado con nuevos problemas encontrados**
