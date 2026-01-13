// Credenciales de Administrador
// ==============================

/**
 * Usar estas credenciales para acceder al panel de administración
 * Ubicación: /admin-secret-login
 */

Email (Usuario): admin@fashionstore.com
Contraseña: 1234

// IMPORTANTE: En producción, cambiar estas credenciales por valores seguros


// CARACTERÍSTICAS DEL PANEL DE ADMINISTRACIÓN
// =============================================

1. ✅ VISUALIZAR PRODUCTOS
   - Tabla completa de productos con todos los detalles
   - Información en tiempo real desde la base de datos
   - Stock, precio y estado de cada producto

2. ✅ AÑADIR PRODUCTOS
   - Crear nuevos productos desde el formulario
   - Rellenar nombre, precio, descripción y stock
   - Se guardan automáticamente en Supabase

3. ✅ EDITAR PRODUCTOS
   - Click en "Editar" en cualquier producto
   - Modificar nombre, precio, descripción y stock
   - Los cambios se actualizan en tiempo real

4. ✅ ELIMINAR PRODUCTOS
   - Click en "Eliminar" para desactivar un producto
   - Los productos se marcan como inactivos (no se borran)
   - Se pueden reactivar fácilmente

5. 📊 ESTADÍSTICAS
   - Total de productos en inventario
   - Stock total disponible
   - Valor total del inventario
   - Productos activos


// FLUJO DE AUTENTICACIÓN
// =======================

1. Usuario va a: /admin-secret-login
2. Ingresa email: admin@fashionstore.com
3. Ingresa contraseña: 1234
4. Sistema crea token de sesión (cookie HTTPOnly)
5. Redirige automáticamente a: /admin/dashboard
6. Panel cargado y protegido


// SEGURIDAD
// =========

✅ Páginas protegidas con verificación de token
✅ Cookies HTTPOnly no accesibles desde JavaScript
✅ Sesión expira en 24 horas automáticamente
✅ SameSite=Strict para prevenir CSRF
✅ Datos almacenados en Supabase (base de datos segura)


// API ENDPOINTS
// =============

GET  /api/admin/productos
     - Obtener todos los productos activos

POST /api/admin/productos
     - Crear un nuevo producto
     - Body: { nombre, precio_venta, descripcion, stock_total }

PUT  /api/admin/productos/[id]
     - Actualizar un producto
     - Body: { nombre, precio_venta, descripcion, stock_total }

DELETE /api/admin/productos/[id]
       - Eliminar (desactivar) un producto


// ESTRUCTURA DE DATOS - PRODUCTO
// ===============================

{
  id: UUID,
  nombre: string,
  precio_venta: number (en céntimos, ej: 8999 = €89.99),
  descripcion: string,
  stock_total: number,
  activo: boolean,
  creado_en: timestamp,
  actualizado_en: timestamp
}


// PRÓXIMAS MEJORAS SUGERIDAS
// ===========================

1. Integración con múltiples admins
2. Auditoría de cambios (quién modificó qué y cuándo)
3. Cambio de contraseña del admin
4. Importar/Exportar productos (CSV)
5. Gestión de imágenes de productos
6. Búsqueda y filtros avanzados
7. Historial de inventario
8. Alertas de stock bajo
9. Roles de usuario (admin, editor, visualizador)
10. Recuperación de productos eliminados
