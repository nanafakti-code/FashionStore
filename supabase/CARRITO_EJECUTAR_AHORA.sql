-- EJECUTAR ESTO AHORA EN SUPABASE SQL EDITOR
-- Copia todo, pega en el editor, click en RUN ▶

-- 1. ELIMINAR TABLA VIEJA
DROP TABLE IF EXISTS cart_items CASCADE;

-- 2. CREAR TABLA NUEVA (CORRECTA)
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

-- 3. ÍNDICES
CREATE UNIQUE INDEX idx_cart_unique ON cart_items(user_id, product_id, COALESCE(talla, ''), COALESCE(color, ''));
CREATE INDEX idx_cart_user ON cart_items(user_id);
CREATE INDEX idx_cart_product ON cart_items(product_id);

-- 4. RLS HABILITADO
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- 5. POLÍTICAS
DROP POLICY IF EXISTS "Users can view their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can insert their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can update their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can delete their own cart items" ON cart_items;

CREATE POLICY "Users can view their own cart items" ON cart_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own cart items" ON cart_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own cart items" ON cart_items FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own cart items" ON cart_items FOR DELETE USING (auth.uid() = user_id);

-- 6. VERIFICACIÓN
SELECT '✅ TABLA CREADA' AS resultado;
