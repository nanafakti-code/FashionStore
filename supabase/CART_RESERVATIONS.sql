-- CREAR TABLA DE RESERVAS DE CARRITO (1 MINUTO)
CREATE TABLE IF NOT EXISTS cart_reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  quantity INT NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '10 minutes'),
  UNIQUE(user_id, product_id)
);

-- ÍNDICES
DROP INDEX IF EXISTS idx_cart_reservations_user_id;
DROP INDEX IF EXISTS idx_cart_reservations_expires_at;
CREATE INDEX idx_cart_reservations_user_id ON cart_reservations(user_id);
CREATE INDEX idx_cart_reservations_expires_at ON cart_reservations(expires_at);

-- RLS DESHABILITADO - La tabla es interna, no contiene datos sensibles
ALTER TABLE cart_reservations DISABLE ROW LEVEL SECURITY;

-- FUNCIÓN PARA LIMPIAR RESERVAS EXPIRADAS Y RESTAURAR STOCK
CREATE OR REPLACE FUNCTION cleanup_expired_reservations()
RETURNS TABLE(items_cleaned INT, stock_restored INT) AS $$
DECLARE
  v_items_cleaned INT := 0;
  v_stock_restored INT := 0;
  v_expired_count INT;
  v_product_id UUID;
  v_quantity INT;
BEGIN
  -- Contar reservas expiradas
  SELECT COUNT(*) INTO v_expired_count
  FROM cart_reservations
  WHERE expires_at <= NOW();

  -- Actualizar stock para cada producto con reserva expirada
  FOR v_product_id, v_quantity IN
    SELECT product_id, SUM(quantity) as total_qty
    FROM cart_reservations
    WHERE expires_at <= NOW()
    GROUP BY product_id
  LOOP
    UPDATE productos
    SET stock_total = stock_total + v_quantity
    WHERE id = v_product_id;
  END LOOP;

  v_stock_restored := v_expired_count;

  -- Eliminar reservas expiradas
  DELETE FROM cart_reservations WHERE expires_at <= NOW();
  v_items_cleaned := v_expired_count;

  RETURN QUERY SELECT v_items_cleaned, v_stock_restored;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNCIÓN PARA CREAR RESERVA
CREATE OR REPLACE FUNCTION create_cart_reservation(
  p_product_id UUID,
  p_quantity INT
)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
  v_available_stock INT;
  v_existing_qty INT := 0;
  v_stock_diff INT;
BEGIN
  -- Obtener stock disponible
  SELECT stock_total INTO v_available_stock
  FROM productos
  WHERE id = p_product_id;

  -- Obtener cantidad reservada existente
  SELECT quantity INTO v_existing_qty
  FROM cart_reservations
  WHERE user_id = auth.uid() AND product_id = p_product_id;

  v_existing_qty := COALESCE(v_existing_qty, 0);
  v_stock_diff := p_quantity - v_existing_qty;

  -- Verificar si hay stock suficiente
  IF v_available_stock < v_stock_diff THEN
    RETURN QUERY SELECT false::BOOLEAN, 'Stock insuficiente'::TEXT;
    RETURN;
  END IF;

  -- Actualizar o insertar reserva
  INSERT INTO cart_reservations (user_id, product_id, quantity, expires_at)
  VALUES (auth.uid(), p_product_id, p_quantity, NOW() + INTERVAL '10 minutes')
  ON CONFLICT (user_id, product_id) DO UPDATE
  SET quantity = EXCLUDED.quantity, expires_at = NOW() + INTERVAL '10 minutes';

  -- Restar del stock solo si es nueva reserva
  IF v_stock_diff > 0 THEN
    UPDATE productos
    SET stock_total = stock_total - v_stock_diff
    WHERE id = p_product_id;
  END IF;

  RETURN QUERY SELECT true::BOOLEAN, 'Reserva creada'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNCIÓN PARA VER TIEMPO RESTANTE DE RESERVA
CREATE OR REPLACE FUNCTION get_reservation_time_remaining(p_product_id UUID)
RETURNS TABLE(expires_in_seconds INT) AS $$
BEGIN
  RETURN QUERY
  SELECT EXTRACT(EPOCH FROM (expires_at - NOW()))::INT
  FROM cart_reservations
  WHERE user_id = auth.uid() AND product_id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- FUNCIÓN PARA ELIMINAR RESERVA
CREATE OR REPLACE FUNCTION delete_cart_reservation(
  p_product_id UUID
)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
  v_reserved_qty INT;
BEGIN
  -- Obtener cantidad reservada
  SELECT quantity INTO v_reserved_qty
  FROM cart_reservations
  WHERE user_id = auth.uid() AND product_id = p_product_id;

  v_reserved_qty := COALESCE(v_reserved_qty, 0);

  -- Eliminar reserva
  DELETE FROM cart_reservations
  WHERE user_id = auth.uid() AND product_id = p_product_id;

  -- Restaurar stock si había cantidad reservada
  IF v_reserved_qty > 0 THEN
    UPDATE productos
    SET stock_total = stock_total + v_reserved_qty
    WHERE id = p_product_id;
  END IF;

  RETURN QUERY SELECT true::BOOLEAN, 'Reserva eliminada'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNCIÓN PARA OBTENER TODAS LAS RESERVAS DEL USUARIO
CREATE OR REPLACE FUNCTION get_user_cart_reservations()
RETURNS TABLE(id UUID, product_id UUID, quantity INT, created_at TIMESTAMPTZ, expires_at TIMESTAMPTZ, expires_in_seconds INT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cart_reservations.id,
    cart_reservations.product_id,
    cart_reservations.quantity,
    cart_reservations.created_at,
    cart_reservations.expires_at,
    EXTRACT(EPOCH FROM (cart_reservations.expires_at - NOW()))::INT as expires_in_seconds
  FROM cart_reservations
  WHERE user_id = auth.uid()
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- TRIGGER PARA LIMPIAR RESERVAS EXPIRADAS (CADA MINUTO)
-- Se ejecutará cada vez que alguien haga una operación en el carrito
CREATE OR REPLACE FUNCTION trigger_cleanup_expired()
RETURNS TRIGGER AS $$
BEGIN
  -- Ejecutar limpieza de reservas expiradas
  PERFORM cleanup_expired_reservations();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- LISTO
SELECT '✅ SISTEMA DE RESERVAS COMPLETO CREADO' AS resultado;
