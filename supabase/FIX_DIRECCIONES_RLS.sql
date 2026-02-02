
-- =================================================================
-- FIX: Habilitar RLS y Políticas para la tabla 'direcciones'
-- =================================================================
-- Este script soluciona el error 400 Bad Request al actualizar direcciones
-- asegurando que la tabla tenga las políticas de seguridad correctas.
-- =================================================================

-- 1. Habilitar Row Level Security (RLS)
ALTER TABLE public.direcciones ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas existentes para evitar conflictos
DROP POLICY IF EXISTS "Usuarios pueden ver sus propias direcciones" ON public.direcciones;
DROP POLICY IF EXISTS "Usuarios pueden insertar sus propias direcciones" ON public.direcciones;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propias direcciones" ON public.direcciones;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propias direcciones" ON public.direcciones;

-- 3. Crear nuevas políticas completas

-- SELECT: Ver solo mis direcciones
CREATE POLICY "Usuarios pueden ver sus propias direcciones"
ON public.direcciones FOR SELECT
USING (auth.uid() = usuario_id);

-- INSERT: Insertar solo con mi usuario_id
CREATE POLICY "Usuarios pueden insertar sus propias direcciones"
ON public.direcciones FOR INSERT
WITH CHECK (auth.uid() = usuario_id);

-- UPDATE: Actualizar solo mis direcciones
CREATE POLICY "Usuarios pueden actualizar sus propias direcciones"
ON public.direcciones FOR UPDATE
USING (auth.uid() = usuario_id);

-- DELETE: Eliminar solo mis direcciones
CREATE POLICY "Usuarios pueden eliminar sus propias direcciones"
ON public.direcciones FOR DELETE
USING (auth.uid() = usuario_id);

-- 4. Garantizar permisos al rol autenticado (por si acaso)
GRANT ALL ON public.direcciones TO authenticated;
GRANT ALL ON public.direcciones TO service_role;

-- 5. Verificar que la columna es_predeterminada existe y tiene default
-- (Esto no cambia nada si ya está bien, es solo aseguramiento)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'direcciones' AND column_name = 'es_predeterminada') THEN
        ALTER TABLE public.direcciones ADD COLUMN es_predeterminada BOOLEAN DEFAULT FALSE;
    END IF;
END $$;
