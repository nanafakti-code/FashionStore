-- VER TODAS LAS IMÁGENES DEL IPHONE 17 CON DETALLES
SELECT 
  p.id,
  p.nombre,
  ip.id as image_id,
  ip.url,
  ip.es_principal,
  ip.orden
FROM productos p
LEFT JOIN imagenes_producto ip ON p.id = ip.producto_id
WHERE p.nombre = 'iPhone 17'
ORDER BY ip.orden;

-- ACTUALIZAR LA VISTA PARA TRAER LA PRIMERA IMAGEN (NO SOLO LA PRINCIPAL)
DROP VIEW IF EXISTS cart_items_with_products CASCADE;

CREATE VIEW cart_items_with_products AS
SELECT 
  ci.id,
  ci.user_id,
  ci.product_id,
  ci.quantity,
  ci.talla,
  ci.color,
  ci.precio_unitario,
  ci.created_at,
  p.nombre as product_name,
  COALESCE((
    SELECT url FROM imagenes_producto 
    WHERE producto_id = p.id 
    ORDER BY es_principal DESC, orden ASC 
    LIMIT 1
  ), '') as product_image,
  p.stock_total as product_stock
FROM cart_items ci
JOIN productos p ON ci.product_id = p.id;
