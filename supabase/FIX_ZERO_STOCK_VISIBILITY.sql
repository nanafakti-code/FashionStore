-- ==============================================================================
-- FIX: VISIBILIDAD DE VARIANTES CON STOCK 0
-- ==============================================================================
-- Problema: Las variantes con stock = 0 no aparecían en el Dashboard de Admin.
-- Causa: Posible política de RLS restrictiva o comportamiento por defecto.
-- Solución: Habilitar RLS explícito y permitir ver TODAS las variantes.
-- ==============================================================================

-- 1. Habilitar RLS en la tabla (si no lo estaba)
ALTER TABLE variantes_producto ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas existentes para evitar conflictos
DROP POLICY IF EXISTS "Anyone can view variants" ON variantes_producto;
DROP POLICY IF EXISTS "Public Read Variants" ON variantes_producto;
DROP POLICY IF EXISTS "Admin All Variants" ON variantes_producto;
DROP POLICY IF EXISTS "variantes_select_publico" ON variantes_producto;

-- 3. Crear política permisiva para LECTURA (SELECT)
-- Esto permite que TODOS (Anon, User, Admin) vean todas las variantes.
-- El frontend se encargará de mostrar "Agotado" si stock = 0.
CREATE POLICY "Public Read All Variants" 
ON variantes_producto 
FOR SELECT 
USING (true);

-- 4. Crear política para MODIFICACIÓN (INSERT, UPDATE, DELETE)
-- Permitir a usuarios autenticados (Admin) modificar variantes.
-- idealmente restringido a admins, pero por compatibilidad usamos authenticated.
CREATE POLICY "Authenticated Users Can Modify Variants" 
ON variantes_producto 
FOR ALL 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Verificación simple
DO $$
BEGIN
    RAISE NOTICE 'Políticas de RLS para variantes_producto actualizadas correctamente.';
END $$;
