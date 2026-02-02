-- FIX_FINAL_DB_ISSUES.sql

-- 1. DROP ALL VARIATIONS to ensure clean slate (Resolve Ambiguity)
DROP FUNCTION IF EXISTS public.add_to_cart_v2(UUID, INTEGER, UUID, UUID);
DROP FUNCTION IF EXISTS public.add_to_cart_v2(UUID, INTEGER, UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS public.get_guest_cart(TEXT);
DROP FUNCTION IF EXISTS public.update_guest_cart_item(TEXT, UUID, INTEGER);
DROP FUNCTION IF EXISTS public.remove_from_guest_cart(TEXT, UUID);
DROP FUNCTION IF EXISTS public.clear_guest_cart(TEXT);

-- 2. RECREATE add_to_cart_v2 (Combined Auth & Guest)
CREATE OR REPLACE FUNCTION public.add_to_cart_v2(
  p_product_id UUID,
  p_quantity INTEGER,
  p_variant_id UUID,
  p_user_id UUID DEFAULT auth.uid(),
  p_session_id TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_current_stock INTEGER;
  v_existing_cart_id UUID;
  v_existing_quantity INTEGER;
  v_variant_exists BOOLEAN;
  v_effective_user_id UUID;
BEGIN
  v_effective_user_id := p_user_id;

  -- Ensure either user_id or session_id is provided
  IF v_effective_user_id IS NULL AND p_session_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'User ID or Session ID required');
  END IF;

  -- 1. Validation and Stock Check
  IF p_variant_id IS NOT NULL THEN
    SELECT EXISTS(SELECT 1 FROM public.variantes_producto WHERE id = p_variant_id) INTO v_variant_exists;
    IF NOT v_variant_exists THEN RETURN jsonb_build_object('success', false, 'message', 'Variant not found'); END IF;

    SELECT stock INTO v_current_stock FROM public.variantes_producto WHERE id = p_variant_id;
    IF v_current_stock < p_quantity THEN
      RETURN jsonb_build_object('success', false, 'message', 'Insufficient variant stock');
    END IF;
  ELSE
    SELECT stock_total INTO v_current_stock FROM public.productos WHERE id = p_product_id;
    IF v_current_stock < p_quantity THEN
      RETURN jsonb_build_object('success', false, 'message', 'Insufficient product stock');
    END IF;
  END IF;

  -- 2. Deduct Stock (Atomic)
  IF p_variant_id IS NOT NULL THEN
    UPDATE public.variantes_producto SET stock = stock - p_quantity WHERE id = p_variant_id;
    UPDATE public.productos SET stock_total = stock_total - p_quantity WHERE id = p_product_id;
  ELSE
    UPDATE public.productos SET stock_total = stock_total - p_quantity WHERE id = p_product_id;
  END IF;

  -- 3. Update Cart
  SELECT id, quantity INTO v_existing_cart_id, v_existing_quantity
  FROM public.cart_items
  WHERE (user_id = v_effective_user_id OR (v_effective_user_id IS NULL AND session_id = p_session_id))
    AND product_id = p_product_id
    AND ((p_variant_id IS NOT NULL AND variante_id = p_variant_id) OR (p_variant_id IS NULL AND variante_id IS NULL))
  LIMIT 1;

  IF v_existing_cart_id IS NOT NULL THEN
    UPDATE public.cart_items
    SET quantity = quantity + p_quantity,
        expires_at = NOW() + INTERVAL '10 minutes',
        updated_at = NOW()
    WHERE id = v_existing_cart_id;
  ELSE
    INSERT INTO public.cart_items (
      user_id, session_id, product_id, variante_id, quantity, expires_at, talla, color, precio_unitario
    ) VALUES (
      v_effective_user_id, p_session_id, p_product_id, p_variant_id, p_quantity, NOW() + INTERVAL '10 minutes',
      (SELECT capacidad FROM public.variantes_producto WHERE id = p_variant_id),
      (SELECT color FROM public.variantes_producto WHERE id = p_variant_id),
      (SELECT precio_venta FROM public.variantes_producto WHERE id = p_variant_id)
    );
  END IF;

  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RECREATE get_guest_cart
CREATE OR REPLACE FUNCTION public.get_guest_cart(p_session_id TEXT)
RETURNS TABLE (
  id UUID,
  product_id UUID,
  variante_id UUID,
  quantity INTEGER,
  talla TEXT,
  color TEXT,
  precio_unitario NUMERIC,
  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  product_name TEXT,
  product_stock INTEGER,
  product_image TEXT,
  variant_name TEXT,
  variant_stock INTEGER,
  variant_image TEXT,
  variant_capacity TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ci.id, ci.product_id, ci.variante_id, ci.quantity, ci.talla, ci.color, 
    ci.precio_unitario::NUMERIC, -- Cast to avoid type mismatch (Int vs Numeric)
    ci.created_at, ci.expires_at,
    p.nombre as product_name,
    p.stock_total as product_stock,
    (SELECT url FROM imagenes_producto ip WHERE ip.producto_id = p.id AND ip.es_principal LIMIT 1) as product_image,
    vp.nombre_variante as variant_name,
    vp.stock as variant_stock,
    vp.imagen_url as variant_image,
    vp.capacidad as variant_capacity
  FROM public.cart_items ci
  JOIN public.productos p ON ci.product_id = p.id
  LEFT JOIN public.variantes_producto vp ON ci.variante_id = vp.id
  WHERE ci.session_id = p_session_id AND ci.user_id IS NULL
  ORDER BY ci.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RECREATE update_guest_cart_item
CREATE OR REPLACE FUNCTION public.update_guest_cart_item(
  p_session_id TEXT,
  p_cart_item_id UUID,
  p_quantity INTEGER
) RETURNS JSONB AS $$
DECLARE
  v_product_id UUID;
  v_variant_id UUID;
  v_current_quantity INTEGER;
  v_diff INTEGER;
  v_stock_available INTEGER;
BEGIN
  SELECT product_id, variante_id, quantity INTO v_product_id, v_variant_id, v_current_quantity
  FROM public.cart_items
  WHERE id = p_cart_item_id AND session_id = p_session_id AND user_id IS NULL;

  IF v_product_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Item not found');
  END IF;

  v_diff := p_quantity - v_current_quantity;

  IF v_diff = 0 THEN RETURN jsonb_build_object('success', true); END IF;

  IF v_diff > 0 THEN
      IF v_variant_id IS NOT NULL THEN
         SELECT stock INTO v_stock_available FROM public.variantes_producto WHERE id = v_variant_id;
      ELSE
         SELECT stock_total INTO v_stock_available FROM public.productos WHERE id = v_product_id;
      END IF;

      IF v_stock_available < v_diff THEN
         RETURN jsonb_build_object('success', false, 'message', 'Insufficient stock');
      END IF;
  END IF;

  IF v_variant_id IS NOT NULL THEN
     UPDATE public.variantes_producto SET stock = stock - v_diff WHERE id = v_variant_id;
     UPDATE public.productos SET stock_total = stock_total - v_diff WHERE id = v_product_id;
  ELSE
     UPDATE public.productos SET stock_total = stock_total - v_diff WHERE id = v_product_id;
  END IF;

  UPDATE public.cart_items
  SET quantity = p_quantity,
      updated_at = NOW(),
      expires_at = NOW() + INTERVAL '10 minutes'
  WHERE id = p_cart_item_id;

  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RECREATE remove_from_guest_cart
CREATE OR REPLACE FUNCTION public.remove_from_guest_cart(
  p_session_id TEXT,
  p_cart_item_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_product_id UUID;
  v_variant_id UUID;
  v_quantity INTEGER;
BEGIN
  SELECT product_id, variante_id, quantity INTO v_product_id, v_variant_id, v_quantity
  FROM public.cart_items
  WHERE id = p_cart_item_id AND session_id = p_session_id AND user_id IS NULL;

  IF v_product_id IS NULL THEN RETURN FALSE; END IF;

  DELETE FROM public.cart_items WHERE id = p_cart_item_id;

  IF v_variant_id IS NOT NULL THEN
    UPDATE public.variantes_producto SET stock = stock + v_quantity WHERE id = v_variant_id;
    UPDATE public.productos SET stock_total = stock_total + v_quantity WHERE id = v_product_id;
  ELSE
    UPDATE public.productos SET stock_total = stock_total + v_quantity WHERE id = v_product_id;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RECREATE clear_guest_cart
CREATE OR REPLACE FUNCTION public.clear_guest_cart(p_session_id TEXT) RETURNS BOOLEAN AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT * FROM public.cart_items WHERE session_id = p_session_id AND user_id IS NULL LOOP
    IF r.variante_id IS NOT NULL THEN
      UPDATE public.variantes_producto SET stock = stock + r.quantity WHERE id = r.variante_id;
      UPDATE public.productos SET stock_total = stock_total + r.quantity WHERE id = r.product_id;
    ELSE
      UPDATE public.productos SET stock_total = stock_total + r.quantity WHERE id = r.product_id;
    END IF;
  END LOOP;
  DELETE FROM public.cart_items WHERE session_id = p_session_id AND user_id IS NULL;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. GRANT PERMISSIONS TO ANON (IMPORTANT FOR GUESTS)
GRANT EXECUTE ON FUNCTION public.add_to_cart_v2 TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_guest_cart TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_guest_cart_item TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.remove_from_guest_cart TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.clear_guest_cart TO anon, authenticated, service_role;
