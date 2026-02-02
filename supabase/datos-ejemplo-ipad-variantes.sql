-- =====================================================
-- DATOS DE EJEMPLO: iPad Pro 12.9 M2
-- =====================================================
-- Este script inserta datos de ejemplo para demostrar
-- el sistema de variantes profesional
-- =====================================================

-- Limpiar datos de ejemplo anteriores (opcional)
DELETE FROM variantes_producto WHERE producto_id IN (
  SELECT id FROM productos WHERE slug = 'ipad-pro-129-m2'
);

-- =====================================================
-- PRODUCTO BASE: iPad Pro 12.9 M2
-- =====================================================

-- Insertar o actualizar producto base
INSERT INTO productos (
  nombre, 
  slug, 
  descripcion, 
  descripcion_larga,
  precio_venta,
  stock_total,
  categoria_id, 
  marca_id, 
  genero,
  destacado, 
  activo
)
VALUES (
  'iPad Pro 12.9 M2',
  'ipad-pro-129-m2',
  'Tablet profesional de Apple con chip M2 y pantalla Liquid Retina XDR',
  'iPad Pro 12.9 pulgadas con chip M2, pantalla Liquid Retina XDR de 12.9", cámara TrueDepth frontal y sistema de cámaras traseras avanzado. Perfecto para profesionales creativos, diseñadores y usuarios exigentes. Incluye garantía de 24 meses.',
  89900,  -- Precio base (precio más bajo de las variantes)
  34,     -- Stock total (suma de todas las variantes: 12+8+3+5+4+2+0)
  (SELECT id FROM categorias WHERE slug = 'tablets'),
  (SELECT id FROM marcas WHERE slug = 'apple'),
  'Unisex',
  TRUE,
  TRUE
)
ON CONFLICT (slug) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion,
  descripcion_larga = EXCLUDED.descripcion_larga,
  precio_venta = EXCLUDED.precio_venta,
  stock_total = EXCLUDED.stock_total,
  destacado = EXCLUDED.destacado,
  activo = EXCLUDED.activo;

-- =====================================================
-- VARIANTES DEL PRODUCTO
-- =====================================================

-- Variante 1: 128GB WiFi Gris Espacial (PRINCIPAL - MÁS BARATA)
INSERT INTO variantes_producto (
  producto_id,
  nombre_variante,
  sku_variante,
  precio_venta,
  precio_original,
  costo,
  stock,
  stock_minimo,
  capacidad,
  color,
  estado,
  conectividad,
  disponible,
  es_principal,
  peso_gramos,
  dimensiones
) VALUES (
  (SELECT id FROM productos WHERE slug = 'ipad-pro-129-m2'),
  '128GB WiFi Gris Espacial',
  'IPAD-PRO-129-M2-128GB-WIFI-GREY',
  89900,   -- 899€
  129900,  -- Antes 1299€ (31% descuento)
  60000,   -- Costo 600€
  12,      -- 12 unidades en stock
  5,       -- Alerta cuando queden 5
  '128GB',
  'Gris Espacial',
  'Excelente',
  'WiFi',
  TRUE,
  TRUE,    -- Variante principal
  682,
  '280.6 x 214.9 x 6.4 mm'
)
ON CONFLICT (sku_variante) DO UPDATE SET
  precio_venta = EXCLUDED.precio_venta,
  stock = EXCLUDED.stock,
  disponible = EXCLUDED.disponible;

-- Variante 2: 256GB WiFi Gris Espacial (PRECIO MEDIO)
INSERT INTO variantes_producto (
  producto_id,
  nombre_variante,
  sku_variante,
  precio_venta,
  precio_original,
  costo,
  stock,
  stock_minimo,
  capacidad,
  color,
  estado,
  conectividad,
  disponible,
  es_principal,
  peso_gramos,
  dimensiones
) VALUES (
  (SELECT id FROM productos WHERE slug = 'ipad-pro-129-m2'),
  '256GB WiFi Gris Espacial',
  'IPAD-PRO-129-M2-256GB-WIFI-GREY',
  109900,  -- 1099€ (+200€ vs 128GB)
  149900,  -- Antes 1499€
  70000,
  8,       -- 8 unidades
  5,
  '256GB',
  'Gris Espacial',
  'Excelente',
  'WiFi',
  TRUE,
  FALSE,
  682,
  '280.6 x 214.9 x 6.4 mm'
)
ON CONFLICT (sku_variante) DO UPDATE SET
  precio_venta = EXCLUDED.precio_venta,
  stock = EXCLUDED.stock;

-- Variante 3: 512GB WiFi Gris Espacial (MÁS CARA)
INSERT INTO variantes_producto (
  producto_id,
  nombre_variante,
  sku_variante,
  precio_venta,
  precio_original,
  costo,
  stock,
  stock_minimo,
  capacidad,
  color,
  estado,
  conectividad,
  disponible,
  es_principal,
  peso_gramos,
  dimensiones
) VALUES (
  (SELECT id FROM productos WHERE slug = 'ipad-pro-129-m2'),
  '512GB WiFi Gris Espacial',
  'IPAD-PRO-129-M2-512GB-WIFI-GREY',
  139900,  -- 1399€ (+500€ vs 128GB)
  189900,  -- Antes 1899€
  85000,
  3,       -- Solo 3 unidades (STOCK BAJO)
  5,
  '512GB',
  'Gris Espacial',
  'Excelente',
  'WiFi',
  TRUE,
  FALSE,
  682,
  '280.6 x 214.9 x 6.4 mm'
)
ON CONFLICT (sku_variante) DO UPDATE SET
  precio_venta = EXCLUDED.precio_venta,
  stock = EXCLUDED.stock;

-- Variante 4: 128GB WiFi Plata (MISMO PRECIO, OTRO COLOR)
INSERT INTO variantes_producto (
  producto_id,
  nombre_variante,
  sku_variante,
  precio_venta,
  precio_original,
  costo,
  stock,
  stock_minimo,
  capacidad,
  color,
  estado,
  conectividad,
  disponible,
  es_principal,
  peso_gramos,
  dimensiones
) VALUES (
  (SELECT id FROM productos WHERE slug = 'ipad-pro-129-m2'),
  '128GB WiFi Plata',
  'IPAD-PRO-129-M2-128GB-WIFI-SILVER',
  89900,   -- Mismo precio que gris
  129900,
  60000,
  5,       -- 5 unidades
  5,
  '128GB',
  'Plata',
  'Excelente',
  'WiFi',
  TRUE,
  FALSE,
  682,
  '280.6 x 214.9 x 6.4 mm'
)
ON CONFLICT (sku_variante) DO UPDATE SET
  precio_venta = EXCLUDED.precio_venta,
  stock = EXCLUDED.stock;

-- Variante 5: 256GB WiFi + Cellular Gris Espacial (MÁS CARA POR CONECTIVIDAD)
INSERT INTO variantes_producto (
  producto_id,
  nombre_variante,
  sku_variante,
  precio_venta,
  precio_original,
  costo,
  stock,
  stock_minimo,
  capacidad,
  color,
  estado,
  conectividad,
  disponible,
  es_principal,
  peso_gramos,
  dimensiones
) VALUES (
  (SELECT id FROM productos WHERE slug = 'ipad-pro-129-m2'),
  '256GB WiFi + Cellular Gris Espacial',
  'IPAD-PRO-129-M2-256GB-CELL-GREY',
  129900,  -- 1299€ (+200€ vs WiFi solo)
  169900,
  80000,
  4,       -- 4 unidades
  5,
  '256GB',
  'Gris Espacial',
  'Excelente',
  'WiFi + Cellular',
  TRUE,
  FALSE,
  684,     -- Ligeramente más pesado
  '280.6 x 214.9 x 6.4 mm'
)
ON CONFLICT (sku_variante) DO UPDATE SET
  precio_venta = EXCLUDED.precio_venta,
  stock = EXCLUDED.stock;

-- Variante 6: 512GB WiFi + Cellular Plata (PREMIUM)
INSERT INTO variantes_producto (
  producto_id,
  nombre_variante,
  sku_variante,
  precio_venta,
  precio_original,
  costo,
  stock,
  stock_minimo,
  capacidad,
  color,
  estado,
  conectividad,
  disponible,
  es_principal,
  peso_gramos,
  dimensiones
) VALUES (
  (SELECT id FROM productos WHERE slug = 'ipad-pro-129-m2'),
  '512GB WiFi + Cellular Plata',
  'IPAD-PRO-129-M2-512GB-CELL-SILVER',
  159900,  -- 1599€ (MODELO PREMIUM)
  209900,
  95000,
  2,       -- Solo 2 unidades
  5,
  '512GB',
  'Plata',
  'Excelente',
  'WiFi + Cellular',
  TRUE,
  FALSE,
  684,
  '280.6 x 214.9 x 6.4 mm'
)
ON CONFLICT (sku_variante) DO UPDATE SET
  precio_venta = EXCLUDED.precio_venta,
  stock = EXCLUDED.stock;

-- Variante 7: 1TB WiFi + Cellular Gris Espacial (SIN STOCK - EJEMPLO)
INSERT INTO variantes_producto (
  producto_id,
  nombre_variante,
  sku_variante,
  precio_venta,
  precio_original,
  costo,
  stock,
  stock_minimo,
  capacidad,
  color,
  estado,
  conectividad,
  disponible,
  es_principal,
  peso_gramos,
  dimensiones
) VALUES (
  (SELECT id FROM productos WHERE slug = 'ipad-pro-129-m2'),
  '1TB WiFi + Cellular Gris Espacial',
  'IPAD-PRO-129-M2-1TB-CELL-GREY',
  179900,  -- 1799€
  229900,
  105000,
  0,       -- SIN STOCK
  5,
  '1TB',
  'Gris Espacial',
  'Excelente',
  'WiFi + Cellular',
  FALSE,   -- No disponible
  FALSE,
  684,
  '280.6 x 214.9 x 6.4 mm'
)
ON CONFLICT (sku_variante) DO UPDATE SET
  precio_venta = EXCLUDED.precio_venta,
  stock = EXCLUDED.stock,
  disponible = EXCLUDED.disponible;

-- =====================================================
-- IMÁGENES DEL PRODUCTO
-- =====================================================

-- Insertar imagen principal del producto
INSERT INTO imagenes_producto (producto_id, url, es_principal, orden, alt_text)
VALUES (
  (SELECT id FROM productos WHERE slug = 'ipad-pro-129-m2'),
  'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=800&fit=crop',
  TRUE,
  1,
  'iPad Pro 12.9 M2 - Vista frontal'
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- VERIFICACIÓN DE DATOS
-- =====================================================

-- Mostrar resumen de variantes creadas
SELECT 
  nombre_variante,
  capacidad,
  color,
  conectividad,
  ROUND(precio_venta / 100.0, 2) AS precio_euros,
  ROUND(precio_original / 100.0, 2) AS precio_original_euros,
  ROUND((precio_original - precio_venta) * 100.0 / precio_original, 0) AS descuento_porcentaje,
  stock,
  CASE 
    WHEN stock = 0 THEN 'AGOTADO'
    WHEN stock < stock_minimo THEN 'STOCK BAJO'
    ELSE 'DISPONIBLE'
  END AS estado_stock,
  disponible,
  es_principal
FROM variantes_producto
WHERE producto_id = (SELECT id FROM productos WHERE slug = 'ipad-pro-129-m2')
ORDER BY precio_venta ASC;

-- Verificar rango de precios
SELECT * FROM get_product_price_range('ipad-pro-129-m2');

-- Verificar variantes disponibles
SELECT * FROM get_product_variants('ipad-pro-129-m2');

-- =====================================================
-- FIN DE DATOS DE EJEMPLO
-- =====================================================
