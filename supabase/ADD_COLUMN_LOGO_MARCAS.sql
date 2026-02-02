-- =====================================================
-- ADD MISSING COLUMNS TO MARCAS TABLE
-- =====================================================

-- 1. Add logo_url column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'marcas' AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE marcas ADD COLUMN logo_url TEXT;
    RAISE NOTICE '✓ Column logo_url added to marcas';
  ELSE
    RAISE NOTICE '✓ Column logo_url already exists in marcas';
  END IF;
END $$;

-- 2. Add activo column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'marcas' AND column_name = 'activo'
  ) THEN
    ALTER TABLE marcas ADD COLUMN activo BOOLEAN DEFAULT true;
    RAISE NOTICE '✓ Column activo added to marcas';
  ELSE
    RAISE NOTICE '✓ Column activo already exists in marcas';
  END IF;
END $$;
