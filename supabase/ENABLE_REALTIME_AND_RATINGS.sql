-- =====================================================
-- HABILITAR REALTIME Y VALORACIONES DINÁMICAS
-- =====================================================

-- 1. Habilitar Realtime para la tabla 'ordenes'
-- Esto permite que los cambios en los pedidos se reflejen al instante en la web del cliente
BEGIN;
  -- Intentar añadir la tabla a la publicación de realtime si no existe
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'ordenes'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE ordenes;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'No se pudo configurar la publicación de realtime automáticamente.';
  END $$;
COMMIT;

-- 2. Función para recalcular la valoración de un producto
-- Se ejecuta cada vez que cambia una reseña aprobada
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
DECLARE
    avg_rating DECIMAL(3, 2);
    total_count INTEGER;
BEGIN
    -- Calcular la media y el total solo de reseñas 'Aprobada'
    SELECT COALESCE(AVG(calificacion), 0), COUNT(*)
    INTO avg_rating, total_count
    FROM resenas
    WHERE producto_id = COALESCE(NEW.producto_id, OLD.producto_id)
    AND estado = 'Aprobada';

    -- Actualizar la tabla de productos
    UPDATE productos
    SET 
        valoracion_promedio = ROUND(avg_rating, 2),
        total_resenas = total_count,
        actualizado_en = NOW()
    WHERE id = COALESCE(NEW.producto_id, OLD.producto_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger para la tabla 'resenas'
DROP TRIGGER IF EXISTS trigger_update_product_rating ON resenas;
CREATE TRIGGER trigger_update_product_rating
AFTER INSERT OR UPDATE OR DELETE ON resenas
FOR EACH ROW
EXECUTE FUNCTION update_product_rating();

-- 4. Cálculo inicial para todos los productos
-- Esto pone al día los contadores de los productos existentes
DO $$
DECLARE
    p_id UUID;
BEGIN
    FOR p_id IN SELECT id FROM productos LOOP
        UPDATE productos
        SET 
            valoracion_promedio = (
                SELECT COALESCE(ROUND(AVG(calificacion), 2), 0)
                FROM resenas
                WHERE producto_id = p_id AND estado = 'Aprobada'
            ),
            total_resenas = (
                SELECT COUNT(*)
                FROM resenas
                WHERE producto_id = p_id AND estado = 'Aprobada'
            )
        WHERE id = p_id;
    END LOOP;
END $$;

COMMENT ON FUNCTION update_product_rating IS 'Actualiza automáticamente la valoración media y el conteo de reseñas en la tabla productos.';
