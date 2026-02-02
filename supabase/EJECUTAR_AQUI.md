# 🚀 Guía Rápida: Ejecutar Scripts SQL

## ⚠️ IMPORTANTE: Orden de Ejecución

Ejecuta los scripts en este orden exacto:

### **PASO 1**: Migración de Base de Datos

```bash
# Ejecutar el script de migración simplificado
psql -h db.xxx.supabase.co -U postgres -d postgres \
  -f supabase/migracion-variantes-simple.sql
```

**O desde Supabase Dashboard**:
1. Ir a **SQL Editor**
2. Abrir archivo: [`migracion-variantes-simple.sql`](file:///c:/Users/rafae/Desktop/DAM%202%C2%BA/Sistema%20de%20Gesti%C3%B3n%20Empresarial/FashionStore/supabase/migracion-variantes-simple.sql)
3. Copiar todo el contenido
4. Pegar en SQL Editor
5. Click en **Run**

**¿Qué hace este script?**
- ✅ Crea backup de la tabla actual (si existe)
- ✅ Elimina tabla antigua `variantes_producto`
- ✅ Crea nueva tabla `variantes_producto` con todos los campos necesarios
- ✅ Agrega columna `variante_id` a `carrito_items` y `detalles_pedido`
- ✅ Crea funciones RPC: `get_product_variants()`, `get_product_price_range()`, `check_variant_stock()`
- ✅ Configura políticas RLS
- ✅ Crea vista `productos_con_precios`

---

### **PASO 2**: Insertar Datos de Ejemplo

```bash
# Ejecutar datos de ejemplo del iPad Pro
psql -h db.xxx.supabase.co -U postgres -d postgres \
  -f supabase/datos-ejemplo-ipad-variantes.sql
```

**O desde Supabase Dashboard**:
1. Ir a **SQL Editor**
2. Abrir archivo: [`datos-ejemplo-ipad-variantes.sql`](file:///c:/Users/rafae/Desktop/DAM%202%C2%BA/Sistema%20de%20Gesti%C3%B3n%20Empresarial/FashionStore/supabase/datos-ejemplo-ipad-variantes.sql)
3. Copiar todo el contenido
4. Pegar en SQL Editor
5. Click en **Run**

**¿Qué hace este script?**
- ✅ Inserta producto base: "iPad Pro 12.9 M2"
- ✅ Inserta 7 variantes diferentes:
  - 128GB WiFi Gris - 899€ - 12 unidades
  - 256GB WiFi Gris - 1099€ - 8 unidades
  - 512GB WiFi Gris - 1399€ - 3 unidades
  - 128GB WiFi Plata - 899€ - 5 unidades
  - 256GB Cellular Gris - 1299€ - 4 unidades
  - 512GB Cellular Plata - 1599€ - 2 unidades
  - 1TB Cellular Gris - 1799€ - 0 unidades (agotado)
- ✅ Inserta imagen del producto

---

## ✅ Verificación

Después de ejecutar ambos scripts, verifica que todo funciona:

### 1. Verificar que la tabla existe

```sql
SELECT COUNT(*) FROM variantes_producto;
-- Debería retornar: 7 (las 7 variantes del iPad)
```

### 2. Ver todas las variantes

```sql
SELECT 
  nombre_variante,
  capacidad,
  ROUND(precio_venta / 100.0, 2) AS precio_euros,
  stock,
  disponible
FROM variantes_producto
ORDER BY precio_venta ASC;
```

**Resultado esperado**:
```
nombre_variante                      | capacidad | precio_euros | stock | disponible
-------------------------------------|-----------|--------------|-------|------------
128GB WiFi Gris Espacial             | 128GB     | 899.00       | 12    | true
128GB WiFi Plata                     | 128GB     | 899.00       | 5     | true
256GB WiFi Gris Espacial             | 256GB     | 1099.00      | 8     | true
256GB WiFi + Cellular Gris Espacial  | 256GB     | 1299.00      | 4     | true
512GB WiFi Gris Espacial             | 512GB     | 1399.00      | 3     | true
512GB WiFi + Cellular Plata          | 512GB     | 1599.00      | 2     | true
1TB WiFi + Cellular Gris Espacial    | 1TB       | 1799.00      | 0     | false
```

### 3. Probar función RPC

```sql
SELECT * FROM get_product_variants('ipad-pro-129-m2');
```

### 4. Verificar rango de precios

```sql
SELECT * FROM get_product_price_range('ipad-pro-129-m2');
-- Resultado: min_price: 89900, max_price: 159900
```

---

## 🐛 Solución de Problemas

### Error: "column vp.talla does not exist"

**Solución**: Usa el script simplificado [`migracion-variantes-simple.sql`](file:///c:/Users/rafae/Desktop/DAM%202%C2%BA/Sistema%20de%20Gesti%C3%B3n%20Empresarial/FashionStore/supabase/migracion-variantes-simple.sql) en lugar de `migracion-variantes-profesional.sql`.

### Error: "relation variantes_producto already exists"

**Solución**: El script simplificado maneja esto automáticamente. Ejecuta:
```sql
DROP TABLE IF EXISTS variantes_producto CASCADE;
```
Y luego vuelve a ejecutar el script.

### Error: "function actualizar_timestamp() does not exist"

**Solución**: Esta función debería existir en tu `schema.sql`. Si no existe, agrégala:
```sql
CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 📋 Checklist de Ejecución

- [ ] **Paso 1**: Ejecutar `migracion-variantes-simple.sql`
- [ ] **Paso 2**: Verificar que no hubo errores
- [ ] **Paso 3**: Ejecutar `datos-ejemplo-ipad-variantes.sql`
- [ ] **Paso 4**: Verificar que hay 7 variantes insertadas
- [ ] **Paso 5**: Probar función `get_product_variants('ipad-pro-129-m2')`
- [ ] **Paso 6**: Continuar con implementación del frontend

---

## 📚 Archivos Disponibles

1. [`migracion-variantes-simple.sql`](file:///c:/Users/rafae/Desktop/DAM%202%C2%BA/Sistema%20de%20Gesti%C3%B3n%20Empresarial/FashionStore/supabase/migracion-variantes-simple.sql) - **USAR ESTE** (sin dependencias)
2. [`datos-ejemplo-ipad-variantes.sql`](file:///c:/Users/rafae/Desktop/DAM%202%C2%BA/Sistema%20de%20Gesti%C3%B3n%20Empresarial/FashionStore/supabase/datos-ejemplo-ipad-variantes.sql) - Datos de ejemplo
3. [`implementation_plan.md`](file:///C:/Users/rafae/.gemini/antigravity/brain/ab73dc33-6b76-44d5-9e13-81c7d7d41fd2/implementation_plan.md) - Plan completo
4. [`guia_completa.md`](file:///C:/Users/rafae/.gemini/antigravity/brain/ab73dc33-6b76-44d5-9e13-81c7d7d41fd2/guia_completa.md) - Guía detallada

---

**¡Listo para ejecutar!** 🎉
