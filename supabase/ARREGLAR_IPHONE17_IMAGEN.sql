-- VER DETALLES DE IMÁGENES DEL IPHONE 17
SELECT 
  p.nombre,
  p.id,
  ip.id as image_id,
  ip.url,
  ip.es_principal,
  ip.orden
FROM productos p
LEFT JOIN imagenes_producto ip ON p.id = ip.producto_id
WHERE p.nombre = 'iPhone 17';

-- MARCAR LA IMAGEN DEL IPHONE 17 COMO PRINCIPAL
UPDATE imagenes_producto
SET es_principal = true
WHERE id IN (
  SELECT ip.id
  FROM imagenes_producto ip
  JOIN productos p ON p.id = ip.producto_id
  WHERE p.nombre = 'iPhone 17'
  LIMIT 1
);

-- VERIFICAR QUE SE ACTUALIZÓ
SELECT 
  p.nombre,
  ip.url,
  ip.es_principal
FROM productos p
LEFT JOIN imagenes_producto ip ON p.id = ip.producto_id
WHERE p.nombre = 'iPhone 17';
