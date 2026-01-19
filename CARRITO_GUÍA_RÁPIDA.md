# 🚀 GUÍA RÁPIDA: Cómo Arreglar el Carrito

## ⚠️ IMPORTANTE: Este proceso borrará los datos del carrito anterior

## Paso 1: Ir a Supabase

1. Abre tu dashboard de Supabase
2. Selecciona tu proyecto FashionStore
3. Ve a **SQL Editor** (lado izquierdo)

## Paso 2: Ejecutar el Script

1. Haz clic en **+ New Query**
2. Copia TODO el contenido de: [`supabase/CARRITO_FIX_RÁPIDO.sql`](supabase/CARRITO_FIX_RÁPIDO.sql)
3. Pégalo en el editor
4. Haz clic en el botón **▶ Run** (arriba a la derecha)

## Paso 3: Verificar que Funcionó

Deberías ver:
```
status
-----
Tabla creada correctamente
```

## Paso 4: Probar desde la Aplicación

1. Abre tu app FashionStore en el navegador
2. Cierra sesión completamente
3. Inicia sesión con un usuario
4. Ve a un producto
5. Intenta añadir al carrito
6. ✅ Debería funcionar sin errores

## Paso 5: Verificar en Supabase (Opcional)

Para ver que los datos se guardaron correctamente:

1. Ve a **Table Editor** en Supabase
2. Abre la tabla `cart_items`
3. Deberías ver una fila con tu producto añadido
4. Intenta añadir el MISMO producto de nuevo:
   - Si tiene la MISMA talla/color → se suma la cantidad
   - Si tiene DIFERENTE talla/color → se crea otro item

## ¿Qué se Arregló?

| Problema | Solución |
|----------|----------|
| user_id podía ser NULL | Ahora es NOT NULL (requerido) |
| Permitía duplicados | Índice UNIQUE evita duplicados |
| Queries fallaban con NULL | Ahora usa `.is()` para NULL |
| RLS inefectivo | Políticas recreadas correctamente |

## 📝 Resumen de Cambios en Código

### cartService.ts (addToAuthenticatedCart)
```typescript
// ANTES (no funcionaba):
.match(talla ? { talla } : {})

// AHORA (funciona):
if (talla) {
  query = query.eq('talla', talla);
} else {
  query = query.is('talla', null);
}
```

## 🐛 Si Aún No Funciona

### Opción 1: Ver el error exacto
Abre la consola del navegador (F12):
- Tab **Console** 
- Intenta añadir producto
- Busca mensajes rojos que digan "Error adding to cart"
- Cópialo y busca en Google o pregunta

### Opción 2: Verificar RLS
En Supabase:
1. Ve a **Authentication > Policies**
2. Selecciona tabla `cart_items`
3. Debería mostrar 4 políticas (SELECT, INSERT, UPDATE, DELETE)
4. Si falta alguna, ejecuta nuevamente el script

### Opción 3: Verificar autenticación
```javascript
// En la consola del navegador (F12 > Console):
const { data: { user } } = await supabaseClient.auth.getUser();
console.log(user);
```
Debería mostrar tu usuario. Si es NULL, no estás autenticado.

## 📞 Soporte

Si después de estos pasos aún no funciona:
1. Verifica que estés autenticado (ver Opción 3 arriba)
2. Verifica que la tabla `productos` existe en tu BD
3. Verifica que el usuario está en `auth.users` de Supabase
4. Revisa los logs en Supabase > Logs > Database

---

**Versión**: 1.0
**Última actualización**: 15 de enero de 2026
