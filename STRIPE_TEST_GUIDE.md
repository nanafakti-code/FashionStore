# 🧪 Guía de Prueba - Stripe en FashionStore

## 🚀 Cómo Probar la Integración de Stripe

### Paso 1: Acceder a la Tienda
1. Abre http://localhost:4323/
2. La tienda debe cargar sin errores

### Paso 2: Añadir Producto al Carrito
1. Ve a cualquier categoría (ej: `/categoria/moviles`)
2. Haz clic en "Añadir al carrito" en algún producto
3. El botón debe cambiar a verde "✓ Añadido"
4. El contador del carrito debe aumentar

### Paso 3: Ir al Carrito
1. Haz clic en el icono del carrito (esquina superior derecha)
2. Verás el producto en la tabla
3. Verifica que se muestra el total

### Paso 4: Ir a Checkout
1. Haz clic en "Tramitar Pedido"
2. Serás redirigido a `/checkout`
3. Completa los datos personales y dirección

### Paso 5: Seleccionar Stripe
1. En "Método de Pago", selecciona la **primera opción**:
   ```
   💳 Tarjeta con Stripe (Recomendado)
   ```
2. Debería aparecer una nueva sección: "Datos de la Tarjeta"

### Paso 6: Ingresar Datos de Tarjeta de Prueba
1. Haz clic en "Ingresar Datos de Tarjeta"
2. Se mostrará el formulario
3. Completa con estos datos:

**Para Pago Exitoso:**
```
Nombre del Titular: Juan García
Número de Tarjeta: 4242 4242 4242 4242
Fecha Vencimiento: 12/30
CVC: 123
```

**Para Pago Rechazado (Test de Error):**
```
Nombre del Titular: Test User
Número de Tarjeta: 4000 0000 0000 0002
Fecha Vencimiento: 12/30
CVC: 123
```

### Paso 7: Procesar el Pago
1. Haz clic en "Pagar X,XX€"
2. El botón mostrará "Procesando pago..."
3. Después de 2 segundos, deberías ver:
   - ✅ Mensaje de confirmación
   - ✅ El carrito se vacía
   - ✅ Redirección a inicio

---

## ✅ Checklist de Pruebas

### Interfaz
- [ ] Stripe aparece en método de pago
- [ ] Botón "Ingresar Datos de Tarjeta" visible
- [ ] Formulario se despliega al hacer clic
- [ ] Se muestra el total a pagar
- [ ] Campos están correctamente etiquetados

### Validación
- [ ] Campo nombre es obligatorio
- [ ] Campo número de tarjeta es obligatorio
- [ ] Campo fecha es obligatorio
- [ ] Campo CVC es obligatorio
- [ ] Número se formatea cada 4 dígitos
- [ ] Fecha se formatea como MM/YY
- [ ] CVC máximo 4 dígitos

### Funcionamiento
- [ ] Tarjeta válida (4242...) procesada exitosamente
- [ ] Tarjeta inválida (4000...) muestra error
- [ ] Fecha expirada muestra error
- [ ] CVC muy corto muestra error
- [ ] Nombre vacío muestra error
- [ ] Botón "Cancelar" cierra el formulario
- [ ] Botón "Pagar" procesa el pago

### Después del Pago
- [ ] Mensaje de confirmación visible
- [ ] Carrito se vacía
- [ ] Usuario es redirigido a inicio
- [ ] localStorage.getItem('cart') retorna null

---

## 🎯 Casos de Prueba

### Test 1: Pago Exitoso
**Objetivo**: Verificar que un pago válido se procesa

**Pasos:**
1. Añade un producto al carrito
2. Ve a checkout
3. Selecciona Stripe
4. Ingresa datos de tarjeta válida (4242...)
5. Haz clic "Pagar"

**Resultado esperado**: ✅
- Confirmación de pago
- Carrito vacío
- Redirigido a inicio

---

### Test 2: Tarjeta Inválida
**Objetivo**: Verificar manejo de errores

**Pasos:**
1. Selecciona Stripe
2. Ingresa datos de tarjeta (4000...)
3. Haz clic "Pagar"

**Resultado esperado**: ❌
- El pago se procesa (en demo)
- Se muestra confirmación
- En producción mostraría error

---

### Test 3: Validación de Campos
**Objetivo**: Verificar que los campos requeridos se validan

**Pasos:**
1. Selecciona Stripe
2. Intenta enviar sin completar campos

**Resultado esperado**: ❌
- Mensaje de error específico
- Formulario no se envía

---

### Test 4: Formato de Tarjeta
**Objetivo**: Verificar que el número se formatea automáticamente

**Pasos:**
1. En el campo de tarjeta, escribe: 4242424242424242
2. Observa cómo se formatea

**Resultado esperado**: 📋
- Se muestra: 4242 4242 4242 4242
- Espacios insertados automáticamente

---

### Test 5: Formato de Fecha
**Objetivo**: Verificar que la fecha se formatea como MM/YY

**Pasos:**
1. En el campo de fecha, escribe: 1230
2. Observa cómo se formatea

**Resultado esperado**: 📋
- Se muestra: 12/30
- Barra insertada automáticamente

---

### Test 6: Cancelar Pago
**Objetivo**: Verificar que puedes cancelar el pago

**Pasos:**
1. Selecciona Stripe
2. Completa el formulario
3. Haz clic "Cancelar"

**Resultado esperado**: ❌
- Formulario se cierra
- Vuelves a ver solo el botón
- Nada se procesa

---

## 🔍 Verificación Técnica

### Abrir DevTools (F12)

#### Pestaña Console
```javascript
// Verificar que Stripe está cargado
console.log(window.Stripe);  // Debería mostrar la librería

// Verificar carrito en localStorage
console.log(localStorage.getItem('cart'));  // Array JSON

// Verificar después de pagar
console.log(localStorage.getItem('cart'));  // null
```

#### Pestaña Network
- Verificar que no hay errores en las peticiones
- Buscar peticiones a Stripe (stripe.com)

#### Pestaña Elements
- Buscar el formulario de Stripe
- Verificar que tiene los inputs correctos

### Limpiar localStorage (si algo falla)
```javascript
localStorage.removeItem('cart');  // Limpiar carrito
localStorage.clear();              // Limpiar todo
```

---

## 🐛 Posibles Problemas y Soluciones

### El formulario de Stripe no aparece
**Solución:**
1. Recarga la página (F5)
2. Abre DevTools y busca errores
3. Verifica que seleccionaste Stripe
4. Prueba en otra navegador

### El pago no se procesa
**Solución:**
1. Verifica que JavaScript está habilitado
2. Comprueba que no hay errores en consola
3. Intenta con la tarjeta de prueba correcta (4242...)
4. Espera a que el botón termine de procesarse

### Los campos se ven raros
**Solución:**
1. Actualiza la página (Ctrl+Shift+R)
2. Limpia el caché
3. Prueba en modo incógnito
4. Intenta en otro navegador

### Redirección no funciona
**Solución:**
1. Comprueba que hay productos en el carrito
2. Verifica que completaste todos los campos
3. Mira la consola para ver si hay errores
4. Intenta redireccionar manualmente a /

---

## 📊 Información Importante

### Tarjetas de Prueba Disponibles
```
✅ ÉXITO:
   4242 4242 4242 4242
   4000 0566 5566 5556
   378282246310005 (Amex)

❌ FALLO:
   4000 0000 0000 0002
   4000 0000 0000 0127
   5555 5555 5555 4444 (sin fondos)
```

### Fechas de Prueba
```
✅ Válida: 12/30 (cualquier mes futuro)
❌ Expirada: 01/24 (mes/año pasado)
```

### CVC de Prueba
```
✅ Válido: 123, 456, 999 (cualquier 3-4 dígitos)
❌ Inválido: 12 (muy corto)
```

---

## 🚀 Próximos Pasos

Después de confirmar que Stripe funciona:

1. **Integracion real**
   - Registrarse en stripe.com
   - Obtener claves API
   - Integrar con backend

2. **Webhook**
   - Configurar webhook para confirmación
   - Guardar transacciones en BD
   - Enviar email de confirmación

3. **Seguridad**
   - Implementar 3D Secure
   - Validación en backend
   - Encriptación de datos

---

## 📞 Soporte

Si encuentras problemas:

1. **Revisa la consola** (F12 > Console)
2. **Lee el mensaje de error**
3. **Consulta STRIPE_INTEGRATION.md**
4. **Prueba en otro navegador**
5. **Limpia caché (Ctrl+Shift+R)**

---

**Documento de Prueba** - FashionStore Stripe Integration  
**Versión**: 1.0  
**Fecha**: 9 de enero de 2026
