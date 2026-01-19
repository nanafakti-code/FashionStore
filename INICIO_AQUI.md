# 🎯 LO QUE NECESITAS HACER - MÁS SIMPLE

## El Problema
- El contador aparecía en la página de productos (❌ MAL)
- No se veían los productos en el carrito (❌ MAL)

## La Solución
He corregido TODO el código. Ahora falta solo **1 paso en Supabase**.

---

## ⚡ PASO ÚNICO (Muy importante)

### 1. Abre Supabase
Ve a: https://app.supabase.com

### 2. Selecciona tu proyecto
Busca "FashionStore" en la lista

### 3. Abre SQL Editor
- Click izquierdo en la barra lateral
- Busca "SQL Editor"
- Click

### 4. Copia este código
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

### 5. Pegalo en el editor
- Click en el editor (área vacía)
- Ctrl+V (pegar)

### 6. Ejecuta
- Click en botón azul "Ejecutar"
- O presiona: Ctrl+Enter

### 7. ¡Listo!
Verás un mensaje de éxito. **Ya está.**

---

## ✅ Luego de ejecutar el SQL

### Abre tu tienda
1. Ve a http://localhost:4322
2. Inicia sesión (si no lo hiciste)
3. Agrega un producto al carrito
4. **VE A /CARRITO**
5. Deberías ver:
   - Los productos ✅
   - "⏱️ Expira en 60s" ✅
   - El número baja cada segundo ✅

---

## 🎉 Eso es todo

No hay nada más que hacer. El sistema de reservas está listo.

---

## 🚨 Si no funciona

**"No veo el countdown"**
1. ¿Ejecutaste el SQL? (verifica en Supabase)
2. ¿Reiniciaste el servidor? (npm run dev)
3. ¿Hard refresh? (Ctrl+Shift+R)

**"El carrito está vacío"**
1. ¿Iniciaste sesión?
2. ¿Agregaste productos?

**"El countdown sigue en productos"**
1. Limpia caché (Ctrl+Shift+Del)
2. Hard refresh (Ctrl+Shift+R)

---

**Eso es. Ejecuta el SQL y listo.** ✅
