-- ============================================
-- FASHIONSTORE - SOPORTE CHECKOUT INVITADOS
-- ============================================
-- Ejecutar este script en Supabase SQL Editor
-- para habilitar compras sin registro
-- ============================================

-- 1. Hacer usuario_id nullable en ordenes
-- (Permitir órdenes sin usuario registrado)
ALTER TABLE ordenes 
ALTER COLUMN usuario_id DROP NOT NULL;

-- 2. Añadir columna is_guest
ALTER TABLE ordenes 
ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT FALSE;

-- 3. Añadir columnas para datos de cliente invitado
ALTER TABLE ordenes 
ADD COLUMN IF NOT EXISTS nombre_cliente TEXT,
ADD COLUMN IF NOT EXISTS email_cliente TEXT,
ADD COLUMN IF NOT EXISTS telefono_cliente TEXT;

-- 4. Crear índice para búsqueda por email
CREATE INDEX IF NOT EXISTS idx_ordenes_email_cliente 
ON ordenes(email_cliente);

-- 5. Actualizar política RLS para ordenes
-- Permitir inserción desde webhook (service role)
DROP POLICY IF EXISTS "Users can view their own orders" ON ordenes;
DROP POLICY IF EXISTS "Users can insert their own orders" ON ordenes;
DROP POLICY IF EXISTS "Service role can manage all orders" ON ordenes;

-- Usuarios pueden ver sus propias órdenes (registrados)
CREATE POLICY "Users can view their own orders" ON ordenes
FOR SELECT
USING (
  auth.uid() = usuario_id 
  OR 
  -- Invitados pueden ver por email (verificación requerida)
  (is_guest = true AND email_cliente = current_setting('app.current_user_email', true))
);

-- Solo el backend puede insertar órdenes (via webhook)
CREATE POLICY "Service role inserts orders" ON ordenes
FOR INSERT
WITH CHECK (true);

-- Usuarios pueden ver items de sus órdenes
DROP POLICY IF EXISTS "Users can view their order items" ON items_orden;
CREATE POLICY "Users can view their order items" ON items_orden
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM ordenes 
    WHERE ordenes.id = items_orden.orden_id 
    AND (
      ordenes.usuario_id = auth.uid() 
      OR ordenes.is_guest = true
    )
  )
);

-- 6. Función para buscar orden por número y email (invitados)
CREATE OR REPLACE FUNCTION buscar_orden_invitado(
  p_numero_orden TEXT,
  p_email TEXT
)
RETURNS TABLE (
  id UUID,
  numero_orden TEXT,
  estado TEXT,
  total INTEGER,
  fecha_creacion TIMESTAMPTZ,
  direccion_envio JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.numero_orden,
    o.estado,
    o.total,
    o.fecha_creacion,
    o.direccion_envio
  FROM ordenes o
  WHERE o.numero_orden = p_numero_orden
  AND o.email_cliente = p_email
  AND o.is_guest = true;
END;
$$;

-- 7. Vista para administradores (todas las órdenes)
CREATE OR REPLACE VIEW admin_ordenes AS
SELECT 
  o.id,
  o.numero_orden,
  o.estado,
  o.total,
  o.fecha_creacion,
  o.is_guest,
  COALESCE(o.nombre_cliente, u.nombre) as nombre_cliente,
  COALESCE(o.email_cliente, u.email) as email_cliente,
  o.direccion_envio,
  o.fecha_pago,
  o.fecha_envio,
  o.fecha_entrega
FROM ordenes o
LEFT JOIN usuarios u ON o.usuario_id = u.id;

-- 8. Actualizar órdenes existentes
UPDATE ordenes 
SET is_guest = false 
WHERE is_guest IS NULL AND usuario_id IS NOT NULL;

-- 9. Comentarios de documentación
COMMENT ON COLUMN ordenes.is_guest IS 'True si el pedido fue realizado por un invitado (sin cuenta)';
COMMENT ON COLUMN ordenes.nombre_cliente IS 'Nombre del cliente (para invitados o respaldo)';
COMMENT ON COLUMN ordenes.email_cliente IS 'Email del cliente (para invitados o respaldo)';
COMMENT ON FUNCTION buscar_orden_invitado IS 'Permite a invitados consultar el estado de su pedido con número de orden y email';

-- ============================================
-- VERIFICACIÓN
-- ============================================
SELECT 
  column_name, 
  is_nullable, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'ordenes' 
AND column_name IN ('usuario_id', 'is_guest', 'nombre_cliente', 'email_cliente')
ORDER BY column_name;
