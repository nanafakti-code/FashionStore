-- VER TODOS LOS IPHONES DISPONIBLES
SELECT 
  p.id,
  p.nombre,
  p.precio_venta,
  COUNT(ip.id) as total_imagenes
FROM productos p
LEFT JOIN imagenes_producto ip ON p.id = ip.producto_id
WHERE p.nombre ILIKE '%iphone%' AND p.activo = true
GROUP BY p.id, p.nombre, p.precio_venta
ORDER BY p.nombre;

-- VER TODOS LOS PRODUCTOS QUE EMPIEZAN CON LETRA "I" (POR SI EL NOMBRE ES DIFERENTE)
SELECT 
  p.id,
  p.nombre,
  p.precio_venta,
  COUNT(ip.id) as total_imagenes
FROM productos p
LEFT JOIN imagenes_producto ip ON p.id = ip.producto_id
WHERE p.nombre ILIKE 'i%' AND p.activo = true AND p.categoria_id IN (
  SELECT id FROM categorias WHERE nombre ILIKE '%móvil%' OR nombre ILIKE '%smartphone%'
)
GROUP BY p.id, p.nombre, p.precio_venta
ORDER BY p.nombre
LIMIT 10;
