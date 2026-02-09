-- =============================================
-- CREAR EVENTO PROMOCIONAL PARA EL BANNER
-- =============================================

-- Primero, crear la tabla si no existe
CREATE TABLE IF NOT EXISTS eventos_promocionales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  tipo_descuento TEXT NOT NULL DEFAULT 'porcentaje', -- 'porcentaje' o 'fijo'
  valor_descuento NUMERIC NOT NULL DEFAULT 0,
  banner_texto TEXT NOT NULL,
  banner_color TEXT NOT NULL DEFAULT '#00aa45',
  activo BOOLEAN NOT NULL DEFAULT true,
  fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_fin TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE eventos_promocionales ENABLE ROW LEVEL SECURITY;

-- Política de lectura pública (todos pueden ver eventos activos)
DROP POLICY IF EXISTS "Lectura pública de eventos" ON eventos_promocionales;
CREATE POLICY "Lectura pública de eventos" ON eventos_promocionales
  FOR SELECT USING (true);

-- Política de gestión para admins (service role)
DROP POLICY IF EXISTS "Gestión de eventos para admins" ON eventos_promocionales;
CREATE POLICY "Gestión de eventos para admins" ON eventos_promocionales
  FOR ALL USING (true) WITH CHECK (true);

-- Desactivar eventos anteriores
UPDATE eventos_promocionales SET activo = false WHERE activo = true;

-- Insertar nuevo evento activo (30 días de duración)
INSERT INTO eventos_promocionales (
  nombre,
  descripcion,
  tipo_descuento,
  valor_descuento,
  banner_texto,
  banner_color,
  activo,
  fecha_inicio,
  fecha_fin
) VALUES (
  'Black Friday 2025',
  'Descuentos exclusivos en toda la tienda durante Black Friday',
  'porcentaje',
  15,
  '💥 Black Friday - Descuentos exclusivos por tiempo limitado',
  '#00aa45',
  true,
  now(),
  now() + INTERVAL '30 days'
);

-- Verificar que se creó correctamente
SELECT id, nombre, banner_texto, banner_color, activo, fecha_inicio, fecha_fin 
FROM eventos_promocionales 
WHERE activo = true;
