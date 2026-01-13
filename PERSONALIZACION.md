# 🎨 Guía de Personalización - FashionStore

Sigue esta guía para personalizar FashionStore según tus necesidades.

## 📝 Cambiar Nombre de la Tienda

### 1. Header
En `src/components/Header.astro`, cambia:
```astro
<h1 class="text-3xl font-black italic text-gray-900">FashionStore</h1>
```

### 2. Titles en HTML
En `src/layouts/Layout.astro` y `src/layouts/PublicLayout.astro`:
```html
<title>FashionStore - Reacondicionado</title>
```

### 3. Footer
En `src/layouts/Layout.astro`, cambia:
```astro
© 2026 FashionStore. Todos los derechos reservados.
```

## 🎯 Cambiar Colores

### Opción 1: Variables CSS (Recomendado)
En `src/styles/global.css`:
```css
:root {
  --color-primary: #00aa45;      /* Verde primario */
  --color-lime: #e2ff7a;          /* Lima/Amarillo */
  --color-bg: #f5f5f7;            /* Fondo */
  --color-text: #1f2937;          /* Texto */
  --color-text-light: #6b7280;   /* Texto claro */
}
```

### Opción 2: Tailwind Config
En `tailwind.config.mjs`:
```js
export default {
  theme: {
    colors: {
      primary: '#00aa45',
      lime: '#e2ff7a',
      // ... más colores
    }
  }
}
```

### Opción 3: Inline en componentes
```astro
<button class="bg-[#00aa45]">Cambiar</button>
```

## 🖼️ Cambiar Logo

1. Reemplazar en `public/favicon.svg`
2. Actualizar en Header (`src/components/Header.astro`):
```astro
<img src="/logo.png" alt="FashionStore" class="h-10" />
```

## 📸 Imágenes de Productos

### Fuentes Recomendadas:
- **Unsplash**: https://unsplash.com
- **Pexels**: https://pexels.com
- **Pixabay**: https://pixabay.com

### Cambiar URLs de ejemplo:
En `src/pages/index.astro` y `src/pages/productos/index.astro`:
```js
image: "https://tu-imagen.jpg"
```

## 🌍 Cambiar Idioma

### 1. HTML Lang
En layouts, cambiar:
```html
<html lang="es">
```
a:
```html
<html lang="en">
```

### 2. Textos
Buscar y reemplazar textos en:
- `src/pages/index.astro`
- `src/components/Header.astro`
- `src/layouts/PublicLayout.astro`

## 💱 Moneda y Precio

### Formato de Precio
En `src/pages/index.astro`:
```js
price: 69900,  // En centavos: 699.00
```

Para cambiar símbolo de €, modificar en `ProductCard.astro`:
```astro
€{priceEur}  →  ${priceEur}  o  £{priceEur}
```

## 🏢 Información de Contacto

### Footer
En `src/layouts/PublicLayout.astro`, actualizar:
```astro
<a href="mailto:contact@fashionstore.com">Email</a>
<a href="tel:+34123456789">Teléfono</a>
```

## 🔗 Enlaces de Navegación

En `src/components/Header.astro`:
```astro
<a href="/productos">Productos</a>
<a href="/categoria/electronics">Categorías</a>
<a href="/contacto">Contacto</a>
```

## 📱 Breakpoints Responsive

En `tailwind.config.mjs`:
```js
screens: {
  'sm': '640px',   // Móvil
  'md': '768px',   // Tablet
  'lg': '1024px',  // Desktop
  'xl': '1280px',  // Desktop grande
}
```

## 🎯 Tipografía

### Cambiar Fuente
En `src/styles/global.css`:
```css
html {
  font-family: 'Tu Fuente', sans-serif;
}
```

### Cambiar Estilos de Headings
En `src/styles/global.css`:
```css
h1, h2, h3 {
  font-family: 'Tu Fuente de Headings';
  font-weight: 900;
  font-style: italic;
}
```

## 🛒 Integración con Base de Datos

### 1. Configurar Supabase
Crear archivo `.env.local`:
```
PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=xxxxx
```

### 2. Reemplazar datos simulados
En `src/pages/index.astro`:
```js
// De esto:
const featuredProducts = [{ ... }]

// A esto:
const { data: featuredProducts } = await supabase
  .from("products")
  .select("*")
```

## 🔐 Configuración SEO

En `src/layouts/PublicLayout.astro`:
```astro
<meta name="description" content="Tu descripción aquí" />
<meta name="keywords" content="palabra1, palabra2" />
<meta name="author" content="Tu Nombre" />
```

## 📊 Analytics

Agregar en `src/layouts/Layout.astro`:
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_ID');
</script>
```

## 🎬 Animaciones Personalizadas

En `src/styles/global.css`:
```css
@keyframes miAnimacion {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-miAnimacion {
  animation: miAnimacion 0.5s ease-out;
}
```

## 📦 Agregar Nuevas Secciones

### Ejemplo: Sección de Blog
1. Crear `src/pages/blog/index.astro`
2. Crear componente `src/components/BlogCard.astro`
3. Agregar enlace en Header

```astro
<a href="/blog">Blog</a>
```

## 🚀 Deploy en Vercel

1. Conectar repositorio GitHub
2. Variables de entorno en Vercel
3. Deploy automático al hacer push

## 🧪 Testing

Agregar en `package.json`:
```json
{
  "scripts": {
    "test": "vitest"
  }
}
```

## 📝 Checklista de Personalización

- [ ] Cambiar nombre de tienda
- [ ] Actualizar colores principales
- [ ] Cambiar logo
- [ ] Actualizar imágenes de productos
- [ ] Cambiar textos y descripciones
- [ ] Actualizar información de contacto
- [ ] Configurar dominio
- [ ] Configurar SSL/HTTPS
- [ ] Agregar analytics
- [ ] Optimizar imágenes
- [ ] Testing en móvil
- [ ] Deploy en producción

## 🆘 Solución de Problemas

### Colores no cambian
- Limpiar caché: `npm run build`
- Reiniciar servidor: `npm run dev`

### Imágenes no cargan
- Verificar URL
- Verificar CORS
- Usar proxy si es necesario

### Responsive no funciona
- Verificar breakpoints en Tailwind
- Usar Dev Tools (F12)
- Probar en diferentes dispositivos

## 📚 Recursos Útiles

- [Tailwind Colors](https://tailwindcss.com/docs/customizing-colors)
- [Astro Docs](https://docs.astro.build)
- [Google Fonts](https://fonts.google.com)
- [Unsplash API](https://unsplash.com/developers)
- [FontAwesome Icons](https://fontawesome.com)

---

**Última actualización:** 9 de enero de 2026
