# ⚙️ CONFIGURACIÓN FINAL - SISTEMA DE RESERVAS

## ✅ Cambios Realizados en Código

1. **AddToCartButton.tsx** - ACTUALIZADO
   - ❌ Removido: countdown que mostraba "✅ Reservado (60s)"
   - ✅ Ahora solo muestra: "Añadir al carrito" → "✓ Añadido al carrito"
   - ✅ El countdown ahora solo aparece en el carrito

2. **Cart.tsx** - YA LISTO
   - ✅ Muestra countdown "⏱️ Expira en 60s" para cada producto en el carrito
   - ✅ Actualiza cada segundo automáticamente
   - ✅ Limpia reservas expiradas cada 30 segundos

## 🔴 PASO CRÍTICO: Actualizar Supabase

**DEBES ejecutar este SQL en Supabase antes de que funcione todo:**

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

### Cómo ejecutar:
1. Ve a Supabase → Tu proyecto
2. SQL Editor
3. Copia y pega el SQL anterior
4. Presiona "Ejecutar"
5. Verás el mensaje "OK"

## 🔄 Flujo Completo

1. **Usuario autenticado ve productos**
   - Botón negro: "Añadir al carrito"
   - Botón naranja (si NO autenticado): "Inicia sesión para comprar"

2. **Usuario hace clic en "Añadir al carrito"**
   - Botón verde: "✓ Añadido al carrito"
   - Se agrega a cart_items
   - Se crea reserva de 60s en cart_reservations

3. **Usuario va a /carrito**
   - Ve sus productos
   - **NUEVO**: Cada producto muestra "⏱️ Expira en XXs" si tiene reserva
   - El contador actualiza cada segundo automáticamente
   - Cuando llega a 0 segundos, la reserva se elimina y se restaura stock

4. **Usuario antes de que expire (60 segundos)**
   - Puede hacer clic en "Tramitar pedido"
   - Va a checkout
   - Completa el pedido

## 🐛 Problemas Solucionados

| Problema | Solución |
|----------|----------|
| Contador mostraba en página de productos | ❌ Removido de AddToCartButton, ahora solo en carrito |
| Carrito no mostraba productos | ✅ Fixed: get_user_cart() ahora retorna expires_in_seconds |
| Countdown no funcionaba | ✅ Cart tiene useEffect que actualiza cada segundo |
| No había sincronización | ✅ Triggers SQL limpian automáticamente |

## 📋 Checklist Antes de Usar

- [ ] Ejecuté el SQL en Supabase (DROP FUNCTION + CREATE)
- [ ] Reinicié servidor (`npm run dev`)
- [ ] Inié sesión en FashionStore
- [ ] Agregué un producto al carrito
- [ ] Fui a /carrito y vi el countdown

## 🔗 Archivos Modificados

- `/src/components/islands/AddToCartButton.tsx` - Removido countdown
- `/supabase/cart-rls-setup.sql` - Actualizado get_user_cart()
- `/src/components/islands/Cart.tsx` - YA TENÍA countdown (sin cambios)

## ❓ Si No Funciona

1. **No veo contador en carrito**
   - Verifica que ejecutaste el SQL en Supabase
   - Reinicia el servidor: `npm run dev`
   
2. **Dice "Stock insuficiente"**
   - Verifica que cart_reservations existe en Supabase
   - Verifica que create_cart_reservation() está creada
   
3. **Contador no actualiza**
   - Abre DevTools (F12)
   - Mira la consola de JavaScript
   - Verifica que no hay errores

---

**PRÓXIMO PASO: Ejecuta el SQL en Supabase, luego reinicia el servidor con `npm run dev`**
