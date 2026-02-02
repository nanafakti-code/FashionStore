-- =====================================================
-- ACTUALIZAR get_user_cart() PARA SOPORTAR VARIANTES
-- =====================================================

DROP FUNCTION IF EXISTS get_user_cart();

CREATE OR REPLACE FUNCTION get_user_cart()
RETURNS TABLE (
  id UUID,
  product_id UUID,
  product_name TEXT,
  quantity INT,
  talla TEXT,
  color TEXT,
  precio_unitario INTEGER,
  product_image TEXT,
  product_stock INT,
  expires_in_seconds INT,
  variant_name TEXT,
  capacity TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ci.id,
    ci.producto_id,
    p.nombre,
    ci.cantidad,
    ci.talla,
    v.color,
    ci.precio_unitario,
    COALESCE(v.imagen_url, p.imagen_principal) as product_image,
    COALESCE(v.stock, p.stock_total) as product_stock,
    EXTRACT(EPOCH FROM (cr.expires_at - NOW()))::INT as expires_in_seconds,
    v.nombre_variante as variant_name,
    v.capacidad as capacity
  FROM carrito_items ci
  JOIN productos p ON ci.producto_id = p.id
  LEFT JOIN variantes_producto v ON ci.variante_id = v.id
  LEFT JOIN cart_reservations cr ON cr.user_id = auth.uid() AND cr.product_id = ci.producto_id
  WHERE ci.usuario_id = auth.uid()
  ORDER BY ci.creado_en DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar
SELECT 'Function get_user_cart() updated for variants' as resultado;
