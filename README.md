# 🛍️ FashionStore

E-commerce premium de moda construido con Astro 5.0, Tailwind CSS, Supabase y Stripe.

![FashionStore Banner](https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop)

## 🚀 Stack Tecnológico

| Tecnología | Uso |
|------------|-----|
| **Astro 5.0** | Framework web (modo híbrido SSR/SSG) |
| **Preact** | Componentes interactivos (islands) |
| **Tailwind CSS** | Estilos y diseño responsive |
| **Supabase** | PostgreSQL + Auth + Storage + RLS |
| **Stripe** | Pagos y checkout seguro |
| **Nano Stores** | Estado global ligero |
| **TypeScript** | Tipado estático |

## ✨ Características Principales

### 🛒 Tienda
- Catálogo de productos con filtros y búsqueda
- Carrito de compra persistente (usuarios autenticados y invitados)
- Sistema de favoritos
- Reseñas y valoraciones de productos
- Checkout con Stripe (tarjeta, Google Pay, Apple Pay)
- Seguimiento de pedidos

### 👤 Usuarios
- Autenticación con Supabase Auth
- Perfil de usuario con historial de pedidos
- Sistema de devoluciones
- Carrito sincronizado entre dispositivos

### 🔧 Panel de Administración
- Dashboard con estadísticas
- CRUD completo de productos
- Gestión de categorías y marcas
- Gestión de pedidos (estados, envíos)
- Sistema de cupones y descuentos
- Gestión de reseñas
- Gestión de usuarios
- Sistema de devoluciones

## 📋 Requisitos Previos

- Node.js 18+
- npm o pnpm
- Cuenta de [Supabase](https://supabase.com)
- Cuenta de [Stripe](https://stripe.com) (para pagos)

## 🛠️ Instalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/FashionStore.git
cd FashionStore
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales:
```env
# Supabase
PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
PUBLIC_SITE_URL=http://localhost:4321
```

### 4. Configurar Base de Datos
Ejecuta los siguientes scripts en el SQL Editor de Supabase:

1. `supabase/schema.sql` - Esquema principal
2. `SQL_EJECUTAR_AHORA.sql` - Tablas de órdenes y devoluciones

### 5. Configurar Stripe Webhook
```bash
# Instalar Stripe CLI
stripe login
stripe listen --forward-to localhost:4321/api/stripe/webhook
```

### 6. Iniciar servidor de desarrollo
```bash
npm run dev
```

Abre [http://localhost:4321](http://localhost:4321) 🎉

## 📁 Estructura del Proyecto

```
FashionStore/
├── src/
│   ├── components/
│   │   ├── islands/          # Componentes Preact interactivos
│   │   │   ├── Cart.tsx
│   │   │   ├── AddToCartButton.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── AdminOrders.tsx
│   │   │   └── ...
│   │   └── *.astro           # Componentes Astro
│   ├── layouts/
│   │   ├── Layout.astro      # Layout principal
│   │   └── AdminLayout.astro # Layout admin
│   ├── lib/
│   │   ├── supabase.ts       # Cliente Supabase
│   │   ├── cartService.ts    # Lógica del carrito
│   │   └── utils.ts          # Utilidades
│   ├── pages/
│   │   ├── api/              # API endpoints
│   │   │   ├── stripe/       # Stripe endpoints
│   │   │   └── ...
│   │   ├── admin/            # Panel administración
│   │   ├── productos/        # Páginas de productos
│   │   └── ...
│   ├── stores/               # Nano Stores
│   └── middleware.ts         # Auth middleware
├── supabase/                 # Scripts SQL
├── public/                   # Assets estáticos
└── .env.example              # Variables de entorno
```

## 🗄️ Base de Datos

### Tablas Principales
| Tabla | Descripción |
|-------|-------------|
| `productos` | Catálogo de productos |
| `categorias` | Categorías de productos |
| `marcas` | Marcas disponibles |
| `cart_items` | Ítems del carrito (usuarios auth) |
| `ordenes` | Pedidos realizados |
| `items_orden` | Ítems de cada pedido |
| `devoluciones` | Solicitudes de devolución |
| `cupones` | Códigos de descuento |
| `reviews` | Reseñas de productos |
| `favoritos` | Productos favoritos |

## 🔐 Acceso Admin

1. Accede a `/admin-secret-login`
2. Credenciales por defecto:
   - Email: `admin@fashionstore.com`
   - Password: (configurar en Supabase)

## 📦 Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run preview      # Preview del build
npm run check        # Verificar tipos TypeScript
```

## 🎨 Paleta de Colores

| Color | Hex | Uso |
|-------|-----|-----|
| Navy | `#102a43` | Color principal |
| Charcoal | `#1a1a1a` | Textos oscuros |
| Cream | `#f1ece3` | Fondos suaves |
| Gold | `#d4a574` | Acentos premium |

## 🔄 Flujo de Compra

```
1. Usuario navega productos
       ↓
2. Añade al carrito (auth o invitado)
       ↓
3. Checkout → Stripe
       ↓
4. Pago procesado → Webhook
       ↓
5. Orden creada en BD
       ↓
6. Email confirmación (opcional)
```

## 📱 Responsive Design

- ✅ Mobile First
- ✅ Tablet optimizado
- ✅ Desktop completo
- ✅ Carrito desplegable
- ✅ Menú hamburguesa móvil

## 🛡️ Seguridad

- Row Level Security (RLS) en Supabase
- Middleware de autenticación
- Validación de webhooks Stripe
- Variables de entorno protegidas
- Service Role solo en servidor

## 📄 Licencia

MIT License - Ver [LICENSE](LICENSE)

## 👨‍💻 Autor

Desarrollado para el módulo de **Sistemas de Gestión Empresarial** - DAM 2º

---

<p align="center">
  <strong>FashionStore</strong> - E-commerce Premium 🛍️
</p>
