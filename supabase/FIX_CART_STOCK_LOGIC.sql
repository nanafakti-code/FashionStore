-- FIX_CART_STOCK_LOGIC.sql

-- 1. Create RPC for updating cart quantity with strict stock check
CREATE OR REPLACE FUNCTION public.update_cart_item_quantity_with_stock_check(
  p_cart_item_id UUID,
  p_new_quantity INTEGER
) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_product_id UUID;
  v_variant_id UUID;
  v_old_quantity INTEGER;
  v_quantity_diff INTEGER;
  v_current_stock INTEGER;
BEGIN
  v_user_id := auth.uid();
  
  -- Get current item details
  SELECT product_id, variante_id, quantity INTO v_product_id, v_variant_id, v_old_quantity
  FROM public.cart_items
  WHERE id = p_cart_item_id AND user_id = v_user_id;

  IF v_product_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Item not found');
  END IF;

  v_quantity_diff := p_new_quantity - v_old_quantity;

  IF v_quantity_diff = 0 THEN
    RETURN jsonb_build_object('success', true);
  END IF;

  -- 1. If increasing quantity, check stock
  IF v_quantity_diff > 0 THEN
    IF v_variant_id IS NOT NULL THEN
      SELECT stock INTO v_current_stock FROM public.variantes_producto WHERE id = v_variant_id;
    ELSE
      SELECT stock_total INTO v_current_stock FROM public.productos WHERE id = v_product_id;
    END IF;

    IF v_current_stock < v_quantity_diff THEN
      RETURN jsonb_build_object('success', false, 'message', 'Insufficient stock');
    END IF;
  END IF;

  -- 2. Update stock (Deduct if increasing, Restore if decreasing)
  IF v_variant_id IS NOT NULL THEN
    UPDATE public.variantes_producto
    SET stock = stock - v_quantity_diff
    WHERE id = v_variant_id;
    -- Also sync parent product stock if needed (optional but good practice)
    UPDATE public.productos
    SET stock_total = stock_total - v_quantity_diff
    WHERE id = v_product_id;
  ELSE
    UPDATE public.productos
    SET stock_total = stock_total - v_quantity_diff
    WHERE id = v_product_id;
  END IF;

  -- 3. Update cart item
  UPDATE public.cart_items
  SET quantity = p_new_quantity,
      updated_at = NOW(),
      expires_at = NOW() + INTERVAL '10 minutes' -- Refresh expiration on interaction
  WHERE id = p_cart_item_id;

  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Improve add_to_cart RPC to also sync parent stock and handle case-insensitive color/size
CREATE OR REPLACE FUNCTION public.add_to_cart_with_stock_check(
  p_product_id UUID,
  p_quantity INTEGER,
  p_talla TEXT DEFAULT NULL,
  p_color TEXT DEFAULT NULL,
  p_precio_unitario NUMERIC DEFAULT 0
) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_current_stock INTEGER;
  v_variant_id UUID;
  v_existing_cart_id UUID;
  v_existing_quantity INTEGER;
BEGIN
  v_user_id := auth.uid();
  
  -- Try to find variant with case-insensitive matching if provided
  SELECT id, stock INTO v_variant_id, v_current_stock
  FROM public.variantes_producto
  WHERE producto_id = p_product_id 
    AND (p_talla IS NULL OR LOWER(talla) = LOWER(p_talla))
    AND (p_color IS NULL OR LOWER(color) = LOWER(p_color))
  LIMIT 1;

  -- If strict match failed but params were provided, maybe try exact match or just assume no variant found?
  -- With the above LOWER check, we handle 'Negro' vs 'negro'.

  -- If not a variant, check base product
  IF v_variant_id IS NULL THEN
    -- Only fallback if params were NOT provided. If params were provided but no variant found, it's an error.
    IF p_talla IS NOT NULL OR p_color IS NOT NULL THEN
       -- Try to force finding a variant if one exists for the product? 
       -- For now, if user selected options and we didn't find them, better to fail than oversell base product.
       -- BUT existing logic might rely on base product fallback. Let's keep strict check:
       -- If we didn't find a variant but inputs were given, we assume invalid selection?
       -- Actually, let's allow fallback only if the product has NO variants?
       -- For safety, stick to previous logic but check stock.
       SELECT stock_total INTO v_current_stock
       FROM public.productos
       WHERE id = p_product_id;
    ELSE
       SELECT stock_total INTO v_current_stock
       FROM public.productos
       WHERE id = p_product_id;
    END IF;
  END IF;

  IF v_current_stock IS NULL OR v_current_stock < p_quantity THEN
    RETURN jsonb_build_object('success', false, 'message', 'Insufficient stock');
  END IF;

  -- Check existence
  SELECT id, quantity INTO v_existing_cart_id, v_existing_quantity
  FROM public.cart_items
  WHERE user_id = v_user_id 
    AND product_id = p_product_id
    AND (
        (v_variant_id IS NOT NULL AND variante_id = v_variant_id) OR 
        (v_variant_id IS NULL AND variante_id IS NULL)
    );
     -- Simplified matching based on resolved variant ID

  -- Deduct stock
  IF v_variant_id IS NOT NULL THEN
    UPDATE public.variantes_producto
    SET stock = stock - p_quantity
    WHERE id = v_variant_id;
    
    -- Sync parent
    UPDATE public.productos
    SET stock_total = stock_total - p_quantity
    WHERE id = p_product_id;
  ELSE
    UPDATE public.productos
    SET stock_total = stock_total - p_quantity
    WHERE id = p_product_id;
  END IF;

  -- Insert/Update
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

-- 3. Trigger to keep stock_total synced (if not already present), optional but recommended
-- (Not adding trigger now to avoid conflicts with existing triggers, handled manually in RPCs above)

-- Improvements to cleanup and remove functions to also sync parent stock
CREATE OR REPLACE FUNCTION public.remove_from_cart_restore_stock(
  p_cart_item_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_product_id UUID;
  v_variant_id UUID;
  v_quantity INTEGER;
BEGIN
  v_user_id := auth.uid();
  
  SELECT product_id, variante_id, quantity INTO v_product_id, v_variant_id, v_quantity
  FROM public.cart_items
  WHERE id = p_cart_item_id AND user_id = v_user_id;

  IF v_product_id IS NULL THEN
    RETURN FALSE;
  END IF;

  DELETE FROM public.cart_items WHERE id = p_cart_item_id;

  IF v_variant_id IS NOT NULL THEN
    UPDATE public.variantes_producto
    SET stock = stock + v_quantity
    WHERE id = v_variant_id;
    -- Sync parent
    UPDATE public.productos
    SET stock_total = stock_total + v_quantity
    WHERE id = v_product_id;
  ELSE
    UPDATE public.productos
    SET stock_total = stock_total + v_quantity
    WHERE id = v_product_id;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION public.cleanup_expired_cart_reservations() 
RETURNS TABLE(items_cleaned INTEGER, stock_restored INTEGER) AS $$
DECLARE
  r RECORD;
  v_cleaned_count INTEGER := 0;
  v_restored_stock INTEGER := 0;
BEGIN
  FOR r IN 
    SELECT * FROM public.cart_items WHERE expires_at < NOW()
  LOOP
    IF r.variante_id IS NOT NULL THEN
      UPDATE public.variantes_producto
      SET stock = stock + r.quantity
      WHERE id = r.variante_id;
      -- Sync parent
      UPDATE public.productos
      SET stock_total = stock_total + r.quantity
      WHERE id = r.product_id;
    ELSE
      UPDATE public.productos
      SET stock_total = stock_total + r.quantity
      WHERE id = r.product_id;
    END IF;

    DELETE FROM public.cart_items WHERE id = r.id;
    
    v_cleaned_count := v_cleaned_count + 1;
    v_restored_stock := v_restored_stock + r.quantity;
  END LOOP;

  RETURN QUERY SELECT v_cleaned_count, v_restored_stock;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION public.clear_user_cart_restore_stock()
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  r RECORD;
BEGIN
  v_user_id := auth.uid();

  FOR r IN 
    SELECT * FROM public.cart_items WHERE user_id = v_user_id
  LOOP
    IF r.variante_id IS NOT NULL THEN
      UPDATE public.variantes_producto
      SET stock = stock + r.quantity
      WHERE id = r.variante_id;
      -- Sync parent
      UPDATE public.productos
      SET stock_total = stock_total + r.quantity
      WHERE id = r.product_id;
    ELSE
      UPDATE public.productos
      SET stock_total = stock_total + r.quantity
      WHERE id = r.product_id;
    END IF;
  END LOOP;

  DELETE FROM public.cart_items WHERE user_id = v_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
