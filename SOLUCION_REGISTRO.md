# ✅ Solución: Errores en Español y Crear Usuarios

## 1. ✅ Errores Ahora en Español

Los mensajes de error que ves en el modal de login ahora se traducen automáticamente al español:

- ❌ "Invalid login credentials" → ✅ "Email o contraseña incorrectos"
- ❌ "User already registered" → ✅ "Este email ya está registrado"
- ❌ "Password should be at least 6 characters" → ✅ "La contraseña debe tener al menos 6 caracteres"
- ❌ "row-level security policy" → ✅ "Error de permisos. Por favor, intenta más tarde."

## 2. ⚠️ Problema: No se pueden crear usuarios

**Causa:** Las políticas RLS (Row Level Security) en Supabase no están permitiendo inserciones.

**Solución - Pasos a seguir:**

### Paso 1: Abre Supabase
1. Ve a https://app.supabase.com
2. Selecciona tu proyecto

### Paso 2: Accede al SQL Editor
1. En el menú izquierdo, haz clic en **SQL Editor**
2. Haz clic en botón **+ New Query** (arriba a la derecha)

### Paso 3: Ejecuta el script de políticas
Copia y pega esto en el editor SQL:

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

Luego haz clic en **Run** (o presiona Ctrl+Enter)

### Paso 4: Verifica la configuración
1. Ve a **Authentication** en el menú izquierdo
2. Haz clic en **Policies**
3. Selecciona la tabla **usuarios**
4. Deberías ver 3 políticas creadas

### Paso 5: Prueba el registro
1. Recarga la página de FashionStore (Ctrl+Shift+R)
2. Intenta crear una nueva cuenta
3. Debería funcionar sin errores

## 3. Si aún hay problemas

Si ves el error "row-level security policy" nuevamente:

**Solución temporal:**
```sql
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;
```

Esto desactiva la seguridad (solo para pruebas). Luego ejecuta las políticas anteriores.

## Checklist final
- [ ] Errores en español ✅
- [ ] Políticas RLS creadas en Supabase
- [ ] Tabla usuarios existe con todas las columnas
- [ ] RLS habilitado en tabla usuarios
- [ ] Puedes crear cuentas sin errores

---

📝 **Nota:** Si necesitas help, revisa el archivo `RLS_SETUP.md` en la carpeta del proyecto.
