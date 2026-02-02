
-- =================================================================
-- FIX: Corregir Triggers de Timestamp (actualizada_en vs actualizado_en)
-- =================================================================
-- Este script soluciona el error: record "new" has no field "actualizado_en"
-- El problema es que algunas tablas usan 'actualizada_en' (feminino) pero
-- el trigger genérico intenta actualizar 'actualizado_en' (masculino).
-- =================================================================

-- 1. Crear función específica para columnas 'actualizada_en'
CREATE OR REPLACE FUNCTION actualizar_timestamp_a()
RETURNS TRIGGER AS $$
BEGIN
  -- Se asume que la columna se llama 'actualizada_en'
  NEW.actualizada_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Corregir trigger en tabla: direcciones
DROP TRIGGER IF EXISTS trigger_direcciones_actualizado ON public.direcciones;
CREATE TRIGGER trigger_direcciones_actualizado
  BEFORE UPDATE ON public.direcciones
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_timestamp_a();

-- 3. Corregir trigger en tabla: resenas
DROP TRIGGER IF EXISTS trigger_resenas_actualizado ON public.resenas;
CREATE TRIGGER trigger_resenas_actualizado
  BEFORE UPDATE ON public.resenas
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_timestamp_a();

-- 4. Corregir trigger en tabla: categorias (si existe la tabla y columna)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categorias') THEN
        DROP TRIGGER IF EXISTS trigger_categorias_actualizado ON public.categorias;
        CREATE TRIGGER trigger_categorias_actualizado
          BEFORE UPDATE ON public.categorias
          FOR EACH ROW
          EXECUTE FUNCTION actualizar_timestamp_a();
    END IF;
END $$;
