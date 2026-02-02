-- =====================================================
-- ADD MISSING COLUMNS TO CATEGORIAS TABLE
-- =====================================================

-- 1. Add imagen_url column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categorias' AND column_name = 'imagen_url'
  ) THEN
    ALTER TABLE categorias ADD COLUMN imagen_url TEXT;
    RAISE NOTICE '✓ Column imagen_url added to categorias';
  ELSE
    RAISE NOTICE '✓ Column imagen_url already exists in categorias';
  END IF;
END $$;

-- 2. Add activo column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categorias' AND column_name = 'activo'
  ) THEN
    ALTER TABLE categorias ADD COLUMN activo BOOLEAN DEFAULT true;
    RAISE NOTICE '✓ Column activo added to categorias';
  ELSE
    RAISE NOTICE '✓ Column activo already exists in categorias';
  END IF;
END $$;
