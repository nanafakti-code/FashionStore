-- =====================================================
-- ADD invoice_attachment_path TO company_settings
-- =====================================================
-- Ejecutar en Supabase SQL Editor
-- Almacena la ruta relativa del PDF genérico que se
-- adjunta a los emails de nuevos pedidos.
-- =====================================================

ALTER TABLE company_settings
  ADD COLUMN IF NOT EXISTS invoice_attachment_path TEXT DEFAULT NULL;

-- Si la tabla no existe por alguna razón, esta migración
-- fallaría; asegúrate de ejecutar admin_preferences.sql primero.
