# 🛍️ FashionStore - Back Market Clone

Un clon exacto de [Back Market](https://www.backmarket.es/) construido con **Astro** y **Tailwind CSS**. Tienda de productos reacondicionados con garantía certificada.

## 🚀 Inicio Rápido

### Instalación

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Construir para producción
npm run build

# Vista previa de producción
npm run preview
```

## 📂 Estructura del Proyecto

```
FashionStore/
├── src/
│   ├── components/
│   │   ├── ProductCard.astro       # Tarjeta de producto
│   │   ├── CategoryCard.astro      # Tarjeta de categoría
│   │   ├── Header.astro            # Encabezado principal
│   │   ├── FilterSidebar.astro     # Panel de filtros
│   │   └── islands/                # Componentes interactivos (React, Vue, etc.)
│   ├── layouts/
│   │   ├── Layout.astro            # Layout base
│   │   ├── PublicLayout.astro      # Layout público
│   │   └── BaseLayout.astro        # Layout base del proyecto
│   ├── pages/
│   │   ├── index.astro             # Página de inicio
│   │   └── productos/
│   │       ├── index.astro         # Listado de productos
│   │       └── [slug].astro        # Detalle de producto
│   ├── lib/
│   │   ├── supabase.ts             # Cliente de Supabase
│   │   ├── utils.ts                # Utilidades
│   │   └── database.types.ts       # Tipos de base de datos
│   ├── stores/
│   │   └── cart.ts                 # Estado del carrito
│   ├── styles/
│   │   └── global.css              # Estilos globales
│   └── middleware.ts               # Middleware de Astro
├── public/                         # Archivos estáticos
├── astro.config.mjs               # Configuración de Astro
├── tailwind.config.mjs            # Configuración de Tailwind
├── tsconfig.json                  # Configuración de TypeScript
└── package.json
```

## 🎨 Sistema de Diseño

### Colores Principales

```css
Verde Primario:    #00aa45
Lima/Amarillo:     #e2ff7a
Fondo:             #f5f5f7
Texto:             #1f2937
```

### Tipografía

- **Headings** (h1, h2): `font-black italic`
- **Body**: Sistema de fuentes por defecto
- **Monospace**: Disponible para código

## 📦 Componentes Principales

### ProductCard
```astro
<ProductCard
  id="1"
  name="iPhone 13 Pro"
  price={69900}
  originalPrice={99900}
  image="https://..."
  badge="Oferta"
  condition="Aspecto excelente"
  rating={4.8}
  reviews={245}
  slug="iphone-13-pro"
/>
```

### CategoryCard
```astro
<CategoryCard
  name="Smartphones"
  image="https://..."
  color="bg-[#e2ff7a]"
/>
```

### Header
```astro
<Header />
```

### FilterSidebar
```astro
<FilterSidebar title="Filtros" />
```

## 🔧 Configuración

### Astro
Ver `astro.config.mjs` para:
- Integración de Tailwind
- Configuración de SSR
- Prerendering de páginas estáticas

### Tailwind CSS
Ver `tailwind.config.mjs` para:
- Extensión de colores personalizados
- Temas y variantes

### TypeScript
Ver `tsconfig.json` para:
- Configuración de paths (`@/` = `src/`)
- Tipos personalizados

## 📱 Responsive Design

Todos los componentes están optimizados para:
- 📱 Móvil (320px - 640px)
- 📱 Tablet (641px - 1024px)
- 🖥️ Desktop (1025px+)

Utiliza clases Tailwind como:
- `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`
- `text-sm sm:text-base lg:text-lg`
- `px-4 sm:px-6 lg:px-8`

## 🔌 Integración con Supabase

El proyecto está listo para conectarse con Supabase:

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Configurar variables de entorno en `.env.local`
3. Ejecutar migraciones de BD (`supabase/schema.sql`)
4. Actualizar llamadas a la API en los componentes

### Variables de Entorno
```env
PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=xxxxx...
```

## 🛒 Carrito de Compras

El carrito está implementado en `src/stores/cart.ts`:
- Usar `AddToCartButton` component para agregar productos
- Usar `CartIcon` para mostrar contador
- Estado compartido entre componentes

## 🔐 Seguridad

- Validar entrada del usuario en servidor
- Usar CORS apropiadamente
- Proteger rutas sensibles con middleware
- Sanitizar datos de la BD

## 📈 Performance

- ✅ Lazy loading de imágenes
- ✅ Code splitting automático
- ✅ Pre-rendering de páginas estáticas
- ✅ Minificación de CSS/JS
- ✅ Compresión de imágenes

## 🧪 Testing

```bash
# Agregar framework de testing
npm install --save-dev vitest

# Ejecutar tests
npm run test
```

## 📚 Recursos

- [Documentación de Astro](https://docs.astro.build)
- [Documentación de Tailwind CSS](https://tailwindcss.com/docs)
- [Supabase Docs](https://supabase.com/docs)

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo licencia MIT. Ver archivo `LICENSE` para más detalles.

## 👨‍💻 Autor

Creado como proyecto de ejemplo para DAM 2º - Sistema de Gestión Empresarial

## 📞 Soporte

Para reportar bugs o sugerencias, abre un issue en el repositorio.

---

**Última actualización:** 9 de enero de 2026
