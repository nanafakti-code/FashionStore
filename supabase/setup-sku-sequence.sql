-- =====================================================
-- SISTEMA DE SKU AUTOMÁTICO PARA PRODUCTOS
-- =====================================================
-- Implementa un sistema de SKU auto-incremental que comienza en 0000000001
-- Cada nuevo producto recibe automáticamente el siguiente SKU

-- 1. Crear la secuencia para SKUs
CREATE SEQUENCE IF NOT EXISTS productos_sku_seq START WITH 1;

-- 2. Crear función que genera SKU con formato de 10 dígitos (0000000001, 0000000002, etc)
CREATE OR REPLACE FUNCTION generate_sku()
RETURNS TEXT AS $$
DECLARE
  next_val BIGINT;
BEGIN
  next_val := nextval('productos_sku_seq');
  RETURN TO_CHAR(next_val, 'FM0000000000');
END;
$$ LANGUAGE plpgsql;

-- 3. Actualizar productos existentes sin SKU
-- Asignar SKUs secuenciales comenzando en 0000000001
-- Primero, resetear la secuencia (no es una tabla, usar ALTER SEQUENCE)
ALTER SEQUENCE productos_sku_seq RESTART WITH 1;

-- Después, actualizar productos existentes sin SKU usando CTE
WITH productos_numerados AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY creado_en ASC, id ASC) as row_num
  FROM productos
  WHERE sku IS NULL OR sku = ''
)
UPDATE productos p
SET sku = TO_CHAR(pn.row_num, 'FM0000000000')
FROM productos_numerados pn
WHERE p.id = pn.id;

-- 4. Actualizar la secuencia para que comience después del mayor SKU actual
-- Obtener el máximo número de SKU actual y establecer la secuencia
SELECT setval('productos_sku_seq', 
  COALESCE(MAX(CAST(sku AS BIGINT)), 0) + 1
) FROM productos WHERE sku ~ '^\d+$';

-- 5. Crear constraint UNIQUE para SKU (permite múltiples NULL)
-- Primero eliminar el constraint antiguo si existe
ALTER TABLE public.productos DROP CONSTRAINT IF EXISTS productos_sku_key;

-- Crear índice único parcial (solo para SKUs no nulos)
DROP INDEX IF EXISTS idx_productos_sku_unique;
CREATE UNIQUE INDEX IF NOT EXISTS idx_productos_sku_unique 
ON public.productos(sku) 
WHERE sku IS NOT NULL;

-- 6. Crear trigger para auto-generar SKU en nuevos productos
CREATE OR REPLACE FUNCTION set_sku_for_new_product()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sku IS NULL OR NEW.sku = '' THEN
    NEW.sku := generate_sku();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear o reemplazar el trigger
DROP TRIGGER IF EXISTS set_sku_on_insert ON public.productos;
CREATE TRIGGER set_sku_on_insert
BEFORE INSERT ON public.productos
FOR EACH ROW
EXECUTE FUNCTION set_sku_for_new_product();

-- 7. Verificar resultados
-- Comentados - descomenta para verificar
-- SELECT id, nombre, sku FROM productos ORDER BY sku NULLS LAST;
-- SELECT nextval('productos_sku_seq');
-- SELECT MAX(CAST(sku AS BIGINT)) FROM productos WHERE sku ~ '^\d+$';

