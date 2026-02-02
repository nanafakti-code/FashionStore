-- =====================================================
-- FIX COMPLETO: CARRITO CON SOPORTE DE VARIANTES
-- =====================================================
-- Este script añade variante_id a cart_items y actualiza todo
-- =====================================================

-- 1. Añadir columna variante_id si no existe
ALTER TABLE cart_items 
ADD COLUMN IF NOT EXISTS variante_id UUID REFERENCES variantes_producto(id) ON DELETE SET NULL;

-- 2. Eliminar índice único anterior
DROP INDEX IF EXISTS idx_cart_unique;

-- 3. Crear nuevo índice único que incluye variante_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_unique_variant 
ON cart_items(user_id, product_id, COALESCE(variante_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- 4. Crear índice para variante_id
CREATE INDEX IF NOT EXISTS idx_cart_variante ON cart_items(variante_id);

-- 5. Actualizar función get_user_cart
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
  capacity TEXT,
  variante_id UUID
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ci.id,
    ci.product_id,
    p.nombre as product_name,
    ci.quantity,
    ci.talla,
    COALESCE(v.color, ci.color) as color,
    ci.precio_unitario,
    COALESCE(v.imagen_url, ip.url, '/placeholder.png') as product_image,
    COALESCE(v.stock, p.stock_total) as product_stock,
    COALESCE(EXTRACT(EPOCH FROM (cr.expires_at - NOW()))::INT, 0) as expires_in_seconds,
    v.nombre_variante as variant_name,
    v.capacidad as capacity,
    ci.variante_id
  FROM cart_items ci
  JOIN productos p ON ci.product_id = p.id
  LEFT JOIN variantes_producto v ON ci.variante_id = v.id
  LEFT JOIN imagenes_producto ip ON ip.producto_id = p.id AND ip.es_principal = true
  LEFT JOIN cart_reservations cr ON cr.user_id = auth.uid() AND cr.product_id = ci.product_id
  WHERE ci.user_id = auth.uid()
  ORDER BY ci.created_at DESC;
END;
$$;

-- 6. Actualizar función clear_user_cart
DROP FUNCTION IF EXISTS clear_user_cart();

CREATE OR REPLACE FUNCTION clear_user_cart()
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM cart_items WHERE user_id = auth.uid();
END;
$$;

-- 7. Actualizar función migrate_guest_cart_to_user
DROP FUNCTION IF EXISTS migrate_guest_cart_to_user(jsonb);

CREATE OR REPLACE FUNCTION migrate_guest_cart_to_user(guest_items jsonb)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  item jsonb;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(guest_items)
  LOOP
    INSERT INTO cart_items (
      user_id,
      product_id,
      variante_id,
      quantity,
      talla,
      color,
      precio_unitario
    )
    VALUES (
      auth.uid(),
      (item->>'product_id')::uuid,
      CASE WHEN item->>'variant_id' IS NOT NULL AND item->>'variant_id' != '' 
           THEN (item->>'variant_id')::uuid 
           ELSE NULL 
      END,
      COALESCE((item->>'quantity')::int, 1),
      item->>'talla',
      item->>'color',
      COALESCE((item->>'precio_unitario')::int, 0)
    )
    ON CONFLICT (user_id, product_id, COALESCE(variante_id, '00000000-0000-0000-0000-000000000000'::uuid)) 
    DO UPDATE SET 
      quantity = cart_items.quantity + EXCLUDED.quantity,
      updated_at = NOW();
  END LOOP;
END;
$$;

-- 8. Función para añadir al carrito (nueva)
DROP FUNCTION IF EXISTS add_to_cart(uuid, uuid, int, text, text, int);

CREATE OR REPLACE FUNCTION add_to_cart(
  p_product_id UUID,
  p_variante_id UUID,
  p_quantity INT,
  p_talla TEXT,
  p_color TEXT,
  p_precio INT
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_cart_item_id UUID;
BEGIN
  -- Intentar actualizar si ya existe
  UPDATE cart_items
  SET quantity = quantity + p_quantity,
      updated_at = NOW()
  WHERE user_id = auth.uid()
    AND product_id = p_product_id
    AND COALESCE(variante_id, '00000000-0000-0000-0000-000000000000'::uuid) = 
        COALESCE(p_variante_id, '00000000-0000-0000-0000-000000000000'::uuid)
  RETURNING id INTO v_cart_item_id;
  
  -- Si no existe, insertar nuevo
  IF v_cart_item_id IS NULL THEN
    INSERT INTO cart_items (
      user_id,
      product_id,
      variante_id,
      quantity,
      talla,
      color,
      precio_unitario
    )
    VALUES (
      auth.uid(),
      p_product_id,
      p_variante_id,
      p_quantity,
      p_talla,
      p_color,
      p_precio
    )
    RETURNING id INTO v_cart_item_id;
  END IF;
  
  RETURN v_cart_item_id;
END;
$$;

-- Verificación
SELECT 'Cart system with variants configured successfully' as resultado;
