-- =====================================================
-- FUNCIÓN: Recalcular Stock Total del Producto
-- =====================================================
-- Esta función se ejecutará automáticamente cuando cambie
-- el stock de una variante.
-- =====================================================

CREATE OR REPLACE FUNCTION recalcular_stock_total_producto()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_producto_id UUID;
    nuevo_stock_total INTEGER;
BEGIN
    -- 1. CASO UPDATE: Manejo especial
    IF (TG_OP = 'UPDATE') THEN
        -- A) Si cambió el producto_id (mover variante de un producto a otro)
        -- Debemos recalcular el stock del producto ANTIGUO inmediatamente
        IF OLD.producto_id IS DISTINCT FROM NEW.producto_id THEN
            UPDATE productos
            SET stock_total = (
                SELECT COALESCE(SUM(stock), 0)
                FROM variantes_producto
                WHERE producto_id = OLD.producto_id
            ),
            actualizado_en = NOW()
            WHERE id = OLD.producto_id;
            
            -- Continuamos la ejecución para actualizar el NUEVO producto abajo...
        
        -- B) Si el producto es el mismo
        ELSE
            -- Si el stock NO cambió, no hacer nada para evitar escrituras innecesarias
            IF OLD.stock IS NOT DISTINCT FROM NEW.stock THEN
                RETURN NULL;
            END IF;
        END IF;
    END IF;

    -- 2. Determinar el ID del producto PRINCIPAL a actualizar
    -- En caso de INSERT o UPDATE (incluso si cambió de producto), será el NEW
    IF (TG_OP = 'DELETE') THEN
        target_producto_id := OLD.producto_id;
    ELSE
        target_producto_id := NEW.producto_id;
    END IF;

    -- 3. Calcular la suma total de stock para el producto objetivo
    SELECT COALESCE(SUM(stock), 0)
    INTO nuevo_stock_total
    FROM variantes_producto
    WHERE producto_id = target_producto_id;

    -- 4. Actualizar el producto objetivo con el nuevo total
    UPDATE productos
    SET 
        stock_total = nuevo_stock_total,
        actualizado_en = NOW()
    WHERE id = target_producto_id;

    RETURN NULL;
END;
$$;

-- IMPORTANT: Asegurar que la función pertenezca a postgres para saltar RLS
ALTER FUNCTION recalcular_stock_total_producto() OWNER TO postgres;

-- =====================================================
-- TRIGGER: Sincronización de Stock
-- =====================================================
-- Se dispara DESPUÉS de cualquier cambio (INSERT, DELETE
-- o CUALQUIER UPDATE) en la tabla variantes_producto.
-- =====================================================

DROP TRIGGER IF EXISTS trigger_sync_stock_variantes ON variantes_producto;

CREATE TRIGGER trigger_sync_stock_variantes
AFTER INSERT OR DELETE OR UPDATE
ON variantes_producto
FOR EACH ROW
EXECUTE FUNCTION recalcular_stock_total_producto();
