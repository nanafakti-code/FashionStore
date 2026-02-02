-- FIX_GUEST_UPDATE.sql

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
  -- Get current item details
  SELECT product_id, variante_id, quantity INTO v_product_id, v_variant_id, v_current_quantity
  FROM public.cart_items
  WHERE id = p_cart_item_id AND session_id = p_session_id AND user_id IS NULL;

  IF v_product_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Item not found');
  END IF;

  v_diff := p_quantity - v_current_quantity;

  IF v_diff = 0 THEN
    RETURN jsonb_build_object('success', true);
  END IF;

  -- Validation: Check stock if increasing quantity
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

  -- Update Stock
  IF v_variant_id IS NOT NULL THEN
     UPDATE public.variantes_producto SET stock = stock - v_diff WHERE id = v_variant_id;
     UPDATE public.productos SET stock_total = stock_total - v_diff WHERE id = v_product_id;
  ELSE
     UPDATE public.productos SET stock_total = stock_total - v_diff WHERE id = v_product_id;
  END IF;

  -- Update Cart Item
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
