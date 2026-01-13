# 🔢 Sistema de SKU Automático

## 📋 Descripción

Se ha implementado un sistema automático de SKU (Stock Keeping Unit) para los productos de FashionStore:

- **Formato**: 10 dígitos con ceros a la izquierda (ej: `0000000001`, `0000000002`, etc.)
- **Inicio**: Los SKUs comenzarán en `0000000001`
- **Automático**: Cada nuevo producto recibe automáticamente el siguiente SKU
- **No editable**: Los SKUs no pueden ser editados manualmente por el admin

## 🚀 Instalación

### Paso 1: Ejecutar el Script SQL en Supabase

1. Ve a **Supabase Dashboard** → Tu Proyecto
2. Abre **SQL Editor**
3. Crea una nueva consulta y copia el contenido de `supabase/setup-sku-sequence.sql`
4. Ejecuta la consulta (botón "Run")

### Paso 2: Verificar la Instalación

Ejecuta esta consulta para verificar que todo está correctamente configurado:

```sql
-- Ver todos los productos con sus SKUs
SELECT id, nombre, sku 
FROM productos 
ORDER BY sku;

-- Ver el próximo SKU a asignar
SELECT nextval('productos_sku_seq');

-- Ver el máximo SKU actual
SELECT MAX(CAST(sku AS BIGINT)) FROM productos WHERE sku ~ '^\d+$';
```

## 📊 Funcionamiento

### Cuando se crea un nuevo producto:

1. Admin accede al Panel de Administración
2. Hace clic en "Crear Nuevo Producto"
3. Rellena: nombre, descripción, precio, stock, etc.
4. **NO ve campo de SKU** (no aparece en formulario de creación)
5. Hace clic en "Guardar"
6. La BD asigna automáticamente el próximo SKU disponible
7. El producto se guarda con su SKU único

### Cuando se edita un producto existente:

1. Admin hace clic en "Editar" en un producto
2. Ve el SKU del producto en un campo **read-only** (no editable)
3. Puede editar otros campos pero NO el SKU
4. El SKU permanece igual después de guardar

## 🔧 Componentes Técnicos

### Base de Datos (PostgreSQL):

- **Secuencia**: `productos_sku_seq` - Genera números secuenciales
- **Función**: `generate_sku()` - Convierte números a formato 0000000001
- **Trigger**: `set_sku_on_insert` - Auto-genera SKU en INSERTs
- **Índice**: `idx_productos_sku_unique` - Garantiza unicidad (permite NULLs)

### Backend (API):

- `/api/admin/productos` - Acepta POST/PUT sin SKU (se genera automáticamente)

### Frontend (AdminProductos.tsx):

- Campo SKU **oculto** en formulario de creación
- Campo SKU **read-only** en formulario de edición
- Muestra el SKU en la tarjeta del producto

## 📈 Ejemplos de SKUs Generados

```
Producto 1: 0000000001
Producto 2: 0000000002
Producto 3: 0000000003
...
Producto 100: 0000000100
Producto 1000: 0000001000
Producto 10000: 0000010000
```

## ⚠️ Notas Importantes

1. **No editar SKU**: Los SKUs se generan automáticamente y no deben editarse
2. **SKU único**: Cada producto tiene un SKU único garantizado por la BD
3. **Retrocompatibilidad**: Los productos existentes sin SKU recibirán SKUs secuenciales al ejecutar el script
4. **Migracion**: No hay que hacer nada especial, el script maneja todo automáticamente

## 🐛 Troubleshooting

### Error: "Ya existe un SKU"
- No edites el campo SKU manualmente
- Si ocurre, revisa que no haya dos productos con el mismo SKU en la BD

### Error: "Función generate_sku no existe"
- Asegúrate de ejecutar `setup-sku-sequence.sql` completamente
- Verifica que el script se ejecutó sin errores en Supabase

### Los nuevos productos no reciben SKU
- Verifica que el trigger `set_sku_on_insert` existe
- Ejecuta: `SELECT trigger_name FROM information_schema.triggers WHERE trigger_name = 'set_sku_on_insert';`

## 📞 Soporte

Si necesitas resetear los SKUs:

```sql
-- CUIDADO: Esto borra todos los SKUs y reinicia desde 0000000001
TRUNCATE productos_sku_seq;
UPDATE productos SET sku = NULL;
UPDATE productos SET sku = TO_CHAR(ROW_NUMBER() OVER (ORDER BY creado_en ASC, id ASC), 'FM0000000000');
SELECT setval('productos_sku_seq', (SELECT COUNT(*) FROM productos) + 1);
```
