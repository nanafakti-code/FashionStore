-- =====================================================
-- UPDATE VARIANT PRICING MODEL
-- =====================================================
-- This script updates the variant system to use precio_adicional
-- as a DELTA instead of storing full price in precio_venta
-- =====================================================

-- STEP 1: Add precio_adicional column if it doesn't exist
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'variantes_producto' AND column_name = 'precio_adicional'
  ) THEN
    ALTER TABLE variantes_producto ADD COLUMN precio_adicional INTEGER DEFAULT 0;
    RAISE NOTICE '✓ Column precio_adicional added';
  ELSE
    RAISE NOTICE '✓ Column precio_adicional already exists';
  END IF;
END $$;

-- STEP 2: Update get_product_variants function to calculate price
-- =====================================================
CREATE OR REPLACE FUNCTION get_product_variants(product_slug TEXT)
RETURNS TABLE (
  variant_id UUID,
  variant_name TEXT,
  sku TEXT,
  price INTEGER,
  original_price INTEGER,
  stock INTEGER,
  capacity TEXT,
  color TEXT,
  size TEXT,
  connectivity TEXT,
  available BOOLEAN,
  is_default BOOLEAN,
  image_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id AS variant_id,
    v.nombre_variante AS variant_name,
    v.sku_variante AS sku,
    -- ✅ PRICE = base price + delta (precio_adicional)
    p.precio_venta + COALESCE(v.precio_adicional, 0) AS price,
    v.precio_original AS original_price,
    v.stock,
    v.capacidad AS capacity,
    v.color,
    v.talla AS size,
    v.conectividad AS connectivity,
    v.disponible AS available,
    v.es_principal AS is_default,
    v.imagen_url AS image_url
  FROM variantes_producto v
  INNER JOIN productos p ON v.producto_id = p.id
  WHERE p.slug = product_slug
    AND v.disponible = TRUE
  ORDER BY v.es_principal DESC, (p.precio_venta + COALESCE(v.precio_adicional, 0)) ASC;
END;
$$ LANGUAGE plpgsql;

-- STEP 3: Update get_product_price_range function
-- =====================================================
CREATE OR REPLACE FUNCTION get_product_price_range(product_slug TEXT)
RETURNS TABLE (
  min_price INTEGER,
  max_price INTEGER,
  has_variants BOOLEAN,
  total_variants INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    MIN(p.precio_venta + COALESCE(v.precio_adicional, 0))::INTEGER AS min_price,
    MAX(p.precio_venta + COALESCE(v.precio_adicional, 0))::INTEGER AS max_price,
    COUNT(v.id) > 1 AS has_variants,
    COUNT(v.id)::INTEGER AS total_variants
  FROM variantes_producto v
  INNER JOIN productos p ON v.producto_id = p.id
  WHERE p.slug = product_slug
    AND v.disponible = TRUE
    AND v.stock > 0;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VERIFICATION
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✓ Pricing model updated successfully';
  RAISE NOTICE '✓ get_product_variants now returns base + delta';
  RAISE NOTICE '✓ get_product_price_range updated';
END $$;
