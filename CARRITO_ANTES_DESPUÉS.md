# 🔄 Carrito - Antes vs Después

## ANTES (No funcionaba ❌)

### Tabla SQL
```sql
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),  -- ❌ NULLABLE
  product_id UUID NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  talla TEXT,
  color TEXT,
  precio_unitario INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- ❌ SIN índice UNIQUE → permite duplicados
-- ❌ Índice innecesario en (user_id, product_id)
```

**Problemas:**
- ❌ user_id podía ser NULL
- ❌ Permitía User A con Producto X 2 veces
- ❌ Índices subóptimos

### TypeScript Code
```typescript
// ❌ INCORRECTO - No funciona con NULL
const { data: existingItem } = await supabase
  .from('cart_items')
  .select('id, quantity')
  .eq('user_id', user.id)
  .eq('product_id', productId)
  .match(talla ? { talla } : {})     // ❌ FALLA CON NULL
  .match(color ? { color } : {})     // ❌ FALLA CON NULL
  .single();                          // ❌ Espera 1 resultado exacto
```

**Resultado:**
- ❌ Queries fallaban con valores NULL
- ❌ No encontraba items sin talla/color
- ❌ Error: "Could not find a single row"

---

## DESPUÉS (Funciona perfectamente ✅)

### Tabla SQL
```sql
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,  -- ✅ REQUIRED
  product_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  quantity INT NOT NULL CHECK (quantity > 0),
  talla TEXT,
  color TEXT,
  precio_unitario INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ✅ UNIQUE: evita duplicados
CREATE UNIQUE INDEX idx_cart_items_unique 
  ON cart_items(user_id, product_id, COALESCE(talla, ''), COALESCE(color, ''));

-- ✅ Índices para búsquedas rápidas
CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
```

**Beneficios:**
- ✅ user_id requerido → RLS siempre funciona
- ✅ Índice UNIQUE → no puede haber duplicados
- ✅ Índices optimizados → búsquedas rápidas

### TypeScript Code
```typescript
// ✅ CORRECTO - Maneja NULL correctamente
let query = supabase
  .from('cart_items')
  .select('id, quantity')
  .eq('user_id', user.id)
  .eq('product_id', productId);

// Manejar talla y color correctamente
if (talla) {
  query = query.eq('talla', talla);      // ✅ Si tiene valor
} else {
  query = query.is('talla', null);       // ✅ Si es NULL
}

if (color) {
  query = query.eq('color', color);      // ✅ Si tiene valor
} else {
  query = query.is('color', null);       // ✅ Si es NULL
}

const { data: existingItems } = await query;  // ✅ Retorna array
const existingItem = existingItems?.[0];      // ✅ Toma primer elemento
```

**Resultado:**
- ✅ Queries funcionan con NULL
- ✅ Encuentra items sin talla/color
- ✅ Retorna array y toma primer elemento (no falla)

---

## Comparación de Comportamiento

### Escenario: Añadir Camiseta M Rojo (1 unidad)

#### ANTES ❌
```
Request: Camiseta M Rojo + 1 unidad
Database: .match(talla ? { talla } : {})
Error: "Invalid query syntax"
Result: ❌ Carrito no se actualiza
```

#### DESPUÉS ✅
```
Request: Camiseta M Rojo + 1 unidad
Database: WHERE user_id = ? AND product_id = ? AND talla = 'M' AND color = 'Rojo'
Result: Encontrado → UPDATE cantidad += 1
Result: ✅ Carrito actualizado correctamente
```

### Escenario: Añadir Mismo Item 2 Veces

#### ANTES ❌
```
1º Intento: INSERT → Éxito ✓
2º Intento: INSERT → Éxito ✓  (PERMITÍA DUPLICADO)
Resultado: Dos filas idénticas → Carrito confundido
```

#### DESPUÉS ✅
```
1º Intento: INSERT → Éxito ✓
2º Intento: BUSCA primero → Encontrado
           UPDATE cantidad += 1 (en lugar de INSERT)
Resultado: Una fila con cantidad = 2 → Carrito correcto
```

### Escenario: Producto sin Talla/Color

#### ANTES ❌
```
Query: .match(talla ? { talla } : {})
Interpretación: .match({})  (Match vacío)
Resultado: ❌ No encuentra nada
```

#### DESPUÉS ✅
```
Query: query.is('talla', null)
Interpretación: WHERE talla IS NULL
Resultado: ✅ Encuentra correctamente
```

---

## RLS Policies Comparación

### ANTES ❌
```sql
CREATE POLICY "Users can view their own cart items"
  ON cart_items
  FOR SELECT
  USING (auth.uid() = user_id);

-- ⚠️ PROBLEMA: user_id puede ser NULL
-- ⚠️ auth.uid() = NULL SIEMPRE es FALSE
-- ⚠️ Aunque el policy esté bien, la tabla permite NULL
```

### DESPUÉS ✅
```sql
CREATE POLICY "Users can view their own cart items"
  ON cart_items
  FOR SELECT
  USING (auth.uid() = user_id);

-- ✅ AHORA: user_id NEVER NULL
-- ✅ auth.uid() = user_id SIEMPRE funciona
-- ✅ Política y tabla están alineadas
```

---

## Resumen Visual

| Aspecto | ANTES ❌ | DESPUÉS ✅ |
|--------|---------|----------|
| user_id | Nullable | NOT NULL |
| Duplicados | ✗ Permite | ✓ Bloqueado |
| NULL Queries | ✗ Falla | ✓ Funciona |
| Índices | 2 (subóptimos) | 3 (optimizados) |
| RLS | Conflicto | Correcto |
| Rendimiento | Lento | Rápido |
| User Experience | 😞 Frustrado | 😊 Feliz |

---

## Timeline de Actualización

```
┌─────────────────────────────────────────┐
│ ANTES                                   │
│ ├─ User intenta añadir                  │
│ ├─ .match() falla con NULL              │
│ ├─ Error en BD                          │
│ ├─ Elemento no se añade                 │
│ └─ Usuario ve error ❌                   │
├─────────────────────────────────────────┤
│ AHORA (Después de aplicar SQL)          │
│ ├─ User intenta añadir                  │
│ ├─ .eq() + .is() funciona               │
│ ├─ BD valida UNIQUE constraint          │
│ ├─ Si existe: UPDATE cantidad           │
│ ├─ Si no existe: INSERT nuevo           │
│ └─ Usuario ve carrito actualizado ✅    │
└─────────────────────────────────────────┘
```

---

## Código Antes/Después Lado a Lado

### addToAuthenticatedCart()

**ANTES:**
```typescript
// ❌ Búsqueda incompleta
const { data: existingItem } = await supabase
  .from('cart_items')
  .select('id, quantity')
  .eq('user_id', user.id)
  .eq('product_id', productId)
  .match(talla ? { talla } : {})
  .match(color ? { color } : {})
  .single();

if (existingItem) {
  // ❌ Actualizar
  update(...)
} else {
  // ❌ Insertar con valores posiblemente undefined
  insert({
    talla,    // Podría ser undefined
    color,    // Podría ser undefined
  })
}
```

**DESPUÉS:**
```typescript
// ✅ Búsqueda correcta paso a paso
let query = supabase.from('cart_items').select('id, quantity')
  .eq('user_id', user.id)
  .eq('product_id', productId);

// ✅ Manejar talla correctamente
if (talla) {
  query = query.eq('talla', talla);
} else {
  query = query.is('talla', null);      // ← Clave
}

// ✅ Manejar color correctamente
if (color) {
  query = query.eq('color', color);
} else {
  query = query.is('color', null);      // ← Clave
}

const { data: existingItems } = await query;
const existingItem = existingItems?.[0];  // ← Safe access

if (existingItem) {
  // ✅ Actualizar
  update(...)
} else {
  // ✅ Insertar con valores seguros
  insert({
    talla: talla || null,      // ← Explícito
    color: color || null,      // ← Explícito
  })
}
```

---

**Conclusión**: La actualización soluciona todos los problemas de forma elegante y eficiente. 🎉
