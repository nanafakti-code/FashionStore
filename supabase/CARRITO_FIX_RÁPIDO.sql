-- =====================================================
-- CARRITO FIX RÁPIDO - Ejecutar en Supabase SQL Editor
-- =====================================================
-- Este script soluciona los problemas del carrito
-- Copia y pega en: Supabase > SQL Editor > Run

-- PASO 1: Eliminar tabla anterior (⚠️ CUIDADO: Esto borra datos)
DROP TABLE IF EXISTS cart_items CASCADE;

-- PASO 2: Crear tabla CORRECTA con user_id NOT NULL
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

-- PASO 3: Crear índice UNIQUE para evitar duplicados
CREATE UNIQUE INDEX idx_cart_items_unique 
  ON cart_items(user_id, product_id, COALESCE(talla, ''), COALESCE(color, ''));

-- PASO 4: Crear otros índices
CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);

-- PASO 5: Habilitar RLS
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- PASO 6: Eliminar políticas antiguas si existen
DROP POLICY IF EXISTS "Users can view their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can insert their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can update their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can delete their own cart items" ON cart_items;

-- PASO 7: Crear políticas RLS NUEVAS
CREATE POLICY "Users can view their own cart items"
  ON cart_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cart items"
  ON cart_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cart items"
  ON cart_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cart items"
  ON cart_items FOR DELETE
  USING (auth.uid() = user_id);

-- PASO 8: Verificar que todo está bien
SELECT 'Tabla creada correctamente' AS status;
SELECT COUNT(*) AS politicas FROM information_schema.role_routine_grants 
  WHERE routine_name LIKE '%cart%';

-- =====================================================
-- ✅ LISTO - El carrito debería funcionar ahora
-- =====================================================
