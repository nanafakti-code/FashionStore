-- =====================================================
-- FIX: CORRECCIÓN DE TABLA CART_ITEMS
-- =====================================================
-- Este script añade la columna 'variante_id' a la tabla 'cart_items'.
-- El script anterior falló porque buscaba 'carrito_items'.
-- =====================================================

DO $$
BEGIN
  -- Verificar si la tabla cart_items existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cart_items') THEN
    
    -- Añadir columna variante_id si no existe
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'cart_items' AND column_name = 'variante_id'
    ) THEN
        ALTER TABLE cart_items 
        ADD COLUMN variante_id UUID REFERENCES variantes_producto(id) ON DELETE CASCADE;
        
        CREATE INDEX IF NOT EXISTS idx_cart_items_variante_id ON cart_items(variante_id);
        
        RAISE NOTICE '✓ Columna variante_id agregada correctamente a cart_items';
    ELSE
        RAISE NOTICE '✓ La columna variante_id ya existe en cart_items';
    END IF;

  ELSE
    RAISE NOTICE '⚠ ERROR: La tabla cart_items no existe. Verifica el nombre de tu tabla de carrito.';
  END IF;
END $$;
