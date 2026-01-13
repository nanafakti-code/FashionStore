# 🔐 ACCESO AL PANEL DE ADMINISTRACIÓN

## Credenciales de Inicio de Sesión

```
URL: http://localhost:3000/admin-secret-login
Email: admin@fashionstore.com
Contraseña: 1234
```

---

## 📋 ¿Qué puedes hacer en el Panel?

### 1. **Ver Todos los Productos** 📦
- Tabla con lista completa de productos
- Información: nombre, precio, stock, estado
- Datos en tiempo real desde la base de datos

### 2. **Crear Producto Nuevo** ➕
```
1. Click botón "Crear Nuevo Producto"
2. Rellena el formulario:
   - Nombre del producto
   - Descripción (opcional)
   - Precio en euros
   - Cantidad en stock
3. Click "Crear Producto"
```

### 3. **Editar Producto** ✏️
```
1. Busca el producto en la tabla
2. Click botón "Editar"
3. Modifica los campos que necesites
4. Click "Actualizar"
```

### 4. **Eliminar Producto** 🗑️
```
1. Busca el producto en la tabla
2. Click botón "Eliminar"
3. Confirma la acción
4. El producto se marca como inactivo
```

---

## 📊 Estadísticas Disponibles

- **Total de Productos**: Cantidad de artículos en catálogo
- **Stock Total**: Unidades disponibles en inventario
- **Valor del Inventario**: Precio total de todos los productos
- **Productos Activos**: Cantidad de artículos disponibles para venta

---

## 🔒 Seguridad

✅ **Protección**: Solo administradores pueden acceder  
✅ **Sesión**: Expira automáticamente en 24 horas  
✅ **Cookies**: Almacenadas de forma segura (HTTPOnly)  
✅ **Datos**: Guardados en base de datos Supabase  

---

## ⚠️ Importante

- **Nunca compartas** las credenciales de admin
- **Cambia la contraseña** antes de producción
- Los datos se guardan **permanentemente** en la BD
- Las sesiones **expiran tras 24 horas** de inactividad

---

## 🚀 Flujo Completo

```
1. Accede a /admin-secret-login
   ↓
2. Ingresa credenciales
   ↓
3. Sistema valida y crea sesión
   ↓
4. Redirige a /admin/dashboard
   ↓
5. Dashboard cargado con productos
   ↓
6. Gestiona productos libremente
   ↓
7. Click "Salir" para cerrar sesión
```

---

## 💡 Consejos

- Guarda **stock actualizado** regularmente
- Revisa **precio** antes de publicar
- Describe bien los **productos**
- Mantén **activos** solo lo que vendes
- Usa **nombres claros** para productos

---

## 🔧 En Caso de Problemas

**Olvidé la contraseña:**
- Contacta al desarrollador
- Edita `src/lib/admin-auth.ts`

**No puedo acceder:**
- Borra cookies del navegador
- Intenta en modo incógnito
- Recarga la página (Ctrl+F5)

**El producto no se guardó:**
- Revisa conexión a internet
- Comprueba que Supabase esté activo
- Intenta de nuevo

---

## 📞 Contacto

Para reportar problemas o solicitar cambios al panel, contacta al equipo de desarrollo.
