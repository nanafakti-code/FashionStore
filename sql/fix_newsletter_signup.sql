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
    SELECT 1 FROM newsletter_subscriptions WHERE email = LOWER(p_email)
  ) INTO v_exists;

  IF v_exists THEN
    SELECT codigo_descuento INTO v_existing_code
    FROM newsletter_subscriptions WHERE email = LOWER(p_email);

    RETURN QUERY SELECT true, 'Ya estás suscrito.'::TEXT, COALESCE(v_existing_code, 'YA_SUSCRITO')::TEXT;
    RETURN;
  END IF;

  -- 2. Buscar el usuario en auth.users por email (case-insensitive)
  SELECT id INTO v_user_id FROM auth.users WHERE LOWER(email) = LOWER(p_email) LIMIT 1;

  -- 3. Si no tiene cuenta registrada, no crear cupón sin dueño
  IF v_user_id IS NULL THEN
    -- Registrar suscripción sin cupón
    INSERT INTO newsletter_subscriptions (email)
    VALUES (LOWER(p_email));

    RETURN QUERY SELECT true, '¡Gracias por suscribirte! Regístrate con este email para recibir tu cupón de descuento.'::TEXT, ''::TEXT;
    RETURN;
  END IF;

  -- 4. Generar código único
  v_codigo := 'WELCOME-' || UPPER(SUBSTRING(MD5(p_email || NOW()::TEXT) FROM 1 FOR 6));

  -- 5. Registrar suscripción con código
  INSERT INTO newsletter_subscriptions (email, codigo_descuento)
  VALUES (LOWER(p_email), v_codigo);

  -- 6. Crear cupón asignado SOLO a este usuario
  INSERT INTO coupons (code, description, discount_type, value, min_order_value, max_uses_global, max_uses_per_user, expiration_date, is_active, assigned_user_id)
  VALUES (
    v_codigo,
    'Cupón bienvenida newsletter - ' || LOWER(p_email),
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
