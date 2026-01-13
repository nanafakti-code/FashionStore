# Integración de Base de Datos Supabase - TechStore

## Cambios Realizados ✅

### 1. **Página Principal (index.astro)** - Conectada a BD
- ✅ Obtiene **productos destacados** de la tabla `productos`
- ✅ Obtiene **categorías activas** de la tabla `categorias`
- ✅ Mapea datos automáticamente para los componentes
- ✅ Muestra imagen principal desde `imagenes_producto`

### 2. **Rutas API Creadas**

#### `/api/productos`
```
GET /api/productos
```
Retorna todos los productos activos con:
- id, nombre, slug, precios, stock, imagen principal
- Total de productos

#### `/api/categorias`
```
GET /api/categorias
```
Retorna todas las categorías activas ordenadas

#### `/api/categorias/[slug]`
```
GET /api/categorias/smartphones
```
Retorna categoría + productos de esa categoría

#### `/api/productos/[slug]`
```
GET /api/productos/iphone-15-pro-max
```
Retorna producto completo con:
- Detalles técnicos
- Todas las imágenes
- Marca y categoría
- Reseñas aprobadas

### 3. **Páginas Dinámicas**

#### Página de Categoría (`/categoria/[slug].astro`)
- Conectada a Supabase
- Muestra todos los productos de la categoría
- Acceso: `/categoria/smartphones`, `/categoria/laptops`, etc.

#### Página de Producto (`/productos/[slug].astro`) - PRÓXIMA A CREAR
- Mostrará detalles completos del producto
- Reseñas y valoraciones
- Stock disponible
- Acceso: `/productos/iphone-15-pro-max`, etc.

## Base de Datos Disponible ✅

### Tablas Principales:
- **usuarios** - 6 usuarios de prueba
- **categorias** - 8 categorías (Smartphones, Laptops, Tablets, Audio, Wearables, Cámaras, Monitores, Consolas)
- **marcas** - 4 marcas (Apple, Samsung, Sony, LG)
- **productos** - 14 productos reacondicionados con precios
- **imagenes_producto** - Imágenes de cada producto
- **variantes_producto** - Variantes (almacenamiento, color, etc.)
- **resenas** - 4 reseñas aprobadas

### Datos de Ejemplo:
- iPhone 15 Pro Max: €1399 (139900 céntimos)
- MacBook Pro 16 M3 Max: €2399
- PlayStation 5: €399
- Y más productos...

## Cómo Usar ✅

### 1. **Ver Productos por Categoría**
```
https://tudominio.com/categoria/smartphones
https://tudominio.com/categoria/laptops
https://tudominio.com/categoria/audio
```

### 2. **Llamar a APIs en JavaScript**
```javascript
// Obtener todos los productos
const res = await fetch('/api/productos');
const { productos } = await res.json();

// Obtener categorías
const res = await fetch('/api/categorias');
const { categorias } = await res.json();

// Obtener productos de una categoría
const res = await fetch('/api/categorias/smartphones');
const { productos } = await res.json();

// Obtener detalles de un producto
const res = await fetch('/api/productos/iphone-15-pro-max');
const { producto, resenas } = await res.json();
```

## Próximos Pasos 📋

1. ✅ Crear página de detalle de producto (`/productos/[slug].astro`)
2. ✅ Implementar carrito de compras en la BD
3. ✅ Crear sistema de órdenes/pedidos
4. ✅ Implementar búsqueda de productos
5. ✅ Agregar filtros (precio, marca, etc.)
6. ✅ Sistema de usuario y checkout con Stripe

## Variables de Entorno Requeridas

En tu `.env`:
```
PUBLIC_SUPABASE_URL=https://tuproyecto.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

## Estructura de Datos

### Precios en Céntimos
- 139900 = €1399
- 34900 = €349
- 19900 = €199

### Estados de Productos
- `activo = true` - Solo estos productos se muestran públicamente
- `destacado = true` - Aparecen en la página principal

### Estados de Reseñas
- `estado = 'Aprobada'` - Solo estas se muestran al público
- `verificada_compra = true` - Marca compras verificadas
