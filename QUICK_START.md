# 🚀 Quick Start - FashionStore

## ⚡ En 30 Segundos

```bash
# 1. Ir a la carpeta del proyecto
cd "C:\Users\rafae\Desktop\DAM 2º\Sistema de Gestión Empresarial\FashionStore"

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor
npm run dev

# 4. Abrir en navegador
# http://localhost:3000
```

---

## 📱 URLs Disponibles

```
🏠 Inicio:          http://localhost:3000
📦 Productos:       http://localhost:3000/productos
📚 Ejemplos:        http://localhost:3000/ejemplo
```

---

## 🎯 Estructura Rápida

```
src/
├── components/
│   ├── ProductCard.astro        ← Tarjeta de producto
│   ├── CategoryCard.astro       ← Tarjeta de categoría
│   ├── Header.astro             ← Header principal
│   └── FilterSidebar.astro      ← Filtros (NUEVO)
│
├── layouts/
│   ├── Layout.astro             ← Layout base
│   └── PublicLayout.astro       ← Layout público
│
├── pages/
│   ├── index.astro              ← Página de inicio
│   ├── productos/index.astro    ← Listado productos
│   └── ejemplo.astro            ← Ejemplos (NUEVO)
│
└── styles/
    └── global.css               ← Estilos globales (NUEVO)
```

---

## 🎨 Cambios Principales

### Header
```
✓ Logo "FashionStore"
✓ Búsqueda
✓ Icono carrito
✓ Navegación principal
✓ Responsive
```

### ProductCard
```
✓ Imagen con hover
✓ Badges (Descuento %, Best Seller)
✓ Rating de 5 estrellas
✓ Precio original y descuento
✓ Botón compra verde
```

### CategoryCard
```
✓ Imagen de fondo
✓ Overlay suave
✓ Badge con nombre
✓ Efecto zoom hover
```

### FilterSidebar (NUEVO)
```
✓ Rango de precio
✓ Filtro categoría
✓ Filtro condición
✓ Botón limpiar
```

### Página Inicio
```
✓ Hero section
✓ 4 categorías
✓ 8 bestsellers
✓ 3 beneficios
✓ Newsletter
✓ Footer
```

### Página Productos (ACTUALIZADA)
```
✓ Sidebar filtros
✓ Grid 12 productos
✓ Selector orden
✓ Sección CTA
✓ Responsive
```

---

## 🎨 Colores

```
Verde:      #00aa45
Lima:       #e2ff7a
Fondo:      #f5f5f7
Texto:      #1f2937
```

---

## 📱 Responsive

```
Mobile:     1 columna (320px)
Tablet:     2 columnas (768px)
Desktop:    4 columnas (1024px)
```

---

## 📂 Documentación Incluida

```
✅ README_FASHIONSTORE.md   - Documentación principal
✅ IMPLEMENTACION.md        - Detalles técnicos
✅ PERSONALIZACION.md       - Cómo personalizar
✅ VERIFICACION.md          - Checklist
✅ RESUMEN_EJECUTIVO.md     - Resumen
✅ QUICK_START.md           - Este archivo
```

---

## 🔧 Comandos Útiles

```bash
# Desarrollo
npm run dev          # Iniciar servidor desarrollo

# Build
npm run build        # Construir para producción

# Preview
npm run preview      # Ver build localmente

# Limpieza
npm run clean        # Limpiar cache
```

---

## ✨ Características

- ✅ 100% Responsive
- ✅ Colores exactos Back Market
- ✅ Tipografía font-black italic
- ✅ Animaciones suave
- ✅ Efectos hover
- ✅ Accesibilidad básica
- ✅ SEO ready
- ✅ Performance optimizado

---

## 🎯 Próximos Pasos

1. **Personalizar:**
   - Cambiar nombre tienda
   - Actualizar colores
   - Cambiar imágenes

2. **Funcionalidad:**
   - Conectar Supabase
   - Implementar carrito
   - Agregar búsqueda

3. **Deploy:**
   - Vercel
   - Netlify
   - Tu servidor

---

## 📖 Leer Documentación

Ver archivos `.md` incluidos:

```
RESUMEN_EJECUTIVO.md     ← Empieza aquí
README_FASHIONSTORE.md   ← Documentación completa
PERSONALIZACION.md       ← Cómo personalizar
IMPLEMENTACION.md        ← Detalles técnicos
```

---

## 🆘 Problemas Comunes

### Puerto 3000 en uso
```bash
npm run dev -- --port 3001
```

### Limpiar caché
```bash
npm run clean
npm install
npm run dev
```

### Reconstruir
```bash
npm run build
npm run preview
```

---

## ✅ Verificación

Cuando abras http://localhost:3000 deberías ver:

1. ✅ Header con navegación
2. ✅ Hero section
3. ✅ 4 categorías en grid
4. ✅ 8 productos bestsellers
5. ✅ 3 beneficios
6. ✅ Newsletter
7. ✅ Footer

Si todo está bien → **¡PROYECTO LISTO!** 🎉

---

## 📝 Estructura de Datos Ejemplo

```javascript
// Producto
{
  id: "1",
  name: "iPhone 13 Pro",
  price: 69900,              // En centavos
  originalPrice: 99900,      // En centavos
  image: "https://...",
  badge: "Oferta",
  condition: "Aspecto excelente",
  rating: 4.8,
  reviews: 245,
  slug: "iphone-13-pro"
}

// Categoría
{
  name: "Smartphones",
  image: "https://...",
  color: "bg-[#e2ff7a]"
}
```

---

## 🚀 Deployment

### Vercel (Recomendado)
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm run build
# Subir carpeta 'dist'
```

---

**¡Tu FashionStore está listo para usar! 🎊**

Última actualización: 9 de enero de 2026
Estado: ✅ COMPLETADO Y VERIFICADO
