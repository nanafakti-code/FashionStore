-- ACTUALIZAR VISTA DEL CARRITO PARA INCLUIR TIEMPO DE EXPIRACIÓN
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
  p.stock_total as product_stock,
  COALESCE(EXTRACT(EPOCH FROM (cr.expires_at - NOW()))::INT, 0) as expires_in_seconds
FROM cart_items ci
JOIN productos p ON ci.product_id = p.id
LEFT JOIN cart_reservations cr ON cr.user_id = ci.user_id AND cr.product_id = ci.product_id;

-- LISTO
SELECT '✅ VISTA ACTUALIZADA CON TIEMPOS DE EXPIRACIÓN' AS resultado;
