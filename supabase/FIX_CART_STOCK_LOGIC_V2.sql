-- FIX_CART_STOCK_LOGIC_V2.sql

-- Drop previous function signatures to avoid ambiguity
DROP FUNCTION IF EXISTS public.add_to_cart_with_stock_check(uuid, integer, text, text, numeric);

CREATE OR REPLACE FUNCTION public.add_to_cart_with_stock_check(
  p_product_id UUID,
  p_quantity INTEGER,
  p_talla TEXT DEFAULT NULL,
  p_color TEXT DEFAULT NULL,
  p_precio_unitario NUMERIC DEFAULT 0,
  p_variant_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_current_stock INTEGER;
  v_variant_id UUID;
  v_existing_cart_id UUID;
  v_existing_quantity INTEGER;
BEGIN
  v_user_id := auth.uid();
  
  -- 1. Determine Variant and Stock
  IF p_variant_id IS NOT NULL THEN
    -- Use specific variant if provided
    v_variant_id := p_variant_id;
    SELECT stock INTO v_current_stock FROM public.variantes_producto WHERE id = v_variant_id;
  ELSE
    -- Try to find by attributes (case insensitive)
    SELECT id, stock INTO v_variant_id, v_current_stock
    FROM public.variantes_producto
    WHERE producto_id = p_product_id 
      AND (p_talla IS NULL OR LOWER(talla) = LOWER(p_talla))
      AND (p_color IS NULL OR LOWER(color) = LOWER(p_color))
    LIMIT 1;
  END IF;

  -- 2. Validate Stock
  -- If we successfully identified a variant, exclude base product stock check unless that was the intent.
  -- But if v_variant_id is still NULL (no variant matches), do we check base product?
  IF v_variant_id IS NULL THEN
     -- Check base product stock as fallback
     SELECT stock_total INTO v_current_stock
     FROM public.productos
     WHERE id = p_product_id;
  END IF;

  IF v_current_stock IS NULL OR v_current_stock < p_quantity THEN
    RETURN jsonb_build_object('success', false, 'message', 'Insufficient stock');
  END IF;

  -- 3. Check for existing cart item
  SELECT id, quantity INTO v_existing_cart_id, v_existing_quantity
  FROM public.cart_items
  WHERE user_id = v_user_id 
    AND product_id = p_product_id
    AND (
        (v_variant_id IS NOT NULL AND variante_id = v_variant_id) OR 
        (v_variant_id IS NULL AND variante_id IS NULL)
    );

  -- 4. Deduct Stock (Atomic)
  IF v_variant_id IS NOT NULL THEN
    UPDATE public.variantes_producto
    SET stock = stock - p_quantity
    WHERE id = v_variant_id;
    
    -- Sync parent product stock
    UPDATE public.productos
    SET stock_total = stock_total - p_quantity
    WHERE id = p_product_id;
  ELSE
    UPDATE public.productos
    SET stock_total = stock_total - p_quantity
    WHERE id = p_product_id;
  END IF;

  -- 5. Insert/Update Cart Item
  IF v_existing_cart_id IS NOT NULL THEN
    UPDATE public.cart_items
    SET quantity = quantity + p_quantity,
        expires_at = NOW() + INTERVAL '10 minutes',
        updated_at = NOW()
    WHERE id = v_existing_cart_id;
  ELSE
    INSERT INTO public.cart_items (
      user_id, product_id, variante_id, quantity, talla, color, precio_unitario, expires_at
    ) VALUES (
      v_user_id, p_product_id, v_variant_id, p_quantity, p_talla, p_color, p_precio_unitario, NOW() + INTERVAL '10 minutes'
    );
  END IF;

  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
