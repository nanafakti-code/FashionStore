-- =====================================================
-- FIX: POLÍTICAS DE SEGURIDAD (RLS) PARA CARRITO
-- =====================================================
-- Este script habilita y configura los permisos para que 
-- los usuarios puedan guardar productos en su carrito.
-- =====================================================

-- 1. Habilitar seguridad a nivel de fila
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas antiguas para evitar conflictos
DROP POLICY IF EXISTS "Users can view their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can insert into their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can update their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can delete their own cart items" ON cart_items;

-- 3. Crear nuevas políticas de acceso

-- PERMITIR VER (SELECT)
CREATE POLICY "Users can view their own cart items"
ON cart_items FOR SELECT
USING (auth.uid() = user_id);

-- PERMITIR AÑADIR (INSERT)
CREATE POLICY "Users can insert into their own cart items"
ON cart_items FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- PERMITIR ACTUALIZAR (UPDATE)
CREATE POLICY "Users can update their own cart items"
ON cart_items FOR UPDATE
USING (auth.uid() = user_id);

-- PERMITIR ELIMINAR (DELETE)
CREATE POLICY "Users can delete their own cart items"
ON cart_items FOR DELETE
USING (auth.uid() = user_id);


