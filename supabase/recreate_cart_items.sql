-- =====================================================
-- SOLUCIÓN DEFINITIVA: RECREAR TABLA CART_ITEMS
-- =====================================================
-- Este script elimina la tabla conflictiva y la crea de nuevo
-- con la estructura EXACTA que requiere el código.
-- =====================================================

-- 1. Eliminar tabla defectuosa (y sus dependencias)
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS carrito_items CASCADE; -- Por si acaso existe la versión en español

-- 2. Crear tabla limpia con nombres de columnas VERIFICADOS
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relaciones
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  variante_id UUID REFERENCES variantes_producto(id) ON DELETE CASCADE, -- Ahora es opcional por seguridad, pero el código lo enviará
  
  -- Datos del item
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  precio_unitario INTEGER NOT NULL DEFAULT 0, -- En centavos
  
  -- Detalles visuales
  color TEXT,
  talla TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Índices para rendimiento
CREATE INDEX idx_cart_items_user ON cart_items(user_id);
CREATE INDEX idx_cart_items_variant ON cart_items(variante_id);

-- 4. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cart_items_modtime
    BEFORE UPDATE ON cart_items
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- =====================================================
-- 5. SEGURIDAD (RLS) - CRÍTICO PARA QUE FUNCIONE
-- =====================================================
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Política de lectura: Ver solo mis items
CREATE POLICY "Users can view their own cart"
ON cart_items FOR SELECT
USING (auth.uid() = user_id);

-- Política de inserción: Añadir solo a mi usuario
CREATE POLICY "Users can insert into their own cart"
ON cart_items FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política de actualización: Modificar solo mis items
CREATE POLICY "Users can update their own cart"
ON cart_items FOR UPDATE
USING (auth.uid() = user_id);

-- Política de eliminación: Borrar solo mis items
CREATE POLICY "Users can delete from their own cart"
ON cart_items FOR DELETE
USING (auth.uid() = user_id);


