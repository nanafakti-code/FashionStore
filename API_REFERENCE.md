# 🔌 API Endpoints Reference

## 📡 Endpoints (Para Futuros Desarrollos)

Estos endpoints están **planificados** pero aún no implementados. Se crearán en la siguiente fase usando Astro's API routes.

---

## 🔐 Autenticación

### POST `/api/admin/auth/login`
**Login con credenciales**

**Request:**
```json
{
  "username": "admin",
  "password": "FashionStore2026!"
}
```

**Response (200):**
```json
{
  "success": true,
  "sessionId": "session_123abc",
  "expiresAt": "2026-01-10T12:00:00Z",
  "user": {
    "id": "user_1",
    "username": "admin",
    "role": "admin"
  }
}
```

**Response (401):**
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

---

### POST `/api/admin/auth/logout`
**Cerrar sesión**

**Headers:**
```
Authorization: Bearer {sessionId}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### POST `/api/admin/auth/refresh`
**Renovar sesión expirada**

**Request:**
```json
{
  "refreshToken": "refresh_123abc"
}
```

**Response (200):**
```json
{
  "sessionId": "session_new123",
  "expiresAt": "2026-01-10T12:00:00Z"
}
```

---

## 📦 Productos (CRUD)

### GET `/api/admin/products`
**Obtener todos los productos**

**Query Parameters:**
```
?page=1
&limit=10
&category=moviles
&sort=price_asc
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "prod_1",
      "name": "iPhone 13",
      "price": 799.99,
      "category": "moviles",
      "stock": 15,
      "image": "https://...",
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-05T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

---

### GET `/api/admin/products/:id`
**Obtener producto específico**

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "prod_1",
    "name": "iPhone 13",
    "price": 799.99,
    "category": "moviles",
    "description": "...",
    "stock": 15,
    "images": ["https://..."],
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-01-05T10:30:00Z",
    "createdBy": "user_1"
  }
}
```

---

### POST `/api/admin/products`
**Crear nuevo producto**

**Headers:**
```
Authorization: Bearer {sessionId}
Content-Type: application/json
```

**Request:**
```json
{
  "name": "Samsung Galaxy S25",
  "price": 899.99,
  "category": "moviles",
  "description": "Flagship Samsung phone",
  "stock": 25,
  "image": "https://..."
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "id": "prod_123",
    "name": "Samsung Galaxy S25",
    "price": 899.99,
    "category": "moviles",
    "createdAt": "2026-01-09T15:30:00Z"
  }
}
```

**Response (400):**
```json
{
  "success": false,
  "error": "Invalid product data",
  "details": {
    "name": "Name is required",
    "price": "Price must be a positive number"
  }
}
```

---

### PUT `/api/admin/products/:id`
**Actualizar producto**

**Headers:**
```
Authorization: Bearer {sessionId}
Content-Type: application/json
```

**Request:**
```json
{
  "name": "Samsung Galaxy S25",
  "price": 849.99,
  "stock": 20
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    "id": "prod_123",
    "name": "Samsung Galaxy S25",
    "price": 849.99,
    "stock": 20,
    "updatedAt": "2026-01-09T16:45:00Z"
  }
}
```

---

### DELETE `/api/admin/products/:id`
**Eliminar producto**

**Headers:**
```
Authorization: Bearer {sessionId}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Product deleted successfully",
  "data": {
    "id": "prod_123",
    "name": "Samsung Galaxy S25"
  }
}
```

**Response (404):**
```json
{
  "success": false,
  "error": "Product not found"
}
```

---

## 👥 Usuarios (Admin Only)

### GET `/api/admin/users`
**Obtener lista de usuarios** *(Solo superadmin)*

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "user_1",
      "username": "admin",
      "email": "admin@fashionstore.com",
      "role": "superadmin",
      "lastLogin": "2026-01-09T14:30:00Z",
      "createdAt": "2025-12-01T00:00:00Z"
    }
  ]
}
```

---

### POST `/api/admin/users`
**Crear nuevo usuario** *(Solo superadmin)*

**Request:**
```json
{
  "username": "moderator",
  "email": "mod@fashionstore.com",
  "password": "SecurePass123!",
  "role": "moderator"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "user_2",
    "username": "moderator",
    "email": "mod@fashionstore.com",
    "role": "moderator"
  }
}
```

---

### PUT `/api/admin/users/:id`
**Actualizar usuario**

**Request:**
```json
{
  "email": "newemail@example.com",
  "role": "admin"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "User updated successfully"
}
```

---

### DELETE `/api/admin/users/:id`
**Eliminar usuario** *(Solo superadmin)*

**Response (200):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

## 📊 Estadísticas y Reportes

### GET `/api/admin/stats/overview`
**Estadísticas generales del dashboard**

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalProducts": 150,
    "totalCategories": 8,
    "totalInventoryValue": 45230.50,
    "productsAddedToday": 5,
    "productsAddedThisMonth": 45,
    "averageProductPrice": 301.54
  }
}
```

---

### GET `/api/admin/stats/products`
**Estadísticas de productos**

**Query Parameters:**
```
?period=month
&category=moviles
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "byCategory": {
      "moviles": 45,
      "portatiles": 30,
      "tablets": 25
    },
    "topProducts": [
      {
        "id": "prod_1",
        "name": "iPhone 13",
        "sales": 150,
        "revenue": 119998.50
      }
    ],
    "lowStockProducts": [
      {
        "id": "prod_2",
        "name": "MacBook Pro",
        "stock": 2
      }
    ]
  }
}
```

---

### GET `/api/admin/stats/sales`
**Estadísticas de ventas** *(Futuro)*

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalSales": 450000,
    "totalOrders": 1200,
    "averageOrderValue": 375,
    "topCustomers": [],
    "salesByDay": {}
  }
}
```

---

## 📝 Auditoría y Logs

### GET `/api/admin/logs`
**Obtener logs de auditoria**

**Query Parameters:**
```
?action=delete
&user=admin
&limit=50
&startDate=2026-01-01
&endDate=2026-01-09
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "log_1",
      "user": "admin",
      "action": "create",
      "table": "products",
      "recordId": "prod_123",
      "newValues": { "name": "iPhone 13" },
      "timestamp": "2026-01-09T15:30:00Z",
      "ipAddress": "192.168.1.1"
    }
  ],
  "pagination": {
    "total": 500,
    "page": 1,
    "limit": 50
  }
}
```

---

## 🔍 Búsqueda y Filtrado

### GET `/api/admin/search`
**Búsqueda global**

**Query Parameters:**
```
?q=iphone
&type=product,user
&limit=20
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "prod_1",
        "name": "iPhone 13",
        "price": 799.99,
        "category": "moviles"
      }
    ],
    "users": []
  }
}
```

---

## ⚙️ Configuración y Settings

### GET `/api/admin/settings`
**Obtener configuración** *(Solo admin)*

**Response (200):**
```json
{
  "success": true,
  "data": {
    "siteName": "FashionStore",
    "currency": "EUR",
    "timezone": "Europe/Madrid",
    "taxRate": 0.21,
    "sessionDuration": 86400,
    "maintenanceMode": false
  }
}
```

---

### PUT `/api/admin/settings`
**Actualizar configuración** *(Solo superadmin)*

**Request:**
```json
{
  "taxRate": 0.21,
  "sessionDuration": 172800
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Settings updated successfully"
}
```

---

## 📤 Importación y Exportación

### POST `/api/admin/products/import`
**Importar productos desde CSV**

**Headers:**
```
Authorization: Bearer {sessionId}
Content-Type: multipart/form-data
```

**Form Data:**
```
file: <archivo.csv>
```

**CSV Format:**
```csv
name,price,category,stock
iPhone 13,799.99,moviles,15
MacBook Pro,1999.99,portatiles,8
iPad Air,599.99,tablets,20
```

**Response (200):**
```json
{
  "success": true,
  "message": "Products imported successfully",
  "data": {
    "imported": 3,
    "errors": 0,
    "warnings": 0
  }
}
```

---

### GET `/api/admin/products/export`
**Exportar productos como CSV/JSON**

**Query Parameters:**
```
?format=csv
&category=moviles
&includeArchived=false
```

**Response (200):**
- Content-Type: `text/csv` o `application/json`
- Body: Productos descargables

---

## 🛠️ Mantenimiento y Sistema

### POST `/api/admin/backup`
**Crear backup de base de datos** *(Solo superadmin)*

**Response (200):**
```json
{
  "success": true,
  "message": "Backup created successfully",
  "data": {
    "backupId": "backup_2026_01_09_001",
    "size": "125 MB",
    "createdAt": "2026-01-09T16:00:00Z"
  }
}
```

---

### GET `/api/admin/health`
**Estado del sistema**

**Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "database": "connected",
    "cache": "connected",
    "uptime": 864000,
    "lastCheck": "2026-01-09T16:30:00Z"
  }
}
```

---

## 📊 Códigos de Estado HTTP

| Código | Significado | Ejemplo |
|---|---|---|
| 200 | OK | GET exitoso, PUT exitoso |
| 201 | Created | POST exitoso (recurso creado) |
| 400 | Bad Request | Datos inválidos |
| 401 | Unauthorized | Sin sesión/token inválido |
| 403 | Forbidden | Permisos insuficientes |
| 404 | Not Found | Recurso no existe |
| 409 | Conflict | Duplicado/Conflicto de datos |
| 422 | Unprocessable Entity | Validación fallida |
| 429 | Too Many Requests | Rate limit excedido |
| 500 | Server Error | Error interno del servidor |
| 503 | Service Unavailable | Mantenimiento/Fuera de servicio |

---

## 🔒 Headers Comunes

### Solicitud
```
Authorization: Bearer {sessionId}
Content-Type: application/json
X-API-Version: 1.0
User-Agent: FashionStore-Admin/1.0
```

### Respuesta
```
Content-Type: application/json
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1641704400
Cache-Control: no-cache, no-store, must-revalidate
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Strict-Transport-Security: max-age=31536000
```

---

## 🔄 Rate Limiting

- **Login**: 5 intentos / 15 minutos
- **API General**: 1000 requests / hora
- **Busca**: 100 requests / minuto
- **Importación**: 10 files / hora

---

## 📚 Recursos

- [Documentación Completa](./ADMIN_PANEL_GUIDE.md)
- [Quick Start](./ADMIN_QUICK_START.md)
- [Roadmap](./ADMIN_ROADMAP.md)

---

**Nota**: Estos endpoints están planificados para futuras versiones.  
**Versión Actual**: 1.0 (UI con localStorage)  
**Próxima Versión**: 2.0 (Con API REST)

**Última actualización**: 9 de enero de 2026
