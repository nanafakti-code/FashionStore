-- =====================================================
-- MIGRACIÓN: Añadir columnas de perfil a usuarios
-- Columnas: ciudad, pais, rol
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. Añadir columna "ciudad" (nullable)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ciudad TEXT;

-- 2. Añadir columna "pais" (nullable, default 'España')
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS pais TEXT DEFAULT 'España';

-- 3. Añadir columna "rol" (nullable, default 'Cliente')
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS rol TEXT DEFAULT 'Cliente';

-- 4. Establecer rol 'Administrador' para el admin existente
UPDATE usuarios
SET rol = 'Administrador'
WHERE email = 'admin@fashionstore.com';
