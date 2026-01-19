-- AGREGAR IMAGEN AL IPHONE 17
-- Primero, verifica que el producto existe
SELECT id FROM productos WHERE nombre = 'iPhone 17';

-- Luego, agregar una imagen principal
INSERT INTO imagenes_producto (
  producto_id,
  url,
  alt_text,
  orden,
  es_principal
) VALUES (
  (SELECT id FROM productos WHERE nombre = 'iPhone 17' LIMIT 1),
  'https://via.placeholder.com/500x700?text=iPhone+17',
  'iPhone 17',
  1,
  true
);

-- Verificar que se agregó
SELECT 
  p.nombre,
  ip.url,
  ip.es_principal
FROM productos p
LEFT JOIN imagenes_producto ip ON p.id = ip.producto_id
WHERE p.nombre = 'iPhone 17';
