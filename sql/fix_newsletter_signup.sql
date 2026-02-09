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
  v_user_id UUID;
BEGIN
  -- 1. Verificar si ya está suscrito
  SELECT EXISTS(
    SELECT 1 FROM newsletter_subscriptions WHERE email = p_email
  ) INTO v_exists;

  IF v_exists THEN
    SELECT codigo_descuento INTO v_existing_code
    FROM newsletter_subscriptions WHERE email = p_email;

    RETURN QUERY SELECT true, 'Ya estás suscrito.'::TEXT, COALESCE(v_existing_code, 'YA_SUSCRITO')::TEXT;
    RETURN;
  END IF;

  -- 2. Buscar el usuario en auth.users por email
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;

  -- 3. Generar código único
  v_codigo := 'WELCOME-' || UPPER(SUBSTRING(MD5(p_email || NOW()::TEXT) FROM 1 FOR 6));

  -- 4. Registrar suscripción con código
  INSERT INTO newsletter_subscriptions (email, codigo_descuento)
  VALUES (p_email, v_codigo);

  -- 5. Crear cupón en la tabla "coupons" asignado al usuario
  --    - assigned_user_id = UUID del usuario (solo él puede usarlo)
  --    - Si no tiene cuenta, queda NULL (público) pero max_uses_global=1
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
    v_user_id
  );

  RETURN QUERY SELECT true, '¡Gracias por suscribirte! Usa tu código de descuento del 10% en tu próxima compra.'::TEXT, v_codigo;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
