-- =====================================================
-- FIX: Agregar columnas faltantes a usuarios
-- =====================================================

-- Agregar columna telefono si no existe
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS telefono TEXT;

-- Agregar columna fecha_nacimiento si no existe  
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE;

-- Agregar columna genero si no existe
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS genero TEXT CHECK (genero IN ('Masculino', 'Femenino', 'Otro'));

-- Agregar columna foto_perfil si no existe
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS foto_perfil TEXT;

-- Ahora ejecuta el script de datos: datos-tienda-completa.sql
