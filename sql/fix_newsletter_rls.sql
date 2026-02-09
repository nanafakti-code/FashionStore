-- ============================================================================
-- FIX: Políticas RLS para newsletter_subscriptions
-- Permite que el service_role Y las claves anon puedan leer suscriptores
-- ============================================================================

-- Habilitar RLS si no está habilitado
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Política permisiva de lectura (SELECT) para todos los roles
DROP POLICY IF EXISTS "Allow read for all" ON newsletter_subscriptions;
CREATE POLICY "Allow read for all" ON newsletter_subscriptions
  FOR SELECT USING (true);

-- Política permisiva de escritura para service_role
DROP POLICY IF EXISTS "Allow all for service_role" ON newsletter_subscriptions;
CREATE POLICY "Allow all for service_role" ON newsletter_subscriptions
  FOR ALL USING (true) WITH CHECK (true);

-- Política de INSERT para anon (para que el popup de newsletter funcione)
DROP POLICY IF EXISTS "Allow insert for anon" ON newsletter_subscriptions;
CREATE POLICY "Allow insert for anon" ON newsletter_subscriptions
  FOR INSERT WITH CHECK (true);

-- Política de UPDATE para anon (para desuscribirse)
DROP POLICY IF EXISTS "Allow update for anon" ON newsletter_subscriptions;
CREATE POLICY "Allow update for anon" ON newsletter_subscriptions
  FOR UPDATE USING (true) WITH CHECK (true);
