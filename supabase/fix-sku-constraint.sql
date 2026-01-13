-- =====================================================
-- ARREGLAR CONSTRAINTA DE SKU DUPLICADO
-- =====================================================
-- El problema: La restricción UNIQUE en SKU causa conflictos al editar
-- Solución: Permitir múltiples NULL en SKU

-- 1. Eliminar el índice/constraint de SKU actual
ALTER TABLE public.productos DROP CONSTRAINT IF EXISTS productos_sku_key;

-- 2. Crear un índice parcial que solo aplique a SKUs no nulos
-- Esto permite múltiples NULL y evita duplicados en valores reales
CREATE UNIQUE INDEX IF NOT EXISTS idx_productos_sku_unique 
ON productos(sku) 
WHERE sku IS NOT NULL;

-- Verificar que se aplicó correctamente
-- SELECT * FROM pg_indexes WHERE tablename = 'productos' AND indexname LIKE '%sku%';
