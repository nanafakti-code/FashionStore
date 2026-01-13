# ⚡ Quick Start - Panel Admin

## 🎯 Acceso Inmediato

### 1. Inicia el servidor (si no está corriendo)
```bash
npm run dev
```
URL: `http://localhost:4323`

### 2. Ve al login
```
http://localhost:4323/admin-secret-login
```

### 3. Credenciales
```
Usuario: admin
Contraseña: FashionStore2026!
```

### 4. ¡Bienvenido al Dashboard!
```
http://localhost:4323/admin/dashboard
```

---

## 📂 Archivos Clave

```
src/
├── lib/
│   └── admin-auth.ts              ← Autenticación
├── pages/
│   ├── admin-secret-login.astro   ← Login
│   └── admin/
│       ├── dashboard.astro        ← Dashboard
│       └── 403.astro              ← Error
└── components/
    └── islands/
        └── AdminCRUD.tsx          ← CRUD
```

---

## 🎮 Acciones Rápidas

### Crear Producto
1. Click en "Crear Nuevo Producto"
2. Completa el formulario
3. Click "Crear Producto"

### Editar Producto
1. Click "Editar" en la tabla
2. Modifica datos
3. Click "Actualizar"

### Eliminar Producto
1. Click "Eliminar" en la tabla
2. Confirma
3. Listo

### Logout
1. Click "Salir" (arriba a la derecha)
2. Se limpia la sesión
3. Vuelves al login

---

## 🔐 Seguridad

- ✅ Sesiones de 24 horas
- ✅ Cookies HttpOnly
- ✅ Protección de rutas
- ✅ Validación de credenciales

---

## 💾 Almacenamiento

- **Sesión**: Cookie admin_session
- **Productos**: localStorage (admin_products)

---

## ❓ Preguntas Frecuentes

**¿Olvidé la contraseña?**
- En desarrollo: `FashionStore2026!`
- En producción: Implementar "olvidé contraseña"

**¿Cuánto dura la sesión?**
- 24 horas desde el login

**¿Se pierden los productos?**
- No, se guardan en localStorage

**¿Dónde están los productos?**
- En `admin_products` en localStorage del navegador

**¿Puedo cambiar credenciales?**
- Sí, en `src/lib/admin-auth.ts` (hardcoded para demo)

---

## ✅ Test Checklist

- [ ] Login funciona
- [ ] Dashboard protegido
- [ ] Crear producto
- [ ] Ver productos
- [ ] Editar producto
- [ ] Eliminar producto
- [ ] Logout funciona
- [ ] Acceso denegado sin sesión

---

**🚀 ¡Listo para usar!**
