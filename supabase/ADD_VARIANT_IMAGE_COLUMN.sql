-- ==============================================================================
-- MIGRACIÓN: AÑADIR COLUMNA DE IMAGEN A VARIANTES
-- ==============================================================================

-- Añadir columna imagen_url si no existe
ALTER TABLE variantes_producto 
ADD COLUMN IF NOT EXISTS imagen_url TEXT;

-- Añadir comentario descriptivo
COMMENT ON COLUMN variantes_producto.imagen_url IS 'URL de la imagen específica para esta variante (opcional)';

-- Verificación
DO $$
BEGIN
    RAISE NOTICE 'Columna imagen_url añadida correctamente a variantes_producto.';
END $$;
