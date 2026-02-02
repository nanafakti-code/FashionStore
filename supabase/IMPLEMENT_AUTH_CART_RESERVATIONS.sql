-- IMPLEMENT_AUTH_CART_RESERVATIONS.sql
-- 1. Add expiration column to cart_items
ALTER TABLE public.cart_items 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '10 minutes');

-- 2. Function to add item to cart with stock check and deduction
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
  v_user_id := auth.uid(); -- Get current authenticated user
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'User not authenticated');
  END IF;

  -- Determine if we are dealing with a variant or base product
  SELECT id, stock INTO v_variant_id, v_current_stock
  FROM public.variantes_producto
  WHERE producto_id = p_product_id 
    AND (p_talla IS NULL OR talla = p_talla) -- Handle flexible matching if needed, or strict
    AND (p_color IS NULL OR color = p_color)
  LIMIT 1;

  -- If not a variant, check base product
  IF v_variant_id IS NULL THEN
    SELECT stock_total INTO v_current_stock
    FROM public.productos
    WHERE id = p_product_id;
  END IF;

  -- Check if stock is sufficient
  IF v_current_stock IS NULL OR v_current_stock < p_quantity THEN
    RETURN jsonb_build_object('success', false, 'message', 'Insufficient stock');
  END IF;

  -- Check if item already exists in cart
  SELECT id, quantity INTO v_existing_cart_id, v_existing_quantity
  FROM public.cart_items
  WHERE user_id = v_user_id 
    AND product_id = p_product_id
    AND (talla IS NOT DISTINCT FROM p_talla)
    AND (color IS NOT DISTINCT FROM p_color);

  -- Deduct stock
  IF v_variant_id IS NOT NULL THEN
    UPDATE public.variantes_producto
    SET stock = stock - p_quantity
    WHERE id = v_variant_id;
  ELSE
    UPDATE public.productos
    SET stock_total = stock_total - p_quantity
    WHERE id = p_product_id;
  END IF;

  -- Insert or Update Cart Item
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

-- 3. Function to remove item and restore stock
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
  
  -- Get item details before deleting
  SELECT product_id, variante_id, quantity INTO v_product_id, v_variant_id, v_quantity
  FROM public.cart_items
  WHERE id = p_cart_item_id AND user_id = v_user_id;

  IF v_product_id IS NULL THEN
    RETURN FALSE; -- Item not found
  END IF;

  -- Delete item
  DELETE FROM public.cart_items WHERE id = p_cart_item_id;

  -- Restore stock
  IF v_variant_id IS NOT NULL THEN
    UPDATE public.variantes_producto
    SET stock = stock + v_quantity
    WHERE id = v_variant_id;
  ELSE
    UPDATE public.productos
    SET stock_total = stock_total + v_quantity
    WHERE id = v_product_id;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function to clear expired reservations (Can be called by cron or periodically by client)
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
    -- Restore stock
    IF r.variante_id IS NOT NULL THEN
      UPDATE public.variantes_producto
      SET stock = stock + r.quantity
      WHERE id = r.variante_id;
    ELSE
      UPDATE public.productos
      SET stock_total = stock_total + r.quantity
      WHERE id = r.product_id;
    END IF;

    -- Delete item
    DELETE FROM public.cart_items WHERE id = r.id;
    
    v_cleaned_count := v_cleaned_count + 1;
    v_restored_stock := v_restored_stock + r.quantity;
  END LOOP;

  RETURN QUERY SELECT v_cleaned_count, v_restored_stock;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Function to clear entire user cart and restore stock
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
    -- Restore stock
    IF r.variante_id IS NOT NULL THEN
      UPDATE public.variantes_producto
      SET stock = stock + r.quantity
      WHERE id = r.variante_id;
    ELSE
      UPDATE public.productos
      SET stock_total = stock_total + r.quantity
      WHERE id = r.product_id;
    END IF;
  END LOOP;

  -- Delete all items
  DELETE FROM public.cart_items WHERE user_id = v_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
