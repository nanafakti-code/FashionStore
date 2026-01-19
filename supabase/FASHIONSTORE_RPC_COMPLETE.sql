-- =====================================================
-- FASHIONSTORE - RPC FUNCTIONS COMPLETAS
-- =====================================================
-- Sistema de e-commerce profesional con funciones atómicas
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. TABLA: newsletter_subscriptions (suscripciones)
-- =====================================================
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  codigo_descuento TEXT UNIQUE,
  usado BOOLEAN DEFAULT FALSE,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_codigo ON newsletter_subscriptions(codigo_descuento);

-- =====================================================
-- 2. TABLA: eventos_promocionales (eventos temporales)
-- =====================================================
CREATE TABLE IF NOT EXISTS eventos_promocionales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  tipo_descuento TEXT NOT NULL CHECK (tipo_descuento IN ('Porcentaje', 'Cantidad')),
  valor_descuento DECIMAL(10, 2) NOT NULL,
  categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  producto_id UUID REFERENCES productos(id) ON DELETE SET NULL,
  banner_texto TEXT,
  banner_color TEXT DEFAULT '#00aa45',
  fecha_inicio TIMESTAMPTZ NOT NULL,
  fecha_fin TIMESTAMPTZ NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eventos_fechas ON eventos_promocionales(fecha_inicio, fecha_fin);
CREATE INDEX IF NOT EXISTS idx_eventos_activo ON eventos_promocionales(activo);

-- =====================================================
-- 3. TABLA: ordenes (tabla unificada de pedidos)
-- =====================================================
-- Asegurarse de que existe la tabla ordenes para órdenes de la web
CREATE TABLE IF NOT EXISTS ordenes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  numero_orden TEXT NOT NULL UNIQUE,
  estado TEXT NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'Pagado', 'Enviado', 'Entregado', 'Cancelado', 'Devolucion_Solicitada')),
  subtotal INTEGER NOT NULL DEFAULT 0,
  impuestos INTEGER NOT NULL DEFAULT 0,
  descuento INTEGER NOT NULL DEFAULT 0,
  coste_envio INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL,
  cupon_id UUID REFERENCES cupones_descuento(id),
  stripe_session_id TEXT,
  stripe_payment_intent TEXT,
  email_cliente TEXT,
  nombre_cliente TEXT,
  telefono_cliente TEXT,
  direccion_envio JSONB,
  notas TEXT,
  fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
  fecha_pago TIMESTAMPTZ,
  fecha_envio TIMESTAMPTZ,
  fecha_entrega TIMESTAMPTZ,
  fecha_cancelacion TIMESTAMPTZ,
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ordenes_usuario ON ordenes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_estado ON ordenes(estado);
CREATE INDEX IF NOT EXISTS idx_ordenes_stripe ON ordenes(stripe_session_id);

-- =====================================================
-- 4. TABLA: items_orden (items de cada orden)
-- =====================================================
CREATE TABLE IF NOT EXISTS items_orden (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  orden_id UUID NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  producto_nombre TEXT NOT NULL,
  producto_imagen TEXT,
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  talla TEXT,
  color TEXT,
  precio_unitario INTEGER NOT NULL,
  subtotal INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_items_orden_orden ON items_orden(orden_id);
CREATE INDEX IF NOT EXISTS idx_items_orden_producto ON items_orden(producto_id);

-- =====================================================
-- 5. FUNCIÓN: Generar número de orden único
-- =====================================================
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
BEGIN
  new_number := 'FS-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. FUNCIÓN: Newsletter signup (registro + código)
-- =====================================================
CREATE OR REPLACE FUNCTION newsletter_signup(p_email TEXT)
RETURNS TABLE(success BOOLEAN, message TEXT, codigo TEXT) AS $$
DECLARE
  v_codigo TEXT;
  v_exists BOOLEAN;
BEGIN
  -- Verificar si el email ya existe
  SELECT EXISTS(SELECT 1 FROM newsletter_subscriptions WHERE email = p_email) INTO v_exists;
  
  IF v_exists THEN
    -- Ya existe, devolver el código existente
    SELECT codigo_descuento INTO v_codigo FROM newsletter_subscriptions WHERE email = p_email;
    RETURN QUERY SELECT true, 'Ya estás suscrito. Tu código es:'::TEXT, v_codigo;
    RETURN;
  END IF;
  
  -- Generar código único
  v_codigo := 'WELCOME' || UPPER(SUBSTRING(MD5(p_email || NOW()::TEXT) FROM 1 FOR 6));
  
  -- Insertar suscripción
  INSERT INTO newsletter_subscriptions (email, codigo_descuento)
  VALUES (p_email, v_codigo);
  
  -- Crear el cupón correspondiente (10% descuento)
  INSERT INTO cupones_descuento (codigo, descripcion, tipo, valor, minimo_compra, maximo_uses, activo, fecha_inicio, fecha_fin)
  VALUES (v_codigo, 'Cupón bienvenida newsletter', 'Porcentaje', 10, 0, 1, true, NOW(), NOW() + INTERVAL '30 days')
  ON CONFLICT (codigo) DO NOTHING;
  
  RETURN QUERY SELECT true, '¡Gracias por suscribirte! Te hemos enviado un email con tu código de descuento.'::TEXT, v_codigo;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. FUNCIÓN: Validar cupón de descuento
-- =====================================================
CREATE OR REPLACE FUNCTION validate_coupon(p_codigo TEXT, p_subtotal INTEGER)
RETURNS TABLE(
  valid BOOLEAN, 
  message TEXT, 
  tipo TEXT, 
  valor DECIMAL, 
  descuento_calculado INTEGER,
  cupon_id UUID
) AS $$
DECLARE
  v_cupon RECORD;
  v_descuento INTEGER;
  v_usado_por_usuario BOOLEAN;
BEGIN
  -- Buscar el cupón
  SELECT * INTO v_cupon FROM cupones_descuento 
  WHERE codigo = UPPER(p_codigo) AND activo = true;
  
  IF v_cupon IS NULL THEN
    RETURN QUERY SELECT false, 'Cupón no encontrado o inactivo'::TEXT, NULL::TEXT, NULL::DECIMAL, 0, NULL::UUID;
    RETURN;
  END IF;
  
  -- Verificar fechas
  IF v_cupon.fecha_inicio IS NOT NULL AND v_cupon.fecha_inicio > NOW() THEN
    RETURN QUERY SELECT false, 'El cupón aún no está activo'::TEXT, NULL::TEXT, NULL::DECIMAL, 0, NULL::UUID;
    RETURN;
  END IF;
  
  IF v_cupon.fecha_fin IS NOT NULL AND v_cupon.fecha_fin < NOW() THEN
    RETURN QUERY SELECT false, 'El cupón ha expirado'::TEXT, NULL::TEXT, NULL::DECIMAL, 0, NULL::UUID;
    RETURN;
  END IF;
  
  -- Verificar límite de usos
  IF v_cupon.maximo_uses IS NOT NULL AND v_cupon.usos_actuales >= v_cupon.maximo_uses THEN
    RETURN QUERY SELECT false, 'El cupón ha alcanzado su límite de usos'::TEXT, NULL::TEXT, NULL::DECIMAL, 0, NULL::UUID;
    RETURN;
  END IF;
  
  -- Verificar mínimo de compra
  IF v_cupon.minimo_compra IS NOT NULL AND p_subtotal < v_cupon.minimo_compra THEN
    RETURN QUERY SELECT false, ('Compra mínima requerida: ' || (v_cupon.minimo_compra / 100)::TEXT || '€')::TEXT, NULL::TEXT, NULL::DECIMAL, 0, NULL::UUID;
    RETURN;
  END IF;
  
  -- Verificar si el usuario ya usó este cupón (si está autenticado)
  IF auth.uid() IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM cupon_uso 
      WHERE cupon_id = v_cupon.id AND usuario_id = auth.uid()
    ) INTO v_usado_por_usuario;
    
    IF v_usado_por_usuario THEN
      RETURN QUERY SELECT false, 'Ya has usado este cupón anteriormente'::TEXT, NULL::TEXT, NULL::DECIMAL, 0, NULL::UUID;
      RETURN;
    END IF;
  END IF;
  
  -- Calcular descuento
  IF v_cupon.tipo = 'Porcentaje' THEN
    v_descuento := ROUND((p_subtotal * v_cupon.valor) / 100);
  ELSE
    v_descuento := LEAST(v_cupon.valor::INTEGER * 100, p_subtotal); -- Cantidad fija en céntimos
  END IF;
  
  RETURN QUERY SELECT 
    true, 
    '¡Cupón aplicado correctamente!'::TEXT, 
    v_cupon.tipo, 
    v_cupon.valor, 
    v_descuento,
    v_cupon.id;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- =====================================================
-- 8. FUNCIÓN: Crear orden desde checkout (ATÓMICA)
-- =====================================================
CREATE OR REPLACE FUNCTION create_order_from_checkout(
  p_stripe_session_id TEXT,
  p_email TEXT,
  p_nombre TEXT,
  p_telefono TEXT,
  p_direccion JSONB,
  p_subtotal INTEGER,
  p_impuestos INTEGER,
  p_descuento INTEGER,
  p_total INTEGER,
  p_cupon_id UUID DEFAULT NULL,
  p_items JSONB DEFAULT '[]'::JSONB
)
RETURNS TABLE(success BOOLEAN, message TEXT, orden_id UUID, numero_orden TEXT) AS $$
DECLARE
  v_orden_id UUID;
  v_numero_orden TEXT;
  v_item JSONB;
  v_producto_id UUID;
  v_cantidad INTEGER;
  v_stock_actual INTEGER;
BEGIN
  -- Verificar que hay items
  IF jsonb_array_length(p_items) = 0 THEN
    RETURN QUERY SELECT false, 'No hay items en el pedido'::TEXT, NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;
  
  -- Generar número de orden
  v_numero_orden := generate_order_number();
  
  -- Verificar stock de todos los productos antes de crear la orden
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_producto_id := (v_item->>'producto_id')::UUID;
    v_cantidad := (v_item->>'cantidad')::INTEGER;
    
    SELECT stock_total INTO v_stock_actual FROM productos WHERE id = v_producto_id;
    
    IF v_stock_actual IS NULL THEN
      RETURN QUERY SELECT false, ('Producto no encontrado: ' || v_producto_id::TEXT)::TEXT, NULL::UUID, NULL::TEXT;
      RETURN;
    END IF;
    
    IF v_stock_actual < v_cantidad THEN
      RETURN QUERY SELECT false, ('Stock insuficiente para producto: ' || (v_item->>'nombre'))::TEXT, NULL::UUID, NULL::TEXT;
      RETURN;
    END IF;
  END LOOP;
  
  -- Crear la orden
  INSERT INTO ordenes (
    usuario_id, numero_orden, estado, subtotal, impuestos, descuento, total,
    cupon_id, stripe_session_id, email_cliente, nombre_cliente, telefono_cliente, 
    direccion_envio, fecha_pago
  ) VALUES (
    auth.uid(), v_numero_orden, 'Pagado', p_subtotal, p_impuestos, p_descuento, p_total,
    p_cupon_id, p_stripe_session_id, p_email, p_nombre, p_telefono,
    p_direccion, NOW()
  ) RETURNING id INTO v_orden_id;
  
  -- Crear items de la orden y actualizar stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_producto_id := (v_item->>'producto_id')::UUID;
    v_cantidad := (v_item->>'cantidad')::INTEGER;
    
    -- Insertar item
    INSERT INTO items_orden (
      orden_id, producto_id, producto_nombre, producto_imagen, cantidad, 
      talla, color, precio_unitario, subtotal
    ) VALUES (
      v_orden_id, v_producto_id, v_item->>'nombre', v_item->>'imagen', v_cantidad,
      v_item->>'talla', v_item->>'color', (v_item->>'precio_unitario')::INTEGER,
      v_cantidad * (v_item->>'precio_unitario')::INTEGER
    );
    
    -- Actualizar stock
    UPDATE productos 
    SET stock_total = stock_total - v_cantidad 
    WHERE id = v_producto_id;
  END LOOP;
  
  -- Registrar uso del cupón si se usó
  IF p_cupon_id IS NOT NULL THEN
    INSERT INTO cupon_uso (cupon_id, usuario_id, pedido_id)
    VALUES (p_cupon_id, auth.uid(), v_orden_id);
    
    UPDATE cupones_descuento 
    SET usos_actuales = usos_actuales + 1 
    WHERE id = p_cupon_id;
  END IF;
  
  -- Limpiar carrito del usuario
  DELETE FROM cart_items WHERE user_id = auth.uid();
  
  -- Limpiar reservas del usuario
  DELETE FROM cart_reservations WHERE user_id = auth.uid();
  
  RETURN QUERY SELECT true, 'Orden creada exitosamente'::TEXT, v_orden_id, v_numero_orden;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. FUNCIÓN: Cancelar orden (ATÓMICA - restaurar stock)
-- =====================================================
CREATE OR REPLACE FUNCTION cancel_order(p_orden_id UUID)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
  v_orden RECORD;
  v_item RECORD;
BEGIN
  -- Obtener la orden
  SELECT * INTO v_orden FROM ordenes WHERE id = p_orden_id AND usuario_id = auth.uid();
  
  IF v_orden IS NULL THEN
    RETURN QUERY SELECT false, 'Orden no encontrada'::TEXT;
    RETURN;
  END IF;
  
  -- Verificar que se puede cancelar (solo si está Pagado)
  IF v_orden.estado != 'Pagado' THEN
    RETURN QUERY SELECT false, ('No se puede cancelar. Estado actual: ' || v_orden.estado)::TEXT;
    RETURN;
  END IF;
  
  -- Restaurar stock de cada item (ATÓMICO)
  FOR v_item IN SELECT * FROM items_orden WHERE orden_id = p_orden_id
  LOOP
    UPDATE productos 
    SET stock_total = stock_total + v_item.cantidad 
    WHERE id = v_item.producto_id;
  END LOOP;
  
  -- Actualizar estado de la orden
  UPDATE ordenes 
  SET estado = 'Cancelado', 
      fecha_cancelacion = NOW(),
      actualizado_en = NOW()
  WHERE id = p_orden_id;
  
  RETURN QUERY SELECT true, 'Orden cancelada y stock restaurado correctamente'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. FUNCIÓN: Solicitar devolución
-- =====================================================
CREATE OR REPLACE FUNCTION request_return(p_orden_id UUID, p_motivo TEXT DEFAULT 'No especificado')
RETURNS TABLE(success BOOLEAN, message TEXT, numero_autorizacion TEXT) AS $$
DECLARE
  v_orden RECORD;
  v_numero_auth TEXT;
BEGIN
  -- Obtener la orden
  SELECT * INTO v_orden FROM ordenes WHERE id = p_orden_id AND usuario_id = auth.uid();
  
  IF v_orden IS NULL THEN
    RETURN QUERY SELECT false, 'Orden no encontrada'::TEXT, NULL::TEXT;
    RETURN;
  END IF;
  
  -- Verificar que se puede solicitar devolución (solo si está Entregado)
  IF v_orden.estado != 'Entregado' THEN
    RETURN QUERY SELECT false, ('Solo se pueden devolver pedidos entregados. Estado actual: ' || v_orden.estado)::TEXT, NULL::TEXT;
    RETURN;
  END IF;
  
  -- Generar número de autorización
  v_numero_auth := 'RMA-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  
  -- Crear registro de devolución
  INSERT INTO devoluciones (pedido_id, usuario_id, motivo, estado, numero_autorizacion, monto_reembolso)
  VALUES (p_orden_id, auth.uid(), p_motivo, 'Solicitada', v_numero_auth, v_orden.total);
  
  -- Actualizar estado de la orden
  UPDATE ordenes 
  SET estado = 'Devolucion_Solicitada',
      actualizado_en = NOW()
  WHERE id = p_orden_id;
  
  RETURN QUERY SELECT true, 'Solicitud de devolución creada correctamente'::TEXT, v_numero_auth;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 11. FUNCIÓN: Obtener pedidos del usuario
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_orders()
RETURNS TABLE(
  id UUID,
  numero_orden TEXT,
  estado TEXT,
  total INTEGER,
  fecha_creacion TIMESTAMPTZ,
  fecha_pago TIMESTAMPTZ,
  fecha_envio TIMESTAMPTZ,
  fecha_entrega TIMESTAMPTZ,
  items_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.numero_orden,
    o.estado,
    o.total,
    o.fecha_creacion,
    o.fecha_pago,
    o.fecha_envio,
    o.fecha_entrega,
    COUNT(io.id) as items_count
  FROM ordenes o
  LEFT JOIN items_orden io ON o.id = io.orden_id
  WHERE o.usuario_id = auth.uid()
  GROUP BY o.id
  ORDER BY o.fecha_creacion DESC;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- =====================================================
-- 12. FUNCIÓN: Obtener detalle de un pedido
-- =====================================================
CREATE OR REPLACE FUNCTION get_order_detail(p_orden_id UUID)
RETURNS TABLE(
  orden JSONB,
  items JSONB
) AS $$
DECLARE
  v_orden JSONB;
  v_items JSONB;
BEGIN
  -- Obtener datos de la orden
  SELECT to_jsonb(o.*) INTO v_orden
  FROM ordenes o
  WHERE o.id = p_orden_id AND o.usuario_id = auth.uid();
  
  IF v_orden IS NULL THEN
    RETURN QUERY SELECT NULL::JSONB, NULL::JSONB;
    RETURN;
  END IF;
  
  -- Obtener items
  SELECT jsonb_agg(to_jsonb(io.*)) INTO v_items
  FROM items_orden io
  WHERE io.orden_id = p_orden_id;
  
  RETURN QUERY SELECT v_orden, COALESCE(v_items, '[]'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- =====================================================
-- 13. FUNCIÓN: Obtener eventos activos
-- =====================================================
CREATE OR REPLACE FUNCTION get_active_events()
RETURNS TABLE(
  id UUID,
  nombre TEXT,
  descripcion TEXT,
  tipo_descuento TEXT,
  valor_descuento DECIMAL,
  categoria_id UUID,
  producto_id UUID,
  banner_texto TEXT,
  banner_color TEXT,
  fecha_inicio TIMESTAMPTZ,
  fecha_fin TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.nombre,
    e.descripcion,
    e.tipo_descuento,
    e.valor_descuento,
    e.categoria_id,
    e.producto_id,
    e.banner_texto,
    e.banner_color,
    e.fecha_inicio,
    e.fecha_fin
  FROM eventos_promocionales e
  WHERE e.activo = true
    AND e.fecha_inicio <= NOW()
    AND e.fecha_fin >= NOW()
  ORDER BY e.fecha_inicio DESC;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- =====================================================
-- 14. FUNCIÓN: Verificar si popup fue cerrado
-- =====================================================
CREATE OR REPLACE FUNCTION check_newsletter_status(p_email TEXT)
RETURNS TABLE(subscribed BOOLEAN, codigo TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT true, ns.codigo_descuento
  FROM newsletter_subscriptions ns
  WHERE ns.email = p_email;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- =====================================================
-- 15. RLS POLICIES para nuevas tablas
-- =====================================================

-- Newsletter (público para insert, privado para select)
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can subscribe" ON newsletter_subscriptions;
CREATE POLICY "Anyone can subscribe" ON newsletter_subscriptions FOR INSERT WITH CHECK (true);

-- Eventos (público para select)
ALTER TABLE eventos_promocionales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Events are public" ON eventos_promocionales;
CREATE POLICY "Events are public" ON eventos_promocionales FOR SELECT USING (activo = true);

-- Órdenes (solo el usuario puede ver sus órdenes)
ALTER TABLE ordenes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own orders" ON ordenes;
CREATE POLICY "Users can view own orders" ON ordenes FOR SELECT USING (auth.uid() = usuario_id);
DROP POLICY IF EXISTS "Users can insert own orders" ON ordenes;
CREATE POLICY "Users can insert own orders" ON ordenes FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- Items de orden (heredan permisos de la orden)
ALTER TABLE items_orden ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own order items" ON items_orden;
CREATE POLICY "Users can view own order items" ON items_orden FOR SELECT 
USING (EXISTS (SELECT 1 FROM ordenes WHERE ordenes.id = items_orden.orden_id AND ordenes.usuario_id = auth.uid()));

-- =====================================================
-- 16. DATOS DE EJEMPLO - Evento promocional activo
-- =====================================================
INSERT INTO eventos_promocionales (
  nombre, descripcion, tipo_descuento, valor_descuento, 
  banner_texto, banner_color, fecha_inicio, fecha_fin, activo
) VALUES (
  'Gran Liquidación de Invierno',
  'Descuentos increíbles en toda la tienda',
  'Porcentaje',
  20,
  'LIQUIDACIÓN: 20% en TODA la tienda con código INVIERNO20',
  '#003366',
  NOW() - INTERVAL '1 day',
  NOW() + INTERVAL '14 days',
  true
) ON CONFLICT DO NOTHING;

-- =====================================================
-- FINALIZACIÓN
-- =====================================================
SELECT '✅ TODAS LAS FUNCIONES RPC CREADAS CORRECTAMENTE' AS resultado;
