-- CARRITO - FIX FINAL (Sin JOINs complicados)
-- Copia todo, pega en Supabase SQL Editor, RUN ▶

-- 1. TABLA
DROP TABLE IF EXISTS cart_items CASCADE;

CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  quantity INT NOT NULL CHECK (quantity > 0),
  talla TEXT NULL,
  color TEXT NULL,
  precio_unitario INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ÍNDICES
CREATE UNIQUE INDEX idx_cart_unique ON cart_items(user_id, product_id, COALESCE(talla, ''), COALESCE(color, ''));
CREATE INDEX idx_cart_user ON cart_items(user_id);
CREATE INDEX idx_cart_product ON cart_items(product_id);

-- 3. RLS
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS
DROP POLICY IF EXISTS "Users can view their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can insert their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can update their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can delete their own cart items" ON cart_items;

CREATE POLICY "Users can view their own cart items" ON cart_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own cart items" ON cart_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own cart items" ON cart_items FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own cart items" ON cart_items FOR DELETE USING (auth.uid() = user_id);

-- 5. FUNCIÓN RPC: GET_USER_CART (VERSION SIMPLE SIN JOIN)
DROP FUNCTION IF EXISTS get_user_cart();

CREATE OR REPLACE FUNCTION get_user_cart()
RETURNS TABLE (
  id UUID,
  product_id UUID,
  quantity INT,
  talla TEXT,
  color TEXT,
  precio_unitario INTEGER,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ci.id,
    ci.product_id,
    ci.quantity,
    ci.talla,
    ci.color,
    ci.precio_unitario,
    ci.created_at
  FROM cart_items ci
  WHERE ci.user_id = auth.uid()
  ORDER BY ci.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- 6. FUNCIÓN RPC: CLEAR_USER_CART
DROP FUNCTION IF EXISTS clear_user_cart();

CREATE OR REPLACE FUNCTION clear_user_cart()
RETURNS void AS $$
BEGIN
  DELETE FROM cart_items
  WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- 7. FUNCIÓN RPC: MIGRATE_GUEST_CART
DROP FUNCTION IF EXISTS migrate_guest_cart_to_user(JSONB);

CREATE OR REPLACE FUNCTION migrate_guest_cart_to_user(items JSONB)
RETURNS void AS $$
DECLARE
  item JSONB;
  user_id_var UUID := auth.uid();
BEGIN
  IF user_id_var IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  FOR item IN SELECT jsonb_array_elements(items)
  LOOP
    IF EXISTS (
      SELECT 1 FROM cart_items
      WHERE user_id = user_id_var
        AND product_id = (item->>'product_id')::UUID
        AND COALESCE(talla, '') = COALESCE((item->>'talla'), '')
        AND COALESCE(color, '') = COALESCE((item->>'color'), '')
    ) THEN
      UPDATE cart_items
      SET quantity = quantity + (item->>'quantity')::INT,
          updated_at = NOW()
      WHERE user_id = user_id_var
        AND product_id = (item->>'product_id')::UUID
        AND COALESCE(talla, '') = COALESCE((item->>'talla'), '')
        AND COALESCE(color, '') = COALESCE((item->>'color'), '');
    ELSE
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
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- LISTO
SELECT '✅ CARRITO CONFIGURADO CORRECTAMENTE' AS resultado;
