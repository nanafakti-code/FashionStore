-- ============================================================================
-- NEWSLETTER & CAMPAIGNS SYSTEM - Setup SQL
-- Asegura que las tablas necesarias existen con la estructura correcta
-- ============================================================================

-- 1. Tabla newsletter_subscriptions (ya debería existir)
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  nombre TEXT,
  codigo_descuento TEXT UNIQUE,
  usado BOOLEAN DEFAULT FALSE,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_activo ON newsletter_subscriptions(activo);

-- Añadir columna 'nombre' si no existe (puede que la tabla original no la tenga)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'newsletter_subscriptions' AND column_name = 'nombre'
  ) THEN
    ALTER TABLE newsletter_subscriptions ADD COLUMN nombre TEXT;
  END IF;
END $$;

-- 2. Tabla campanas_email (ya debería existir)
CREATE TABLE IF NOT EXISTS campanas_email (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  asunto TEXT NOT NULL,
  contenido_html TEXT NOT NULL,
  estado TEXT DEFAULT 'Borrador' CHECK (estado IN ('Borrador', 'Programada', 'Enviada', 'Cancelada')),
  tipo_segmento TEXT DEFAULT 'Todos' CHECK (tipo_segmento IN ('Todos', 'Premium', 'Ofertas', 'Abandono')),
  fecha_programada TIMESTAMPTZ,
  fecha_envio TIMESTAMPTZ,
  total_destinatarios INT DEFAULT 0,
  total_enviados INT DEFAULT 0,
  total_abiertos INT DEFAULT 0,
  total_clicks INT DEFAULT 0,
  creada_en TIMESTAMPTZ DEFAULT NOW(),
  actualizada_en TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla campana_email_logs (ya debería existir)
CREATE TABLE IF NOT EXISTS campana_email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campana_id UUID NOT NULL REFERENCES campanas_email(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  estado TEXT DEFAULT 'Enviado' CHECK (estado IN ('Enviado', 'Fallido', 'Abierto', 'Click', 'Rebote')),
  error_mensaje TEXT,
  fecha_evento TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campana_logs_campana_id ON campana_email_logs(campana_id);
CREATE INDEX IF NOT EXISTS idx_campana_logs_email ON campana_email_logs(email);

-- 4. Habilitar RLS (Row Level Security) - políticas permisivas para service_role
ALTER TABLE campanas_email ENABLE ROW LEVEL SECURITY;
ALTER TABLE campana_email_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para campanas_email
DROP POLICY IF EXISTS "Allow all for service_role" ON campanas_email;
CREATE POLICY "Allow all for service_role" ON campanas_email
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read for authenticated" ON campanas_email;
CREATE POLICY "Allow read for authenticated" ON campanas_email
  FOR SELECT USING (true);

-- Políticas para campana_email_logs
DROP POLICY IF EXISTS "Allow all for service_role" ON campana_email_logs;
CREATE POLICY "Allow all for service_role" ON campana_email_logs
  FOR ALL USING (true) WITH CHECK (true);

-- 5. Función para obtener estadísticas de suscriptores
CREATE OR REPLACE FUNCTION get_newsletter_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_suscriptores', (SELECT COUNT(*) FROM newsletter_subscriptions WHERE activo = true),
    'total_campanas', (SELECT COUNT(*) FROM campanas_email),
    'campanas_enviadas', (SELECT COUNT(*) FROM campanas_email WHERE estado = 'Enviada'),
    'campanas_borrador', (SELECT COUNT(*) FROM campanas_email WHERE estado = 'Borrador')
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
