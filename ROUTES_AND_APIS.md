# URLs y Rutas del Sistema - FashionStore

## 🗺️ Mapa de Rutas Completo

### Rutas Públicas (Sin Autenticación)

#### Navegación Principal
| Ruta | Descripción | Componentes |
|------|-------------|------------|
| `/` | Página de inicio | Header, Hero, Categorías, Bestsellers |
| `/carrito` | Carrito de compras | Header, Cart.tsx, Resumen |
| `/checkout` | Proceso de compra | Formulario, Resumen, Métodos de pago |

#### Categorías (Dinámicas)
| Ruta | Categoría | Productos |
|------|-----------|-----------|
| `/categoria/ofertones` | Ofertones | 12 productos con descuento |
| `/categoria/guia-regalos` | Guía de Regalos | 2 productos |
| `/categoria/moviles` | Móviles | 3 productos |
| `/categoria/portatiles` | Portátiles | 2 productos |
| `/categoria/tablets` | Tablets | 2 productos |
| `/categoria/consolas` | Consolas | 2 productos |
| `/categoria/smartwatches` | Smartwatches | 2 productos |
| `/categoria/audio` | Audio | 2 productos |
| `/categoria/electrodomesticos` | Electrodomésticos | 2 productos |
| `/categoria/mas` | Más | 2 productos |

#### Otras Rutas
| Ruta | Descripción | Estado |
|------|-------------|--------|
| `/buscar` | Búsqueda de productos | ✅ Funcional |
| `/login` | Login de usuario | ✅ Disponible |
| `/auth/callback` | Callback OAuth | ✅ Disponible |
| `/productos` | Listado completo | ✅ Funcional |
| `/productos/[slug]` | Detalle de producto | ✅ Dinámico |

## 🛒 Sistema de Carrito

### Endpoints y Funciones

#### localStorage
```javascript
// Obtener carrito
const cart = JSON.parse(localStorage.getItem('cart') || '[]');

// Guardar carrito
localStorage.setItem('cart', JSON.stringify(cartArray));

// Limpiar carrito
localStorage.removeItem('cart');
```

#### Estructura de Datos (Carrito)
```json
{
  "id": "iphone-13",
  "name": "iPhone 13",
  "price": 79999,
  "image": "https://images.pexels.com/photos/...",
  "quantity": 2
}
```

#### CustomEvent
```javascript
// Emitir evento de actualización
window.dispatchEvent(new CustomEvent('cartUpdated', {
  detail: { 
    cart: cartArray, 
    itemCount: 2 
  }
}));

// Escuchar evento
window.addEventListener('cartUpdated', (event) => {
  console.log(event.detail.cart);
});
```

## 📦 Componentes del Carrito

### AddToCartButton.tsx
**Ubicación**: `src/components/islands/AddToCartButton.tsx`

**Props**:
```typescript
{
  productId: string;        // ID único del producto
  productName: string;      // Nombre del producto
  price: number;           // Precio en céntimos
  image: string;           // URL de imagen
}
```

**Eventos**:
- Emite: `cartUpdated` (CustomEvent)
- Escucha: Cambios en localStorage

**Acciones**:
- Añade producto a localStorage
- Incrementa cantidad si existe
- Muestra feedback visual (2 segundos)

---

### Cart.tsx
**Ubicación**: `src/components/islands/Cart.tsx`

**Funcionalidad**:
- Carga carrito de localStorage
- Permite editar cantidades
- Permite eliminar productos
- Calcula totales
- Escucha cambios con CustomEvent

**Métodos**:
```javascript
updateQuantity(id, newQuantity)  // Actualizar cantidad
removeItem(id)                    // Eliminar producto
calculateTotal()                  // Calcular total
```

---

### CartIcon.tsx
**Ubicación**: `src/components/islands/CartIcon.tsx`

**Funcionalidad**:
- Muestra número de productos
- Badge verde actualizado
- Link a `/carrito`
- Se actualiza en tiempo real

**Props**: `className?: string`

---

## 📋 Formulario de Checkout

### Campos Requeridos

#### Datos Personales
```typescript
{
  nombre: string,          // Requerido
  apellidos: string,       // Requerido
  email: string,           // Requerido, validación email
  telefono: string         // Requerido, validación teléfono
}
```

#### Dirección de Entrega
```typescript
{
  calle: string,           // Requerido
  ciudad: string,          // Requerido
  codigoPostal: string,    // Requerido
  pais: string             // Requerido (select)
}
```

#### Método de Pago
```typescript
{
  metodo: 'card' | 'paypal' | 'bank'
}
```

### Páises Disponibles
- España (ES)
- Francia (FR)
- Italia (IT)
- Portugal (PT)
- Alemania (DE)

## 🔐 Validación del Sistema

### Cliente
- Campos obligatorios validados
- Email válido requerido
- Teléfono validado
- País seleccionado obligatorio

### Servidor (Próximamente)
- Validación adicional en backend
- Autenticación de usuario
- Verificación de inventario
- Procesamiento de pago

## 📊 Flujos de Datos

### Flujo de Añadir Producto

```
ProductCard.astro (componente)
  ↓
AddToCartButton.tsx (Click)
  ↓
localStorage.setItem('cart', ...)
  ↓
window.dispatchEvent('cartUpdated')
  ↓
Cart.tsx y CartIcon.tsx (escuchan)
  ↓
Componentes se re-renderizan
```

### Flujo de Checkout

```
Página /carrito
  ↓
Botón "Tramitar Pedido"
  ↓
Redirección a /checkout
  ↓
Formulario se carga con carrito en memoria
  ↓
Usuario completa formulario
  ↓
Click "Confirmar Pedido"
  ↓
Validación cliente
  ↓
localStorage.removeItem('cart')
  ↓
Mensaje de confirmación
  ↓
Redirección a /
```

## 🎯 Integración de Componentes

### En ProductCard.astro
```astro
import AddToCartButton from './islands/AddToCartButton';

<AddToCartButton 
  client:load
  productId={id}
  productName={name}
  price={price}
  image={image || ''}
/>
```

### En Header.astro
```astro
import CartIcon from './islands/CartIcon.tsx';

<CartIcon className="..." />
```

### En carrito.astro
```astro
import Cart from '@/components/islands/Cart';

<Cart client:load />
```

## 🔔 Eventos CustomEvent

### cartUpdated
**Emitido por**: AddToCartButton.tsx  
**Escuchado por**: Cart.tsx, CartIcon.tsx

```javascript
new CustomEvent('cartUpdated', {
  detail: { 
    cart: [...],           // Array de productos
    itemCount: number      // Número de productos únicos
  }
})
```

## 📱 URLs por Tipo de Dispositivo

### Desktop
- `/carrito` - Carrito con tabla completa
- `/checkout` - Formulario a lado del resumen

### Mobile
- `/carrito` - Carrito con cards apiladas
- `/checkout` - Formulario completo (scroll)

## ⚙️ Configuración

### Colores (Tailwind)
```javascript
primary: '#00aa45',
secondary: '#e2ff7a',
background: '#f5f5f7'
```

### Precios
- Moneda: EUR (€)
- Almacenado en: céntimos (100 = 1€)
- Descuento: Hasta 35%
- Envío: Gratis

### Categorías (10 total)
- Ofertones (12 productos)
- Guía de Regalos (2 productos)
- Móviles (3 productos)
- Portátiles (2 productos)
- Tablets (2 productos)
- Consolas (2 productos)
- Smartwatches (2 productos)
- Audio (2 productos)
- Electrodomésticos (2 productos)
- Más (2 productos)

**Total**: 32 productos

## 🔗 Enlaces Internos

### Botones de Navegación
- Logo → `/`
- Categorías → `/categoria/[slug]`
- Carrito → `/carrito`
- Tramitar Pedido → `/checkout`
- Volver al Carrito → `/carrito`
- Continuar Comprando → `/`
- Más Vendidos → `/categoria/ofertones`

## 📈 Métricas y Estado

### Página Actual
- **Productos totales**: 32
- **Categorías**: 10
- **Precio promedio**: ~€150
- **Descuento máximo**: 35%

### Rendimiento
- localStorage: Límite ~5-10MB por dominio
- CustomEvent: Actualización instantánea
- Renderizado: React Islands (optimizado)

## 🚀 Próximos Endpoints (Producción)

```
POST /api/orders              # Crear pedido
GET  /api/orders/:id          # Obtener pedido
GET  /api/orders              # Listar pedidos del usuario
POST /api/payments            # Procesar pago
GET  /api/categories          # Obtener categorías
GET  /api/products            # Listar productos
POST /api/auth/login          # Login de usuario
POST /api/auth/logout         # Logout
```

---

**Documento actualizado**: 2024  
**Estado**: ✅ FUNCIONAL  
**Framework**: Astro 5.16.7 + React 18 + TypeScript
