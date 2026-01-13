-- =====================================================
-- FASHIONSTORE - ESQUEMA COMPLETO (LIMPIO)
-- =====================================================
-- E-commerce de moda femenina y masculina premium
-- Ejecutar primero este archivo para limpiar la BD completamente
-- =====================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ELIMINAR TODAS LAS TABLAS EN ORDEN CORRECTO
-- =====================================================
DROP TABLE IF EXISTS campana_email_logs CASCADE;
DROP TABLE IF EXISTS campanas_email CASCADE;
DROP TABLE IF EXISTS inventario_movimientos CASCADE;
DROP TABLE IF EXISTS estadisticas_visualizacion CASCADE;
DROP TABLE IF EXISTS gustos_usuario CASCADE;
DROP TABLE IF EXISTS notificaciones CASCADE;
DROP TABLE IF EXISTS eventos_envio CASCADE;
DROP TABLE IF EXISTS envios CASCADE;
DROP TABLE IF EXISTS logs_transacciones CASCADE;
DROP TABLE IF EXISTS metodos_pago CASCADE;
DROP TABLE IF EXISTS carrito_cupones CASCADE;
DROP TABLE IF EXISTS cupon_uso CASCADE;
DROP TABLE IF EXISTS cupones_descuento CASCADE;
DROP TABLE IF EXISTS carrito_items CASCADE;
DROP TABLE IF EXISTS carrito CASCADE;
DROP TABLE IF EXISTS devoluciones CASCADE;
DROP TABLE IF EXISTS seguimiento_pedido CASCADE;
DROP TABLE IF EXISTS detalles_pedido CASCADE;
DROP TABLE IF EXISTS pedidos CASCADE;
DROP TABLE IF EXISTS codigos_descuento CASCADE;
DROP TABLE IF EXISTS lista_deseos CASCADE;
DROP TABLE IF EXISTS resenas CASCADE;
DROP TABLE IF EXISTS variantes_producto CASCADE;
DROP TABLE IF EXISTS imagenes_producto CASCADE;
DROP TABLE IF EXISTS productos CASCADE;
DROP TABLE IF EXISTS marcas CASCADE;
DROP TABLE IF EXISTS categorias CASCADE;
DROP TABLE IF EXISTS direcciones CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- =====================================================
-- TABLA: usuarios
-- =====================================================
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  apellidos TEXT,
  telefono TEXT,
  genero TEXT CHECK (genero IN ('Masculino', 'Femenino', 'Otro')),
  fecha_nacimiento DATE,
  foto_perfil TEXT,
  contraseña_hash TEXT,
  activo BOOLEAN DEFAULT TRUE,
  verificado BOOLEAN DEFAULT FALSE,
  fecha_registro TIMESTAMPTZ DEFAULT NOW(),
  ultimo_acceso TIMESTAMPTZ,
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_activo ON usuarios(activo);

-- =====================================================
-- TABLA: direcciones
-- =====================================================
CREATE TABLE direcciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo TEXT CHECK (tipo IN ('Envío', 'Facturación', 'Ambas')),
  nombre_destinatario TEXT NOT NULL,
  calle TEXT NOT NULL,
  numero TEXT NOT NULL,
  piso TEXT,
  codigo_postal TEXT NOT NULL,
  ciudad TEXT NOT NULL,
  provincia TEXT NOT NULL,
  pais TEXT DEFAULT 'España',
  es_predeterminada BOOLEAN DEFAULT FALSE,
  creada_en TIMESTAMPTZ DEFAULT NOW(),
  actualizada_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_direcciones_usuario_id ON direcciones(usuario_id);

-- =====================================================
-- TABLA: categorias
-- =====================================================
CREATE TABLE categorias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  icono TEXT,
  imagen_portada TEXT,
  padre_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  orden INT DEFAULT 0,
  activa BOOLEAN DEFAULT TRUE,
  creada_en TIMESTAMPTZ DEFAULT NOW(),
  actualizada_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_categorias_slug ON categorias(slug);
CREATE INDEX idx_categorias_activa ON categorias(activa);

-- =====================================================
-- TABLA: marcas
-- =====================================================
CREATE TABLE marcas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  logo TEXT,
  sitio_web TEXT,
  activa BOOLEAN DEFAULT TRUE,
  creada_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_marcas_slug ON marcas(slug);

-- =====================================================
-- TABLA: productos
-- =====================================================
CREATE TABLE productos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  descripcion_larga TEXT,
  precio_venta INTEGER NOT NULL CHECK (precio_venta > 0),
  precio_original INTEGER,
  costo INTEGER,
  stock_total INTEGER NOT NULL DEFAULT 0 CHECK (stock_total >= 0),
  sku TEXT UNIQUE,
  categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  marca_id UUID REFERENCES marcas(id) ON DELETE SET NULL,
  genero TEXT CHECK (genero IN ('Masculino', 'Femenino', 'Unisex')),
  color TEXT,
  material TEXT,
  destacado BOOLEAN DEFAULT FALSE,
  activo BOOLEAN DEFAULT TRUE,
  valoracion_promedio DECIMAL(3, 2) DEFAULT 0,
  total_resenas INTEGER DEFAULT 0,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_productos_slug ON productos(slug);
CREATE INDEX idx_productos_categoria_id ON productos(categoria_id);
CREATE INDEX idx_productos_marca_id ON productos(marca_id);
CREATE INDEX idx_productos_destacado ON productos(destacado);
CREATE INDEX idx_productos_activo ON productos(activo);

-- =====================================================
-- TABLA: imagenes_producto
-- =====================================================
CREATE TABLE imagenes_producto (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  url_miniatura TEXT,
  alt_text TEXT,
  orden INT DEFAULT 0,
  es_principal BOOLEAN DEFAULT FALSE,
  creada_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_imagenes_producto_id ON imagenes_producto(producto_id);

-- =====================================================
-- TABLA: variantes_producto
-- =====================================================
CREATE TABLE variantes_producto (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  talla TEXT NOT NULL,
  color TEXT,
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sku_variante TEXT UNIQUE,
  precio_adicional INTEGER DEFAULT 0,
  creada_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_variantes_producto_id ON variantes_producto(producto_id);

-- =====================================================
-- TABLA: resenas
-- =====================================================
CREATE TABLE resenas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  calificacion INT NOT NULL CHECK (calificacion >= 1 AND calificacion <= 5),
  titulo TEXT,
  comentario TEXT,
  verificada_compra BOOLEAN DEFAULT FALSE,
  util INT DEFAULT 0,
  no_util INT DEFAULT 0,
  estado TEXT CHECK (estado IN ('Pendiente', 'Aprobada', 'Rechazada')),
  creada_en TIMESTAMPTZ DEFAULT NOW(),
  actualizada_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_resenas_producto_id ON resenas(producto_id);
CREATE INDEX idx_resenas_usuario_id ON resenas(usuario_id);

-- =====================================================
-- TABLA: lista_deseos
-- =====================================================
CREATE TABLE lista_deseos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  anadida_en TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(usuario_id, producto_id)
);

CREATE INDEX idx_lista_deseos_usuario_id ON lista_deseos(usuario_id);

-- =====================================================
-- TABLA: pedidos
-- =====================================================
CREATE TABLE pedidos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_pedido TEXT NOT NULL UNIQUE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  estado TEXT NOT NULL CHECK (estado IN ('Pendiente', 'Confirmado', 'Pagado', 'Enviado', 'Entregado', 'Cancelado', 'Devuelto')),
  subtotal INTEGER NOT NULL DEFAULT 0,
  impuestos INTEGER NOT NULL DEFAULT 0,
  coste_envio INTEGER NOT NULL DEFAULT 0,
  descuento INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL,
  metodo_pago TEXT CHECK (metodo_pago IN ('Tarjeta', 'PayPal', 'Transferencia')),
  referencia_pago TEXT,
  direccion_envio_id UUID REFERENCES direcciones(id),
  direccion_facturacion_id UUID REFERENCES direcciones(id),
  notas TEXT,
  fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
  fecha_confirmacion TIMESTAMPTZ,
  fecha_pago TIMESTAMPTZ,
  fecha_envio TIMESTAMPTZ,
  fecha_entrega_estimada TIMESTAMPTZ,
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pedidos_usuario_id ON pedidos(usuario_id);
CREATE INDEX idx_pedidos_estado ON pedidos(estado);
CREATE INDEX idx_pedidos_numero ON pedidos(numero_pedido);
CREATE INDEX idx_pedidos_fecha ON pedidos(fecha_creacion);

-- =====================================================
-- TABLA: detalles_pedido
-- =====================================================
CREATE TABLE detalles_pedido (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  cantidad INT NOT NULL CHECK (cantidad > 0),
  talla TEXT,
  color TEXT,
  precio_unitario INTEGER NOT NULL,
  subtotal INTEGER NOT NULL,
  descuento INT DEFAULT 0,
  total INT NOT NULL,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_detalles_pedido_id ON detalles_pedido(pedido_id);
CREATE INDEX idx_detalles_producto_id ON detalles_pedido(producto_id);

-- =====================================================
-- TABLA: seguimiento_pedido
-- =====================================================
CREATE TABLE seguimiento_pedido (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  estado TEXT NOT NULL,
  descripcion TEXT,
  numero_tracking TEXT,
  ubicacion TEXT,
  fecha_actualizacion TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_seguimiento_pedido_id ON seguimiento_pedido(pedido_id);

-- =====================================================
-- TABLA: codigos_descuento
-- =====================================================
CREATE TABLE codigos_descuento (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo TEXT NOT NULL UNIQUE,
  tipo TEXT CHECK (tipo IN ('Porcentaje', 'Cantidad')),
  valor DECIMAL(10, 2) NOT NULL,
  minimo_compra INTEGER DEFAULT 0,
  maximo_uses INTEGER,
  usos_actuales INTEGER DEFAULT 0,
  categoria_id UUID REFERENCES categorias(id),
  activo BOOLEAN DEFAULT TRUE,
  fecha_inicio TIMESTAMPTZ,
  fecha_fin TIMESTAMPTZ,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_codigos_descuento_codigo ON codigos_descuento(codigo);

-- =====================================================
-- TABLA: devoluciones
-- =====================================================
CREATE TABLE devoluciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id),
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  motivo TEXT NOT NULL,
  descripcion TEXT,
  estado TEXT CHECK (estado IN ('Solicitada', 'Aprobada', 'En tránsito', 'Recibida', 'Rechazada')),
  numero_autorizacion TEXT UNIQUE,
  monto_reembolso INTEGER,
  fecha_solicitud TIMESTAMPTZ DEFAULT NOW(),
  fecha_procesamiento TIMESTAMPTZ,
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_devoluciones_usuario_id ON devoluciones(usuario_id);
CREATE INDEX idx_devoluciones_pedido_id ON devoluciones(pedido_id);

-- =====================================================
-- TABLA: carrito
-- =====================================================
CREATE TABLE carrito (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(usuario_id)
);

CREATE INDEX idx_carrito_usuario_id ON carrito(usuario_id);

-- =====================================================
-- TABLA: carrito_items
-- =====================================================
CREATE TABLE carrito_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  carrito_id UUID NOT NULL REFERENCES carrito(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  cantidad INT NOT NULL CHECK (cantidad > 0),
  talla TEXT,
  color TEXT,
  precio_unitario INTEGER NOT NULL,
  anadido_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_carrito_items_carrito_id ON carrito_items(carrito_id);

-- =====================================================
-- TABLA: cupones_descuento
-- =====================================================
CREATE TABLE cupones_descuento (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('Porcentaje', 'Cantidad Fija')),
  valor DECIMAL(10, 2) NOT NULL,
  minimo_compra INTEGER DEFAULT 0,
  maximo_uses INTEGER,
  usos_actuales INTEGER DEFAULT 0,
  categoria_id UUID REFERENCES categorias(id),
  activo BOOLEAN DEFAULT TRUE,
  fecha_inicio TIMESTAMPTZ,
  fecha_fin TIMESTAMPTZ,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cupones_codigo ON cupones_descuento(codigo);
CREATE INDEX idx_cupones_activo ON cupones_descuento(activo);

-- =====================================================
-- TABLA: cupon_uso
-- =====================================================
CREATE TABLE cupon_uso (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cupon_id UUID NOT NULL REFERENCES cupones_descuento(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  pedido_id UUID REFERENCES pedidos(id) ON DELETE SET NULL,
  usado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cupon_uso_cupon_id ON cupon_uso(cupon_id);
CREATE INDEX idx_cupon_uso_usuario_id ON cupon_uso(usuario_id);

-- =====================================================
-- TABLA: carrito_cupones
-- =====================================================
CREATE TABLE carrito_cupones (
  carrito_id UUID NOT NULL REFERENCES carrito(id) ON DELETE CASCADE,
  cupon_id UUID NOT NULL REFERENCES cupones_descuento(id) ON DELETE CASCADE,
  anadido_en TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (carrito_id, cupon_id)
);

-- =====================================================
-- TABLA: metodos_pago
-- =====================================================
CREATE TABLE metodos_pago (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('Tarjeta Crédito', 'Tarjeta Débito', 'PayPal', 'Transferencia')),
  es_predeterminado BOOLEAN DEFAULT FALSE,
  ultimos_digitos TEXT,
  fecha_expiracion TEXT,
  nombre_titular TEXT,
  referencia_externa TEXT UNIQUE,
  activo BOOLEAN DEFAULT TRUE,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_metodos_pago_usuario_id ON metodos_pago(usuario_id);

-- =====================================================
-- TABLA: logs_transacciones
-- =====================================================
CREATE TABLE logs_transacciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  tipo_evento TEXT NOT NULL,
  descripcion TEXT,
  referencia_externa TEXT,
  monto_procesado INTEGER,
  estado TEXT,
  respuesta_gateway TEXT,
  ip_cliente TEXT,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_logs_transacciones_pedido_id ON logs_transacciones(pedido_id);

-- =====================================================
-- TABLA: envios
-- =====================================================
CREATE TABLE envios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  tipo_envio TEXT NOT NULL CHECK (tipo_envio IN ('Estándar', 'Express', 'Premium')),
  numero_tracking TEXT UNIQUE,
  transportista TEXT,
  costo INTEGER NOT NULL DEFAULT 0,
  peso_kg DECIMAL(8, 2),
  dimensiones TEXT,
  estado TEXT DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'En preparación', 'Enviado', 'En tránsito', 'Entregado', 'Retrasado', 'Problema')),
  fecha_envio TIMESTAMPTZ,
  fecha_entrega_estimada TIMESTAMPTZ,
  fecha_entrega_real TIMESTAMPTZ,
  ubicacion_actual TEXT,
  firma_receptor TEXT,
  notas TEXT,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_envios_pedido_id ON envios(pedido_id);
CREATE INDEX idx_envios_tracking ON envios(numero_tracking);

-- =====================================================
-- TABLA: eventos_envio
-- =====================================================
CREATE TABLE eventos_envio (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  envio_id UUID NOT NULL REFERENCES envios(id) ON DELETE CASCADE,
  tipo_evento TEXT NOT NULL,
  descripcion TEXT,
  ubicacion TEXT,
  fecha_evento TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_eventos_envio_envio_id ON eventos_envio(envio_id);

-- =====================================================
-- TABLA: notificaciones
-- =====================================================
CREATE TABLE notificaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('Pedido', 'Envío', 'Reseña', 'Promoción', 'Sistema')),
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  referencia_id UUID,
  leida BOOLEAN DEFAULT FALSE,
  creada_en TIMESTAMPTZ DEFAULT NOW(),
  leida_en TIMESTAMPTZ
);

CREATE INDEX idx_notificaciones_usuario_id ON notificaciones(usuario_id);
CREATE INDEX idx_notificaciones_leida ON notificaciones(leida);

-- =====================================================
-- TABLA: gustos_usuario
-- =====================================================
CREATE TABLE gustos_usuario (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  categoria_id UUID REFERENCES categorias(id) ON DELETE CASCADE,
  marca_id UUID REFERENCES marcas(id) ON DELETE CASCADE,
  color_preferido TEXT,
  talla_preferida TEXT,
  puntuacion_interes INT DEFAULT 1 CHECK (puntuacion_interes >= 1 AND puntuacion_interes <= 5),
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gustos_usuario_usuario_id ON gustos_usuario(usuario_id);

-- =====================================================
-- TABLA: estadisticas_visualizacion
-- =====================================================
CREATE TABLE estadisticas_visualizacion (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  ip_cliente TEXT,
  user_agent TEXT,
  referencia TEXT,
  tiempo_permanencia INT,
  visualizado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_estadisticas_producto_id ON estadisticas_visualizacion(producto_id);
CREATE INDEX idx_estadisticas_usuario_id ON estadisticas_visualizacion(usuario_id);

-- =====================================================
-- TABLA: inventario_movimientos
-- =====================================================
CREATE TABLE inventario_movimientos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  tipo_movimiento TEXT NOT NULL CHECK (tipo_movimiento IN ('Compra', 'Devolucion', 'Ajuste', 'Dañado', 'Entrada')),
  cantidad INT NOT NULL,
  referencia TEXT,
  notas TEXT,
  creado_por UUID REFERENCES usuarios(id),
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inventario_producto_id ON inventario_movimientos(producto_id);

-- =====================================================
-- TABLA: campanas_email
-- =====================================================
CREATE TABLE campanas_email (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  asunto TEXT NOT NULL,
  contenido_html TEXT NOT NULL,
  estado TEXT DEFAULT 'Borrador' CHECK (estado IN ('Borrador', 'Programada', 'Enviada', 'Cancelada')),
  tipo_segmento TEXT CHECK (tipo_segmento IN ('Todos', 'Premium', 'Ofertas', 'Abandono')),
  fecha_programada TIMESTAMPTZ,
  fecha_envio TIMESTAMPTZ,
  total_destinatarios INT DEFAULT 0,
  total_enviados INT DEFAULT 0,
  total_abiertos INT DEFAULT 0,
  total_clicks INT DEFAULT 0,
  creada_en TIMESTAMPTZ DEFAULT NOW(),
  actualizada_en TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: campana_email_logs
-- =====================================================
CREATE TABLE campana_email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campana_id UUID NOT NULL REFERENCES campanas_email(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  estado TEXT CHECK (estado IN ('Enviado', 'Abierto', 'Click', 'Rebote')),
  fecha_evento TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_campana_logs_campana_id ON campana_email_logs(campana_id);

-- =====================================================
-- FUNCIÓN: Actualizar timestamp automáticamente
-- =====================================================
CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualización automática
CREATE TRIGGER trigger_usuarios_actualizado BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER trigger_direcciones_actualizado BEFORE UPDATE ON direcciones FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER trigger_productos_actualizado BEFORE UPDATE ON productos FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER trigger_resenas_actualizado BEFORE UPDATE ON resenas FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER trigger_pedidos_actualizado BEFORE UPDATE ON pedidos FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER trigger_devoluciones_actualizado BEFORE UPDATE ON devoluciones FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE resenas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "productos_select_publico" ON productos FOR SELECT USING (activo = TRUE);
CREATE POLICY "resenas_select_publico" ON resenas FOR SELECT USING (estado = 'Aprobada');

-- =====================================================
-- FIN DE CREACIÓN DE ESQUEMA
-- =====================================================
