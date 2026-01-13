# Sistema de Carrito y Checkout - FashionStore

## 📦 Descripción General

El sistema de carrito de FashionStore está completamente funcional e implementado con tecnología moderna:

- **Almacenamiento**: localStorage (sin necesidad de servidor)
- **Actualización en tiempo real**: Usando CustomEvent API
- **Componentes**: React para interactividad, Astro para páginas
- **Persistencia**: Los datos se mantienen aunque recargues la página

## 🛒 Características Principales

### 1. Añadir al Carrito
- **Ubicación**: Botón en cada tarjeta de producto
- **Acción**: Click en "Añadir al carrito"
- **Feedback**: El botón cambia a verde "✓ Añadido al carrito" por 2 segundos
- **Duplicados**: Si añades el mismo producto, aumenta la cantidad automáticamente

### 2. Ver Carrito
- **Ubicación**: Icono del carrito en la esquina superior derecha
- **URL**: `/carrito`
- **Muestra**:
  - Imagen del producto
  - Nombre
  - Precio unitario
  - Cantidad
  - Precio total por producto
  - Total del carrito

### 3. Gestionar Carrito
- **Cambiar cantidad**: Usa el campo de número para cada producto
- **Eliminar producto**: Botón "Eliminar" rojo
- **Ver total**: Se recalcula automáticamente
- **Carrito vacío**: Muestra opción de "Continuar comprando"

### 4. Proceso de Checkout
1. Haz click en "Tramitar pedido"
2. Completa los datos personales:
   - Nombre
   - Apellidos
   - Email
   - Teléfono
3. Rellena dirección de entrega:
   - Calle y número
   - Ciudad
   - Código Postal
   - País
4. Selecciona método de pago:
   - Tarjeta de crédito/débito
   - PayPal
   - Transferencia bancaria
5. Haz click en "Confirmar Pedido"
6. Recibirás confirmación y el carrito se vaciará

## 🎯 Flujo Técnico

### Componentes Involucrados

```
ProductCard.astro
    ↓
AddToCartButton.tsx (client:load)
    ↓
localStorage (carrito.json)
    ↓
CustomEvent ('cartUpdated')
    ↓
Cart.tsx (escucha evento)
CartIcon.tsx (escucha evento)
```

### Estructura de Datos en localStorage

```json
[
  {
    "id": "iphone-13",
    "name": "iPhone 13",
    "price": 79999,
    "image": "https://images.pexels.com/...",
    "quantity": 2
  }
]
```

**Notas**:
- `price` está en centimos (79999 = 799,99€)
- `quantity` es el número de unidades
- El carrito es un array de objetos

## 📝 Archivos del Sistema

### Páginas
- **`src/pages/carrito.astro`** - Página del carrito
  - Muestra productos en tabla
  - Permite gestionar cantidades
  - Botón para ir a checkout

- **`src/pages/checkout.astro`** - Página de checkout
  - Formulario de datos personales
  - Formulario de dirección
  - Selección de método de pago
  - Resumen de pedido

### Componentes
- **`src/components/islands/AddToCartButton.tsx`** - Botón añadir (React)
  - Props: productId, productName, price, image
  - client:load (se ejecuta en el cliente)
  - Guarda en localStorage
  - Emite CustomEvent

- **`src/components/islands/Cart.tsx`** - Gestor del carrito (React)
  - client:load
  - Lee de localStorage
  - Escucha CustomEvent 'cartUpdated'
  - Permite editar cantidades
  - Calcula totales

- **`src/components/islands/CartIcon.tsx`** - Icono con contador (React)
  - client:load
  - Muestra número de productos
  - Badge rojo con número
  - Se actualiza al cambiar carrito

- **`src/components/ProductCard.astro`** - Tarjeta de producto
  - Importa AddToCartButton con client:load
  - Muestra imagen, nombre, precio
  - Descuentos y badges

## 🧪 Cómo Probar

### Test 1: Añadir Producto
1. Ve a cualquier categoría (ej: `/categoria/moviles`)
2. Haz click en "Añadir al carrito"
3. El botón debe cambiar a verde "✓ Añadido al carrito"
4. El contador del carrito debe aumentar

### Test 2: Ver Carrito
1. Haz click en el icono del carrito
2. Debería aparecer el producto que añadiste
3. Verifica que el precio es correcto
4. Verifica que la cantidad es 1

### Test 3: Modificar Cantidad
1. En la página del carrito, cambia la cantidad a 3
2. El total debe multiplicarse por 3
3. El contador del carrito debe mostrar 1 producto (pero con cantidad 3)

### Test 4: Añadir Otro Producto
1. Ve a otra categoría
2. Añade un producto diferente
3. Vuelve al carrito
4. Debería haber 2 filas (2 productos diferentes)
5. El contador debería mostrar 2

### Test 5: Eliminar Producto
1. En el carrito, haz click en "Eliminar" en uno de los productos
2. Ese producto debe desaparecer
3. El contador debe disminuir
4. El total debe recalcularse

### Test 6: Checkout Completo
1. Llena todos los campos del formulario
2. Haz click en "Confirmar Pedido"
3. Debería aparecer un mensaje de confirmación
4. El carrito debe vaciarse
5. Deberías ser redirigido al inicio

### Test 7: Persistencia
1. Añade productos al carrito
2. Recarga la página (F5)
3. Los productos deben seguir en el carrito
4. El contador debe mantener el número

## 🔐 Seguridad y Validación

### Validación en Cliente
- Campos obligatorios en el formulario
- Email válido
- Teléfono válido
- Código postal válido
- País seleccionado

### Notas de Seguridad
- **Este es un sistema de demo**
- En producción se integraría con:
  - Base de datos real (Supabase)
  - Procesador de pagos (Stripe/PayPal)
  - Autenticación de usuarios
  - Tokens de seguridad

## 🐛 Troubleshooting

### El carrito no se actualiza
**Solución**: Verifica que el navegador permite localStorage
- Abre DevTools (F12)
- Consola → Escribe: `localStorage.getItem('cart')`
- Debería mostrar los productos en JSON

### El botón "Añadir al carrito" no funciona
**Solución**: 
- Verifica que no hay errores en la consola (F12)
- Comprueba que JavaScript está habilitado
- Intenta en otro navegador

### El checkout no guarda datos
**Solución**:
- Verifica que los campos están correctamente rellenados
- Abre DevTools y busca errores
- Prueba en modo incógnito (evita conflictos de caché)

## 📚 Recursos Técnicos

### localStorage API
```javascript
// Guardar
localStorage.setItem('cart', JSON.stringify(cartArray));

// Obtener
const cart = JSON.parse(localStorage.getItem('cart') || '[]');

// Limpiar
localStorage.removeItem('cart');
```

### CustomEvent API
```javascript
// Emitir evento
window.dispatchEvent(new CustomEvent('cartUpdated', { detail: data }));

// Escuchar evento
window.addEventListener('cartUpdated', (event) => {
  console.log(event.detail);
});
```

## 🚀 Próximas Mejoras

1. **Base de Datos**
   - Guardar pedidos en Supabase
   - Historial de compras
   - Wishlist/Favoritos

2. **Pagos**
   - Integración Stripe
   - Integración PayPal
   - Validación de tarjetas

3. **Notificaciones**
   - Email de confirmación
   - Email de envío
   - SMS de actualización

4. **Usuario**
   - Autenticación real
   - Direcciones guardadas
   - Métodos de pago guardados
   - Seguimiento de pedidos

## 📞 Soporte

Para reportar issues o sugerencias, contacta al equipo de desarrollo.

---

**Versión**: 1.0  
**Última actualización**: 2024  
**Framework**: Astro 5.16.7 + React 18 + TypeScript
