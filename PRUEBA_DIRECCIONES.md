# 📋 GUÍA DE PRUEBA - GESTIÓN DE DIRECCIONES

## 🚀 Para Probar la Funcionalidad

### 1. **Prueba en Mi Cuenta - Mis Direcciones**

1. Abre `http://localhost:4322/mi-cuenta`
2. Deberías ver un nuevo botón en el menú lateral: **"Mis Direcciones"**
3. Haz click en él
4. Haz click en **"Añadir Nueva Dirección"**
5. Rellena los campos (todos requeridos excepto "Piso"):
   - Nombre del destinatario: Ej: "Juan García"
   - Tipo: Selecciona "Envío"
   - Calle: Ej: "Calle Mayor"
   - Número: Ej: "45"
   - Código Postal: Ej: "28001"
   - Ciudad: Ej: "Madrid"
   - Provincia: Ej: "Madrid"
   - País: "España"
6. Marca "Usar como dirección predeterminada"
7. Haz click en **"Guardar"**
8. ✅ Deberías ver un mensaje "Dirección guardada correctamente"
9. La dirección aparecerá en la lista con un badge "Predeterminada"

### 2. **Prueba en Checkout**

1. Añade un producto al carrito (como se hizo antes)
2. Ve al checkout: `http://localhost:4322/checkout`
3. Deberías ver un selector azul: **"Selecciona una dirección guardada"**
4. Haz click en la dirección que creaste en el paso anterior
5. ✅ El formulario de dirección se rellenará automáticamente:
   - Calle: mostrará "Calle Mayor, 45"
   - Ciudad: "Madrid"
   - etc.

### 3. **Prueba Edición**

1. Vuelve a Mi Cuenta → Mis Direcciones
2. Haz click en el botón **"Editar"** (lápiz) de una dirección
3. Modifica algún campo (Ej: número a "50")
4. Haz click en **"Actualizar"**
5. ✅ Deberías ver "Dirección actualizada correctamente"

### 4. **Prueba Dirección Predeterminada**

1. En Mi Cuenta → Mis Direcciones
2. Si tiene varias direcciones, haz click en la **estrella** (⭐) de otra
3. ✅ Se marcará como predeterminada y en checkout se seleccionará automáticamente

### 5. **Prueba Eliminación**

1. En Mi Cuenta → Mis Direcciones
2. Haz click en el botón **"Eliminar"** (papelera) 🗑️
3. Confirma la eliminación
4. ✅ La dirección desaparece de la lista

## 🔍 Qué Verificar

### En Mi Cuenta
- [x] Botón "Mis Direcciones" visible en el menú
- [x] Contador de direcciones guardadas
- [x] Formulario con todos los campos
- [x] Validación de campos requeridos
- [x] Mensajes de éxito/error
- [x] Listado de direcciones
- [x] Badges de tipo y predeterminada
- [x] Botones de editar, eliminar, marcar predeterminada

### En Checkout
- [x] Selector azul visible para usuarios autenticados
- [x] Direcciones de tipo "Envío" o "Ambas" mostradas
- [x] Auto-rellenado del formulario al seleccionar
- [x] Opción "Usar una dirección diferente" funcional
- [x] Los campos se limpian al cambiar a dirección nueva

## 🐛 Si Algo No Funciona

### "No veo el selector en checkout"
- Asegúrate de estar autenticado (verás un email en el header)
- Deberías tener al menos una dirección guardada
- Si no aparece, abre la consola (F12) y busca errores

### "El formulario no se rellena automáticamente"
- Abre la consola del navegador (F12 → Console)
- Deberías ver: "✓ Formulario rellenado con dirección guardada"
- Si no aparece, reporta el error de consola

### "No puedo guardar una dirección"
- Asegúrate de completar TODOS los campos requeridos
- El campo "Piso" es opcional
- Verifica que los datos sean válidos

## 📊 Base de Datos

Las direcciones se guardan en la tabla `direcciones` con esta estructura:
- `id`: UUID único
- `usuario_id`: ID del usuario propietario
- `nombre_destinatario`: Nombre completo
- `calle`: Nombre de la calle
- `numero`: Número de la vivienda
- `piso`: Piso/puerta (opcional)
- `codigo_postal`: CP
- `ciudad`: Ciudad
- `provincia`: Provincia
- `pais`: País
- `tipo`: "Envío", "Facturación" o "Ambas"
- `es_predeterminada`: true/false
- `creada_en`: Fecha de creación
- `actualizada_en`: Fecha de última actualización

## 🔐 Seguridad

✅ **RLS (Row Level Security) Activo**
- Solo el propietario puede ver/modificar sus direcciones
- Las direcciones están protegidas a nivel de BD

✅ **Validaciones**
- Campos requeridos validados en UI
- Máximo una dirección predeterminada por usuario

## 📞 Contacto para Ayuda

Si tienes problemas:
1. Abre la consola (F12)
2. Anota cualquier error que veas
3. Revisa los pasos de prueba arriba
4. Intenta con datos diferentes
