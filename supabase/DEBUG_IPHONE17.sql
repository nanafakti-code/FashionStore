-- VERIFICACIÓN COMPLETA DEL IPHONE 17
-- 1. Ver si el producto existe
SELECT id, nombre, activo FROM productos WHERE nombre = 'iPhone 17';

-- 2. Ver TODAS las imágenes del iPhone 17 (sin filtros)
SELECT 
  ip.id,
  ip.producto_id,
  ip.url,
  ip.es_principal,
  ip.orden,
  ip.alt_text
FROM imagenes_producto ip
WHERE ip.producto_id = (SELECT id FROM productos WHERE nombre = 'iPhone 17' LIMIT 1);

-- 3. Contar imágenes
SELECT COUNT(*) as total
FROM imagenes_producto ip
WHERE ip.producto_id = (SELECT id FROM productos WHERE nombre = 'iPhone 17' LIMIT 1);

-- 4. Ver la URL exacta
SELECT url FROM imagenes_producto WHERE producto_id = (SELECT id FROM productos WHERE nombre = 'iPhone 17' LIMIT 1);
