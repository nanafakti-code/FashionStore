-- =====================================================
-- VERIFICAR ESTADO DE LA BASE DE DATOS
-- =====================================================
-- Ejecuta este script para ver qué columnas tiene
-- la tabla variantes_producto actualmente
-- =====================================================

-- Ver estructura de la tabla variantes_producto
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'variantes_producto'
ORDER BY ordinal_position;

-- Ver si la tabla existe
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_name = 'variantes_producto';
