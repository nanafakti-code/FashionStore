# Guía del Sistema de Carrito y Checkout

## ¿Cómo funciona el carrito?

El sistema de carrito de FashionStore está completamente funcional y utiliza `localStorage` del navegador para persistencia de datos.

### Flujo Completo:

1. **Añadir al Carrito**
   - Haz clic en "Añadir al carrito" en cualquier producto
   - El botón cambiará a "✓ Añadido al carrito" (verde) durante 2 segundos
   - El producto se guarda automáticamente en localStorage

2. **Ver Carrito**
   - Haz clic en el icono del carrito en la esquina superior derecha
   - O ve a `/carrito` en la URL
   - Se mostrarán todos los productos añadidos

3. **Gestionar Carrito**
   - Modifica la cantidad usando el campo de número
   - Elimina productos con el botón "Eliminar"
   - El total se calcula automáticamente

4. **Tramitar Pedido**
   - Haz clic en "Tramitar pedido"
   - Te llevará a `/checkout`
   - Completa el formulario con tus datos

5. **Confirmar Pedido**
   - Rellena:
     - Datos personales (Nombre, Apellidos, Email, Teléfono)
     - Dirección de entrega (Calle, Ciudad, CP, País)
     - Método de pago (Tarjeta, PayPal, Transferencia)
   - Haz clic en "Confirmar Pedido"
   - Recibirás un mensaje de confirmación
   - El carrito se vaciará automáticamente
   - Serás redirigido al inicio

## Estructura de Archivos

### Componentes de Carrito:
- `src/components/islands/AddToCartButton.tsx` - Botón para añadir al carrito
- `src/components/islands/Cart.tsx` - Componente para gestionar carrito
- `src/pages/carrito.astro` - Página del carrito
- `src/pages/checkout.astro` - Página de checkout

### Almacenamiento:
Los datos se guardan en `localStorage` con la estructura:
```json
[
  {
    "id": "producto-1",
    "name": "iPhone 13",
    "price": 79999,
    "image": "https://images.pexels.com/...",
    "quantity": 2
  }
]
```

## Validación y Seguridad

### Validación de Formulario:
- Todos los campos son obligatorios
- Se valida email y número de teléfono
- Se valida código postal

### Nota Importante:
- Este es un sistema de demo/desarrollo
- En producción se integraría con:
  - Una base de datos real (Supabase)
  - Un procesador de pagos (Stripe, PayPal)
  - Sistemas de notificación por email
  - Autenticación real de usuarios

## Pruebas Recomendadas

1. ✅ Añade un producto al carrito
2. ✅ Verifica que aparece en `/carrito`
3. ✅ Modifica la cantidad
4. ✅ Elimina un producto
5. ✅ Añade otro producto y verifica que se suma
6. ✅ Ve a checkout y completa el formulario
7. ✅ Verifica el mensaje de confirmación
8. ✅ Recarga la página - el carrito debe estar vacío

## Valores Importantes

- Moneda: Euros (€)
- Envío: Gratis para todos los pedidos
- Precisión de precios: Se usan centavos (centimos) en el código
- Colores:
  - Verde principal: `#00aa45`
  - Verde claro: `#e2ff7a`
  - Fondo: `#f5f5f7`

## Próximas Mejoras

Para una versión de producción, se recomienda:

1. **Integración de Base de Datos**
   - Guardar pedidos en Supabase
   - Autenticación real de usuarios
   - Historial de pedidos

2. **Procesamiento de Pagos**
   - Integración con Stripe
   - Validación de tarjetas
   - Webhook para confirmación de pago

3. **Notificaciones**
   - Email de confirmación
   - Email de envío
   - SMS de actualización

4. **Analytics**
   - Seguimiento de conversiones
   - Abandono de carrito
   - Productos más vendidos

## Contacto

Para reportar issues o sugerencias, contacta al equipo de desarrollo.
