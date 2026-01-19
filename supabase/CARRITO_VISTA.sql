-- CREAR VISTA PARA EL CARRITO CON PRODUCTOS
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
  COALESCE(ip.url, '') as product_image,
  p.stock_total as product_stock
FROM cart_items ci
JOIN productos p ON ci.product_id = p.id
LEFT JOIN imagenes_producto ip ON p.id = ip.producto_id AND ip.es_principal = true;

-- ACTUALIZAR RPC PARA USAR LA VISTA
DROP FUNCTION IF EXISTS get_user_cart();

CREATE OR REPLACE FUNCTION get_user_cart()
RETURNS TABLE (
  id UUID,
  product_id UUID,
  quantity INT,
  talla TEXT,
  color TEXT,
  precio_unitario INTEGER,
  product_name TEXT,
  product_image TEXT,
  product_stock INT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cip.id,
    cip.product_id,
    cip.quantity,
    cip.talla,
    cip.color,
    cip.precio_unitario,
    cip.product_name,
    cip.product_image,
    cip.product_stock,
    cip.created_at
  FROM cart_items_with_products cip
  WHERE cip.user_id = auth.uid()
  ORDER BY cip.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- LISTO
SELECT '✅ VISTA Y RPC ACTUALIZADOS' AS resultado;
