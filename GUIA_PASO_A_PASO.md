# 🚀 GUÍA PASO A PASO - Activar Sistema de Reservas

## ⚠️ IMPORTANTE: Antes de empezar

El servidor está corriendo pero falta **1 paso crítico en Supabase** para que todo funcione.

---

## 📋 PASO 1: Preparar el SQL

1. Copia el siguiente código:

```sql
DROP FUNCTION IF EXISTS get_user_cart();

CREATE OR REPLACE FUNCTION get_user_cart()
RETURNS TABLE (
  id UUID,
  product_id UUID,
  product_name TEXT,
  quantity INT,
  talla TEXT,
  color TEXT,
  precio_unitario INTEGER,
  product_image TEXT,
  product_stock INT,
  expires_in_seconds INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ci.id,
    ci.product_id,
    p.nombre,
    ci.quantity,
    ci.talla,
    ci.color,
    ci.precio_unitario,
    p.imagen_principal,
    p.stock_total,
    CASE 
      WHEN cr.expires_at IS NOT NULL AND cr.expires_at > NOW() THEN 
        EXTRACT(EPOCH FROM (cr.expires_at - NOW()))::INT 
      ELSE 0 
    END as expires_in_seconds
  FROM cart_items ci
  JOIN productos p ON ci.product_id = p.id
  LEFT JOIN cart_reservations cr ON cr.user_id = auth.uid() AND cr.product_id = ci.product_id
  WHERE ci.user_id = auth.uid()
  ORDER BY ci.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🔧 PASO 2: Ejecutar en Supabase

1. **Abre Supabase:**
   - Ve a https://app.supabase.com
   - Selecciona tu proyecto FashionStore

2. **Abre SQL Editor:**
   - Click izquierdo en "SQL Editor"
   - Debería abrir un editor de texto

3. **Pega el código:**
   - Click derecho → "Pegar"
   - O Ctrl+V

4. **Ejecuta:**
   - Click en botón azul "Ejecutar" o presiona Ctrl+Enter
   - Verás una barra verde en la parte superior indicando éxito

5. **Verifica:**
   - Deberías ver un mensaje como: "Command executed successfully"

---

## ✅ PASO 3: Verificar que funciona

1. **Abre el navegador:**
   - Ve a http://localhost:4322 (o el puerto que muestre)

2. **Inicia sesión:**
   - Click en "Ayuda" → "raafablanco" (tu cuenta)
   - O ir a "/login"

3. **Agrega un producto:**
   - Ve a cualquier categoría
   - Click en "Añadir al carrito"
   - Debería decir "✓ Añadido al carrito"

4. **Verifica que NO hay countdown en productos:**
   - El botón debe estar verde
   - NO debe mostrarse "Reservado (60s)"
   - ✅ **Esto es correcto**

5. **Ve al carrito:**
   - Click en icono de carrito (arriba derecha)
   - O ve a http://localhost:4322/carrito

6. **AHORA deberías ver:**
   - ✅ Tus productos listados
   - ✅ Junto a cada precio: "⏱️ Expira en XXs"
   - ✅ El número debería bajar cada segundo

---

## 🎯 ¿Qué significa cada cosa?

| Elemento | Dónde | Qué significa |
|----------|-------|---------------|
| "Añadir al carrito" | Página productos | Botón inicial |
| "✓ Añadido" | Página productos | Se agregó correctamente |
| "⏱️ Expira en 60s" | Carrito | El producto tiene reserva activa por 60 segundos |
| "⏱️ Expira en 30s" | Carrito | Quedan 30 segundos antes de que expire |
| "⏱️ Expira en 0s" | Carrito | La reserva acaba de expirar |

---

## 🆘 Troubleshooting

### ❌ No veo el carrito
**Soluciones:**
1. ¿Iniciaste sesión? (busca tu nombre arriba derecha)
2. ¿Agregaste productos? (intenta agregar uno)
3. ¿Vas a la URL correcta? (http://localhost:4322/carrito)

### ❌ No veo el countdown en carrito
**Soluciones:**
1. ¿Ejecutaste el SQL? (verifica en Supabase)
2. ¿Reiniciaste el servidor? (npm run dev)
3. ¿Hard refresh? (Ctrl+Shift+R)
4. ¿Esperas 2-3 segundos a que cargue?

### ❌ El countdown aparece en PRODUCTOS (pero no debería)
**Soluciones:**
1. Limpia caché: Ctrl+Shift+Del → "Todo"
2. Hard refresh: Ctrl+Shift+R
3. Cierra pestaña y vuelve a abrir

### ❌ Veo carrito vacío
**Soluciones:**
1. ¿Iniciaste sesión? (necesaria)
2. Abre DevTools (F12) → Consola
3. ¿Hay errores rojos? Si sí → copia y pega aquí

### ❌ Las imágenes de productos son blancas
**Soluciones:**
1. Es normal si no tienen imagen
2. Se muestra un placeholder gris
3. No afecta la funcionalidad

---

## 🔍 Cómo verificar que SQL se ejecutó

1. En Supabase, ve a "SQL Editor"
2. Click en "Consultas ejecutadas recientemente"
3. Deberías ver tu query en la lista
4. Si dice "Error", verifica el SQL

---

## 📸 Resultado esperado

### Página de Productos:
```
[Producto Image]
Sony WH-1000XM5
⭐⭐⭐⭐⭐ 4.8 (245)
349.00€ → 279.00€

[Botón: Añadir al carrito] ← SIN countdown
```

### Página de Carrito:
```
Artículos en tu carrito (2)

1. Canon EOS R6
   1799.00€
   Cantidad: 1
   Subtotal: 1799.00€
   ⏱️ Expira en 52s  ← SÍ debe aparecer

2. LG UltraWide 34
   799.00€
   Cantidad: 2
   Subtotal: 1598.00€
   ⏱️ Expira en 48s  ← SÍ debe aparecer
```

---

## ✨ Si todo funciona:

1. ✅ Los productos aparecen en carrito
2. ✅ Se ve el countdown
3. ✅ El número baja cada segundo
4. ✅ No hay countdown en página de productos
5. ✅ **LISTO PARA PRODUCCIÓN**

---

## 🎉 Próximos pasos

Una vez que todo funcione:
1. Prueba comprando (checkout)
2. Verifica que se procesa el pago
3. Comprueba el email de confirmación
4. ¡Celebra! 🎊
