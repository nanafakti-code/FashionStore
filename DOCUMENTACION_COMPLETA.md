# 📄 Memoria Técnica y Documentación: FashionStore E-commerce

## 1. Introducción
**FashionStore** es una plataforma de comercio electrónico de vanguardia diseñada para ofrecer una experiencia de compra prémium, rápida y segura. El proyecto ha sido desarrollado como parte del módulo de **Sistemas de Gestión Empresarial (SGE)**, integrando tecnologías modernas de renderizado, gestión de bases de datos relacionales y pasarelas de pago de estándar industrial.

---

## 2. Arquitectura de Software

La aplicación utiliza un enfoque de **Desarrollo Web Moderno Híbrido**, apoyándose en las siguientes tecnologías:

### 2.1. Framework: Astro 5.0
Se ha seleccionado **Astro** por su innovadora **Arquitectura de Islas**. Esto permite que la mayoría del sitio se entregue como HTML estático, cargando JavaScript de forma selectiva solo para componentes interactivos (Islands).
*   **Modo Híbrido:** Combinación de SSG (Static Site Generation) para el catálogo y SEO, y SSR (Server-Side Rendering) para el área de cliente y administración.

### 2.2. Frontend & Estética
*   **Preact:** Utilizado para la interactividad de las islas por su ligereza y compatibilidad con React.
*   **Tailwind CSS:** Sistema de diseño basado en utilidades con una paleta personalizada "Modern Colorful" (Azul Celeste, Rosa Coral, Naranja Cálido).
*   **Nano Stores:** Gestión de estado compartida ultra-ligera y agnóstica al framework para el carrito de compras.

### 2.3. Backend & Persistencia: Supabase
*   **PostgreSQL:** Base de datos relacional robusta.
*   **RLS (Row Level Security):** Seguridad a nivel de fila para garantizar que cada usuario solo acceda a sus propios datos.
*   **RPC (Remote Procedure Calls):** Lógica de negocio crítica (como la gestión de stock) ejecutada directamente en el servidor para garantizar atomicidad.

---

## 3. Módulos del Sistema

### 3.1. Tienda Pública (Storefront)
*   **Buscador en Tiempo Real:** Implementado con técnicas de *debouncing* para búsquedas eficientes.
*   **Fichas de Producto Dinámicas:** Soporte completo para variantes (tallas, colores) y visualización de galerías.
*   **Sistema de Reseñas:** Los clientes pueden calificar y comentar productos, aumentando la confianza de la comunidad.
*   **Carrito de Compra Inteligente:** Persistencia automática en el navegador y sincronización con la base de datos para usuarios registrados.

### 3.2. Proceso de Checkout y Pagos
*   **Integración con Stripe:** Procesamiento de pagos seguro que cumple con la normativa PCI.
*   **Atomicidad de Stock:** Al tramitar un pedido, el sistema ejecuta una función atómica en la base de datos que descuenta el stock, evitando errores de inventario por compras simultáneas.

### 3.3. Área de Cliente
*   **Historial de Pedidos:** Seguimiento detallado del estado de las compras.
*   **Gestión de Devoluciones:** Interfaz para solicitar devoluciones con flujo de aprobación automatizado.
*   **Perfil de Usuario:** Gestión de direcciones y datos personales.

---

## 4. Panel de Administración (Backoffice)

El panel de control permite una gestión integral del negocio:
*   **Dashboard de KPIs:** Visualización de métricas clave como ventas mensuales, productos más vendidos y pedidos pendientes.
*   **Gestión de Inventario:** CRUD (Creación, Lectura, Actualización, Borrado) completo de productos, imágenes y variantes.
*   **Logística:** Control de estados de pedido (Procesando, Enviado, Entregado).
*   **Marketing:** Sistema de cupones y descuentos con reglas de validación (fechas, compra mínima, etc.).
*   **Facturación:** Generación automática de **Facturas PDF** profesionales utilizando la librería jsPDF.

---

## 5. Optimización y SEO

*   **Rendimiento:** Puntuaciones altas en Core Web Vitals gracias al pre-renderizado de Astro.
*   **SEO Técnico:** Generación automática de `sitemap-index.xml` y configuración manual de `robots.txt` para una indexación perfecta en buscadores.
*   **Imágenes Optimizadas:** Uso de transformaciones en servidor para entregar tamaños adecuados a cada dispositivo.

---

## 6. Seguridad y Cumplimiento

1.  **Protección de Datos:** Implementación de políticas RLS en Supabase para proteger la privacidad del usuario.
2.  **Validación de Sesiones:** Middleware de protección para rutas de administración.
3.  **Hiding de Credenciales:** Uso de variables de entorno (`.env`) y configuraciones de seguridad en servidores de producción (Coolify).

---

## 7. Conclusión

**FashionStore** representa una solución e-commerce completa que equilibra la estética visual con la robustez técnica. La combinación de Astro y Supabase proporciona una base escalable y de alto rendimiento lista para entornos de producción reales.

---
*Documentación generada para el Proyecto Final de 2DAM - Sistemas de Gestión Empresarial.*
W