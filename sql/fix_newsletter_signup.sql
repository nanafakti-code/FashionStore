-- ============================================================================
-- FIX: newsletter_signup - Crear cupón en tabla correcta (coupons)
-- El checkout usa la tabla "coupons" (inglés), NO "cupones" ni "cupones_descuento"
-- ============================================================================

CREATE OR REPLACE FUNCTION newsletter_signup(p_email TEXT)
RETURNS TABLE(success BOOLEAN, message TEXT, codigo TEXT) AS $$
DECLARE
  v_codigo TEXT;
  v_exists BOOLEAN;
  v_existing_code TEXT;
BEGIN
  -- 1. Verificar si ya está suscrito
  SELECT EXISTS(
    SELECT 1 FROM newsletter_subscriptions WHERE email = p_email
  ) INTO v_exists;

  IF v_exists THEN
    -- Ya suscrito: devolver success=true con código 'YA_SUSCRITO' 
    -- (la API detecta esto y devuelve error 409)
    SELECT codigo_descuento INTO v_existing_code
    FROM newsletter_subscriptions WHERE email = p_email;

    RETURN QUERY SELECT true, 'Ya estás suscrito.'::TEXT, COALESCE(v_existing_code, 'YA_SUSCRITO')::TEXT;
    RETURN;
  END IF;

  -- 2. Generar código único
  v_codigo := 'WELCOME-' || UPPER(SUBSTRING(MD5(p_email || NOW()::TEXT) FROM 1 FOR 6));

  -- 3. Registrar suscripción con código
  INSERT INTO newsletter_subscriptions (email, codigo_descuento)
  VALUES (p_email, v_codigo);

  -- 4. Crear cupón en la tabla "coupons" (la que usa el checkout real)
  --    - assigned_user_id = NULL (público, cualquier usuario logueado puede usarlo)
  --    - max_uses_global = 1 (solo 1 uso en total -> solo el que lo recibió)
  --    - max_uses_per_user = 1
  --    - expira en 30 días
  INSERT INTO coupons (code, description, discount_type, value, min_order_value, max_uses_global, max_uses_per_user, expiration_date, is_active, assigned_user_id)
  VALUES (
    v_codigo,
    'Cupón bienvenida newsletter - ' || p_email,
    'PERCENTAGE',
    10,
    0,
    1,
    1,
    NOW() + INTERVAL '30 days',
    true,
    NULL
  );

  RETURN QUERY SELECT true, '¡Gracias por suscribirte! Usa tu código de descuento del 10% en tu próxima compra.'::TEXT, v_codigo;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
