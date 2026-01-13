# 🛍️ Tutorial Visual - Usar el Carrito de FashionStore

## Paso 1: Acceder a la Tienda

1. Abre tu navegador
2. Ve a `http://localhost:4323/`
3. Verás la página de inicio de FashionStore

**¿Qué verás?**
- Logo de FashionStore en la esquina superior izquierda
- Menú con 10 categorías
- Icono de carrito en la esquina superior derecha (mostrará 0)
- Sección de "Más Vendidos" con productos destacados

---

## Paso 2: Seleccionar un Producto

### Opción A: Desde Categoría
1. Haz clic en "Móviles" en el menú
2. Verás 3 productos de móviles
3. Elige cualquiera

### Opción B: Desde Inicio
1. En la página de inicio, verás "Más Vendidos"
2. Elige cualquier producto

**¿Qué verás en cada producto?**
```
┌─────────────────────────────┐
│      [IMAGEN PRODUCTO]      │
├─────────────────────────────┤
│ iPhone 13                   │
│ ★★★★★ (5 estrellas)       │
│ €799,99  (Ahorro: €100)    │
│ Aspecto excelente          │
│ ┌───────────────────────┐  │
│ │ Añadir al carrito     │  │ ← BOTÓN
│ └───────────────────────┘  │
└─────────────────────────────┘
```

---

## Paso 3: Añadir Producto al Carrito

1. Haz clic en el botón **"Añadir al carrito"**
2. El botón cambiará a color **verde** y mostrará **"✓ Añadido al carrito"**
3. Después de 2 segundos, vuelve al estado normal

**¿Qué pasa?**
- El producto se guarda en el navegador
- El contador del carrito sube de 0 a 1
- El icono del carrito muestra un badge rojo con el número 1

```
ANTES:          DURANTE:           DESPUÉS:
[Carrito] 0     [Carrito] 0        [Carrito] 1
                (botón verde)      
```

---

## Paso 4: Ir al Carrito

### Opción 1: Haz clic en el Icono del Carrito
- Esquina superior derecha
- Icono de carrito
- Badge verde con número (ej: "1")

### Opción 2: Escribe la URL
- `http://localhost:4323/carrito`

**¿Qué verás?**
```
┌─────────────────────────────────────────────┐
│ Carrito                                     │
├─────────────────────────────────────────────┤
│                                             │
│ PRODUCTO    │ PRECIO │ CANTIDAD │ TOTAL    │
│─────────────┼────────┼──────────┼──────────┤
│ [Img]       │ €799   │    1     │ €799     │
│ iPhone 13   │        │  [↓ ↑]   │          │
│             │        │ [Eliminar]          │
│─────────────┼────────┼──────────┼──────────┤
│ TOTAL: €799,99                            │
│ [Tramitar Pedido]                         │
└─────────────────────────────────────────────┘
```

---

## Paso 5: Gestionar el Carrito

### Cambiar Cantidad

1. En la columna "CANTIDAD", verás un campo de número
2. Haz clic en el campo
3. Escribe una cantidad nueva (ej: 3)
4. Presiona Enter
5. El total se recalcula automáticamente

**Ejemplo:**
```
Cantidad: [1] → Cambiar a [3]
Total: €799,99 → €2.399,97
```

### Eliminar Producto

1. Busca el botón **"Eliminar"** en rojo
2. Haz clic
3. El producto desaparece
4. El total se recalcula
5. El contador del carrito disminuye

---

## Paso 6: Tramitar el Pedido

1. En el carrito, haz clic en el botón **"Tramitar Pedido"**
2. Serás redirigido a `/checkout`

**¿Qué verás?**
```
┌──────────────────────────────────────────┐
│ Tramitar Pedido                          │
│ Completa los datos de entrega y pago    │
└──────────────────────────────────────────┘

[LADO IZQUIERDO]        [LADO DERECHO]
Formulario              Resumen del Pedido
- Datos personales      - iPhone 13 x1
- Dirección             - €799,99
- Método de pago        - Envío: Gratis
                        - TOTAL: €799,99
```

---

## Paso 7: Completar el Formulario

### Sección 1: Datos Personales

Rellena estos campos:
- **Nombre**: Tu nombre (ej: Juan)
- **Apellidos**: Tus apellidos (ej: García Martínez)
- **Email**: Tu correo electrónico (ej: juan@example.com)
- **Teléfono**: Tu número (ej: 612345678)

```
┌─────────────────────────────────────┐
│ Datos Personales                    │
├─────────────────────────────────────┤
│ [Nombre: ___________]               │
│ [Apellidos: ___________]            │
│ [Email: ___________]                │
│ [Teléfono: ___________]             │
└─────────────────────────────────────┘
```

### Sección 2: Dirección de Entrega

Rellena estos campos:
- **Calle y número**: Dirección completa (ej: Calle Mayor 123)
- **Ciudad**: Tu ciudad (ej: Madrid)
- **Código Postal**: Tu CP (ej: 28001)
- **País**: Selecciona de la lista (ej: España)

```
┌─────────────────────────────────────┐
│ Dirección de Entrega                │
├─────────────────────────────────────┤
│ [Calle: ___________]                │
│ [Ciudad: ___________]               │
│ [Código Postal: ___________]        │
│ [País: ▼ España]                   │
└─────────────────────────────────────┘
```

### Sección 3: Método de Pago

Selecciona una opción:

```
○ Tarjeta de Crédito/Débito
○ PayPal
○ Transferencia Bancaria
```

Haz clic en la opción que prefieras.

---

## Paso 8: Confirmar el Pedido

1. Revisa todos los datos (están rellenados)
2. Haz clic en el botón **"Confirmar Pedido"** (verde, abajo)

**¿Qué pasará?**
- Verás un mensaje de confirmación:
  ```
  ¡Pedido tramitado exitosamente!
  
  Gracias por tu compra en FashionStore.
  Te hemos enviado un email de confirmación.
  ```
- El carrito se vaciará automáticamente
- Serás redirigido a la página de inicio

---

## Paso 9: Verificar que Funcionó

1. Haz clic en el icono del carrito
2. El carrito debería estar **vacío**
3. El contador debería ser **0**
4. Deberías ver un mensaje: "Tu carrito está vacío"

```
┌─────────────────────────────────────┐
│ Carrito                             │
├─────────────────────────────────────┤
│ Tu carrito está vacío               │
│                                     │
│ [Continuar comprando]               │
└─────────────────────────────────────┘
```

---

## ✅ Checklist - Confirma que Todo Funciona

- [ ] Puedo ver productos
- [ ] Puedo hacer clic en "Añadir al carrito"
- [ ] El botón se vuelve verde después de hacer clic
- [ ] El contador del carrito aumenta
- [ ] Puedo ver el carrito haciendo clic en el icono
- [ ] El producto aparece en la tabla del carrito
- [ ] Puedo cambiar la cantidad
- [ ] El total se recalcula al cambiar cantidad
- [ ] Puedo eliminar un producto
- [ ] Puedo ir a checkout
- [ ] Puedo rellenar el formulario
- [ ] Puedo confirmar el pedido
- [ ] Recibo un mensaje de confirmación
- [ ] El carrito se vacía
- [ ] Soy redirigido a inicio

---

## 🆘 Si Algo No Funciona

### El carrito no se actualiza
**Solución:**
1. Abre DevTools (presiona F12)
2. Ve a la pestaña "Consola"
3. Escribe: `localStorage.getItem('cart')`
4. Debería mostrar los productos en JSON

### El botón "Añadir al carrito" no responde
**Solución:**
1. Abre DevTools (F12)
2. Mira la pestaña "Consola"
3. ¿Hay errores rojos?
4. Si hay errores, captura una screenshot y envía

### El formulario no valida
**Solución:**
1. Asegúrate de rellenar TODOS los campos
2. El email debe tener formato válido (@)
3. Revisa que no haya espacios extras

### Nada funciona
**Solución:**
1. Prueba en modo incógnito (Ctrl+Shift+N)
2. Limpia caché del navegador
3. Recarga la página (Ctrl+Shift+R)
4. Intenta en otro navegador

---

## 💡 Consejos Útiles

1. **Persistencia**: Los productos se guardan en el navegador. Aunque cierres la pestaña, al volver estarán ahí.

2. **Múltiples Productos**: Puedes añadir productos de diferentes categorías. Todos aparecerán en el carrito.

3. **Cantidad Cero**: No puedes pedir cantidad 0. El mínimo es 1.

4. **Precios**: Los precios están en euros (€). Aparecen con 2 decimales.

5. **Envío**: El envío es GRATIS. No se suma al total.

6. **Email Falso**: En esta versión puedes usar emails falsos (demo@example.com funciona).

---

## 🎯 Ejemplo Práctico Completo

**Prueba esta secuencia:**

1. ✅ Ve a `/categoria/moviles`
2. ✅ Añade iPhone 13 (cantidad: 1)
3. ✅ Añade Samsung S24 (cantidad: 1)
4. ✅ Vuelve a añadir iPhone 13 (cantidad debe ser 2)
5. ✅ Ve al carrito (`/carrito`)
6. ✅ Verifica que hay 2 filas (2 productos diferentes)
7. ✅ Cambia iPhone 13 a cantidad 3
8. ✅ El total debe cambiar
9. ✅ Elimina Samsung S24
10. ✅ Solo queda iPhone 13 x3
11. ✅ Haz clic en "Tramitar Pedido"
12. ✅ Completa el formulario (usa datos ficticios)
13. ✅ Haz clic en "Confirmar Pedido"
14. ✅ Deberías ver confirmación
15. ✅ Carrito debe estar vacío
16. ✅ ¡Éxito!

---

**¡Disfruta comprando en FashionStore! 🎉**

---

*Última actualización: 2024*  
*Para el proyecto: Sistema de Gestión Empresarial - FashionStore*
