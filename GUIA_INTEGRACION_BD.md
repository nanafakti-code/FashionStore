# 🚀 TechStore - Integración Base de Datos Completada

## ✅ Lo que se ha implementado

### Base de Datos SQL (Supabase)
- **14 productos electrónicos** reacondicionados (iPhone, MacBook, Samsung, etc.)
- **8 categorías** (Smartphones, Laptops, Tablets, Audio, Wearables, Cámaras, Monitores, Consolas)
- **4 marcas** (Apple, Samsung, Sony, LG)
- **6 usuarios** de prueba
- **4 reseñas** aprobadas
- **Imágenes** para cada producto

### Frontend - Páginas Conectadas a BD

#### 1. **Página Principal** (`/`)
```
✓ Obtiene productos destacados de la BD
✓ Obtiene categorías de la BD
✓ Muestra imágenes desde imagenes_producto
✓ Calcula precios y descuentos automáticamente
```

#### 2. **Página de Categorías** (`/categoria/[slug]`)
```
✓ Dinámico: /categoria/smartphones, /categoria/laptops, etc.
✓ Obtiene productos de esa categoría desde BD
✓ Muestra todos los productos con imágenes
✓ Total de productos disponibles
```

#### 3. **Página de Detalle de Producto** (`/productos/[slug]`)
```
✓ Detalle completo del producto
✓ Galería de imágenes interactiva
✓ Precios en euros (convertidos de céntimos)
✓ Calificación y número de reseñas
✓ Reseñas de clientes aprobadas
✓ Stock disponible
✓ Información de envío
✓ Botones: Agregar al Carrito, Favoritos
```

### APIs REST Creadas

```
GET /api/productos
  → Todos los productos activos

GET /api/categorias  
  → Todas las categorías activas

GET /api/categorias/[slug]
  → Categoría + productos de esa categoría
  Ejemplo: /api/categorias/smartphones

GET /api/productos/[slug]
  → Producto completo + reseñas
  Ejemplo: /api/productos/iphone-15-pro-max
```

## 📊 Datos Disponibles en BD

### Productos Disponibles
| Producto | Categoría | Precio | Stock |
|----------|-----------|--------|-------|
| iPhone 15 Pro Max | Smartphones | €1399 | 35 |
| Samsung Galaxy S24 Ultra | Smartphones | €1299 | 28 |
| MacBook Pro 16 M3 Max | Laptops | €2399 | 12 |
| iPad Pro 12.9 M2 | Tablets | €899 | 15 |
| Sony WH-1000XM5 | Audio | €349 | 22 |
| Apple Watch Ultra | Wearables | €399 | 20 |
| Canon EOS R6 | Cámaras | €1799 | 8 |
| LG UltraWide 34 OLED | Monitores | €799 | 10 |
| PlayStation 5 | Consolas | €399 | 15 |
| Xbox Series X | Consolas | €449 | 12 |

## 🔗 Rutas Disponibles

### Página Principal
```
https://tudominio.com/
```

### Categorías (8 disponibles)
```
https://tudominio.com/categoria/smartphones
https://tudominio.com/categoria/laptops
https://tudominio.com/categoria/tablets
https://tudominio.com/categoria/audio
https://tudominio.com/categoria/wearables
https://tudominio.com/categoria/camaras
https://tudominio.com/categoria/monitores
https://tudominio.com/categoria/consolas
```

### Productos (14 disponibles)
```
https://tudominio.com/productos/iphone-15-pro-max
https://tudominio.com/productos/samsung-galaxy-s24-ultra
https://tudominio.com/productos/macbook-pro-16-m3-max
https://tudominio.com/productos/dell-xps-15
https://tudominio.com/productos/ipad-pro-129-m2
https://tudominio.com/productos/sony-wh-1000xm5
https://tudominio.com/productos/airpods-pro-2
https://tudominio.com/productos/apple-watch-ultra
https://tudominio.com/productos/samsung-galaxy-watch-6-classic
https://tudominio.com/productos/canon-eos-r6
https://tudominio.com/productos/gopro-hero-12
https://tudominio.com/productos/lg-ultrawide-34-oled
https://tudominio.com/productos/playstation-5
https://tudominio.com/productos/xbox-series-x
```

## 💾 Estructura Base de Datos

### Tabla: productos
```sql
id (UUID)
nombre (TEXT)
slug (TEXT UNIQUE)
descripcion (TEXT)
descripcion_larga (TEXT)
precio_venta (INTEGER) -- en céntimos
precio_original (INTEGER)
stock_total (INTEGER)
destacado (BOOLEAN)
activo (BOOLEAN)
valoracion_promedio (DECIMAL)
total_resenas (INTEGER)
imagenes_producto (JSON) -- relación
marca (JSON) -- relación
categoria (JSON) -- relación
```

### Tabla: imagenes_producto
```sql
id (UUID)
producto_id (UUID FK)
url (TEXT)
es_principal (BOOLEAN)
orden (INTEGER)
```

### Tabla: categorias
```sql
id (UUID)
nombre (TEXT)
slug (TEXT UNIQUE)
descripcion (TEXT)
orden (INTEGER)
activa (BOOLEAN)
```

## 🔌 Cómo Usar en JavaScript

### Obtener todos los productos
```javascript
const res = await fetch('/api/productos');
const { productos, total } = await res.json();
console.log(productos); // Array de productos
```

### Obtener categorías
```javascript
const res = await fetch('/api/categorias');
const { categorias } = await res.json();
```

### Obtener productos de una categoría
```javascript
const res = await fetch('/api/categorias/smartphones');
const { categoria, productos } = await res.json();
console.log(categoria.nombre); // "Smartphones"
console.log(productos.length); // Número de productos
```

### Obtener detalle de un producto
```javascript
const res = await fetch('/api/productos/iphone-15-pro-max');
const { producto, resenas } = await res.json();
console.log(producto.nombre);
console.log(resenas); // Array de reseñas
```

## 🎨 Estilos y Colores

- **Color Principal**: `#e2ff7a` (Limón)
- **Color Secundario**: `#00aa45` (Verde)
- **Color Oscuro**: `#1a1a1a` / `gray-900`
- **Tipografía**: Font-black italic para títulos

## 🔐 Variables de Entorno Requeridas

En tu archivo `.env`:
```
PUBLIC_SUPABASE_URL=https://tuproyecto.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

## 📝 Notas Importantes

### Precios
- Todos los precios en base de datos están en **céntimos**
- `139900` = **€1399.00**
- Las páginas convierten automáticamente a euros: `(precio / 100).toFixed(2)`

### Stock
- `stock_total > 0` = Producto disponible
- `stock_total = 0` = Producto agotado (botón deshabilitado)

### Estados
- `activo = true` → Se muestra en la tienda
- `destacado = true` → Aparece en página principal
- Reseña con `estado = 'Aprobada'` → Se muestra públicamente

## 🚀 Próximas Funcionalidades

- [ ] Carrito de compras en BD
- [ ] Sistema de órdenes/pedidos
- [ ] Búsqueda de productos
- [ ] Filtros (precio, marca, etc.)
- [ ] Checkout con Stripe
- [ ] Sistema de usuarios completo
- [ ] Favoritos/Wishlist en BD
- [ ] Admin panel para gestionar productos

## 📞 Soporte

Si hay algún error al ejecutar las queries de SQL:
1. Asegúrate de haber ejecutado `schema.sql` en Supabase
2. Verifica que los datos estén en `datos-tienda-completa.sql`
3. Comprueba que las variables de entorno estén correctas
