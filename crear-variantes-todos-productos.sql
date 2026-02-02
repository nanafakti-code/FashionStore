-- =====================================================
-- CREAR VARIANTES PARA TODOS LOS PRODUCTOS
-- =====================================================
-- Este script crea variantes automáticas para todos los productos
-- según su categoría (tablets, portátiles, smartphones, etc.)
-- =====================================================

-- =====================================================
-- PASO 1: Crear variantes para TABLETS
-- =====================================================

INSERT INTO variantes_producto (
  producto_id,
  nombre_variante,
  sku_variante,
  precio_venta,
  precio_original,
  stock,
  capacidad,
  color,
  estado,
  disponible,
  es_principal
)
SELECT 
  p.id,
  '128GB ' || COALESCE(c.nombre, 'Negro'),
  UPPER(REPLACE(p.slug, '-', '_')) || '_128GB_' || UPPER(REPLACE(COALESCE(c.nombre, 'NEGRO'), ' ', '_')),
  p.precio_venta,
  CASE WHEN p.precio_original IS NOT NULL THEN p.precio_original ELSE p.precio_venta + (p.precio_venta * 0.3)::INTEGER END,
  FLOOR(RANDOM() * 10 + 5)::INTEGER,
  '128GB',
  c.nombre,
  'Excelente',
  TRUE,
  TRUE
FROM productos p
CROSS JOIN (VALUES ('Negro'), ('Blanco'), ('Gris Espacial')) AS c(nombre)
WHERE p.categoria_id = (SELECT id FROM categorias WHERE slug = 'tablets' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM variantes_producto WHERE producto_id = p.id)
ON CONFLICT (sku_variante) DO NOTHING;

INSERT INTO variantes_producto (
  producto_id,
  nombre_variante,
  sku_variante,
  precio_venta,
  precio_original,
  stock,
  capacidad,
  color,
  estado,
  disponible,
  es_principal
)
SELECT 
  p.id,
  '256GB ' || COALESCE(c.nombre, 'Negro'),
  UPPER(REPLACE(p.slug, '-', '_')) || '_256GB_' || UPPER(REPLACE(COALESCE(c.nombre, 'NEGRO'), ' ', '_')),
  p.precio_venta + 20000,
  CASE WHEN p.precio_original IS NOT NULL THEN p.precio_original + 20000 ELSE p.precio_venta + 20000 + (p.precio_venta * 0.3)::INTEGER END,
  FLOOR(RANDOM() * 8 + 3)::INTEGER,
  '256GB',
  c.nombre,
  'Excelente',
  TRUE,
  FALSE
FROM productos p
CROSS JOIN (VALUES ('Negro'), ('Blanco'), ('Gris Espacial')) AS c(nombre)
WHERE p.categoria_id = (SELECT id FROM categorias WHERE slug = 'tablets' LIMIT 1)
ON CONFLICT (sku_variante) DO NOTHING;

INSERT INTO variantes_producto (
  producto_id,
  nombre_variante,
  sku_variante,
  precio_venta,
  precio_original,
  stock,
  capacidad,
  color,
  estado,
  disponible,
  es_principal
)
SELECT 
  p.id,
  '512GB ' || COALESCE(c.nombre, 'Negro'),
  UPPER(REPLACE(p.slug, '-', '_')) || '_512GB_' || UPPER(REPLACE(COALESCE(c.nombre, 'NEGRO'), ' ', '_')),
  p.precio_venta + 40000,
  CASE WHEN p.precio_original IS NOT NULL THEN p.precio_original + 40000 ELSE p.precio_venta + 40000 + (p.precio_venta * 0.3)::INTEGER END,
  FLOOR(RANDOM() * 5 + 1)::INTEGER,
  '512GB',
  c.nombre,
  'Excelente',
  TRUE,
  FALSE
FROM productos p
CROSS JOIN (VALUES ('Negro'), ('Blanco'), ('Gris Espacial')) AS c(nombre)
WHERE p.categoria_id = (SELECT id FROM categorias WHERE slug = 'tablets' LIMIT 1)
ON CONFLICT (sku_variante) DO NOTHING;

-- =====================================================
-- PASO 2: Crear variantes para PORTÁTILES
-- =====================================================

INSERT INTO variantes_producto (
  producto_id,
  nombre_variante,
  sku_variante,
  precio_venta,
  precio_original,
  stock,
  capacidad,
  color,
  estado,
  disponible,
  es_principal
)
SELECT 
  p.id,
  '256GB SSD ' || COALESCE(c.nombre, 'Gris'),
  UPPER(REPLACE(p.slug, '-', '_')) || '_256GB_' || UPPER(REPLACE(COALESCE(c.nombre, 'GRIS'), ' ', '_')),
  p.precio_venta,
  CASE WHEN p.precio_original IS NOT NULL THEN p.precio_original ELSE p.precio_venta + (p.precio_venta * 0.3)::INTEGER END,
  FLOOR(RANDOM() * 8 + 3)::INTEGER,
  '256GB SSD',
  c.nombre,
  'Excelente',
  TRUE,
  TRUE
FROM productos p
CROSS JOIN (VALUES ('Gris'), ('Plata'), ('Negro')) AS c(nombre)
WHERE p.categoria_id = (SELECT id FROM categorias WHERE slug = 'portatiles' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM variantes_producto WHERE producto_id = p.id)
ON CONFLICT (sku_variante) DO NOTHING;

INSERT INTO variantes_producto (
  producto_id,
  nombre_variante,
  sku_variante,
  precio_venta,
  precio_original,
  stock,
  capacidad,
  color,
  estado,
  disponible,
  es_principal
)
SELECT 
  p.id,
  '512GB SSD ' || COALESCE(c.nombre, 'Gris'),
  UPPER(REPLACE(p.slug, '-', '_')) || '_512GB_' || UPPER(REPLACE(COALESCE(c.nombre, 'GRIS'), ' ', '_')),
  p.precio_venta + 25000,
  CASE WHEN p.precio_original IS NOT NULL THEN p.precio_original + 25000 ELSE p.precio_venta + 25000 + (p.precio_venta * 0.3)::INTEGER END,
  FLOOR(RANDOM() * 6 + 2)::INTEGER,
  '512GB SSD',
  c.nombre,
  'Excelente',
  TRUE,
  FALSE
FROM productos p
CROSS JOIN (VALUES ('Gris'), ('Plata'), ('Negro')) AS c(nombre)
WHERE p.categoria_id = (SELECT id FROM categorias WHERE slug = 'portatiles' LIMIT 1)
ON CONFLICT (sku_variante) DO NOTHING;

INSERT INTO variantes_producto (
  producto_id,
  nombre_variante,
  sku_variante,
  precio_venta,
  precio_original,
  stock,
  capacidad,
  color,
  estado,
  disponible,
  es_principal
)
SELECT 
  p.id,
  '1TB SSD ' || COALESCE(c.nombre, 'Gris'),
  UPPER(REPLACE(p.slug, '-', '_')) || '_1TB_' || UPPER(REPLACE(COALESCE(c.nombre, 'GRIS'), ' ', '_')),
  p.precio_venta + 50000,
  CASE WHEN p.precio_original IS NOT NULL THEN p.precio_original + 50000 ELSE p.precio_venta + 50000 + (p.precio_venta * 0.3)::INTEGER END,
  FLOOR(RANDOM() * 4 + 1)::INTEGER,
  '1TB SSD',
  c.nombre,
  'Excelente',
  TRUE,
  FALSE
FROM productos p
CROSS JOIN (VALUES ('Gris'), ('Plata'), ('Negro')) AS c(nombre)
WHERE p.categoria_id = (SELECT id FROM categorias WHERE slug = 'portatiles' LIMIT 1)
ON CONFLICT (sku_variante) DO NOTHING;

-- =====================================================
-- PASO 3: Crear variantes para SMARTPHONES
-- =====================================================

INSERT INTO variantes_producto (
  producto_id,
  nombre_variante,
  sku_variante,
  precio_venta,
  precio_original,
  stock,
  capacidad,
  color,
  estado,
  disponible,
  es_principal
)
SELECT 
  p.id,
  '64GB ' || COALESCE(c.nombre, 'Negro'),
  UPPER(REPLACE(p.slug, '-', '_')) || '_64GB_' || UPPER(REPLACE(COALESCE(c.nombre, 'NEGRO'), ' ', '_')),
  p.precio_venta,
  CASE WHEN p.precio_original IS NOT NULL THEN p.precio_original ELSE p.precio_venta + (p.precio_venta * 0.3)::INTEGER END,
  FLOOR(RANDOM() * 12 + 5)::INTEGER,
  '64GB',
  c.nombre,
  'Excelente',
  TRUE,
  TRUE
FROM productos p
CROSS JOIN (VALUES ('Negro'), ('Blanco'), ('Azul'), ('Rojo')) AS c(nombre)
WHERE p.categoria_id = (SELECT id FROM categorias WHERE slug = 'smartphones' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM variantes_producto WHERE producto_id = p.id)
ON CONFLICT (sku_variante) DO NOTHING;

INSERT INTO variantes_producto (
  producto_id,
  nombre_variante,
  sku_variante,
  precio_venta,
  precio_original,
  stock,
  capacidad,
  color,
  estado,
  disponible,
  es_principal
)
SELECT 
  p.id,
  '128GB ' || COALESCE(c.nombre, 'Negro'),
  UPPER(REPLACE(p.slug, '-', '_')) || '_128GB_' || UPPER(REPLACE(COALESCE(c.nombre, 'NEGRO'), ' ', '_')),
  p.precio_venta + 10000,
  CASE WHEN p.precio_original IS NOT NULL THEN p.precio_original + 10000 ELSE p.precio_venta + 10000 + (p.precio_venta * 0.3)::INTEGER END,
  FLOOR(RANDOM() * 10 + 4)::INTEGER,
  '128GB',
  c.nombre,
  'Excelente',
  TRUE,
  FALSE
FROM productos p
CROSS JOIN (VALUES ('Negro'), ('Blanco'), ('Azul'), ('Rojo')) AS c(nombre)
WHERE p.categoria_id = (SELECT id FROM categorias WHERE slug = 'smartphones' LIMIT 1)
ON CONFLICT (sku_variante) DO NOTHING;

INSERT INTO variantes_producto (
  producto_id,
  nombre_variante,
  sku_variante,
  precio_venta,
  precio_original,
  stock,
  capacidad,
  color,
  estado,
  disponible,
  es_principal
)
SELECT 
  p.id,
  '256GB ' || COALESCE(c.nombre, 'Negro'),
  UPPER(REPLACE(p.slug, '-', '_')) || '_256GB_' || UPPER(REPLACE(COALESCE(c.nombre, 'NEGRO'), ' ', '_')),
  p.precio_venta + 20000,
  CASE WHEN p.precio_original IS NOT NULL THEN p.precio_original + 20000 ELSE p.precio_venta + 20000 + (p.precio_venta * 0.3)::INTEGER END,
  FLOOR(RANDOM() * 8 + 2)::INTEGER,
  '256GB',
  c.nombre,
  'Excelente',
  TRUE,
  FALSE
FROM productos p
CROSS JOIN (VALUES ('Negro'), ('Blanco'), ('Azul'), ('Rojo')) AS c(nombre)
WHERE p.categoria_id = (SELECT id FROM categorias WHERE slug = 'smartphones' LIMIT 1)
ON CONFLICT (sku_variante) DO NOTHING;

-- =====================================================
-- PASO 4: Crear variantes para OTROS PRODUCTOS
-- =====================================================

INSERT INTO variantes_producto (
  producto_id,
  nombre_variante,
  sku_variante,
  precio_venta,
  precio_original,
  stock,
  capacidad,
  color,
  estado,
  disponible,
  es_principal
)
SELECT 
  p.id,
  'Estándar ' || COALESCE(c.nombre, 'Negro'),
  UPPER(REPLACE(p.slug, '-', '_')) || '_STD_' || UPPER(REPLACE(COALESCE(c.nombre, 'NEGRO'), ' ', '_')),
  p.precio_venta,
  CASE WHEN p.precio_original IS NOT NULL THEN p.precio_original ELSE p.precio_venta + (p.precio_venta * 0.3)::INTEGER END,
  FLOOR(RANDOM() * 15 + 5)::INTEGER,
  'Estándar',
  c.nombre,
  'Excelente',
  TRUE,
  TRUE
FROM productos p
CROSS JOIN (VALUES ('Negro'), ('Blanco'), ('Gris')) AS c(nombre)
WHERE p.categoria_id NOT IN (
  SELECT id FROM categorias WHERE slug IN ('tablets', 'portatiles', 'smartphones')
)
AND NOT EXISTS (SELECT 1 FROM variantes_producto WHERE producto_id = p.id)
ON CONFLICT (sku_variante) DO NOTHING;

-- =====================================================
-- PASO 5: Actualizar stock_total en productos
-- =====================================================

UPDATE productos p
SET stock_total = (
  SELECT COALESCE(SUM(v.stock), 0)
  FROM variantes_producto v
  WHERE v.producto_id = p.id
    AND v.disponible = TRUE
)
WHERE EXISTS (
  SELECT 1 FROM variantes_producto WHERE producto_id = p.id
);

-- =====================================================
-- PASO 6: Actualizar precio_venta en productos (precio mínimo)
-- =====================================================

UPDATE productos p
SET precio_venta = (
  SELECT MIN(v.precio_venta)
  FROM variantes_producto v
  WHERE v.producto_id = p.id
    AND v.disponible = TRUE
    AND v.stock > 0
)
WHERE EXISTS (
  SELECT 1 FROM variantes_producto WHERE producto_id = p.id
);

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Mostrar resumen por categoría
SELECT 
  c.nombre AS categoria,
  COUNT(DISTINCT p.id) AS total_productos,
  COUNT(v.id) AS total_variantes,
  ROUND(AVG(v.stock), 2) AS stock_promedio
FROM categorias c
LEFT JOIN productos p ON c.id = p.categoria_id
LEFT JOIN variantes_producto v ON p.id = v.producto_id
GROUP BY c.nombre
ORDER BY total_variantes DESC;

-- Mostrar productos sin variantes
SELECT 
  p.nombre,
  c.nombre AS categoria
FROM productos p
LEFT JOIN categorias c ON p.categoria_id = c.id
WHERE NOT EXISTS (
  SELECT 1 FROM variantes_producto WHERE producto_id = p.id
)
ORDER BY c.nombre, p.nombre;

-- =====================================================
-- FIN
-- =====================================================
