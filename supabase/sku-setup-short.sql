-- =====================================================
-- SCRIPT CORTO: Configuración de SKU Automático
-- Copia y ejecuta esto en Supabase SQL Editor
-- =====================================================

-- 1. Crear secuencia
CREATE SEQUENCE IF NOT EXISTS productos_sku_seq START WITH 1;

-- 2. Crear función generadora
CREATE OR REPLACE FUNCTION generate_sku()
RETURNS TEXT AS $$
BEGIN
  RETURN TO_CHAR(nextval('productos_sku_seq'), 'FM0000000000');
END;
$$ LANGUAGE plpgsql;

-- 3. Resetear secuencia y asignar SKUs a productos sin SKU
ALTER SEQUENCE productos_sku_seq RESTART WITH 1;

WITH productos_numerados AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY creado_en ASC, id ASC) as row_num
  FROM productos
  WHERE sku IS NULL OR sku = ''
)
UPDATE productos p
SET sku = TO_CHAR(pn.row_num, 'FM0000000000')
FROM productos_numerados pn
WHERE p.id = pn.id;

-- 4. Configurar secuencia al máximo SKU
SELECT setval('productos_sku_seq', 
  COALESCE(MAX(CAST(sku AS BIGINT)), 0) + 1
) FROM productos WHERE sku ~ '^\d+$';

-- 5. Crear índice único
ALTER TABLE public.productos DROP CONSTRAINT IF EXISTS productos_sku_key;
DROP INDEX IF EXISTS idx_productos_sku_unique;
CREATE UNIQUE INDEX idx_productos_sku_unique ON public.productos(sku) WHERE sku IS NOT NULL;

-- 6. Crear trigger para auto-generar
CREATE OR REPLACE FUNCTION set_sku_for_new_product()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sku IS NULL OR NEW.sku = '' THEN
    NEW.sku := generate_sku();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_sku_on_insert ON public.productos;
CREATE TRIGGER set_sku_on_insert
BEFORE INSERT ON public.productos
FOR EACH ROW
EXECUTE FUNCTION set_sku_for_new_product();

-- ✅ ¡Listo! Verifica con:
-- SELECT id, nombre, sku FROM productos ORDER BY sku;
