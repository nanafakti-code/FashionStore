-- =====================================================
-- MIGRACIÓN: SISTEMA DE CUPONES ENTERPRISE
-- =====================================================
-- Fecha: 2024-02-03
-- Descripción: Separación de conceptos Promoción (Reglas) vs Cupón (Instancia)

-- 1. Crear Tabla PROMOCIONES (Reglas del Negocio)
CREATE TABLE IF NOT EXISTS promociones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  tipo_descuento TEXT CHECK (tipo_descuento IN ('Porcentaje', 'Cantidad')),
  valor DECIMAL(10, 2) NOT NULL,
  
  -- Reglas flexibles (JSONB)
  -- Ej: { "minimo_compra": 5000, "categorias": ["uuid"], "productos": ["uuid"] }
  reglas JSONB DEFAULT '{}'::JSONB,
  
  fecha_inicio TIMESTAMPTZ DEFAULT NOW(),
  fecha_fin TIMESTAMPTZ,
  activo BOOLEAN DEFAULT TRUE,
  origen TEXT DEFAULT 'Admin', -- 'Newsletter', 'Campaign', 'Admin'
  
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Crear Tabla CUPONES (Instancias Únicas)
CREATE TABLE IF NOT EXISTS cupones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promocion_id UUID NOT NULL REFERENCES promociones(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id), -- Dueño del cupón (Opcional si es público)
  codigo TEXT NOT NULL UNIQUE, -- El código que escribe el usuario
  
  estado TEXT DEFAULT 'Disponible' CHECK (estado IN ('Disponible', 'Usado', 'Bloqueado', 'Expirado')),
  
  fecha_asignacion TIMESTAMPTZ DEFAULT NOW(),
  fecha_uso TIMESTAMPTZ,
  pedido_id UUID REFERENCES pedidos(id), -- Donde se gastó
  
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cupones_codigo ON cupones(codigo);
CREATE INDEX IF NOT EXISTS idx_cupones_usuario ON cupones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_cupones_estado ON cupones(estado);

-- 3. Migración de Datos Existentes
DO $$
DECLARE
  r RECORD;
  v_promo_id UUID;
BEGIN
  -- Iterar sobre cupones antiguos
  FOR r IN SELECT * FROM cupones_descuento LOOP
    
    -- Crear Promoción basada en el cupón antiguo
    INSERT INTO promociones (
      nombre, descripcion, tipo_descuento, valor, 
      reglas, fecha_inicio, fecha_fin, activo, origen
    ) VALUES (
      'Promo Legacy: ' || r.codigo, 
      r.descripcion, 
      CASE WHEN r.tipo = 'Cantidad Fija' THEN 'Cantidad' ELSE r.tipo END, 
      r.valor,
      jsonb_build_object('minimo_compra', r.minimo_compra, 'maximo_usos', r.maximo_uses),
      r.fecha_inicio, 
      r.fecha_fin, 
      r.activo, 
      'Legacy'
    ) RETURNING id INTO v_promo_id;

    -- Crear Instancia de Cupón
    -- Nota: Como los antiguos no tenían dueño, los dejamos públicos (usuario_id NULL)
    INSERT INTO cupones (
      promocion_id, usuario_id, codigo, estado, creado_en
    ) VALUES (
      v_promo_id, 
      NULL, 
      r.codigo, 
      CASE WHEN r.activo THEN 'Disponible' ELSE 'Bloqueado' END,
      r.creado_en
    ) ON CONFLICT (codigo) DO NOTHING;

  END LOOP;
END $$;

-- 4. Actualizar RPC: validate_coupon
CREATE OR REPLACE FUNCTION validate_coupon(p_codigo TEXT, p_subtotal INTEGER, p_usuario_id UUID DEFAULT NULL)
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
  v_promo RECORD;
  v_descuento INTEGER;
  v_reglas JSONB;
  v_min_compra INTEGER;
  v_actual_user_id UUID;
BEGIN
  -- 1. Buscar el cupón (Instancia)
  SELECT * INTO v_cupon FROM cupones 
  WHERE codigo = UPPER(p_codigo);
  
  IF v_cupon IS NULL THEN
    RETURN QUERY SELECT false, 'Cupón no encontrado'::TEXT, NULL::TEXT, NULL::DECIMAL, 0, NULL::UUID;
    RETURN;
  END IF;

  -- 2. Verificar Estado Instancia
  IF v_cupon.estado != 'Disponible' THEN
    RETURN QUERY SELECT false, ('El cupón está ' || v_cupon.estado)::TEXT, NULL::TEXT, NULL::DECIMAL, 0, NULL::UUID;
    RETURN;
  END IF;

  -- 3. Verificar Propiedad (Si tiene dueño)
  v_actual_user_id := COALESCE(p_usuario_id, auth.uid());
  
  IF v_cupon.usuario_id IS NOT NULL THEN
    IF v_actual_user_id IS NULL OR v_actual_user_id != v_cupon.usuario_id THEN
      RETURN QUERY SELECT false, 'Este cupón no te pertenece'::TEXT, NULL::TEXT, NULL::DECIMAL, 0, NULL::UUID;
      RETURN;
    END IF;
  END IF;

  -- 4. Buscar Promoción (Reglas)
  SELECT * INTO v_promo FROM promociones WHERE id = v_cupon.promocion_id;

  -- 5. Verificar Estado Promoción
  IF v_promo.activo = FALSE THEN
    RETURN QUERY SELECT false, 'La promoción ha finalizado'::TEXT, NULL::TEXT, NULL::DECIMAL, 0, NULL::UUID;
    RETURN;
  END IF;

  IF v_promo.fecha_inicio > NOW() OR (v_promo.fecha_fin IS NOT NULL AND v_promo.fecha_fin < NOW()) THEN
    RETURN QUERY SELECT false, 'La promoción no está vigente'::TEXT, NULL::TEXT, NULL::DECIMAL, 0, NULL::UUID;
    RETURN;
  END IF;

  -- 6. Verificar Reglas (JSONB)
  v_reglas := v_promo.reglas;
  
  -- Mínimo de compra
  IF v_reglas ? 'minimo_compra' THEN
    v_min_compra := (v_reglas->>'minimo_compra')::INTEGER;
    IF p_subtotal < v_min_compra THEN
       RETURN QUERY SELECT false, ('Compra mínima requerida: ' || (v_min_compra / 100)::TEXT || '€')::TEXT, NULL::TEXT, NULL::DECIMAL, 0, NULL::UUID;
       RETURN;
    END IF;
  END IF;

  -- 7. Calcular Descuento
  IF v_promo.tipo_descuento = 'Porcentaje' THEN
    v_descuento := ROUND((p_subtotal * v_promo.valor) / 100);
  ELSE
    v_descuento := LEAST(v_promo.valor::INTEGER * 100, p_subtotal); -- Valor en céntimos
  END IF;

  RETURN QUERY SELECT 
    true, 
    '¡Cupón aplicado correctamente!'::TEXT, 
    v_promo.tipo_descuento, 
    v_promo.valor, 
    v_descuento,
    v_cupon.id;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- 5. Actualizar RPC: create_order_from_checkout (Consumo del cupón)
-- Necesitamos modificar la parte donde se registra el uso del cupón
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
  -- Verificar items
  IF jsonb_array_length(p_items) = 0 THEN
    RETURN QUERY SELECT false, 'No hay items en el pedido'::TEXT, NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;
  
  -- Generar número
  v_numero_orden := generate_order_number();
  
  -- Verificar Stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_producto_id := (v_item->>'producto_id')::UUID;
    v_cantidad := (v_item->>'cantidad')::INTEGER;
    
    SELECT stock_total INTO v_stock_actual FROM productos WHERE id = v_producto_id;
    
    IF v_stock_actual IS NULL OR v_stock_actual < v_cantidad THEN
      RETURN QUERY SELECT false, ('Stock insuficiente para: ' || (v_item->>'nombre'))::TEXT, NULL::UUID, NULL::TEXT;
      RETURN;
    END IF;
  END LOOP;
  
  -- Crear Orden
  INSERT INTO ordenes (
    usuario_id, numero_orden, estado, subtotal, impuestos, descuento, total,
    cupon_id, stripe_session_id, email_cliente, nombre_cliente, telefono_cliente, 
    direccion_envio, fecha_pago
  ) VALUES (
    auth.uid(), v_numero_orden, 'Pagado', p_subtotal, p_impuestos, p_descuento, p_total,
    p_cupon_id, p_stripe_session_id, p_email, p_nombre, p_telefono,
    p_direccion, NOW()
  ) RETURNING id INTO v_orden_id;
  
  -- Crear Items y Restar Stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_producto_id := (v_item->>'producto_id')::UUID;
    v_cantidad := (v_item->>'cantidad')::INTEGER;
    
    INSERT INTO items_orden (
      orden_id, producto_id, producto_nombre, producto_imagen, cantidad, 
      talla, color, precio_unitario, subtotal
    ) VALUES (
      v_orden_id, v_producto_id, v_item->>'nombre', v_item->>'imagen', v_cantidad,
      v_item->>'talla', v_item->>'color', (v_item->>'precio_unitario')::INTEGER,
      v_cantidad * (v_item->>'precio_unitario')::INTEGER
    );
    
    UPDATE productos SET stock_total = stock_total - v_cantidad WHERE id = v_producto_id;
  END LOOP;
  
  -- CONSUMIR CUPÓN (Nueva Lógica)
  IF p_cupon_id IS NOT NULL THEN
    UPDATE cupones 
    SET estado = 'Usado', 
        fecha_uso = NOW(),
        pedido_id = v_orden_id
    WHERE id = p_cupon_id;
    
    -- Opcional: Registrar en tabla histórica si se mantiene cupon_uso por redundancia,
    -- pero con la tabla 'cupones' ya tenemos el estado y el pedido_id.
  END IF;
  
  -- Limpieza
  DELETE FROM carrito_items WHERE carrito_id IN (SELECT id FROM carrito WHERE usuario_id = auth.uid());
  -- DELETE FROM cart_reservations WHERE user_id = auth.uid(); -- Si existe
  
  RETURN QUERY SELECT true, 'Orden creada exitosamente'::TEXT, v_orden_id, v_numero_orden;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Actualizar RPC: newsletter_signup
CREATE OR REPLACE FUNCTION newsletter_signup(p_email TEXT)
RETURNS TABLE(success BOOLEAN, message TEXT, codigo TEXT) AS $$
DECLARE
  v_codigo TEXT;
  v_promo_id UUID;
  v_usuario_id UUID;
  v_exists BOOLEAN;
BEGIN
  -- Verificar suscripción existente
  SELECT EXISTS(SELECT 1 FROM newsletter_subscriptions WHERE email = p_email) INTO v_exists;
  
  IF v_exists THEN
    -- Recuperar código asignado si existe en la nueva tabla
    SELECT c.codigo INTO v_codigo 
    FROM cupones c
    JOIN cupones_descuento old ON old.codigo = c.codigo -- Join trick or look up by logic?
    -- Mejor: Si ya existe suscripción, devolvemos mensaje genérico o buscamos su cupón activo
    WHERE c.estado = 'Disponible' LIMIT 1; -- Simplificación
    
    RETURN QUERY SELECT true, 'Ya estás suscrito.'::TEXT, COALESCE(v_codigo, 'YA_SUSCRITO');
    RETURN;
  END IF;
  
  -- Registrar suscripción
  INSERT INTO newsletter_subscriptions (email) VALUES (p_email);
  
  -- Buscar o Crear Promoción de Bienvenida
  SELECT id INTO v_promo_id FROM promociones WHERE nombre = 'Newsletter Welcome' LIMIT 1;
  
  IF v_promo_id IS NULL THEN
    INSERT INTO promociones (
      nombre, descripcion, tipo_descuento, valor, reglas, origen
    ) VALUES (
      'Newsletter Welcome', 'Descuento de bienvenida', 'Porcentaje', 10, '{"minimo_compra": 0}'::JSONB, 'Newsletter'
    ) RETURNING id INTO v_promo_id;
  END IF;
  
  -- Intentar enlazar usuario si existe
  SELECT id INTO v_usuario_id FROM usuarios WHERE email = p_email;
  
  -- Generar Código Único
  v_codigo := 'WELCOME-' || UPPER(SUBSTRING(MD5(p_email || NOW()::TEXT) FROM 1 FOR 6));
  
  -- Crear Instancia de Cupón
  INSERT INTO cupones (
    promocion_id, usuario_id, codigo, estado
  ) VALUES (
    v_promo_id, v_usuario_id, v_codigo, 'Disponible'
  );
  
  RETURN QUERY SELECT true, '¡Gracias por suscribirte!'::TEXT, v_codigo;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
