-- SCRIPT DE VALIDACIÓN Y PRUEBAS DEL SISTEMA DE RESERVAS
-- Ejecutar en Supabase SQL Editor para verificar la implementación

-- ============================================================================
-- 1. VERIFICAR ESTRUCTURA DE LA TABLA
-- ============================================================================

-- Ver estructura de cart_reservations
\d cart_reservations;

-- Ver índices
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'cart_reservations'
ORDER BY indexname;

-- ============================================================================
-- 2. VERIFICAR FUNCIONES SQL
-- ============================================================================

-- Listar todas las funciones
SELECT 
  p.oid,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as definition
FROM pg_proc p
WHERE p.proname LIKE '%reservation%' OR p.proname LIKE '%cleanup%'
ORDER BY p.proname;

-- ============================================================================
-- 3. DATOS DE PRUEBA
-- ============================================================================

-- A. Obtener un producto de prueba
SELECT id, nombre, stock_total 
FROM productos 
LIMIT 5;

-- Guardar el ID del producto (ej: 'product-uuid-1234')
-- Se usará en las pruebas siguientes

-- ============================================================================
-- 4. PRUEBAS FUNCIONALES
-- ============================================================================

-- TEST 1: Verificar stock inicial
DO $$
DECLARE
  v_product_id UUID := 'REEMPLAZAR-CON-PRODUCT-ID';
  v_stock INT;
BEGIN
  SELECT stock_total INTO v_stock 
  FROM productos 
  WHERE id = v_product_id;
  
  RAISE NOTICE 'Stock inicial del producto: %', v_stock;
END $$;

-- TEST 2: Crear una reserva
DO $$
DECLARE
  v_product_id UUID := 'REEMPLAZAR-CON-PRODUCT-ID';
  v_user_id UUID := 'REEMPLAZAR-CON-USER-ID';
  v_result RECORD;
BEGIN
  -- Simular usuario autenticado
  SET ROLE authenticated;
  SET app.current_user = v_user_id;
  
  -- Crear reserva
  SELECT * INTO v_result
  FROM create_cart_reservation(v_product_id, 2);
  
  RAISE NOTICE 'Resultado: success=%, message=%', v_result.success, v_result.message;
  RAISE NOTICE 'Stock después de reservar: %', (SELECT stock_total FROM productos WHERE id = v_product_id);
END $$;

-- TEST 3: Verificar reserva creada
SELECT 
  id,
  user_id,
  product_id,
  quantity,
  created_at,
  expires_at,
  EXTRACT(EPOCH FROM (expires_at - NOW()))::INT as segundos_restantes
FROM cart_reservations
ORDER BY created_at DESC
LIMIT 5;

-- TEST 4: Actualizar reserva (aumentar cantidad)
DO $$
DECLARE
  v_product_id UUID := 'REEMPLAZAR-CON-PRODUCT-ID';
  v_result RECORD;
BEGIN
  SET ROLE authenticated;
  
  -- Aumentar cantidad reservada de 2 a 5
  SELECT * INTO v_result
  FROM create_cart_reservation(v_product_id, 5);
  
  RAISE NOTICE 'Actualización: success=%, message=%', v_result.success, v_result.message;
  RAISE NOTICE 'Stock actualizado: %', (SELECT stock_total FROM productos WHERE id = v_product_id);
  RAISE NOTICE 'Cantidad reservada: %', (SELECT quantity FROM cart_reservations WHERE product_id = v_product_id LIMIT 1);
END $$;

-- TEST 5: Obtener reservas del usuario
SELECT 
  id,
  product_id,
  quantity,
  created_at,
  expires_at,
  EXTRACT(EPOCH FROM (expires_at - NOW()))::INT as expires_in_seconds
FROM cart_reservations
WHERE user_id = 'REEMPLAZAR-CON-USER-ID'
ORDER BY created_at DESC;

-- TEST 6: Verificar tiempo restante
SELECT 
  product_id,
  quantity,
  EXTRACT(EPOCH FROM (expires_at - NOW()))::INT as seconds_left,
  CASE 
    WHEN EXTRACT(EPOCH FROM (expires_at - NOW())) <= 0 THEN 'EXPIRADA'
    WHEN EXTRACT(EPOCH FROM (expires_at - NOW())) <= 10 THEN 'A PUNTO DE EXPIRAR'
    ELSE 'ACTIVA'
  END as status
FROM cart_reservations
WHERE user_id = 'REEMPLAZAR-CON-USER-ID';

-- TEST 7: Simular reserva expirada
UPDATE cart_reservations
SET expires_at = NOW() - INTERVAL '1 second'
WHERE id = 'REEMPLAZAR-CON-RESERVATION-ID';

-- TEST 8: Ejecutar limpieza de expiradas
SELECT * FROM cleanup_expired_reservations();

-- TEST 9: Verificar que la reserva fue eliminada
SELECT COUNT(*) as remaining_reservations
FROM cart_reservations
WHERE product_id = 'REEMPLAZAR-CON-PRODUCT-ID';

-- TEST 10: Verificar que el stock fue restaurado
SELECT stock_total 
FROM productos 
WHERE id = 'REEMPLAZAR-CON-PRODUCT-ID';

-- ============================================================================
-- 5. PRUEBAS DE CONCURRENCIA
-- ============================================================================

-- TEST 11: Simular dos usuarios intentando reservar el mismo stock limitado
-- USUARIO 1: Crea reserva de 8 unidades
DO $$
DECLARE
  v_product_id UUID := 'REEMPLAZAR-CON-PRODUCT-ID';
  v_user_1 UUID := 'user-1-uuid';
  v_result RECORD;
BEGIN
  SET ROLE authenticated;
  SET app.current_user = v_user_1;
  
  SELECT * INTO v_result FROM create_cart_reservation(v_product_id, 8);
  RAISE NOTICE 'Usuario 1: success=%, message=%', v_result.success, v_result.message;
END $$;

-- USUARIO 2: Intenta reservar 5 unidades
-- Si el stock fue 10 y Usuario 1 reservó 8, quedan 2
-- Esto debería fallar con "Stock insuficiente"
DO $$
DECLARE
  v_product_id UUID := 'REEMPLAZAR-CON-PRODUCT-ID';
  v_user_2 UUID := 'user-2-uuid';
  v_result RECORD;
BEGIN
  SET ROLE authenticated;
  SET app.current_user = v_user_2;
  
  SELECT * INTO v_result FROM create_cart_reservation(v_product_id, 5);
  RAISE NOTICE 'Usuario 2: success=%, message=%', v_result.success, v_result.message;
  
  IF NOT v_result.success THEN
    RAISE NOTICE '✓ Protección contra sobreventa funcionando correctamente!';
  END IF;
END $$;

-- ============================================================================
-- 6. MONITOREO Y ESTADÍSTICAS
-- ============================================================================

-- Ver todas las reservas activas
SELECT 
  COUNT(*) as total_reservations,
  SUM(quantity) as total_items_reserved,
  COUNT(DISTINCT user_id) as unique_users
FROM cart_reservations
WHERE expires_at > NOW();

-- Ver reservas próximas a expirar (menos de 10 segundos)
SELECT 
  id,
  user_id,
  product_id,
  quantity,
  EXTRACT(EPOCH FROM (expires_at - NOW()))::INT as seconds_left,
  created_at
FROM cart_reservations
WHERE expires_at BETWEEN NOW() AND NOW() + INTERVAL '10 seconds'
ORDER BY expires_at ASC;

-- Ver histórico de limpieza (reservas ya expiradas)
SELECT 
  id,
  product_id,
  quantity,
  expires_at,
  (NOW() - expires_at) as tiempo_desde_expiracion
FROM cart_reservations
WHERE expires_at < NOW()
ORDER BY expires_at DESC
LIMIT 20;

-- ============================================================================
-- 7. LIMPIEZA Y RESET
-- ============================================================================

-- LIMPIAR TODAS LAS RESERVAS (SOLO PARA TESTING)
DELETE FROM cart_reservations;

-- RESETEAR STOCK A VALORES ORIGINALES (SOLO SI ES NECESARIO)
-- UPDATE productos SET stock_total = stock_total_original WHERE id IN (...);

-- ============================================================================
-- 8. HEALTH CHECK - EJECUTAR REGULARMENTE
-- ============================================================================

-- Script de health check
DO $$
DECLARE
  v_active_reservations INT;
  v_expired_reservations INT;
  v_total_reserved_stock INT;
BEGIN
  -- Contar reservas activas
  SELECT COUNT(*) INTO v_active_reservations
  FROM cart_reservations
  WHERE expires_at > NOW();
  
  -- Contar reservas expiradas
  SELECT COUNT(*) INTO v_expired_reservations
  FROM cart_reservations
  WHERE expires_at <= NOW();
  
  -- Contar stock total reservado
  SELECT COALESCE(SUM(quantity), 0) INTO v_total_reserved_stock
  FROM cart_reservations
  WHERE expires_at > NOW();
  
  RAISE NOTICE '========== HEALTH CHECK ==========';
  RAISE NOTICE 'Reservas activas: %', v_active_reservations;
  RAISE NOTICE 'Reservas expiradas: %', v_expired_reservations;
  RAISE NOTICE 'Stock total reservado: %', v_total_reserved_stock;
  RAISE NOTICE '=================================';
  
  -- Advertencia si hay expiradas sin limpiar
  IF v_expired_reservations > 0 THEN
    RAISE WARNING 'ALERTA: % reservas expiradas sin limpiar! Ejecutar cleanup_expired_reservations()', v_expired_reservations;
  END IF;
END $$;

-- ============================================================================
-- 9. ÍNDICES Y PERFORMANCE
-- ============================================================================

-- Analizar plan de ejecución
EXPLAIN ANALYZE
SELECT * FROM cart_reservations
WHERE user_id = 'REEMPLAZAR-CON-USER-ID'
AND expires_at > NOW();

EXPLAIN ANALYZE
SELECT * FROM cart_reservations
WHERE expires_at <= NOW();

-- Estadísticas de la tabla
SELECT 
  schemaname,
  tablename,
  round(pg_total_relation_size(schemaname||'.'||tablename) / 1024 / 1024, 2) as size_mb,
  n_live_tup as live_rows,
  n_dead_tup as dead_rows
FROM pg_stat_user_tables
WHERE tablename = 'cart_reservations';

-- ============================================================================
-- 10. LOGS Y AUDITORÍA
-- ============================================================================

-- Ver últimas operaciones en cart_reservations
-- (Si tienes trigger de auditoría implementado)
SELECT * FROM audit_log
WHERE table_name = 'cart_reservations'
ORDER BY operation_time DESC
LIMIT 20;

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
/*
1. Reemplazar todos los placeholders antes de ejecutar:
   - REEMPLAZAR-CON-PRODUCT-ID
   - REEMPLAZAR-CON-USER-ID
   - REEMPLAZAR-CON-RESERVATION-ID

2. Las pruebas con SET ROLE y SET app.current_user simulan
   un usuario autenticado. En producción se usa auth.uid()

3. El stock debe ser consistente:
   stock_actual = stock_original - SUM(quantity reservadas activas)

4. Ejecutar cleanup_expired_reservations() cada minuto en cron

5. Si los tests fallan, revisar:
   - ¿Existen las funciones?
   - ¿El usuario tiene permisos?
   - ¿La tabla tiene datos?
   - ¿Las transacciones están activas?
*/
