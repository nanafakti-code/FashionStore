# 🔧 Configuración y Próximas Fases

## 📋 Estado Actual

### ✅ Implementado
- [x] Autenticación básica
- [x] Login page
- [x] Dashboard protegido
- [x] CRUD de productos
- [x] Almacenamiento en localStorage
- [x] Sesiones con expiración
- [x] Cookies HttpOnly
- [x] Validación de formularios
- [x] Interfaz responsive

---

## 🎯 Roadmap Completo

### Fase 1: Producción Ready (Ahora)
**Estimado**: 2-3 días

#### Seguridad Mejorada
```typescript
// Cambios necesarios en admin-auth.ts
- Implementar bcrypt/argon2 para hashing
- Usar variables de entorno para credenciales
- Añadir rate limiting en login
- Implementar logging de intentos fallidos
```

#### Ejemplo:
```typescript
import bcrypt from 'bcrypt';

// Antes: validateAdminCredentials(user, pass)
// Después: 
const storedHash = process.env.ADMIN_PASSWORD_HASH;
const isValid = await bcrypt.compare(pass, storedHash);
```

#### Variables de Entorno
```bash
# .env
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2b$10$... # bcrypt hash
ADMIN_SESSION_SECRET=your-secret-key
ADMIN_SESSION_DURATION=86400 # 24 horas
```

---

### Fase 2: Base de Datos (Semana 1)
**Estimado**: 3-5 días

#### Opción A: Supabase (Recomendado)
```typescript
// src/lib/supabase.ts (ya existe)
// Añadir tabla: admin_users
// Añadir tabla: admin_products (reemplazar localStorage)
// Añadir tabla: admin_sessions

interface AdminUser {
  id: string;
  username: string;
  password_hash: string;
  email: string;
  role: 'admin' | 'moderator';
  last_login?: Date;
  is_active: boolean;
  created_at: Date;
}

interface AdminProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  image_url?: string;
  stock: number;
  created_at: Date;
  updated_at: Date;
  created_by: string; // FK admin_users
}

interface AdminSession {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
}
```

#### Opción B: Astro DB
```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const adminProducts = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    price: z.number(),
    category: z.string(),
    stock: z.number(),
    createdAt: z.date(),
  }),
});
```

#### Opción C: MongoDB
```typescript
// Instalar: npm install mongodb
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db('fashionstore');
const products = db.collection('admin_products');
```

---

### Fase 3: Autenticación Avanzada (Semana 2)
**Estimado**: 2-3 días

#### Lucia Auth Integration
```typescript
// npm install lucia @lucia-auth/astro
import { Lucia } from 'lucia';
import { AstroSession } from '@lucia-auth/astro';

export const lucia = new Lucia(adapter, {
  sessionExpiresIn: 1000 * 60 * 60 * 24, // 24h
  attributes: {
    userId: 'user_id',
    username: 'username',
    role: 'role',
  },
});
```

#### OAuth (Google/GitHub)
```typescript
// npm install arctic
import { Google } from 'arctic';

export const google = new Google(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  'http://localhost:4323/auth/google/callback'
);
```

#### 2FA (Two-Factor Authentication)
```typescript
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

const secret = speakeasy.generateSecret({
  name: 'FashionStore Admin'
});

const qrCode = await QRCode.toDataURL(secret.otpauth_url);
```

---

### Fase 4: Funcionalidades Avanzadas (Semana 3-4)
**Estimado**: 4-5 días

#### Roles y Permisos
```typescript
interface AdminUser {
  id: string;
  role: 'superadmin' | 'admin' | 'moderator' | 'viewer';
}

type Permission = 
  | 'products:create'
  | 'products:read'
  | 'products:update'
  | 'products:delete'
  | 'users:manage'
  | 'reports:view'
  | 'settings:edit';

const rolePermissions: Record<string, Permission[]> = {
  superadmin: ['*'], // All permissions
  admin: ['products:*', 'users:manage', 'reports:view'],
  moderator: ['products:read', 'products:update'],
  viewer: ['products:read'],
};
```

#### Auditoría y Logging
```typescript
interface AuditLog {
  id: string;
  user_id: string;
  action: 'create' | 'update' | 'delete' | 'login' | 'logout';
  table: string;
  record_id: string;
  old_values?: Record<string, any>;
  new_values: Record<string, any>;
  timestamp: Date;
  ip_address: string;
}

// Middleware para logging
export const auditMiddleware = async (event: AstroMiddleware) => {
  const { request } = event;
  // Log action
  await db.auditLogs.insertOne({
    user_id: userId,
    action: 'create',
    table: 'admin_products',
    new_values: { name: '...', price: 99.99 },
    timestamp: new Date(),
    ip_address: request.headers.get('x-forwarded-for') || '',
  });
};
```

#### Dashboard Analytics
```typescript
interface DashboardStats {
  totalProducts: number;
  totalRevenue: number;
  activeOrders: number;
  totalUsers: number;
  productsByCategory: Record<string, number>;
  revenueByDay: Record<string, number>;
  topProducts: Product[];
  recentOrders: Order[];
}

// Componente: src/components/islands/AdminAnalytics.tsx
export default function AdminAnalytics({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="Productos" value={stats.totalProducts} />
      <StatCard title="Ingresos" value={`${stats.totalRevenue}€`} />
      <StatCard title="Órdenes" value={stats.activeOrders} />
      <StatCard title="Usuarios" value={stats.totalUsers} />
    </div>
  );
}
```

---

## 🚀 Plan de Migración

### Paso 1: Preparación
```bash
# 1. Crear rama de desarrollo
git checkout -b feature/admin-production

# 2. Instalar dependencias nuevas
npm install bcrypt lucia @lucia-auth/astro arctic speakeasy qrcode

# 3. Crear archivos de configuración
cp .env.example .env
```

### Paso 2: Implementación Seguridad
```bash
# 1. Actualizar admin-auth.ts con bcrypt
# 2. Crear .env con variables
# 3. Testear login con credenciales hasheadas
```

### Paso 3: Base de Datos
```bash
# 1. Crear tablas en Supabase
# 2. Migrar datos de localStorage a DB
# 3. Actualizar AdminCRUD.tsx para usar API
```

### Paso 4: Testing
```bash
# 1. Test login
# 2. Test CRUD
# 3. Test protección de rutas
# 4. Test expiración de sesión
# 5. Test concurrencia
```

### Paso 5: Deployment
```bash
# 1. Build para producción
npm run build

# 2. Verificar con preview
npm run preview

# 3. Deploy a hosting
# vercel deploy / netlify deploy / cloudflare pages
```

---

## 📊 Comparativa de Opciones

### Bases de Datos

| Característica | Supabase | Astro DB | MongoDB |
|---|---|---|---|
| **Configuración** | Fácil | Muy Fácil | Media |
| **Costo** | Gratis (límites) | Gratis | Gratis/Pago |
| **Escalabilidad** | Excelente | Buena | Excelente |
| **Sincronización Real-time** | Sí | No | No |
| **Seguridad** | Excelente | Buena | Buena |
| **Preferencia** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |

### Autenticación

| Característica | Lucia | NextAuth | Auth0 |
|---|---|---|---|
| **Setup** | Media | Media | Fácil |
| **Customización** | Excelente | Buena | Limitada |
| **Costo** | Gratis | Gratis | Pago |
| **2FA** | Manual | Manual | Incluido |
| **Preferencia** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## 🔐 Checklist de Seguridad

### Antes de Producción
- [ ] Contraseñas con bcrypt/argon2
- [ ] Variables de entorno configuradas
- [ ] HTTPS habilitado
- [ ] CSRF tokens en formularios
- [ ] Rate limiting en login
- [ ] Sanitización de inputs
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CORS configurado
- [ ] Headers de seguridad (CSP, HSTS, etc)

### En Producción
- [ ] Backups diarios
- [ ] Monitoring de logs
- [ ] Alertas de errores
- [ ] 2FA habilitado
- [ ] Auditoría completa
- [ ] Política de contraseñas
- [ ] Rotación de secrets
- [ ] WAF (Web Application Firewall)
- [ ] DDoS protection
- [ ] Incident response plan

---

## 📚 Referencias Útiles

### Documentación
- [Astro Docs](https://docs.astro.build)
- [Lucia Auth](https://lucia-auth.com)
- [Supabase](https://supabase.com/docs)
- [Bcrypt.js](https://github.com/dcodeIO/bcrypt.js)
- [OWASP Auth Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

### Tutoriales
- Implementing 2FA
- OAuth2 Flow
- Role-Based Access Control (RBAC)
- API Rate Limiting

### Herramientas
- Postman (API testing)
- SQLPad (Database UI)
- JWT.io (Token decoding)
- OWASP ZAP (Security scanning)

---

## 💡 Tips y Buenas Prácticas

### 1. Environment Variables
```bash
# .env.example
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=...
JWT_SECRET=...
DATABASE_URL=...
```

### 2. Middleware Pattern
```typescript
// src/middleware.ts
export const onRequest = defineMiddleware(async (context, next) => {
  // Check authentication
  const admin = await checkAdmin(context);
  
  if (!admin && context.url.pathname.includes('/admin/')) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  return next();
});
```

### 3. Error Handling
```typescript
try {
  // Database operation
} catch (error) {
  if (error instanceof DatabaseError) {
    // Handle DB error
    logger.error('Database error', { error });
    return new Response('Database error', { status: 500 });
  }
  
  throw error;
}
```

### 4. Testing
```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Security scan
npm audit
```

---

## 🎓 Recursos de Aprendizaje

1. **Autenticación Web**
   - Sesiones vs JWT
   - OAuth 2.0
   - SAML

2. **Seguridad**
   - OWASP Top 10
   - SQL Injection Prevention
   - XSS Prevention
   - CSRF Protection

3. **Bases de Datos**
   - Normalización
   - Indexing
   - Query Optimization

---

**Última actualización**: 9 de enero de 2026  
**Versión**: 1.0  
**Mantenimiento**: Equipo de Desarrollo FashionStore
