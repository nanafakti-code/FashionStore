# 🚀 MIGRACIÓN: Web Astro → App Flutter

**Documento de Especificaciones Técnicas para Replicar FashionStore en Flutter**

> **Fecha**: 19 de enero de 2026  
> **Estado**: 📋 Ready for Development  
> **Objetivo**: Crear app Flutter idéntica a web Astro, usando la MISMA BD Supabase

---

## 📑 Tabla de Contenidos

1. [Contexto General](#contexto-general)
2. [Análisis de la Web Astro](#análisis-de-la-web-astro)
3. [Esquema de Base de Datos](#esquema-de-base-de-datos)
4. [Funcionalidades a Replicar](#funcionalidades-a-replicar)
5. [Requisitos Técnicos](#requisitos-técnicos)
6. [Especificaciones de UI/UX](#especificaciones-de-uiux)
7. [Entregables Esperados](#entregables-esperados)
8. [Checklist Pre-Desarrollo](#checklist-pre-desarrollo)

---

## 🎯 Contexto General

### Situación Actual
- **Versión Web**: Astro 5.0 (en producción)
- **Base de Datos**: Supabase/PostgreSQL (compartida)
- **Objetivo**: Replicar toda la funcionalidad en una app Flutter nativa

### Scope
- ✅ Interfaz idéntica a la web
- ✅ Misma BD (sin duplicación de datos)
- ✅ Funcionalidad completa (cliente + admin)
- ✅ Real-time updates (ofertas, stock)
- ✅ Persistencia local de carrito (Hive)
- ✅ Subida de imágenes desde el móvil (cámara + galería)

### No Incluye
- ❌ Mantener actualizada la web (solo se replica)
- ❌ Cambiar schema de BD existente
- ❌ Crear nueva infraestructura

---

## 🔍 Análisis de la Web Astro

### Estructura del Proyecto Web
```
FashionStore/
├── src/
│   ├── pages/                 # Rutas principales
│   │   ├── admin/             # Panel administrativo
│   │   ├── auth/              # Autenticación
│   │   ├── checkout/          # Proceso de compra
│   │   ├── categoria/         # Productos por categoría
│   │   ├── productos/         # Detalles de producto
│   │   ├── index.astro        # Home
│   │   ├── carrito.astro      # Carrito de compras
│   │   ├── buscar.astro       # Búsqueda
│   │   ├── favoritos.astro    # Lista de deseos
│   │   ├── mi-cuenta.astro    # Perfil de usuario
│   │   └── mis-pedidos.astro  # Historial de pedidos
│   ├── components/            # Componentes reutilizables
│   │   ├── Header.astro       # Navegación principal
│   │   ├── ProductCard.astro  # Tarjeta de producto
│   │   ├── CategoryCard.astro # Tarjeta de categoría
│   │   ├── FilterSidebar.astro # Filtros
│   │   └── CartComponents.tsx # Componentes Preact del carrito
│   ├── islands/               # Componentes interactivos
│   ├── layouts/               # Plantillas
│   ├── lib/                   # Lógica compartida
│   └── stores/                # Estado global (nanostores)
├── public/                    # Archivos estáticos
├── supabase/                  # Migraciones y configuración BD
├── astro.config.mjs           # Configuración
├── tailwind.config.mjs        # Estilos (IMPORTANTE)
├── package.json
└── README.md
```

### Rutas/Páginas Principales

| Ruta | Descripción | Estado |
|------|-------------|--------|
| `/` | Home - Categorías destacadas + productos bestsellers | ✅ Activa |
| `/productos` | Listado completo con filtros y búsqueda | ✅ Activa |
| `/productos/[slug]` | Detalles de producto (galería, stock, variantes) | ✅ Activa |
| `/categoria/[slug]` | Productos filtrados por categoría | ✅ Activa |
| `/carrito` | Carrito de compras (reservas 10 min) | ✅ Activa |
| `/checkout` | Pago (Stripe integrado) | ✅ Activa |
| `/buscar` | Búsqueda global | ✅ Activa |
| `/favoritos` | Lista de deseos | ✅ Activa |
| `/login` | Autenticación | ✅ Activa |
| `/mi-cuenta` | Perfil del usuario | ✅ Activa |
| `/mis-pedidos` | Historial de órdenes | ✅ Activa |
| `/admin` | Dashboard administrador | ✅ Activa |
| `/admin-secret-login` | Login admin especial | ✅ Activa |

### Componentes Clave

| Componente | Ubicación | Función |
|------------|-----------|---------|
| **Header** | `components/Header.astro` | Logo, búsqueda, nav, carrito, perfil |
| **ProductCard** | `components/ProductCard.astro` | Tarjeta: imagen, precio, stock, botón añadir |
| **CategoryCard** | `components/CategoryCard.astro` | Tarjeta de categoría con imagen |
| **FilterSidebar** | `components/FilterSidebar.astro` | Filtros: precio, categoría, marca |
| **CartComponents** | `components/CartComponents.tsx` | Carrito interactivo (Preact) |
| **ProductGallery** | En ProductCard | Carrusel de imágenes con zoom |

### Integración con Supabase

La web conecta con Supabase mediante:
- **Autenticación**: Email/contraseña + OAuth (Google, Apple)
- **Queries**: Fetch directo a tablas (`usuarios`, `productos`, `pedidos`, etc)
- **Storage**: Bucket `products-images` para imágenes
- **Realtime**: Escucha cambios en stock y ofertas (opcional)
- **Functions**: Para Stripe, confirmación de pedidos, etc

### Stack Tecnológico Web

```json
{
  "Frontend": {
    "Framework": "Astro 5.0",
    "Estilos": "Tailwind CSS 3.4",
    "Interactividad": "Preact 10 (islands)",
    "Estado": "Nanostores 0.11"
  },
  "Backend": {
    "BD": "Supabase/PostgreSQL",
    "Autenticación": "Supabase Auth",
    "Storage": "Supabase Storage",
    "Pagos": "Stripe"
  },
  "Deployment": {
    "Hosting": "Vercel",
    "Dominio": "[Tu dominio]"
  }
}
```

---

## 📊 Esquema de Base de Datos

### Tablas Principales

#### 👥 USUARIOS
```sql
CREATE TABLE usuarios (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  apellidos TEXT,
  telefono TEXT,
  genero TEXT CHECK (genero IN ('Masculino', 'Femenino', 'Otro')),
  fecha_nacimiento DATE,
  foto_perfil TEXT,
  activo BOOLEAN DEFAULT TRUE,
  verificado BOOLEAN DEFAULT FALSE,
  fecha_registro TIMESTAMPTZ DEFAULT NOW(),
  ultimo_acceso TIMESTAMPTZ,
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);
```

#### 📍 DIRECCIONES
```sql
CREATE TABLE direcciones (
  id UUID PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id),
  tipo TEXT CHECK (tipo IN ('Envío', 'Facturación', 'Ambas')),
  nombre_destinatario TEXT NOT NULL,
  calle TEXT, numero TEXT, piso TEXT,
  codigo_postal TEXT NOT NULL,
  ciudad TEXT NOT NULL,
  provincia TEXT NOT NULL,
  pais TEXT DEFAULT 'España',
  es_predeterminada BOOLEAN DEFAULT FALSE,
  creada_en TIMESTAMPTZ DEFAULT NOW()
);
```

#### 📂 CATEGORÍAS
```sql
CREATE TABLE categorias (
  id UUID PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  slug TEXT UNIQUE,
  descripcion TEXT,
  icono TEXT,
  imagen_portada TEXT,
  padre_id UUID REFERENCES categorias(id),
  orden INT DEFAULT 0,
  activa BOOLEAN DEFAULT TRUE,
  creada_en TIMESTAMPTZ DEFAULT NOW()
);
```

#### 🏢 MARCAS
```sql
CREATE TABLE marcas (
  id UUID PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  slug TEXT UNIQUE,
  descripcion TEXT,
  logo TEXT,
  sitio_web TEXT,
  activa BOOLEAN DEFAULT TRUE,
  creada_en TIMESTAMPTZ DEFAULT NOW()
);
```

#### 📦 PRODUCTOS
```sql
CREATE TABLE productos (
  id UUID PRIMARY KEY,
  nombre TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  descripcion_larga TEXT,
  precio_venta INTEGER NOT NULL,           -- Centavos (€19.99 = 1999)
  precio_original INTEGER,
  costo INTEGER,
  stock_total INTEGER DEFAULT 0,
  sku TEXT UNIQUE,
  categoria_id UUID REFERENCES categorias(id),
  marca_id UUID REFERENCES marcas(id),
  genero TEXT CHECK (genero IN ('Masculino', 'Femenino', 'Unisex')),
  color TEXT,
  material TEXT,
  destacado BOOLEAN DEFAULT FALSE,
  activo BOOLEAN DEFAULT TRUE,
  valoracion_promedio DECIMAL(3,2) DEFAULT 0,
  total_resenas INTEGER DEFAULT 0,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);
```

#### 🖼️ IMÁGENES DE PRODUCTO
```sql
CREATE TABLE imagenes_producto (
  id UUID PRIMARY KEY,
  producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  url_miniatura TEXT,
  alt_text TEXT,
  orden INT DEFAULT 0,
  es_principal BOOLEAN DEFAULT FALSE,
  creada_en TIMESTAMPTZ DEFAULT NOW()
);
```

#### 📏 VARIANTES DE PRODUCTO
```sql
CREATE TABLE variantes_producto (
  id UUID PRIMARY KEY,
  producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
  talla TEXT NOT NULL,
  color TEXT,
  stock INT DEFAULT 0,
  sku_variante TEXT UNIQUE,
  precio_adicional INTEGER DEFAULT 0,
  creada_en TIMESTAMPTZ DEFAULT NOW()
);
```

#### ⭐ RESEÑAS
```sql
CREATE TABLE resenas (
  id UUID PRIMARY KEY,
  producto_id UUID REFERENCES productos(id),
  usuario_id UUID REFERENCES usuarios(id),
  calificacion INT CHECK (calificacion >= 1 AND calificacion <= 5),
  titulo TEXT,
  comentario TEXT,
  verificada_compra BOOLEAN DEFAULT FALSE,
  estado TEXT CHECK (estado IN ('Pendiente', 'Aprobada', 'Rechazada')),
  creada_en TIMESTAMPTZ DEFAULT NOW()
);
```

#### ❤️ LISTA DE DESEOS
```sql
CREATE TABLE lista_deseos (
  id UUID PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id),
  producto_id UUID REFERENCES productos(id),
  anadida_en TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(usuario_id, producto_id)
);
```

#### 🛒 CARRITO (Reservas)
```sql
CREATE TABLE cart_reservations (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID REFERENCES productos(id),
  quantity INT NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '10 minutes'),
  UNIQUE(user_id, product_id)
);
```

**Nota**: El carrito usa un sistema de **reservas de 10 minutos**. Cuando el usuario añade un producto:
1. Se crea una reserva que descuenta del `stock_total`
2. Expira en 10 minutos si no se completa el pago
3. Se restaura el stock automáticamente

#### 📋 PEDIDOS
```sql
CREATE TABLE pedidos (
  id UUID PRIMARY KEY,
  numero_pedido TEXT UNIQUE,
  usuario_id UUID REFERENCES usuarios(id),
  estado TEXT CHECK (estado IN ('Pendiente', 'Confirmado', 'Pagado', 'Enviado', 'Entregado', 'Cancelado')),
  subtotal INTEGER DEFAULT 0,
  impuestos INTEGER DEFAULT 0,
  coste_envio INTEGER DEFAULT 0,
  descuento INTEGER DEFAULT 0,
  total INTEGER NOT NULL,
  metodo_pago TEXT CHECK (metodo_pago IN ('Tarjeta', 'PayPal', 'Transferencia')),
  referencia_pago TEXT,
  direccion_envio_id UUID REFERENCES direcciones(id),
  fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
  fecha_envio TIMESTAMPTZ,
  fecha_entrega_estimada TIMESTAMPTZ,
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);
```

#### 📦 DETALLES DE PEDIDO
```sql
CREATE TABLE detalles_pedido (
  id UUID PRIMARY KEY,
  pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id),
  cantidad INT NOT NULL CHECK (cantidad > 0),
  talla TEXT,
  color TEXT,
  precio_unitario INTEGER NOT NULL,
  subtotal INTEGER NOT NULL,
  descuento INT DEFAULT 0,
  total INT NOT NULL,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);
```

### Credenciales Supabase

```
PROJECT_URL=https://spzvtjybxpaxpnpfxbqv.supabase.co
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwenZ0anlieHBheHBucGZ4YnF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NjgyMzUsImV4cCI6MjA4MzQ0NDIzNX0.5gggyKxtxR7IdQejFS48eoF_xL-7CPuP2jOeuMLTS8M

Bucket Storage: 
  - Name: products-images
  - Public: Si
  - Policies: Permite lectura pública, escritura solo de usuarios autenticados
```

### Datos Actuales

**Categorías** (8):
- Teléfonos Inteligentes (smartphones)
- Portátiles (laptops)
- Tabletas (tablets)
- Audio (audio)
- Dispositivos Portátiles (wearables)
- Cámaras (camaras)
- Monitores (monitores)
- Consolas (consolas)

**Marcas** (4):
- Apple
- Samsung
- Sony
- LG

**Usuarios de Ejemplo**:
```
admin@fashionstore.com / Administrador
maria.garcia@email.com / María García López
carlos.rodriguez@email.com / Carlos Rodríguez Martín
laura.martin@email.com / Laura Martín Sánchez
antonio.lopez@email.com / Antonio López García
isabel.fernandez@email.com / Isabel Fernández Ruiz
```

**Productos de Ejemplo** (6 iniciales):
- iPhone 15 Pro Max (€1,399 | Stock: 35)
- Samsung Galaxy S24 Ultra (€1,299 | Stock: 28)
- MacBook Pro 16 M3 Max (€2,399 | Stock: 12)
- Dell XPS 15 (€1,199 | Stock: 18)
- iPad Pro 12.9 M2 (€899 | Stock: 15)
- Sony WH-1000XM5 (€349 | Stock: 22)

---

## ✨ Funcionalidades a Replicar

### 👥 Usuario Cliente

#### Autenticación
- [ ] Pantalla de login (email/contraseña)
- [ ] Pantalla de registro (validaciones)
- [ ] Recuperación de contraseña
- [ ] Persistencia de sesión (SharedPreferences)
- [ ] Logout

#### Catálogo de Productos
- [ ] Vista grid de productos (infinite scroll)
- [ ] Filtros por categoría, precio, marca
- [ ] Búsqueda por nombre/descripción
- [ ] Ordenamiento (precio, popularidad, nuevos)
- [ ] Shimmer loading durante carga
- [ ] Lazy loading de imágenes

#### Detalles de Producto
- [ ] Galería de imágenes (carrusel, zoom pinch)
- [ ] Información completa (precio, stock, descripción)
- [ ] Mostrar rating y número de reseñas
- [ ] Selector de cantidad
- [ ] Botón "Añadir al carrito" con feedback visual
- [ ] Botón "Añadir a favoritos" (heart icon)
- [ ] Mostrar variantes (talla, color) si aplica
- [ ] Mostrar productos relacionados
- [ ] Mostrar stock disponible en tiempo real

#### Carrito de Compra
- [ ] Listar items añadidos al carrito
- [ ] Mostrar cantidad, precio unitario, total por item
- [ ] Ajustar cantidad (increment/decrement)
- [ ] Eliminar items del carrito
- [ ] Cálculo automático:
  - Subtotal
  - Impuestos (IVA 21%)
  - Envío (gratuito si total > €50, €5 en caso contrario)
  - Total final
- [ ] Persistencia local en Hive (sincronizar con BD)
- [ ] Contador de items en icono de carrito (badge)
- [ ] Botón vaciar carrito (con confirmación)
- [ ] Proceder a checkout

#### Checkout
- [ ] Resumen de pedido (items, subtotal, total)
- [ ] Seleccionar/crear dirección de envío
- [ ] Seleccionar dirección de facturación
- [ ] Método de pago:
  - [ ] Tarjeta de crédito (Stripe)
  - [ ] PayPal (opcional)
  - [ ] Transferencia bancaria (simulado)
- [ ] Confirmación final antes de pagar
- [ ] Procesar pago
- [ ] Mostrar confirmación de orden
- [ ] Número de seguimiento
- [ ] Envío de email de confirmación (opcional)

#### Perfil de Usuario
- [ ] Ver datos personales (nombre, email, teléfono, etc)
- [ ] Editar perfil
- [ ] Cambiar contraseña
- [ ] Foto de perfil
- [ ] Listado de direcciones guardadas
- [ ] Editar/eliminar direcciones
- [ ] Marcar dirección predeterminada
- [ ] Histórico de órdenes
- [ ] Ver detalles de cada orden
- [ ] Seguimiento de pedidos
- [ ] Cerrar sesión

#### Funcionalidades Extra
- [ ] Favoritos/Lista de deseos
- [ ] Búsqueda global
- [ ] Filtros avanzados
- [ ] Notificaciones de nuevas ofertas
- [ ] Historial de búsquedas recientes

### 🔐 Usuario Administrador

#### Autenticación Admin
- [ ] Login especial con credenciales admin
- [ ] Protección: solo usuarios con rol admin
- [ ] Logout desde dashboard

#### Dashboard
- [ ] Resumen de métricas:
  - [ ] Total ventas (hoy, semana, mes)
  - [ ] Número de órdenes
  - [ ] Productos con stock bajo
  - [ ] Usuarios activos
- [ ] Últimas órdenes (tabla)
- [ ] Productos más vendidos
- [ ] Gráficos básicos (opcional)

#### Gestión de Productos
- [ ] Listar todos los productos
- [ ] Crear nuevo producto:
  - [ ] Nombre, descripción, precio
  - [ ] Stock, SKU, categoría, marca
  - [ ] Características (genero, color, material)
  - [ ] Subida de imágenes
  - [ ] Orden de imágenes
- [ ] Editar producto existente
- [ ] Eliminar producto (soft delete)
- [ ] Cambiar estado (activo/inactivo)
- [ ] Gestionar variantes (talla, color)
- [ ] Subida de imágenes:
  - [ ] Desde cámara (foto en tiempo real)
  - [ ] Desde galería
  - [ ] Comprimir automáticamente (max 500KB)
  - [ ] Subir a Storage de Supabase

#### Control de Ofertas (Real-time)
- [ ] Pantalla de control de ofertas
- [ ] Toggle switch: Activar/desactivar sección ofertas
- [ ] Agregar productos a ofertas:
  - [ ] Seleccionar producto
  - [ ] Establecer precio original
  - [ ] Establecer precio descuento
  - [ ] Calcular porcentaje automáticamente
- [ ] Listar productos en oferta
- [ ] Eliminar producto de oferta
- [ ] Cambios se reflejan en tiempo real en clientes (StreamProvider)

#### Gestión de Órdenes
- [ ] Listar todas las órdenes
- [ ] Filtros por estado, usuario, fecha
- [ ] Ver detalles completos de cada orden
- [ ] Cambiar estado de orden (Pendiente → Confirmado → Pagado → Enviado → Entregado)
- [ ] Generar número de seguimiento
- [ ] Notas internas
- [ ] Posibilidad de cancelar orden (si está Pendiente)

#### Gestión de Usuarios (Opcional)
- [ ] Listar usuarios
- [ ] Ver detalles de usuario
- [ ] Desactivar usuario
- [ ] Ver historial de compras del usuario

### ⚡ Funcionalidades Real-time

- [ ] Stock actualizado cuando cambia en BD (StreamProvider)
- [ ] Ofertas mostradas/ocultadas sin recargar (escucha changes)
- [ ] Notificaciones si inventario baja de límite crítico
- [ ] Cambios en perfil sincronizados entre dispositivos
- [ ] Órdenes actualizadas en tiempo real en admin

---

## 🛠️ Requisitos Técnicos

### Framework & Lenguaje
- **Framework**: Flutter 3.24.0+ (última versión estable)
- **Lenguaje**: Dart 3.5.0+
- **Plataformas**: Android 8.0+ + iOS 11.0+ (+ Web opcional)

### Arquitectura
- **Patrón**: Clean Architecture (5 capas)
- **Patrón de Datos**: Repository Pattern
- **State Management**: Riverpod (StreamProvider, AsyncNotifier, StateNotifier)
- **Serialización**: Freezed + JsonSerializable
- **Manejo de Errores**: Either<Failure, T> (fpdart)

### Dependencias Obligatorias

#### State Management & Serialización
```yaml
flutter_riverpod: ^2.4.0           # State management
riverpod_annotation: ^2.3.0        # Anotaciones
freezed_annotation: ^2.4.1         # Modelos inmutables
json_annotation: ^4.8.1            # Serialización JSON
build_runner: ^2.4.0               # Generador de código
freezed: ^2.4.5                    # Generador Freezed
json_serializable: ^6.7.0          # Generador JSON
```

#### Backend & Auth
```yaml
supabase_flutter: ^2.0.0           # Cliente Supabase
supabase: ^2.0.0                   # Para llamadas directo
```

#### Navegación
```yaml
go_router: ^14.0.0                 # Navegación tipada + deep links
```

#### Persistencia Local
```yaml
hive: ^2.2.3                       # Base de datos local
hive_flutter: ^1.1.0               # Integración Flutter
hive_generator: ^2.0.0             # Generador Hive
```

#### Imágenes & Multimedia
```yaml
image_picker: ^1.0.4               # Cámara + galería
flutter_image_compress: ^2.4.0     # Comprimir imágenes
cached_network_image: ^3.3.0       # Caché de imágenes
```

#### Utilities
```yaml
fpdart: ^1.1.0                     # Either, TaskEither
google_fonts: ^6.1.0               # Fuentes Google
intl: ^0.19.0                      # Internacionalización
uuid: ^4.0.0                       # Generar UUIDs
logger: ^2.1.0                     # Logging mejorado
dio: ^5.3.1                        # Cliente HTTP
```

### Estructura de Carpetas

```
lib/
├── config/
│   ├── constants/
│   │   ├── app_constants.dart
│   │   └── supabase_config.dart
│   ├── router/
│   │   ├── app_router.dart
│   │   ├── app_routes.dart
│   │   └── route_guards.dart
│   └── theme/
│       ├── app_colors.dart        ← PALETA TAILWIND
│       ├── app_text_styles.dart   ← TIPOGRAFÍAS
│       └── app_theme.dart
│
├── shared/
│   ├── exceptions/
│   │   └── failure.dart
│   ├── extensions/
│   │   ├── context_ext.dart
│   │   ├── string_ext.dart
│   │   ├── date_ext.dart
│   │   └── num_ext.dart            ← Para conversiones precio
│   ├── services/
│   │   ├── supabase_service.dart
│   │   ├── local_storage_service.dart
│   │   ├── image_compress_service.dart
│   │   └── logger_service.dart
│   └── widgets/
│       ├── custom_app_bar.dart
│       ├── custom_button.dart
│       ├── custom_input.dart
│       ├── custom_loader.dart
│       ├── error_widget.dart
│       └── empty_state_widget.dart
│
├── features/
│   ├── auth/
│   │   ├── data/
│   │   │   ├── datasources/
│   │   │   │   └── auth_remote_datasource.dart
│   │   │   ├── models/
│   │   │   │   └── user_model.dart
│   │   │   └── repositories/
│   │   │       └── auth_repository_impl.dart
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   └── user_entity.dart
│   │   │   └── repositories/
│   │   │       └── auth_repository.dart
│   │   └── presentation/
│   │       ├── providers/
│   │       │   ├── auth_provider.dart
│   │       │   └── user_provider.dart
│   │       ├── screens/
│   │       │   ├── login_screen.dart
│   │       │   └── register_screen.dart
│   │       └── widgets/
│   │           └── login_form.dart
│   │
│   ├── products/
│   │   ├── data/
│   │   │   ├── datasources/
│   │   │   │   ├── product_remote_datasource.dart
│   │   │   │   └── product_local_datasource.dart
│   │   │   ├── models/
│   │   │   │   ├── product_model.dart
│   │   │   │   ├── category_model.dart
│   │   │   │   └── image_model.dart
│   │   │   └── repositories/
│   │   │       └── product_repository_impl.dart
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   ├── product_entity.dart
│   │   │   │   └── category_entity.dart
│   │   │   └── repositories/
│   │   │       └── product_repository.dart
│   │   └── presentation/
│   │       ├── providers/
│   │       │   ├── products_provider.dart
│   │       │   ├── categories_provider.dart
│   │       │   └── product_details_provider.dart
│   │       ├── screens/
│   │       │   ├── products_screen.dart
│   │       │   └── product_details_screen.dart
│   │       └── widgets/
│   │           ├── product_card.dart
│   │           ├── product_filters.dart
│   │           ├── product_gallery.dart
│   │           └── category_chip.dart
│   │
│   ├── cart/
│   │   ├── data/
│   │   │   ├── datasources/
│   │   │   │   ├── cart_local_datasource.dart (Hive)
│   │   │   │   └── cart_remote_datasource.dart (Supabase)
│   │   │   ├── models/
│   │   │   │   ├── cart_item_model.dart
│   │   │   │   └── cart_model.dart
│   │   │   └── repositories/
│   │   │       └── cart_repository_impl.dart
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   ├── cart_item_entity.dart
│   │   │   │   └── cart_entity.dart
│   │   │   └── repositories/
│   │   │       └── cart_repository.dart
│   │   └── presentation/
│   │       ├── providers/
│   │       │   ├── cart_provider.dart
│   │       │   └── cart_total_provider.dart
│   │       ├── screens/
│   │       │   └── cart_screen.dart
│   │       └── widgets/
│   │           ├── cart_item_tile.dart
│   │           └── cart_summary.dart
│   │
│   ├── checkout/
│   │   ├── data/
│   │   │   ├── datasources/
│   │   │   │   └── checkout_remote_datasource.dart
│   │   │   ├── models/
│   │   │   │   └── order_model.dart
│   │   │   └── repositories/
│   │   │       └── checkout_repository_impl.dart
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   └── order_entity.dart
│   │   │   └── repositories/
│   │   │       └── checkout_repository.dart
│   │   └── presentation/
│   │       ├── screens/
│   │       │   ├── checkout_screen.dart
│   │       │   └── order_confirmation_screen.dart
│   │       └── widgets/
│   │
│   ├── offers/
│   │   ├── data/
│   │   │   ├── models/
│   │   │   │   └── offer_product_model.dart
│   │   │   └── datasources/
│   │   │       └── offers_remote_datasource.dart
│   │   ├── domain/
│   │   │   └── entities/
│   │   │       └── offer_product_entity.dart
│   │   └── presentation/
│   │       ├── providers/
│   │       │   └── offers_stream_provider.dart
│   │       └── widgets/
│   │           └── offers_carousel.dart
│   │
│   └── admin/
│       ├── data/
│       │   ├── datasources/
│       │   │   ├── admin_products_datasource.dart
│       │   │   ├── admin_offers_datasource.dart
│       │   │   └── admin_orders_datasource.dart
│       │   ├── models/
│       │   │   └── admin_models.dart
│       │   └── repositories/
│       │       └── admin_repository_impl.dart
│       ├── domain/
│       │   └── repositories/
│       │       └── admin_repository.dart
│       └── presentation/
│           ├── screens/
│           │   ├── admin_dashboard.dart
│           │   ├── products_management_screen.dart
│           │   ├── offers_control_screen.dart
│           │   └── orders_management_screen.dart
│           └── widgets/
│               ├── product_form.dart
│               └── image_picker_widget.dart
│
├── main.dart                       # Punto de entrada
└── firebase_options.dart           # Configuración env (si aplica)
```

---

## 🎨 Especificaciones de UI/UX

### Paleta de Colores (Tailwind)

**Colores Primarios**:
```dart
// Azul Celeste (primario)
const primary = Color(0xFF0ea5e9);        // sky-500
const primaryLight = Color(0xFF7dd3fc);   // sky-300
const primaryDark = Color(0xFF0369a1);    // sky-700

// Rosa Coral (secundario)
const secondary = Color(0xFFec4899);      // pink-500
const secondaryLight = Color(0xFFf472b6); // pink-400

// Naranja Cálido (accent)
const accent = Color(0xFFf59e0b);         // amber-500

// Verde Menta (éxito)
const success = Color(0xFF10b981);        // emerald-500
```

**Colores Neutrales**:
```dart
// Background
const bgWhite = Color(0xFFFEFEFE);        // cream-50
const bgLight = Color(0xFFFAF8F5);        // cream-200
const bgMedium = Color(0xFFF1ECE3);       // cream-500
const bgDark = Color(0xFFF8FAFC);         // slate-50

// Text
const textDark = Color(0xFF1e293b);       // slate-800
const textMedium = Color(0xFF475569);     // slate-600
const textLight = Color(0xFF94a3b8);      // slate-400

// Border
const borderColor = Color(0xFFe2e8f0);    // slate-200

// Error/Warning
const error = Color(0xFFEF4444);          // red-500
const warning = Color(0xFFF59E0B);        // amber-500
```

### Tipografía

**Fuentes**:
```dart
// Títulos: Playfair Display (serif)
const titleFontFamily = 'Playfair Display';

// Cuerpo: Inter (sans-serif)
const bodyFontFamily = 'Inter';
```

**Estilos**:
```dart
// H1: 32px, Bold (700)
TextStyle h1 = TextStyle(
  fontSize: 32,
  fontWeight: FontWeight.w700,
  fontFamily: 'Playfair Display',
  color: Colors.black,
);

// H2: 28px, Bold (700)
TextStyle h2 = TextStyle(
  fontSize: 28,
  fontWeight: FontWeight.w700,
  fontFamily: 'Playfair Display',
);

// H3: 24px, Bold (700)
TextStyle h3 = TextStyle(
  fontSize: 24,
  fontWeight: FontWeight.w700,
  fontFamily: 'Playfair Display',
);

// Body: 16px, Regular (400)
TextStyle body = TextStyle(
  fontSize: 16,
  fontWeight: FontWeight.w400,
  fontFamily: 'Inter',
);

// Small: 14px, Regular (400)
TextStyle small = TextStyle(
  fontSize: 14,
  fontWeight: FontWeight.w400,
  fontFamily: 'Inter',
);

// Button: 16px, Medium (500)
TextStyle button = TextStyle(
  fontSize: 16,
  fontWeight: FontWeight.w500,
  fontFamily: 'Inter',
);
```

### Componentes UI Principales

#### ProductCard
```
┌──────────────────────┐
│   [Image]            │  Imagen con badge "NEW" o descuento
│   [    ]             │
│  -30%                │
├──────────────────────┤
│ Nombre Producto      │  Max 2 líneas
│ Marca                │  Gris claro
├──────────────────────┤
│ ⭐ 4.5 (20 reseñas)  │
│ €19.99               │  Precio en azul primario, grande
│ €29.99               │  Precio tachado si hay descuento
│ Stock: 5 unidades    │  Verde si hay stock, rojo si no
├──────────────────────┤
│ [+ Añadir]           │  Botón primario
└──────────────────────┘
```

#### Header
```
┌──────────────────────────────────────┐
│  FashionStore  🔍  🛒(3)  👤  ≡      │  Sticky en top
└──────────────────────────────────────┘
```

#### ProductGallery
```
┌──────────────────────┐
│                      │
│  [   Imagen 1    ]   │  Fullscreen, pinch zoom
│                      │
├──────────────────────┤
│ [T1][T2][T3]..       │  Thumbnails scrolleables
└──────────────────────┘
```

#### CartSummary
```
┌──────────────────────┐
│ Subtotal:    €79.96  │
│ Impuestos:   €16.79  │
│ Envío:       € 0.00  │ (Gratis si >€50)
│ ─────────────────    │
│ TOTAL:      €96.75   │  En azul primario, grande
├──────────────────────┤
│ [  Pagar  ]          │  Botón primario
│ [Seguir comprando]   │  Botón secundario
└──────────────────────┘
```

#### FilterSheet
```
Categorías:
  ☐ Smartphones
  ☐ Laptops
  ☐ Tablets
  
Rango de Precio:
  €0 ----●------ €3000
  
Marca:
  ☐ Apple
  ☐ Samsung
  ☐ Sony
  ☐ LG

[Aplicar Filtros]  [Limpiar]
```

#### AdminDashboard
```
┌─────────────────────────────┐
│ Admin Panel  Perfil  Logout  │
├─────────────────────────────┤
│ 📊 Dashboard                │
│                             │
│ Ventas hoy: €1,234          │
│ Órdenes: 12                 │
│ Stock bajo: 3 prod          │
│ Usuarios activos: 45        │
├─────────────────────────────┤
│ Últimas órdenes             │
│ [Order 001] Confirmado      │
│ [Order 002] Pagado          │
├─────────────────────────────┤
│ ⚙️ Menú Admin               │
│ 📦 Gestionar Productos      │
│ 🔥 Control de Ofertas       │
│ 📋 Gestionar Órdenes        │
│ 👥 Gestionar Usuarios       │
└─────────────────────────────┘
```

---

## 📦 Entregables Esperados

### 🔵 HITO 2: Setup & DataSources
**Duración**: 2-3 semanas  
**Entrega**: Proyecto Flutter conectado a BD

- [ ] Proyecto Flutter creado y configurado
- [ ] pubspec.yaml con todas las dependencias
- [ ] Estructura de carpetas Clean Architecture
- [ ] Configuración de Supabase (URL, keys)
- [ ] Modelos Freezed (mapeo exacto a tablas)
  - [ ] UserModel
  - [ ] ProductModel
  - [ ] CategoryModel
  - [ ] CartItemModel
  - [ ] OrderModel
  - [ ] OfferProductModel
- [ ] RemoteDataSources implementados
  - [ ] ProductRemoteDataSource
  - [ ] AuthRemoteDataSource
  - [ ] CartRemoteDataSource
  - [ ] OrderRemoteDataSource
  - [ ] OffersRemoteDataSource
- [ ] LocalDataSources con Hive
  - [ ] CartLocalDataSource
  - [ ] UserLocalDataSource
- [ ] Repositories implementados
- [ ] Providers Riverpod básicos
- [ ] App ejecutable en emulador/dispositivo
- [ ] Obtención de productos desde BD funcional
- [ ] Documentación:
  - [ ] HITO2_COMPLETADO.md
  - [ ] API_DATASOURCES.md
  - [ ] SETUP_DESARROLLO.md

**Criterios de Aceptación**:
- ✅ La app carga productos de Supabase
- ✅ Autenticación funcional
- ✅ Sin errores de compilación
- ✅ Carrito persiste en Hive

---

### 🟠 HITO 3: UI Completa
**Duración**: 3-4 semanas  
**Entrega**: App lista para producción (APK/IPA)

**Pantallas Cliente**:
- [ ] Home
  - [ ] Header con navegación
  - [ ] Hero section
  - [ ] Categorías (chips horizontales)
  - [ ] Carrusel de ofertas (si enabled)
  - [ ] Grid de productos (infinite scroll)
  - [ ] Footer

- [ ] Productos
  - [ ] Grid con filtros
  - [ ] Búsqueda
  - [ ] Ordenamiento
  - [ ] Infinite scroll

- [ ] Detalles Producto
  - [ ] Galería con zoom
  - [ ] Info completa
  - [ ] Selector de cantidad
  - [ ] Productos relacionados
  - [ ] Reseñas

- [ ] Carrito
  - [ ] Lista de items
  - [ ] Editar cantidad
  - [ ] Eliminar items
  - [ ] Resumen de totales
  - [ ] Proceder a checkout

- [ ] Checkout
  - [ ] Dirección de envío
  - [ ] Dirección de facturación
  - [ ] Método de pago
  - [ ] Confirmación
  - [ ] Pantalla de éxito

- [ ] Órdenes
  - [ ] Historial de compras
  - [ ] Detalles de orden
  - [ ] Seguimiento

- [ ] Perfil
  - [ ] Datos personales
  - [ ] Editar perfil
  - [ ] Dirección predeterminada
  - [ ] Cambiar contraseña
  - [ ] Logout

- [ ] Autenticación
  - [ ] Login
  - [ ] Registro
  - [ ] Recuperación contraseña

**Pantallas Admin**:
- [ ] Dashboard
  - [ ] Resumen de ventas
  - [ ] Últimas órdenes
  - [ ] Stock bajo

- [ ] Productos
  - [ ] Listar productos
  - [ ] Crear producto
  - [ ] Editar producto
  - [ ] Subir imágenes (cámara/galería)
  - [ ] Comprimir imágenes automáticamente

- [ ] Ofertas
  - [ ] Toggle ofertas
  - [ ] Agregar productos
  - [ ] Establecer precios
  - [ ] Cambios en tiempo real

- [ ] Órdenes
  - [ ] Listar órdenes
  - [ ] Ver detalles
  - [ ] Cambiar estado
  - [ ] Generar tracking

**Funcionalidades**:
- [ ] Carrito persistente (Hive)
- [ ] Autenticación JWT
- [ ] Real-time updates (StreamProvider)
- [ ] Animaciones fluidas
- [ ] Manejo de errores visual
- [ ] Loading states (Shimmer)
- [ ] Compresión de imágenes
- [ ] Offline support básico

**APK/IPA**:
- [ ] Build Android release
- [ ] Build iOS release (si aplica)
- [ ] Tamaño < 100MB

**Documentación Final**:
- [ ] HITO3_COMPLETADO.md
- [ ] USER_GUIDE.md
- [ ] DEPLOYMENT.md
- [ ] TROUBLESHOOTING.md

---

## ✅ Checklist Pre-Desarrollo

### Datos Confirmados ✓
- [x] URL Supabase: `https://spzvtjybxpaxpnpfxbqv.supabase.co`
- [x] Anon Key proporcionada
- [x] Schema SQL completo disponible
- [x] Bucket Storage: `products-images`
- [x] 6 usuarios de ejemplo
- [x] 8 categorías
- [x] 4 marcas
- [x] 6 productos de ejemplo
- [x] Paleta de colores confirmada (Tailwind)
- [x] Tipografía: Playfair Display + Inter

### Funcionalidades Confirmadas ✓
- [x] Login: Email/contraseña
- [x] Carrito: Sistema de reservas (10 minutos)
- [x] Checkout: Stripe integrado
- [x] Admin: Panel completo
- [x] Favoritos: Lista de deseos
- [x] Ofertas: Control real-time
- [x] Imágenes: Subida desde app

### Requisitos No-Funcionales
- [x] Android: 8.0+ (API 26+)
- [x] iOS: 11.0+
- [x] Performance: 30fps mínimo, 60fps objetivo
- [x] Tamaño APK: < 100MB
- [x] Offline: Carrito local con Hive

---

## 📚 Referencias & Documentación

### Documentos del Proyecto
- [astro.config.mjs](astro.config.mjs) - Configuración web
- [supabase/schema.sql](supabase/schema.sql) - SQL completo
- [tailwind.config.mjs](tailwind.config.mjs) - Paleta y tema
- [package.json](package.json) - Dependencias web

### Enlaces Útiles
- [Flutter Official Docs](https://flutter.dev/docs)
- [Riverpod Documentation](https://riverpod.dev)
- [Supabase Flutter Docs](https://supabase.com/docs/reference/dart)
- [Clean Architecture in Flutter](https://codewithandrea.com/articles/flutter-clean-architecture/)
- [Freezed Package](https://pub.dev/packages/freezed)
- [Hive Database](https://docs.hivedb.dev/)

---

## 🚀 Próximos Pasos

1. **Crear proyecto Flutter**
   ```bash
   flutter create fashionstore_flutter
   cd fashionstore_flutter
   ```

2. **Configurar Supabase**
   ```bash
   flutter pub add supabase_flutter
   ```

3. **Configurar dependencias**
   ```bash
   flutter pub get
   flutter pub add freezed_annotation json_annotation riverpod
   flutter pub add --dev build_runner freezed json_serializable
   ```

4. **Crear estructura de carpetas**
   - Ver sección "Estructura de Carpetas" arriba

5. **Implementar HITO 2**
   - Modelos Freezed
   - DataSources
   - Repositories
   - Providers básicos

6. **Testing**
   - Conectar app a Supabase
   - Cargar productos
   - Verificar autenticación

---

## 💬 Notas Importantes

### Precios en la BD
- Los precios están almacenados en **centavos** (INTEGER)
- €19.99 = 1999 en BD
- Conversión: `precio / 100.0` para mostrar

### Sistema de Carrito
- USA **reservas de 10 minutos**
- Cuando se añade un producto, se descuenta del `stock_total`
- Si expira la reserva, se restaura automáticamente
- Ver: [CART_RESERVATIONS.sql](CART_RESERVATIONS.sql)

### Imágenes
- Storage bucket: `products-images`
- URLs públicas (lectura)
- Subida protegida (solo autenticados)
- Comprimir a max 500KB
- Soportados: JPG, PNG, WebP

### Real-time
- Supabase Realtime activo
- StreamProvider para ofertas
- Cambios reflejados sin recargar

### Seguridad
- Row Level Security (RLS) habilitado en productos
- Solo productos `activo = TRUE` visibles
- Usuarios pueden ver solo sus datos

---

**Última actualización**: 19 de enero de 2026  
**Versión**: 1.0 FINAL  
**Estado**: ✅ Ready for HITO 2 Development

**Desarrollador**: [Tu nombre]  
**Equipo**: FashionStore Development Team  
**Proyecto**: FASHIONSTORE - E-commerce Premium

---

¡Listo para comenzar el desarrollo de la app Flutter! 🎯📱✨
