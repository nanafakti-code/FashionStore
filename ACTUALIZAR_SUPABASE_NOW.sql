-- =====================================================
-- EJECUTAR ESTO EN SUPABASE SQL EDITOR
-- =====================================================
-- Esto actualiza la función get_user_cart() para incluir
-- los tiempos de expiración de las reservas

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
  expires_in_seconds INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ci.id,
    ci.product_id,
    p.nombre,
    ci.quantity,
    ci.talla,
    ci.color,
    ci.precio_unitario,
    p.imagen_principal,
    p.stock_total,
    CASE 
      WHEN cr.expires_at IS NOT NULL AND cr.expires_at > NOW() THEN 
        EXTRACT(EPOCH FROM (cr.expires_at - NOW()))::INT 
      ELSE 0 
    END as expires_in_seconds
  FROM cart_items ci
  JOIN productos p ON ci.product_id = p.id
  LEFT JOIN cart_reservations cr ON cr.user_id = auth.uid() AND cr.product_id = ci.product_id
  WHERE ci.user_id = auth.uid()
  ORDER BY ci.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 'OK: get_user_cart() actualizada con expires_in_seconds' as resultado;
