-- VERIFICAR IMÁGENES DEL IPHONE 17
SELECT 
  p.id,
  p.nombre,
  COUNT(ip.id) as total_imagenes,
  SUM(CASE WHEN ip.es_principal = true THEN 1 ELSE 0 END) as imagenes_principales
FROM productos p
LEFT JOIN imagenes_producto ip ON p.id = ip.producto_id
WHERE p.nombre LIKE '%iPhone%17%' OR p.nombre LIKE '%iPhone 17%'
GROUP BY p.id, p.nombre;

-- VER TODAS LAS IMÁGENES DEL IPHONE 17
SELECT 
  p.nombre,
  ip.id,
  ip.url,
  ip.es_principal,
  ip.orden
FROM productos p
LEFT JOIN imagenes_producto ip ON p.id = ip.producto_id
WHERE p.nombre LIKE '%iPhone%' AND p.nombre LIKE '%17%'
ORDER BY p.nombre, ip.orden;
