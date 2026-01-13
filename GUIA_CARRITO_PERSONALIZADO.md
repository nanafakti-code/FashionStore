# 🛍️ Guía Rápida: Carrito Personalizado por Usuario

## Resumen de Cambios

He implementado un **carrito completamente funcional y personalizado por usuario**. Cada cuenta tiene su propio carrito almacenado en Supabase.

## 🎯 ¿Qué Hace Ahora?

### Usuarios NO Autenticados
- Pueden agregar productos al carrito
- El carrito se guarda en `localStorage` de su navegador
- Se mantiene entre sesiones
- Si cierran el navegador, el carrito se preserva

### Usuarios Autenticados
- Los productos se guardan en **Supabase** (base de datos)
- El carrito es **único por usuario**
- El carrito persiste sin importar el navegador
- Pueden acceder desde cualquier dispositivo

### Migración Automática
- Cuando un usuario inicia sesión con carrito local, **se migra automáticamente**
- Los productos que había en el carrito local se fusionan con el carrito del usuario
- El proceso es invisible para el usuario

## 📁 Archivos Nuevos Creados

### 1. **`src/lib/cartService.ts`** ⭐ (Principal)
Servicio centralizado que maneja todas las operaciones:
- Obtener carrito del usuario
- Agregar productos
- Actualizar cantidades
- Eliminar productos
- Vaciar carrito completo

**Uso:**
```typescript
import { addToCart, getCartForCurrentUser } from '@/lib/cartService';

// Agregar al carrito
await addToCart(productId, name, price, image, quantity);

// Obtener carrito
const items = await getCartForCurrentUser();
```

### 2. **`src/lib/cartMigration.ts`**
Maneja la migración del carrito local a la BD:
- Se ejecuta automáticamente al iniciar sesión
- Fusiona productos del carrito local
- Limpia el localStorage

### 3. **`src/pages/api/carrito.ts`**
API RESTful con tres métodos:
- `GET /api/carrito` - Obtiene el carrito actual
- `POST /api/carrito` - Agrega producto al carrito
- `DELETE /api/carrito` - Elimina o vacía el carrito

## 📝 Archivos Modificados

### 1. **`src/components/islands/AddToCartButton.tsx`**
- Ahora usa `addToCart()` del servicio
- Sincroniza con Supabase automáticamente

### 2. **`src/components/islands/Cart.tsx`**
- Carga el carrito desde `getCartForCurrentUser()`
- Se actualiza en tiempo real
- Indicador de carga mientras obtiene datos

### 3. **`src/components/islands/CartIcon.tsx`**
- Muestra el contador correcto de items
- Se actualiza reactivamente

### 4. **`src/components/islands/AuthButtons.tsx`**
- Ejecuta la migración al iniciar sesión
- Sincroniza el carrito automáticamente

### 5. **`src/pages/auth/callback.astro`**
- Inicia la migración después de OAuth
- Confirma que el carrito se haya migrado

## 🔄 Flujo de Funcionamiento

```
┌─────────────────────────────────────────────────────────┐
│                    Usuario Entra                         │
└─────────────┬───────────────────────────────────────────┘
              │
      ┌───────┴──────────┐
      │                  │
   ¿Autenticado?        NO
      │                  │
     SÍ              Carrito Local
      │              (localStorage)
      │                  │
      ▼                  │
Supabase ◄───────────────┘
  carrito                (Se migra al autenticar)
  
  Usuario Cierra Sesión
      │
      ▼
  Carrito Local (localStorage)
  Se preserva para la próxima sesión
```

## 🚀 Cómo Probar

### Test 1: Sin Autenticar
```
1. Abre la tienda
2. Agrega 2-3 productos al carrito
3. Recarga la página (F5)
4. ✅ Los productos siguen en el carrito
5. Abre en otra pestaña
6. ✅ El carrito está sincronizado
```

### Test 2: Autenticado
```
1. Inicia sesión con Google/Apple
2. Agrega productos
3. Cierra sesión
4. Vuelve a iniciar sesión
5. ✅ El carrito se mantiene
6. ✅ Los datos están en Supabase
```

### Test 3: Migración
```
1. SIN autenticar, agrega productos
2. Inicia sesión
3. ✅ Los productos migraron automáticamente
4. Revisa /carrito
5. ✅ Los productos están allí
```

### Test 4: Múltiples Cuentas
```
1. Crea una cuenta con usuario A
2. Agrega productos
3. Cierra sesión
4. Crea una cuenta con usuario B
5. ✅ B tiene un carrito vacío (no ve productos de A)
```

## 🔐 Seguridad

- Las operaciones requieren autenticación en Supabase
- Cada usuario solo puede ver/modificar su propio carrito
- Los datos están protegidos a nivel de BD

## 📊 Base de Datos

Se usa esta estructura (ya existe en tu schema.sql):

**Tabla: carrito**
- `id` (UUID)
- `usuario_id` (vinculado al usuario)
- `creado_en`, `actualizado_en`

**Tabla: carrito_items**
- `id` (UUID)
- `carrito_id` (vinculado al carrito)
- `producto_id` (vinculado al producto)
- `cantidad`, `talla`, `color`
- `precio_unitario`

## ✅ Checklist de Verificación

- [x] Crear archivo `cartService.ts` con lógica centralizada
- [x] Crear API endpoint `/api/carrito`
- [x] Actualizar `AddToCartButton.tsx`
- [x] Actualizar `Cart.tsx`
- [x] Actualizar `CartIcon.tsx`
- [x] Crear sistema de migración
- [x] Actualizar `AuthButtons.tsx` para migrar
- [x] Actualizar `callback.astro` para migrar

## 🎨 Comportamiento Visual

- Contador de items en el header se actualiza en tiempo real
- Página de carrito carga datos desde Supabase
- Sin lag ni demora observable
- Fallback a localStorage si hay error en BD

## 🐛 Troubleshooting

**El carrito no se sincroniza:**
- Verificar que Supabase esté configurado
- Revisar que el usuario esté autenticado
- Revisar la consola del navegador

**Los datos no migran:**
- Esperar 2 segundos en la página de callback
- Revisar que el usuario esté autenticado
- Verificar localStorage tiene datos

**El contador no actualiza:**
- Recargar la página
- Verificar que el evento `cartUpdated` se dispare
- Revisar la consola

---

## 📞 Resumen

**Ahora cada usuario tiene:**
✅ Carrito único y personalizado
✅ Datos almacenados en Supabase
✅ Sincronización automática entre dispositivos
✅ Migración automática de carrito local
✅ Experiencia perfecta sin pérdida de datos
