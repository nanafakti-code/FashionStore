-- =====================================================
-- ADMIN NOTIFICATION PREFERENCES
-- =====================================================
-- Ejecutar en Supabase SQL Editor
-- Tabla para almacenar las preferencias de notificación del admin
-- =====================================================

-- 1. Crear la tabla
CREATE TABLE IF NOT EXISTS admin_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Email notifications
    new_order       BOOLEAN NOT NULL DEFAULT true,
    low_stock       BOOLEAN NOT NULL DEFAULT true,
    new_user        BOOLEAN NOT NULL DEFAULT false,
    
    -- Push notifications
    urgent_order    BOOLEAN NOT NULL DEFAULT false,
    returns         BOOLEAN NOT NULL DEFAULT true,
    
    -- Reports
    daily_summary   BOOLEAN NOT NULL DEFAULT true,
    weekly_report   BOOLEAN NOT NULL DEFAULT true,
    monthly_report  BOOLEAN NOT NULL DEFAULT false,
    
    -- Meta
    admin_email     TEXT NOT NULL DEFAULT 'fashionstorerbv@gmail.com',
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Insertar fila por defecto (singleton — una sola fila)
INSERT INTO admin_preferences (admin_email)
VALUES ('fashionstorerbv@gmail.com')
ON CONFLICT DO NOTHING;

-- 3. Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_admin_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_admin_preferences_updated ON admin_preferences;
CREATE TRIGGER trg_admin_preferences_updated
    BEFORE UPDATE ON admin_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_preferences_timestamp();

-- 4. RLS — permitir lectura/escritura pública (el panel admin ya tiene su propia auth)
ALTER TABLE admin_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read admin_preferences" ON admin_preferences;
CREATE POLICY "Allow read admin_preferences" ON admin_preferences
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow update admin_preferences" ON admin_preferences;
CREATE POLICY "Allow update admin_preferences" ON admin_preferences
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow insert admin_preferences" ON admin_preferences;
CREATE POLICY "Allow insert admin_preferences" ON admin_preferences
    FOR INSERT WITH CHECK (true);


-- =====================================================
-- ADMIN CREDENTIALS (contraseña dinámica)
-- =====================================================
-- Migra las credenciales hardcoded a BD para poder
-- cambiar la contraseña desde el panel de configuración.
-- La contraseña se almacena en texto plano (simplificado).
-- En producción usar pgcrypto/bcrypt.
-- =====================================================

CREATE TABLE IF NOT EXISTS admin_credentials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email       TEXT NOT NULL DEFAULT 'admin@fashionstore.com',
    password    TEXT NOT NULL DEFAULT '1234',
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insertar credenciales por defecto (singleton)
INSERT INTO admin_credentials (email, password)
VALUES ('admin@fashionstore.com', '1234')
ON CONFLICT DO NOTHING;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_admin_credentials_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_admin_credentials_updated ON admin_credentials;
CREATE TRIGGER trg_admin_credentials_updated
    BEFORE UPDATE ON admin_credentials
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_credentials_timestamp();

-- RLS
ALTER TABLE admin_credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read admin_credentials" ON admin_credentials;
CREATE POLICY "Allow read admin_credentials" ON admin_credentials
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow update admin_credentials" ON admin_credentials;
CREATE POLICY "Allow update admin_credentials" ON admin_credentials
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow insert admin_credentials" ON admin_credentials;
CREATE POLICY "Allow insert admin_credentials" ON admin_credentials
    FOR INSERT WITH CHECK (true);


-- =====================================================
-- COMPANY SETTINGS (datos fiscales de la empresa)
-- =====================================================

CREATE TABLE IF NOT EXISTS company_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre          TEXT NOT NULL DEFAULT 'FashionStore',
    nif             TEXT NOT NULL DEFAULT 'B-12345678',
    email           TEXT NOT NULL DEFAULT 'fashionstorerbv@gmail.com',
    telefono        TEXT NOT NULL DEFAULT '+34 910 000 000',
    direccion       TEXT NOT NULL DEFAULT 'Calle Gran Vía 28, 3ª Planta',
    ciudad          TEXT NOT NULL DEFAULT 'Madrid',
    codigo_postal   TEXT NOT NULL DEFAULT '28013',
    pais            TEXT NOT NULL DEFAULT 'España',
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insertar fila por defecto (singleton)
INSERT INTO company_settings (email)
VALUES ('fashionstorerbv@gmail.com')
ON CONFLICT DO NOTHING;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_company_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_company_settings_updated ON company_settings;
CREATE TRIGGER trg_company_settings_updated
    BEFORE UPDATE ON company_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_company_settings_timestamp();

-- RLS
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read company_settings" ON company_settings;
CREATE POLICY "Allow read company_settings" ON company_settings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow update company_settings" ON company_settings;
CREATE POLICY "Allow update company_settings" ON company_settings
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow insert company_settings" ON company_settings;
CREATE POLICY "Allow insert company_settings" ON company_settings
    FOR INSERT WITH CHECK (true);
