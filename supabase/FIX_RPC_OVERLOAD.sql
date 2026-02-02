-- FIX_RPC_OVERLOAD.sql

-- 1. Drop the specific OLD version (4 arguments) to resolve ambiguity
DROP FUNCTION IF EXISTS public.add_to_cart_v2(UUID, INTEGER, UUID, UUID);

-- 2. Drop the NEW version (5 arguments) just to be clean and recreate it freshly
DROP FUNCTION IF EXISTS public.add_to_cart_v2(UUID, INTEGER, UUID, UUID, TEXT);

-- 3. Recreate the SINGLE comprehensive function
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
  LIMIT 1; -- Ensure single result

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
