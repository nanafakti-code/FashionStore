-- ============================================
-- FASHIONSTORE - SETUP DEVOLUCIONES (VERSIÓN SIMPLE)
-- ============================================
-- Copiar y ejecutar TODO el contenido en Supabase SQL Editor
-- NO ejecutar línea por línea
-- ============================================

-- PASO 1: Crear tabla ordenes (si no existe)
CREATE TABLE IF NOT EXISTS ordenes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_orden TEXT NOT NULL UNIQUE,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  estado TEXT NOT NULL DEFAULT 'Pendiente' CHECK (estado IN (
    'Pendiente', 'Confirmado', 'Pagado', 'Enviado', 
    'Entregado', 'Cancelado', 'Devuelto', 'Devolucion_Solicitada'
  )),
  subtotal INTEGER NOT NULL DEFAULT 0,
  impuestos INTEGER NOT NULL DEFAULT 0,
  coste_envio INTEGER NOT NULL DEFAULT 0,
  descuento INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL,
  cupon_id UUID,
  metodo_pago TEXT,
  stripe_payment_intent TEXT,
  is_guest BOOLEAN DEFAULT FALSE,
  nombre_cliente TEXT,
  email_cliente TEXT,
  telefono_cliente TEXT,
  direccion_envio JSONB,
  fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
  fecha_pago TIMESTAMPTZ,
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- PASO 2: Crear índices para ordenes
CREATE INDEX IF NOT EXISTS idx_ordenes_usuario_id ON ordenes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_estado ON ordenes(estado);
CREATE INDEX IF NOT EXISTS idx_ordenes_numero ON ordenes(numero_orden);
CREATE INDEX IF NOT EXISTS idx_ordenes_email_cliente ON ordenes(email_cliente);
CREATE INDEX IF NOT EXISTS idx_ordenes_stripe_payment ON ordenes(stripe_payment_intent);

-- PASO 3: Crear tabla items_orden
CREATE TABLE IF NOT EXISTS items_orden (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  orden_id UUID NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id) ON DELETE SET NULL,
  producto_nombre TEXT NOT NULL,
  producto_imagen TEXT,
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  talla TEXT,
  color TEXT,
  precio_unitario INTEGER NOT NULL,
  subtotal INTEGER NOT NULL,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- PASO 4: Crear índices para items_orden
CREATE INDEX IF NOT EXISTS idx_items_orden_orden_id ON items_orden(orden_id);
CREATE INDEX IF NOT EXISTS idx_items_orden_producto_id ON items_orden(producto_id);

-- PASO 5: Habilitar RLS en ordenes
ALTER TABLE ordenes ENABLE ROW LEVEL SECURITY;

-- PASO 6: Crear políticas RLS para ordenes
DROP POLICY IF EXISTS "Users can view their own orders" ON ordenes;
CREATE POLICY "Users can view their own orders" ON ordenes
FOR SELECT
USING (
  auth.uid() = usuario_id 
  OR 
  (is_guest = true AND email_cliente = current_setting('app.current_user_email', true))
);

DROP POLICY IF EXISTS "Service role inserts orders" ON ordenes;
CREATE POLICY "Service role inserts orders" ON ordenes
FOR INSERT
WITH CHECK (true);

-- PASO 7: Crear tabla devoluciones
CREATE TABLE IF NOT EXISTS devoluciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  orden_id UUID NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,
  numero_devolucion TEXT NOT NULL UNIQUE,
  motivo TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'Pendiente' CHECK (estado IN (
    'Pendiente',
    'Aprobada',
    'Rechazada',
    'Producto_Recibido',
    'Reembolso_Procesado',
    'Completada'
  )),
  notas_admin TEXT,
  fecha_solicitud TIMESTAMPTZ DEFAULT NOW(),
  fecha_aprobacion TIMESTAMPTZ,
  fecha_recepcion TIMESTAMPTZ,
  fecha_reembolso TIMESTAMPTZ,
  importe_reembolso INTEGER,
  metodo_reembolso TEXT,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- PASO 8: Crear índices para devoluciones
CREATE INDEX IF NOT EXISTS idx_devoluciones_orden_id ON devoluciones(orden_id);
CREATE INDEX IF NOT EXISTS idx_devoluciones_estado ON devoluciones(estado);
CREATE INDEX IF NOT EXISTS idx_devoluciones_numero ON devoluciones(numero_devolucion);

-- PASO 9: Habilitar RLS en devoluciones
ALTER TABLE devoluciones ENABLE ROW LEVEL SECURITY;

-- PASO 10: Crear políticas RLS para devoluciones
DROP POLICY IF EXISTS "Users can view their own returns" ON devoluciones;
CREATE POLICY "Users can view their own returns" ON devoluciones
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM ordenes 
    WHERE ordenes.id = devoluciones.orden_id 
    AND ordenes.usuario_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Service role manages returns" ON devoluciones;
CREATE POLICY "Service role manages returns" ON devoluciones
FOR ALL
USING (true)
WITH CHECK (true);

-- PASO 11: Crear función para buscar devoluciones por invitado
CREATE OR REPLACE FUNCTION buscar_devolucion_invitado(
  p_numero_devolucion TEXT,
  p_email TEXT
)
RETURNS TABLE (
  id UUID,
  numero_devolucion TEXT,
  estado TEXT,
  motivo TEXT,
  fecha_solicitud TIMESTAMPTZ,
  orden_numero TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.numero_devolucion,
    d.estado,
    d.motivo,
    d.fecha_solicitud,
    o.numero_orden
  FROM devoluciones d
  JOIN ordenes o ON d.orden_id = o.id
  WHERE d.numero_devolucion = p_numero_devolucion
  AND o.email_cliente = p_email;
END;
$$;

-- PASO 12: Crear vista para administradores
CREATE OR REPLACE VIEW admin_devoluciones AS
SELECT 
  d.id,
  d.numero_devolucion,
  d.estado,
  d.motivo,
  d.fecha_solicitud,
  d.fecha_aprobacion,
  d.fecha_reembolso,
  d.importe_reembolso,
  d.notas_admin,
  o.numero_orden,
  o.total as orden_total,
  COALESCE(o.nombre_cliente, u.nombre) as nombre_cliente,
  COALESCE(o.email_cliente, u.email) as email_cliente
FROM devoluciones d
JOIN ordenes o ON d.orden_id = o.id
LEFT JOIN usuarios u ON o.usuario_id = u.id
ORDER BY d.fecha_solicitud DESC;

-- PASO 13: Crear trigger para timestamp automático
CREATE OR REPLACE FUNCTION update_devolucion_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_devolucion_timestamp ON devoluciones;
CREATE TRIGGER trigger_update_devolucion_timestamp
  BEFORE UPDATE ON devoluciones
  FOR EACH ROW
  EXECUTE FUNCTION update_devolucion_timestamp();

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================
-- Ejecuta esta query para verificar que todo se creó correctamente:

SELECT 
  'ordenes' as tabla,
  COUNT(*) as columnas
FROM information_schema.columns 
WHERE table_name = 'ordenes'

UNION ALL

SELECT 
  'items_orden' as tabla,
  COUNT(*) as columnas
FROM information_schema.columns 
WHERE table_name = 'items_orden'

UNION ALL

SELECT 
  'devoluciones' as tabla,
  COUNT(*) as columnas
FROM information_schema.columns 
WHERE table_name = 'devoluciones';
