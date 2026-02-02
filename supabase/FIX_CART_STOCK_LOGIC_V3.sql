-- FIX_CART_STOCK_LOGIC_V3.sql

-- Create a new function with a clean name to ensure no signature conflicts
CREATE OR REPLACE FUNCTION public.add_to_cart_v2(
  p_product_id UUID,
  p_quantity INTEGER,
  p_variant_id UUID, -- Explicitly required (can be NULL for non-variant products)
  p_user_id UUID DEFAULT auth.uid()
) RETURNS JSONB AS $$
DECLARE
  v_current_stock INTEGER;
  v_existing_cart_id UUID;
  v_existing_quantity INTEGER;
  v_variant_exists BOOLEAN;
BEGIN
  -- 1. Validation and Stock Check
  IF p_variant_id IS NOT NULL THEN
    -- Check if variant truly exists
    SELECT EXISTS(SELECT 1 FROM public.variantes_producto WHERE id = p_variant_id) INTO v_variant_exists;
    
    IF NOT v_variant_exists THEN
       RETURN jsonb_build_object('success', false, 'message', 'Variant not found');
    END IF;

    -- Check Variant Stock
    SELECT stock INTO v_current_stock 
    FROM public.variantes_producto 
    WHERE id = p_variant_id;

    IF v_current_stock < p_quantity THEN
      RETURN jsonb_build_object('success', false, 'message', 'Insufficient variant stock', 'current', v_current_stock);
    END IF;
  ELSE
    -- Check Product Stock (for products without variants)
    SELECT stock_total INTO v_current_stock 
    FROM public.productos 
    WHERE id = p_product_id;

    IF v_current_stock < p_quantity THEN
      RETURN jsonb_build_object('success', false, 'message', 'Insufficient product stock');
    END IF;
  END IF;

  -- 2. Deduct Stock (Both Variant and Product)
  IF p_variant_id IS NOT NULL THEN
    -- Deduct from Variant
    UPDATE public.variantes_producto
    SET stock = stock - p_quantity
    WHERE id = p_variant_id;

    -- Deduct from Parent Product (Total Stock)
    UPDATE public.productos
    SET stock_total = stock_total - p_quantity
    WHERE id = p_product_id;
  ELSE
    -- Deduct from Product only
    UPDATE public.productos
    SET stock_total = stock_total - p_quantity
    WHERE id = p_product_id;
  END IF;

  -- 3. Update Cart
  -- Check for existing item
  SELECT id, quantity INTO v_existing_cart_id, v_existing_quantity
  FROM public.cart_items
  WHERE user_id = p_user_id 
    AND product_id = p_product_id
    AND (
        (p_variant_id IS NOT NULL AND variante_id = p_variant_id) OR 
        (p_variant_id IS NULL AND variante_id IS NULL)
    );

  IF v_existing_cart_id IS NOT NULL THEN
    UPDATE public.cart_items
    SET quantity = quantity + p_quantity,
        expires_at = NOW() + INTERVAL '10 minutes',
        updated_at = NOW()
    WHERE id = v_existing_cart_id;
  ELSE
    INSERT INTO public.cart_items (
      user_id, product_id, variante_id, quantity, expires_at
    ) VALUES (
      p_user_id, p_product_id, p_variant_id, p_quantity, NOW() + INTERVAL '10 minutes'
    );
     -- Note: We omitted talla/color/precio_unitario to simplify. 
     -- If these are needed for display, we should fetch them or pass them.
     -- Let's stick to the core logic first. 
     -- Actually, cart items usually store snapshot data.
     -- I'll fetch them from the variant to be safe and clean.
     IF p_variant_id IS NOT NULL THEN
        UPDATE public.cart_items 
        SET talla = (SELECT capacidad FROM public.variantes_producto WHERE id = p_variant_id),
            color = (SELECT color FROM public.variantes_producto WHERE id = p_variant_id),
            precio_unitario = (SELECT precio_venta FROM public.variantes_producto WHERE id = p_variant_id)
        WHERE user_id = p_user_id AND product_id = p_product_id AND variante_id = p_variant_id;
     END IF;
  END IF;

  RETURN jsonb_build_object('success', true, 'variant_id', p_variant_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
