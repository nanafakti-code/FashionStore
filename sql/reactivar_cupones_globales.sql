-- =============================================
-- REACTIVAR CUPONES GLOBALES DESACTIVADOS
-- =============================================
-- Este script reactiva cupones globales (sin assigned_user_id) 
-- que fueron desactivados incorrectamente por un solo uso

-- 1. Ver cupones desactivados (para diagnóstico)
SELECT id, code, discount_type, value, is_active, assigned_user_id, max_uses_global, max_uses_per_user
FROM coupons
WHERE is_active = false;

-- 2. Reactivar TODOS los cupones globales que fueron desactivados
-- (solo los que NO tienen usuario asignado, es decir, los generales)
UPDATE coupons 
SET is_active = true 
WHERE is_active = false 
  AND assigned_user_id IS NULL;

-- 3. Opcional: Si quieres que el cupón global sea ilimitado, 
-- limpiar max_uses_global para que no se desactive nunca
-- UPDATE coupons 
-- SET max_uses_global = NULL 
-- WHERE assigned_user_id IS NULL AND max_uses_global IS NOT NULL;

-- 4. Verificar estado final
SELECT id, code, discount_type, value, is_active, assigned_user_id, 
       max_uses_global, max_uses_per_user, expiration_date
FROM coupons
ORDER BY created_at DESC;
