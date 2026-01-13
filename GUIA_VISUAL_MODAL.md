# 📱 Guía Visual: Modal de Autenticación Mejorado

## 🎯 Ubicación del Modal

El modal mejorado está disponible en dos lugares:

### 1. **Página Dedicada `/login`**
```
Acceso directo: http://localhost:3000/login
Mostrará el modal en pantalla completa
Ideal para compartir un enlace directo de login
```

### 2. **Header (Modal flotante)**
```
Click en "Iniciar sesión" en el header
Se abre el modal encima del contenido actual
Puedes cerrar con ESC o click fuera
```

---

## 🎨 Componentes Visuales

### Logo Section
```
┌──────────────────────────────────┐
│                                  │
│      FashionStore                │
│      (Store en verde)            │
│                                  │
└──────────────────────────────────┘
```

**Estilos:**
- Tamaño: 3xl
- Font-weight: 900 (black)
- "Store" en color #00aa45
- Centrado
- Margen inferior: 48px

---

### Título Principal
```
┌──────────────────────────────────┐
│                                  │
│    ¿Quién anda ahí?              │
│                                  │
└──────────────────────────────────┘
```

**Estilos:**
- Tamaño: 5xl (48px)
- Font-weight: 900 (black)
- Font-style: italic
- Centrado
- Line-height: 1.2
- Margen inferior: 40px

---

### Campo de Email
```
┌──────────────────────────────────┐
│ Correo electrónico            ✉  │
└──────────────────────────────────┘
```

**Estilos:**
- Padding: px-5 py-4
- Border: 1px solid #d3d3d3
- Border-radius: 6px
- Focus: border-color cambio a #000
- Icono: ✉ en la derecha
- Placeholder: gris suave
- Margen inferior: 24px

---

### Botón Continuar
```
┌──────────────────────────────────┐
│    ■ ■ ■ Continuar ■ ■ ■         │
└──────────────────────────────────┘
```

**Estilos:**
- Fondo: #000 (negro)
- Texto: blanco
- Padding: py-4 (16px vertical)
- Ancho: 100%
- Font-weight: 600
- Border-radius: 6px
- Hover: bg-gray-900
- Transición: 200ms
- Margen inferior: 32px

---

### Divisor
```
    ──────────── o ────────────
```

**Estilos:**
- Flex row con items centrados
- Líneas: 1px solid #d3d3d3
- Texto "o": color #999, px-4
- Margen: my-8

---

### Botones Sociales

#### Google
```
┌──────────────────────────────────┐
│  🔵  Continuar con Google        │
└──────────────────────────────────┘
```

**Estilos:**
- Fondo: white
- Border: 1px solid #d3d3d3
- Texto: negro
- Padding: py-4
- Gap con icono: 12px
- Hover: bg-gray-50
- Margen inferior: 16px

#### Apple
```
┌──────────────────────────────────┐
│  🍎  Continuar con Apple         │
└──────────────────────────────────┘
```

**Estilos:**
- Fondo: #000 (negro)
- Texto: blanco
- Padding: py-4
- Gap con icono: 12px
- Hover: bg-gray-900
- Margen inferior: 0px

---

### Footer
```
Política de confidencialidad
```

**Estilos:**
- Tamaño: sm (14px)
- Color: #999
- Centrado
- Link underline on hover
- Margen superior: 16px

---

## 🎬 Comportamiento

### Apertura
```
Usuario hace click en "Iniciar sesión"
         ↓
Modal aparece con fade-in
         ↓
Overlay semi-transparente
         ↓
Modal centrado en pantalla
```

### Cierre
```
Click en botón ✕
     O
Click fuera del modal (overlay)
     O
Tecla ESC (si está implementado)
         ↓
Modal desaparece
         ↓
Vuelve a página anterior
```

### Interacción
```
Usuario ingresa email
         ↓
Click en "Continuar"
         ↓
O
         ↓
Click en "Continuar con Google"
         ↓
Redirige a Google OAuth
         ↓
O
         ↓
Click en "Continuar con Apple"
         ↓
Redirige a Apple OAuth
```

---

## 📐 Dimensiones

```
Modal Width:        max-w-md (448px)
Modal Padding:      px-6 py-12
Logo Size:          text-3xl
Title Size:         text-5xl
Button Height:      py-4 (16px vertical)
Input Height:       py-4 (16px vertical)
Border Radius:      rounded-lg (6px)
Overlay Backdrop:   blur-sm
```

---

## 🎯 Estados de Botones

### Hover State
```
Google:  bg-gray-50 (background claro)
Apple:   bg-gray-900 (oscurecer negro)
Primary: Mismo fondo, cursor pointer
```

### Disabled State
```
Opacidad: 50%
Cursor: not-allowed
No responde a clicks
```

### Loading State
```
Texto: "Cargando..." 
Disabled: true
Opacidad: 50%
```

---

## 📱 Responsive Behavior

### Desktop (lg ≥ 1024px)
```
├─ Modal ancho: 448px (max-w-md)
├─ Centrado en pantalla (fixed)
├─ Botones grandes y espaciosos
└─ Tipografía completa
```

### Tablet (md 768px - 1023px)
```
├─ Modal ancho: 448px
├─ Margen horizontal: 16px (mx-4)
├─ Centrado verticalmente
└─ Igual que desktop
```

### Mobile (< 768px)
```
├─ Modal ancho: 100% - 32px (mx-4)
├─ Margen horizontal: 16px
├─ Botones ocupan ancho completo
├─ Tipografía reducida
└─ Padding: py-12
```

---

## 🔄 Flujo de Autenticación

```
┌─────────────────────────────────┐
│  Usuario abre /login o hace     │
│  click en "Iniciar sesión"      │
└────────────────┬────────────────┘
                 ↓
        ┌────────────────────┐
        │ Modal aparece      │
        │ - Logo visible     │
        │ - Título centrado  │
        │ - Email input      │
        │ - Botones claros   │
        └────────────┬───────┘
                     ↓
      ┌──────────────────────────────┐
      │  Usuario elige opción:       │
      │  ├─ Continuar (email)        │
      │  ├─ Google OAuth             │
      │  └─ Apple OAuth              │
      └──────────────┬───────────────┘
                     ↓
      ┌──────────────────────────────┐
      │  Supabase procesa login      │
      │  - Crea sesión               │
      │  - Crea usuario (si nuevo)   │
      │  - Genera JWT                │
      └──────────────┬───────────────┘
                     ↓
      ┌──────────────────────────────┐
      │  Redirige a home (/)         │
      │  - Modal se cierra           │
      │  - UserMenu se actualiza     │
      │  - Muestra perfil del usuario│
      └──────────────────────────────┘
```

---

## 🎨 Paleta de Colores

| Color | Hex | Uso |
|-------|-----|-----|
| Blanco | #FFFFFF | Fondo modal, inputs |
| Negro | #000000 | Texto, botones Apple |
| Gris | #666666 | Texto secundario |
| Gris Claro | #D3D3D3 | Bordes inputs |
| Gris Fondo | #F5F5F7 | Background página |
| Verde | #00AA45 | Acento (Store en logo) |

---

## 🔤 Tipografía

```
Familia: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto...

Estilos:
├─ font-black (900) + italic → Título "¿Quién anda ahí?"
├─ font-black (900) → Logo "FashionStore"
├─ font-semibold (600) → Botones
├─ font-medium (500) → Texto secundario
└─ font-normal (400) → Inputs, placeholder
```

---

## ✅ Checklist de Verificación

```
[✓] Modal abre al click en "Iniciar sesión"
[✓] Logo FashionStore visible
[✓] Título "¿Quién anda ahí?" en 5xl italic
[✓] Input de email funcional
[✓] Botón "Continuar" negro
[✓] Divisor elegante con "o"
[✓] Botón Google con icono azul
[✓] Botón Apple con icono blanco
[✓] Footer con política de privacidad
[✓] Cerrar con ✕ en esquina
[✓] Respuesta en todos los dispositivos
[✓] Overlay blanco/95 con blur
[✓] Sin bordes redondeados
[✓] Sin shadow prominente
```

---

## 🚀 URLs de Acceso

```
Página de login:     /login
Callback OAuth:      /auth/callback
Test de auth:        /test-auth
Header modal:        Haz click en "Iniciar sesión"
```

---

## 📞 Soporte

Si el modal no se ve correctamente:

1. Asegúrate de que Astro está compilando sin errores
2. Revisa que `LoginModal.tsx` está importado correctamente
3. Verifica que Tailwind CSS está procesando los archivos
4. Limpia la caché del navegador (Ctrl+Shift+Delete)
5. Recarga la página (F5)

---

**Última actualización:** 9 de enero de 2026
**Versión:** 1.0 Estable
**Navegador compatible:** Todos los modernos
