# FashionMarket

E-commerce premium de moda masculina construido con Astro 5.0, Tailwind CSS y Supabase.

## 🚀 Stack Tecnológico

- **Frontend**: Astro 5.0 (modo híbrido)
- **Estilos**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Estado**: Nano Stores
- **Componentes Interactivos**: Preact

## 📋 Requisitos Previos

- Node.js 18+ 
- npm o pnpm
- Cuenta de Supabase

## 🛠️ Instalación

1. **Clonar el repositorio**
```bash
git clone <tu-repo>
cd FashionStore
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar Supabase**

   a. Crea un proyecto en [Supabase](https://app.supabase.com)
   
   b. Ejecuta el esquema de base de datos:
   - Ve a SQL Editor en Supabase
   - Copia y ejecuta el contenido de `supabase/schema.sql`
   
   c. Configura Storage:
   - Sigue las instrucciones en `supabase/storage-setup.md`

4. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Edita `.env` y añade tus credenciales de Supabase:
```
PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

5. **Iniciar servidor de desarrollo**
```bash
npm run dev
```

Abre [http://localhost:4321](http://localhost:4321)

## 📁 Estructura del Proyecto

```
fashionstore/
├── src/
│   ├── components/
│   │   ├── islands/          # Componentes interactivos (Preact)
│   │   ├── product/          # Componentes de productos
│   │   └── ui/               # Componentes UI genéricos
│   ├── layouts/              # Layouts de Astro
│   ├── lib/                  # Utilidades y clientes
│   ├── pages/                # Rutas de la aplicación
│   ├── stores/               # Estado global (Nano Stores)
│   └── middleware.ts         # Middleware de autenticación
├── supabase/
│   ├── schema.sql            # Esquema de base de datos
│   └── storage-setup.md      # Guía de configuración de Storage
└── public/                   # Archivos estáticos
```

## 🎨 Características

### Tienda Pública
- ✅ Catálogo de productos (SSG)
- ✅ Filtrado por categorías
- ✅ Fichas de producto con galería
- ✅ Carrito de compra persistente
- ✅ Diseño responsive y elegante

### Panel de Administración
- ✅ Autenticación con Supabase Auth
- ✅ CRUD de productos
- ✅ Gestión de inventario
- ✅ Subida de imágenes a Supabase Storage
- ✅ Rutas protegidas con middleware

## 🔐 Crear Usuario Administrador

Para acceder al panel de administración, crea un usuario en Supabase:

1. Ve a Authentication > Users en Supabase
2. Crea un nuevo usuario con email y contraseña
3. Accede a `/admin/login` con esas credenciales

## 📦 Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run preview      # Preview del build
npm run check        # Verificar tipos TypeScript
```

## 🎨 Paleta de Colores

- **Navy**: `#102a43` - Color principal
- **Charcoal**: `#1a1a1a` - Textos y elementos oscuros
- **Cream**: `#f1ece3` - Fondos suaves
- **Gold**: `#d4a574` - Acentos premium

## 📝 Licencia

MIT

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor, abre un issue primero para discutir los cambios que te gustaría hacer.
