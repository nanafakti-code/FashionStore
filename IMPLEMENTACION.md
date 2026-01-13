# 🎨 FashionStore - Clon de Back Market en Astro

Implementación completa de un clon estilo Back Market (tienda de productos reacondicionados) usando Astro + Tailwind CSS.

## ✨ Características Implementadas

### 1. **Componentes Creados/Actualizados**

#### `src/components/ProductCard.astro`
- Tarjeta de producto completa con:
  - Imagen con efecto hover
  - Badges de descuento y "Best Seller"
  - Sistema de ratings con estrellas
  - Información de condición del producto
  - Precios con descuento (original y actual)
  - Botón "Agregar al carrito"
  - Responsive (grid-cols-1 md:grid-cols-2 lg:grid-cols-4)

#### `src/components/CategoryCard.astro`
- Tarjeta de categoría con:
  - Imagen de fondo con overlay
  - Nombre de categoría en badge
  - Efecto zoom al pasar el ratón
  - Personalización de colores

#### `src/components/Header.astro`
- Header sticky con:
  - Logo y branding
  - Barra de búsqueda
  - Icono del carrito
  - Navegación principal
  - Bar de información (envío gratis, ayuda)
  - Responsive para móvil

#### `src/components/FilterSidebar.astro` (NUEVO)
- Panel de filtros con:
  - Rango de precios
  - Filtro por categoría
  - Filtro por condición
  - Botón limpiar filtros

### 2. **Layouts**

#### `src/layouts/Layout.astro`
- Layout base para la aplicación
- Importa estilos globales
- Footer completo con links

#### `src/layouts/PublicLayout.astro`
- Layout para páginas públicas
- Header y footer integrados
- Optimizado para SEO

### 3. **Páginas**

#### `src/pages/index.astro` (ACTUALIZADA)
Secciones implementadas:
- **Hero Section**: Encabezado principal con CTA
- **Categorías**: Grid de 4 categorías con imágenes
- **Bestsellers**: Grid de 8 productos destacados
- **Beneficios**: 3 columnas con propuestas de valor
- **Newsletter**: Suscripción por email

#### `src/pages/productos/index.astro` (ACTUALIZADA)
- Listado completo de productos (12 productos)
- Sidebar de filtros
- Grid responsive de productos
- Selector de ordenamiento
- Sección CTA adicional

### 4. **Estilos**

#### `src/styles/global.css` (NUEVO)
- Estilos globales con:
  - Variables CSS para colores
  - Tipografía personalizada
  - Scrollbar customizado
  - Animaciones
  - Estados de accesibilidad
  - Media queries

## 🎯 Colores Utilizados

```css
--color-primary: #00aa45 (Verde)
--color-lime: #e2ff7a (Amarillo/Lima)
--color-bg: #f5f5f7 (Fondo gris claro)
--color-text: #1f2937 (Texto oscuro)
```

## 📱 Responsive Design

Todos los componentes usan Tailwind breakpoints:
- `grid-cols-1` → Móvil
- `md:grid-cols-2` → Tablets
- `lg:grid-cols-4` → Desktop

## ✅ Características de Productos

Cada producto incluye:
- Imagen con efecto hover
- Título y descripción
- Condición (Como nuevo, Aspecto excelente, Buen estado)
- Rating y número de reseñas
- Precio original y con descuento
- Badge de descuento %
- Badge de "Best Seller"
- Botón de "Agregar al carrito"

## 🎯 Estructura de Datos

Productos con propiedades:
```typescript
{
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  image: string;
  badge: string;
  condition: string;
  rating: number;
  reviews: number;
  slug: string;
}
```

## 📦 Tecnologías Utilizadas

- **Astro 4.0** - Framework web moderno
- **Tailwind CSS** - Utilidades de estilos
- **Responsive Design** - Mobile-first
- **Astro Islands** - Componentes interactivos opcionales

## 🚀 Próximas Mejoras Sugeridas

1. Conectar con base de datos (Supabase)
2. Implementar carrito de compras con estado
3. Página de detalle de producto
4. Sistema de filtrado dinámico
5. Búsqueda de productos
6. Sistema de autenticación
7. Historial de compras
8. Reviews de usuarios
9. Chat de soporte
10. Analytics y tracking

## 📝 Notas

- Todos los estilos son 100% responsive
- Los colores siguen la identidad de Back Market
- La tipografía usa `font-black italic` para h1 y h2
- Incluye efectos hover y transiciones suaves
- Optimizado para accesibilidad
