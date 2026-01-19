-- =====================================================
-- FASHIONSTORE - SETUP CARRITO CON RLS
-- =====================================================
-- Sistema de carrito completo con:
-- 1. Tabla mejorada que soporta usuarios autenticados y guests
-- 2. Políticas RLS para seguridad
-- 3. Índices para performance
-- =====================================================

-- =====================================================
-- PASO 1: RECREAR TABLA carrito_items CON user_id DIRECTO
-- =====================================================
-- Eliminamos la tabla antigua de carrito si existe
DROP TABLE IF EXISTS carrito_items CASCADE;
DROP TABLE IF EXISTS carrito CASCADE;

-- Nueva estructura: cart_items con user_id NOT NULL
-- Cada usuario autenticado tiene su carrito (único por usuario)
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  quantity INT NOT NULL CHECK (quantity > 0),
  talla TEXT,
  color TEXT,
  precio_unitario INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CONSTRAINT DE UNICIDAD: Un usuario no puede tener el mismo producto 2 veces
-- con las mismas características (talla y color)
CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_items_unique 
  ON cart_items(user_id, product_id, COALESCE(talla, ''), COALESCE(color, ''));

-- Índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);

-- =====================================================
-- PASO 2: ENABLE RLS EN TABLA cart_items
-- =====================================================
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PASO 3: POLÍTICAS RLS
-- =====================================================

-- POLÍTICA 1: SELECT - Usuarios solo ven su propio carrito
DROP POLICY IF EXISTS "Users can view their own cart items" ON cart_items;
CREATE POLICY "Users can view their own cart items"
  ON cart_items
  FOR SELECT
  USING (auth.uid() = user_id);

-- POLÍTICA 2: INSERT - Usuarios pueden insertar solo en su carrito
DROP POLICY IF EXISTS "Users can insert their own cart items" ON cart_items;
CREATE POLICY "Users can insert their own cart items"
  ON cart_items
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- POLÍTICA 3: UPDATE - Usuarios pueden actualizar solo su carrito
DROP POLICY IF EXISTS "Users can update their own cart items" ON cart_items;
CREATE POLICY "Users can update their own cart items"
  ON cart_items
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- POLÍTICA 4: DELETE - Usuarios pueden eliminar solo de su carrito
DROP POLICY IF EXISTS "Users can delete their own cart items" ON cart_items;
CREATE POLICY "Users can delete their own cart items"
  ON cart_items
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- PASO 4: FUNCIÓN PARA MIGRAR CARRITO INVITADO A USUARIO
-- =====================================================
CREATE OR REPLACE FUNCTION migrate_guest_cart_to_user(
  guest_items JSONB
) RETURNS void AS $$
DECLARE
  item JSONB;
  user_id_var UUID;
BEGIN
  user_id_var := auth.uid();
  
  IF user_id_var IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- Iterar sobre cada item del carrito invitado
  FOR item IN SELECT jsonb_array_elements(guest_items)
  LOOP
    -- Verificar si el producto ya está en el carrito del usuario
    IF EXISTS (
      SELECT 1 FROM cart_items
      WHERE user_id = user_id_var 
        AND product_id = (item->>'product_id')::UUID
        AND COALESCE(talla, '') = COALESCE((item->>'talla'), '')
        AND COALESCE(color, '') = COALESCE((item->>'color'), '')
    ) THEN
      -- Si existe, sumar cantidades
      UPDATE cart_items
      SET quantity = quantity + (item->>'quantity')::INT,
          updated_at = NOW()
      WHERE user_id = user_id_var 
        AND product_id = (item->>'product_id')::UUID
        AND COALESCE(talla, '') = COALESCE((item->>'talla'), '')
        AND COALESCE(color, '') = COALESCE((item->>'color'), '');
    ELSE
      -- Si no existe, insertar nuevo item
      INSERT INTO cart_items (
        user_id,
        product_id,
        quantity,
        talla,
        color,
        precio_unitario
      ) VALUES (
        user_id_var,
        (item->>'product_id')::UUID,
        (item->>'quantity')::INT,
        item->>'talla',
        item->>'color',
        (item->>'precio_unitario')::INT
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PASO 5: FUNCIÓN PARA OBTENER CARRITO DEL USUARIO
-- =====================================================
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
    ip.url,
    p.stock_total,
    COALESCE(EXTRACT(EPOCH FROM (cr.expires_at - NOW()))::INT, 0) as expires_in_seconds
  FROM cart_items ci
  JOIN productos p ON ci.product_id = p.id
  LEFT JOIN imagenes_producto ip ON ci.product_id = ip.producto_id AND ip.es_principal = TRUE
  LEFT JOIN cart_reservations cr ON cr.user_id = auth.uid() AND cr.product_id = ci.product_id
  WHERE ci.user_id = auth.uid()
  ORDER BY ci.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PASO 6: FUNCIÓN PARA LIMPIAR CARRITO
-- =====================================================
CREATE OR REPLACE FUNCTION clear_user_cart()
RETURNS void AS $$
BEGIN
  DELETE FROM cart_items
  WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================
COMMENT ON TABLE cart_items IS 'Items del carrito de compra. Cada usuario autenticado tiene su carrito único.';
COMMENT ON COLUMN cart_items.user_id IS 'UUID del usuario autenticado. NULL para invitados';
COMMENT ON COLUMN cart_items.product_id IS 'Referencia al producto';
COMMENT ON COLUMN cart_items.quantity IS 'Cantidad de este producto en el carrito';
COMMENT ON FUNCTION migrate_guest_cart_to_user(JSONB) IS 'Migra items del carrito invitado al carrito del usuario autenticado';
COMMENT ON FUNCTION get_user_cart() IS 'Obtiene el carrito del usuario actual con información del producto';
COMMENT ON FUNCTION clear_user_cart() IS 'Limpia completamente el carrito del usuario actual';
