# Configuración de RLS en Supabase

## Problema
El error "new row violates row-level security policy for table usuarios" indica que las políticas RLS no están permitiendo que los usuarios no autenticados inserten datos en la tabla.

## Solución

### Opción 1: Usar la consola SQL de Supabase (Recomendado)

1. Ve a tu proyecto en Supabase: https://app.supabase.com
2. En el menú izquierdo, ve a **SQL Editor**
3. Haz clic en "New Query"
4. Copia y pega el siguiente código:

```sql
-- Permitir que cualquiera cree una cuenta
CREATE POLICY "Allow unauthenticated users to create accounts" 
ON public.usuarios 
FOR INSERT 
WITH CHECK (true);

-- Usuarios pueden ver su propia información
CREATE POLICY "Users can view their own data" 
ON public.usuarios 
FOR SELECT 
USING (auth.uid() = id);

-- Usuarios pueden actualizar su información
CREATE POLICY "Users can update their own data" 
ON public.usuarios 
FOR UPDATE 
USING (auth.uid() = id);
```

5. Haz clic en **Run** (o presiona Ctrl+Enter)
6. Verifica que no haya errores

### Opción 2: Verificar que RLS está habilitado

1. Ve a **Authentication > Policies** en Supabase
2. Selecciona la tabla **usuarios**
3. Verifica que **Row Level Security (RLS)** esté **habilitado**
4. Si no hay políticas listadas, crea las anteriores

### Opción 3: Deshabilitar RLS temporalmente (No recomendado para producción)

Si necesitas que funcione inmediatamente:

```sql
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;
```

**Luego habilítalo con políticas correctas:**

```sql
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
```

## Después de la configuración

1. Recarga la página en el navegador (Ctrl+Shift+R)
2. Intenta crear una cuenta nuevamente
3. El registro debería funcionar sin errores

## Estructura esperada

La tabla `usuarios` debe tener estas columnas:
- `id` (UUID, PK, referencia a auth.users)
- `email` (text)
- `nombre` (text)
- `apellidos` (text)
- `telefono` (text)
- `genero` (text)
- `fecha_nacimiento` (date)
- `foto_perfil` (text)
- `activo` (boolean)
- `verificado` (boolean)

Si faltan columnas, créalas con:
```sql
ALTER TABLE public.usuarios ADD COLUMN nombre TEXT;
-- ... repite para otras columnas faltantes
```
