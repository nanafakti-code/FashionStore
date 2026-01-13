-- =====================================================
-- FASHIONSTORE - ESQUEMA COMPLETO DE BASE DE DATOS
-- =====================================================
-- E-commerce de moda femenina y masculina premium
-- Stack: Astro 5.0 + Supabase + Tailwind CSS
-- =====================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- DROP TABLES (Eliminar tablas antiguas - IMPORTANTE: Orden correcto)
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

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON usuarios(activo);

-- =====================================================
-- TABLA: direcciones
-- =====================================================
CREATE TABLE IF NOT EXISTS direcciones (
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

CREATE INDEX IF NOT EXISTS idx_direcciones_usuario_id ON direcciones(usuario_id);

-- =====================================================
-- TABLA: categorias
-- =====================================================
CREATE TABLE IF NOT EXISTS categorias (
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

CREATE INDEX IF NOT EXISTS idx_categorias_slug ON categorias(slug);
CREATE INDEX IF NOT EXISTS idx_categorias_activa ON categorias(activa);

-- =====================================================
-- TABLA: marcas
-- =====================================================
CREATE TABLE IF NOT EXISTS marcas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  logo TEXT,
  sitio_web TEXT,
  activa BOOLEAN DEFAULT TRUE,
  creada_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marcas_slug ON marcas(slug);

-- =====================================================
-- TABLA: productos
-- =====================================================
CREATE TABLE IF NOT EXISTS productos (
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

CREATE INDEX IF NOT EXISTS idx_productos_slug ON productos(slug);
CREATE INDEX IF NOT EXISTS idx_productos_categoria_id ON productos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_productos_marca_id ON productos(marca_id);
CREATE INDEX IF NOT EXISTS idx_productos_destacado ON productos(destacado);
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo);

-- =====================================================
-- TABLA: imagenes_producto
-- =====================================================
CREATE TABLE IF NOT EXISTS imagenes_producto (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  url_miniatura TEXT,
  alt_text TEXT,
  orden INT DEFAULT 0,
  es_principal BOOLEAN DEFAULT FALSE,
  creada_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_imagenes_producto_id ON imagenes_producto(producto_id);

-- =====================================================
-- TABLA: variantes_producto
-- =====================================================
CREATE TABLE IF NOT EXISTS variantes_producto (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  talla TEXT NOT NULL,
  color TEXT,
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sku_variante TEXT UNIQUE,
  precio_adicional INTEGER DEFAULT 0,
  creada_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_variantes_producto_id ON variantes_producto(producto_id);

-- =====================================================
-- TABLA: resenas
-- =====================================================
CREATE TABLE IF NOT EXISTS resenas (
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

CREATE INDEX IF NOT EXISTS idx_resenas_producto_id ON resenas(producto_id);
CREATE INDEX IF NOT EXISTS idx_resenas_usuario_id ON resenas(usuario_id);

-- =====================================================
-- TABLA: lista_deseos
-- =====================================================
CREATE TABLE IF NOT EXISTS lista_deseos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  anadida_en TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(usuario_id, producto_id)
);

CREATE INDEX IF NOT EXISTS idx_lista_deseos_usuario_id ON lista_deseos(usuario_id);

-- =====================================================
-- TABLA: pedidos
-- =====================================================
CREATE TABLE IF NOT EXISTS pedidos (
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

CREATE INDEX IF NOT EXISTS idx_pedidos_usuario_id ON pedidos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_numero ON pedidos(numero_pedido);
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha ON pedidos(fecha_creacion);

-- =====================================================
-- TABLA: detalles_pedido
-- =====================================================
CREATE TABLE IF NOT EXISTS detalles_pedido (
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

CREATE INDEX IF NOT EXISTS idx_detalles_pedido_id ON detalles_pedido(pedido_id);
CREATE INDEX IF NOT EXISTS idx_detalles_producto_id ON detalles_pedido(producto_id);

-- =====================================================
-- TABLA: seguimiento_pedido
-- =====================================================
CREATE TABLE IF NOT EXISTS seguimiento_pedido (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  estado TEXT NOT NULL,
  descripcion TEXT,
  numero_tracking TEXT,
  ubicacion TEXT,
  fecha_actualizacion TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seguimiento_pedido_id ON seguimiento_pedido(pedido_id);

-- =====================================================
-- TABLA: codigos_descuento
-- =====================================================
CREATE TABLE IF NOT EXISTS codigos_descuento (
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

CREATE INDEX IF NOT EXISTS idx_codigos_descuento_codigo ON codigos_descuento(codigo);

-- =====================================================
-- TABLA: devoluciones
-- =====================================================
CREATE TABLE IF NOT EXISTS devoluciones (
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

CREATE INDEX IF NOT EXISTS idx_devoluciones_usuario_id ON devoluciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_devoluciones_pedido_id ON devoluciones(pedido_id);

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

-- Drops de triggers si existen
DROP TRIGGER IF EXISTS trigger_usuarios_actualizado ON usuarios;
DROP TRIGGER IF EXISTS trigger_direcciones_actualizado ON direcciones;
DROP TRIGGER IF EXISTS trigger_productos_actualizado ON productos;
DROP TRIGGER IF EXISTS trigger_resenas_actualizado ON resenas;
DROP TRIGGER IF EXISTS trigger_pedidos_actualizado ON pedidos;
DROP TRIGGER IF EXISTS trigger_devoluciones_actualizado ON devoluciones;
DROP TRIGGER IF EXISTS trigger_actualizar_valoracion ON resenas;

-- Triggers
CREATE TRIGGER trigger_usuarios_actualizado
  BEFORE UPDATE ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trigger_direcciones_actualizado
  BEFORE UPDATE ON direcciones
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trigger_productos_actualizado
  BEFORE UPDATE ON productos
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trigger_resenas_actualizado
  BEFORE UPDATE ON resenas
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trigger_pedidos_actualizado
  BEFORE UPDATE ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trigger_devoluciones_actualizado
  BEFORE UPDATE ON devoluciones
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_timestamp();

-- =====================================================
-- SECUENCIA para números de pedido
-- =====================================================
CREATE SEQUENCE IF NOT EXISTS pedidos_seq START 1000;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE resenas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "productos_select_publico" ON productos;
CREATE POLICY "productos_select_publico" ON productos FOR SELECT USING (activo = TRUE);

DROP POLICY IF EXISTS "resenas_select_publico" ON resenas;
CREATE POLICY "resenas_select_publico" ON resenas FOR SELECT USING (estado = 'Aprobada');

-- =====================================================
-- DATOS DE EJEMPLO - USUARIOS
-- =====================================================
INSERT INTO usuarios (email, nombre, apellidos, telefono, genero, fecha_nacimiento, activo, verificado) VALUES
  ('admin@fashionstore.com', 'Administrador', 'FashionStore', '600000000', 'Masculino', '1990-01-01', TRUE, TRUE),
  ('maria.garcia@email.com', 'María', 'García López', '600123456', 'Femenino', '1995-03-15', TRUE, TRUE),
  ('carlos.rodriguez@email.com', 'Carlos', 'Rodríguez Martín', '600234567', 'Masculino', '1988-07-22', TRUE, TRUE),
  ('laura.martin@email.com', 'Laura', 'Martín Sánchez', '600345678', 'Femenino', '1992-11-08', TRUE, TRUE),
  ('antonio.lopez@email.com', 'Antonio', 'López García', '600456789', 'Masculino', '1990-05-30', TRUE, TRUE),
  ('isabel.fernandez@email.com', 'Isabel', 'Fernández Ruiz', '600567890', 'Femenino', '1998-01-19', TRUE, TRUE)
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- DATOS DE EJEMPLO - CATEGORÍAS
-- =====================================================
INSERT INTO categorias (nombre, slug, descripcion, orden, activa) VALUES
  ('Teléfonos Inteligentes', 'smartphones', 'Teléfonos inteligentes reacondicionados', 1, TRUE),
  ('Portátiles', 'laptops', 'Computadoras portátiles de última generación', 2, TRUE),
  ('Tabletas', 'tablets', 'Tabletas iPad y Android', 3, TRUE),
  ('Audio', 'audio', 'Auriculares y altavoces premium', 4, TRUE),
  ('Dispositivos Portátiles', 'wearables', 'Relojes inteligentes y pulseras inteligentes', 5, TRUE),
  ('Cámaras', 'camaras', 'Cámaras digitales y de acción', 6, TRUE),
  ('Monitores', 'monitores', 'Monitores para juegos y profesionales', 7, TRUE),
  ('Consolas', 'consolas', 'Consolas de juegos reacondicionadas', 8, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- DATOS DE EJEMPLO - MARCAS
-- =====================================================
INSERT INTO marcas (nombre, slug, descripcion, activa) VALUES
  ('Apple', 'apple', 'Dispositivos Apple de última generación', TRUE),
  ('Samsung', 'samsung', 'Electrónica Samsung de calidad premium', TRUE),
  ('Sony', 'sony', 'Productos Sony de audio y electrónica', TRUE),
  ('LG', 'lg', 'Televisores y monitores LG de calidad', TRUE)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- DATOS DE EJEMPLO - PRODUCTOS
-- =====================================================
INSERT INTO productos (nombre, slug, descripcion, descripcion_larga, precio_venta, precio_original, costo, stock_total, categoria_id, marca_id, genero, color, material, destacado, activo) VALUES
(
  'iPhone 15 Pro Max',
  'iphone-15-pro-max',
  'Smartphone flagship de Apple',
  'iPhone 15 Pro Max en perfecto estado. Pantalla OLED 6.7", procesador A17 Pro, cámara 48MP. Batería con 95% de salud. Incluye carcasa y cable original. Garantía 24 meses.',
  139900, 199900, 60000, 35,
  (SELECT id FROM categorias WHERE slug = 'smartphones'),
  (SELECT id FROM marcas WHERE slug = 'apple'),
  'Unisex', 'Negro', 'Metal/Cristal', TRUE, TRUE
),
(
  'Samsung Galaxy S24 Ultra',
  'samsung-galaxy-s24-ultra',
  'Smartphone premium de Samsung',
  'Samsung Galaxy S24 Ultra con Snapdragon 8 Gen 3. Pantalla AMOLED 6.8", cámara 200MP. Prácticamente nuevo, apenas usado.',
  129900, 189900, 55000, 28,
  (SELECT id FROM categorias WHERE slug = 'smartphones'),
  (SELECT id FROM marcas WHERE slug = 'samsung'),
  'Unisex', 'Gris', 'Metal/Cristal', TRUE, TRUE
),
(
  'MacBook Pro 16 M3 Max',
  'macbook-pro-16-m3-max',
  'Laptop profesional de Apple',
  'MacBook Pro 16 pulgadas con chip M3 Max, 36GB RAM, 512GB SSD. Batería al 98%. Incluye cargador original. Garantía 24 meses. Perfecto para profesionales.',
  239900, 349900, 100000, 12,
  (SELECT id FROM categorias WHERE slug = 'laptops'),
  (SELECT id FROM marcas WHERE slug = 'apple'),
  'Unisex', 'Gris Espacial', 'Aluminio', TRUE, TRUE
),
(
  'Dell XPS 15',
  'dell-xps-15',
  'Laptop potente para edición',
  'Dell XPS 15 con Intel i7-13700H, RTX 4060, 16GB RAM. Pantalla 4K OLED. Excelente para edición de video y diseño gráfico.',
  119900, 179900, 50000, 18,
  (SELECT id FROM categorias WHERE slug = 'laptops'),
  (SELECT id FROM marcas WHERE slug = 'lg'),
  'Unisex', 'Platino', 'Metal', FALSE, TRUE
),
(
  'iPad Pro 12.9 M2',
  'ipad-pro-129-m2',
  'Tablet profesional de Apple',
  'iPad Pro 12.9 con chip M2, pantalla Liquid Retina XDR, 256GB almacenamiento. Incluye Apple Pencil. Garantía 24 meses.',
  89900, 129900, 40000, 15,
  (SELECT id FROM categorias WHERE slug = 'tablets'),
  (SELECT id FROM marcas WHERE slug = 'apple'),
  'Unisex', 'Gris Espacial', 'Aluminio', TRUE, TRUE
),
(
  'Sony WH-1000XM5',
  'sony-wh-1000xm5',
  'Auriculares con cancelación de ruido',
  'Sony WH-1000XM5 - Los mejores auriculares con cancelación de ruido. Autonomía 30 horas, sonido premium. Perfectos para viajes.',
  34900, 47900, 15000, 22,
  (SELECT id FROM categorias WHERE slug = 'audio'),
  (SELECT id FROM marcas WHERE slug = 'sony'),
  'Unisex', 'Negro', 'Plástico/Metal', TRUE, TRUE
),
(
  'AirPods Pro 2',
  'airpods-pro-2',
  'Auriculares inalámbricos de Apple',
  'AirPods Pro 2 con cancelación de ruido activa, audio espacial, carga inalámbrica. Garantía 24 meses. Compatibles con todos los dispositivos Apple.',
  19900, 27900, 8000, 45,
  (SELECT id FROM categorias WHERE slug = 'audio'),
  (SELECT id FROM marcas WHERE slug = 'apple'),
  'Unisex', 'Blanco', 'Plástico', FALSE, TRUE
),
(
  'Apple Watch Ultra',
  'apple-watch-ultra',
  'Smartwatch resistente de Apple',
  'Apple Watch Ultra con titanio, pantalla LTPO OLED, resistencia extrema. Ideal para deportistas y aventureros. Garantía 24 meses.',
  39900, 59900, 18000, 20,
  (SELECT id FROM categorias WHERE slug = 'wearables'),
  (SELECT id FROM marcas WHERE slug = 'apple'),
  'Unisex', 'Titanio', 'Titanio', TRUE, TRUE
),
(
  'Samsung Galaxy Watch 6',
  'samsung-galaxy-watch-6-classic',
  'Smartwatch con bisel giratorio',
  'Galaxy Watch 6 Classic con bisel giratorio, AMOLED 1.4", Wear OS 3. Excelente batería y procesador potente.',
  19900, 34900, 9000, 25,
  (SELECT id FROM categorias WHERE slug = 'wearables'),
  (SELECT id FROM marcas WHERE slug = 'samsung'),
  'Unisex', 'Negro', 'Metal', FALSE, TRUE
),
(
  'Canon EOS R6',
  'canon-eos-r6',
  'Cámara profesional sin espejo',
  'Canon EOS R6 - Cámara profesional, sensor full-frame 20MP, video 4K. Incluye lentes. Garantía 12 meses. Perfecta para fotografía profesional.',
  179900, 269900, 80000, 8,
  (SELECT id FROM categorias WHERE slug = 'camaras'),
  (SELECT id FROM marcas WHERE slug = 'sony'),
  'Unisex', 'Negro', 'Metal/Polímero', TRUE, TRUE
),
(
  'GoPro Hero 12',
  'gopro-hero-12',
  'Cámara de acción 5.3K',
  'GoPro Hero 12 Black - 5.3K video, HyperSmooth, resistente al agua. Perfecta para aventura y deportes extremos.',
  39900, 54900, 17000, 30,
  (SELECT id FROM categorias WHERE slug = 'camaras'),
  (SELECT id FROM marcas WHERE slug = 'sony'),
  'Unisex', 'Negro', 'Plástico/Metal', FALSE, TRUE
),
(
  'LG UltraWide 34',
  'lg-ultrawide-34-oled',
  'Monitor OLED ultraancho',
  'LG 34" OLED UltraWide, 3440x1440, 240Hz. Color perfecto para profesionales y gamers. Garantía 24 meses.',
  79900, 119900, 35000, 10,
  (SELECT id FROM categorias WHERE slug = 'monitores'),
  (SELECT id FROM marcas WHERE slug = 'lg'),
  'Unisex', 'Negro', 'Metal/Plástico', TRUE, TRUE
),
(
  'PlayStation 5',
  'playstation-5',
  'Consola gaming next-gen',
  'PS5 con 2 controles DualSense, incluye juegos y cables. La consola más potente del mercado. Garantía 12 meses.',
  39900, 59900, 18000, 15,
  (SELECT id FROM categorias WHERE slug = 'consolas'),
  (SELECT id FROM marcas WHERE slug = 'sony'),
  'Unisex', 'Blanco/Negro', 'Plástico', TRUE, TRUE
),
(
  'Xbox Series X',
  'xbox-series-x',
  'Consola gaming Microsoft',
  'Xbox Series X - La consola más potente. Incluye Game Pass 3 meses y controles. Excelente biblioteca de juegos.',
  44900, 64900, 20000, 12,
  (SELECT id FROM categorias WHERE slug = 'consolas'),
  (SELECT id FROM marcas WHERE slug = 'lg'),
  'Unisex', 'Negro', 'Plástico', FALSE, TRUE
)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- DATOS DE EJEMPLO - IMÁGENES
-- =====================================================
INSERT INTO imagenes_producto (producto_id, url, es_principal, orden) VALUES
((SELECT id FROM productos WHERE slug = 'iphone-15-pro-max'), 'https://images.unsplash.com/photo-1592286927505-1def25115558?w=500&h=700&fit=crop&bg=white', TRUE, 1),
((SELECT id FROM productos WHERE slug = 'samsung-galaxy-s24-ultra'), 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&h=700&fit=crop&bg=white', TRUE, 1),
((SELECT id FROM productos WHERE slug = 'macbook-pro-16-m3-max'), 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&h=700&fit=crop&bg=white', TRUE, 1),
((SELECT id FROM productos WHERE slug = 'dell-xps-15'), 'https://images.unsplash.com/photo-1593642632693-aba93a858e44?w=500&h=700&fit=crop&bg=white', TRUE, 1),
((SELECT id FROM productos WHERE slug = 'ipad-pro-129-m2'), 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=500&h=700&fit=crop&bg=white', TRUE, 1),
((SELECT id FROM productos WHERE slug = 'sony-wh-1000xm5'), 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500&h=700&fit=crop&bg=white', TRUE, 1),
((SELECT id FROM productos WHERE slug = 'airpods-pro-2'), 'https://images.unsplash.com/photo-1606084285291-a602b5470371?w=500&h=700&fit=crop&bg=white', TRUE, 1),
((SELECT id FROM productos WHERE slug = 'apple-watch-ultra'), 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=700&fit=crop&bg=white', TRUE, 1),
((SELECT id FROM productos WHERE slug = 'samsung-galaxy-watch-6-classic'), 'https://images.unsplash.com/photo-1629505462235-0b2ce9cee8a6?w=500&h=700&fit=crop&bg=white', TRUE, 1),
((SELECT id FROM productos WHERE slug = 'canon-eos-r6'), 'https://images.unsplash.com/photo-1606986628025-35d57e735ae0?w=500&h=700&fit=crop&bg=white', TRUE, 1),
((SELECT id FROM productos WHERE slug = 'gopro-hero-12'), 'https://images.unsplash.com/photo-1609034227505-5876f6aa4e90?w=500&h=700&fit=crop&bg=white', TRUE, 1),
((SELECT id FROM productos WHERE slug = 'lg-ultrawide-34-oled'), 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500&h=700&fit=crop&bg=white', TRUE, 1),
((SELECT id FROM productos WHERE slug = 'playstation-5'), 'https://images.unsplash.com/photo-1606141471246-0f88e2a2ae19?w=500&h=700&fit=crop&bg=white', TRUE, 1),
((SELECT id FROM productos WHERE slug = 'xbox-series-x'), 'https://images.unsplash.com/photo-1609710228159-0fa9bd7c3784?w=500&h=700&fit=crop&bg=white', TRUE, 1);

-- =====================================================
-- DATOS DE EJEMPLO - VARIANTES
-- =====================================================
INSERT INTO variantes_producto (producto_id, talla, color, stock) VALUES
((SELECT id FROM productos WHERE slug = 'iphone-15-pro-max'), '128GB', 'Negro', 15),
((SELECT id FROM productos WHERE slug = 'iphone-15-pro-max'), '256GB', 'Negro', 12),
((SELECT id FROM productos WHERE slug = 'iphone-15-pro-max'), '512GB', 'Negro', 8),
((SELECT id FROM productos WHERE slug = 'iphone-15-pro-max'), '128GB', 'Titanio', 10),
((SELECT id FROM productos WHERE slug = 'samsung-galaxy-s24-ultra'), '256GB', 'Gris', 12),
((SELECT id FROM productos WHERE slug = 'samsung-galaxy-s24-ultra'), '512GB', 'Gris', 9),
((SELECT id FROM productos WHERE slug = 'samsung-galaxy-s24-ultra'), '256GB', 'Negro', 7),
((SELECT id FROM productos WHERE slug = 'samsung-galaxy-s24-ultra'), '512GB', 'Negro', 3),
((SELECT id FROM productos WHERE slug = 'macbook-pro-16-m3-max'), '512GB', 'Gris Espacial', 5),
((SELECT id FROM productos WHERE slug = 'macbook-pro-16-m3-max'), '1TB', 'Gris Espacial', 4),
((SELECT id FROM productos WHERE slug = 'macbook-pro-16-m3-max'), '512GB', 'Plata', 3),
((SELECT id FROM productos WHERE slug = 'macbook-pro-16-m3-max'), '1TB', 'Plata', 2),
((SELECT id FROM productos WHERE slug = 'ipad-pro-129-m2'), '128GB', 'Gris Espacial', 8),
((SELECT id FROM productos WHERE slug = 'ipad-pro-129-m2'), '256GB', 'Gris Espacial', 5),
((SELECT id FROM productos WHERE slug = 'ipad-pro-129-m2'), '128GB', 'Plata', 4);

-- =====================================================
-- DATOS DE EJEMPLO - RESEÑAS
-- =====================================================
INSERT INTO resenas (producto_id, usuario_id, calificacion, titulo, comentario, verificada_compra, estado) VALUES
(
  (SELECT id FROM productos WHERE slug = 'iphone-15-pro-max'),
  (SELECT id FROM usuarios WHERE email = 'maria.garcia@email.com'),
  5,
  'Excelente smartphone en perfecto estado',
  'El iPhone es impecable, funciona de maravilla. La batería está al 95% como se indicaba. Muy buen precio para un refurbished. Altamente recomendado.',
  TRUE,
  'Aprobada'
),
(
  (SELECT id FROM productos WHERE slug = 'macbook-pro-16-m3-max'),
  (SELECT id FROM usuarios WHERE email = 'carlos.rodriguez@email.com'),
  5,
  'Laptop potente y confiable',
  'MacBook de trabajo profesional. El rendimiento es excepcional, la batería dura mucho. Perfecto para edición y desarrollo. 100% recomendado.',
  TRUE,
  'Aprobada'
),
(
  (SELECT id FROM productos WHERE slug = 'sony-wh-1000xm5'),
  (SELECT id FROM usuarios WHERE email = 'laura.martin@email.com'),
  5,
  'Los mejores auriculares con cancelación',
  'Cancelación de ruido impresionante. La calidad de sonido es premium. He viajado varias veces y no puedo estar sin ellos. Excelente compra.',
  TRUE,
  'Aprobada'
),
(
  (SELECT id FROM productos WHERE slug = 'playstation-5'),
  (SELECT id FROM usuarios WHERE email = 'isabel.fernandez@email.com'),
  5,
  'Consola gaming de lujo',
  'PS5 funciona perfectamente. Juegos en 4K a 120fps. Entrega rápida. Super feliz con la compra. La mejor generación de consolas.',
  TRUE,
  'Aprobada'
);

-- =====================================================
-- =====================================================
-- TABLA: carrito
-- =====================================================
CREATE TABLE IF NOT EXISTS carrito (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(usuario_id)
);

CREATE INDEX IF NOT EXISTS idx_carrito_usuario_id ON carrito(usuario_id);

-- =====================================================
-- TABLA: carrito_items
-- =====================================================
CREATE TABLE IF NOT EXISTS carrito_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  carrito_id UUID NOT NULL REFERENCES carrito(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  cantidad INT NOT NULL CHECK (cantidad > 0),
  talla TEXT,
  color TEXT,
  precio_unitario INTEGER NOT NULL,
  anadido_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_carrito_items_carrito_id ON carrito_items(carrito_id);

-- =====================================================
-- TABLA: cupones_descuento
-- =====================================================
CREATE TABLE IF NOT EXISTS cupones_descuento (
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

CREATE INDEX IF NOT EXISTS idx_cupones_codigo ON cupones_descuento(codigo);
CREATE INDEX IF NOT EXISTS idx_cupones_activo ON cupones_descuento(activo);

-- =====================================================
-- TABLA: cupon_uso
-- =====================================================
CREATE TABLE IF NOT EXISTS cupon_uso (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cupon_id UUID NOT NULL REFERENCES cupones_descuento(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  pedido_id UUID REFERENCES pedidos(id) ON DELETE SET NULL,
  usado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cupon_uso_cupon_id ON cupon_uso(cupon_id);
CREATE INDEX IF NOT EXISTS idx_cupon_uso_usuario_id ON cupon_uso(usuario_id);

-- =====================================================
-- TABLA: carrito_cupones
-- =====================================================
CREATE TABLE IF NOT EXISTS carrito_cupones (
  carrito_id UUID NOT NULL REFERENCES carrito(id) ON DELETE CASCADE,
  cupon_id UUID NOT NULL REFERENCES cupones_descuento(id) ON DELETE CASCADE,
  anadido_en TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (carrito_id, cupon_id)
);

-- =====================================================
-- TABLA: metodos_pago
-- =====================================================
CREATE TABLE IF NOT EXISTS metodos_pago (
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

CREATE INDEX IF NOT EXISTS idx_metodos_pago_usuario_id ON metodos_pago(usuario_id);

-- =====================================================
-- TABLA: logs_transacciones
-- =====================================================
CREATE TABLE IF NOT EXISTS logs_transacciones (
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

CREATE INDEX IF NOT EXISTS idx_logs_transacciones_pedido_id ON logs_transacciones(pedido_id);

-- =====================================================
-- TABLA: envios
-- =====================================================
CREATE TABLE IF NOT EXISTS envios (
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

CREATE INDEX IF NOT EXISTS idx_envios_pedido_id ON envios(pedido_id);
CREATE INDEX IF NOT EXISTS idx_envios_tracking ON envios(numero_tracking);

-- =====================================================
-- TABLA: eventos_envio
-- =====================================================
CREATE TABLE IF NOT EXISTS eventos_envio (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  envio_id UUID NOT NULL REFERENCES envios(id) ON DELETE CASCADE,
  tipo_evento TEXT NOT NULL,
  descripcion TEXT,
  ubicacion TEXT,
  fecha_evento TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eventos_envio_envio_id ON eventos_envio(envio_id);

-- =====================================================
-- TABLA: notificaciones
-- =====================================================
CREATE TABLE IF NOT EXISTS notificaciones (
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

CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario_id ON notificaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leida ON notificaciones(leida);

-- =====================================================
-- TABLA: gustos_usuario
-- =====================================================
CREATE TABLE IF NOT EXISTS gustos_usuario (
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

CREATE INDEX IF NOT EXISTS idx_gustos_usuario_usuario_id ON gustos_usuario(usuario_id);

-- =====================================================
-- TABLA: estadisticas_visualizacion
-- =====================================================
CREATE TABLE IF NOT EXISTS estadisticas_visualizacion (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  ip_cliente TEXT,
  user_agent TEXT,
  referencia TEXT,
  tiempo_permanencia INT,
  visualizado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_estadisticas_producto_id ON estadisticas_visualizacion(producto_id);
CREATE INDEX IF NOT EXISTS idx_estadisticas_usuario_id ON estadisticas_visualizacion(usuario_id);

-- =====================================================
-- TABLA: inventario_movimientos
-- =====================================================
CREATE TABLE IF NOT EXISTS inventario_movimientos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  tipo_movimiento TEXT NOT NULL CHECK (tipo_movimiento IN ('Compra', 'Devolucion', 'Ajuste', 'Dañado', 'Entrada')),
  cantidad INT NOT NULL,
  referencia TEXT,
  notas TEXT,
  creado_por UUID REFERENCES usuarios(id),
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventario_producto_id ON inventario_movimientos(producto_id);

-- =====================================================
-- TABLA: campanas_email
-- =====================================================
CREATE TABLE IF NOT EXISTS campanas_email (
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
CREATE TABLE IF NOT EXISTS campana_email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campana_id UUID NOT NULL REFERENCES campanas_email(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  estado TEXT CHECK (estado IN ('Enviado', 'Abierto', 'Click', 'Rebote')),
  fecha_evento TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campana_logs_campana_id ON campana_email_logs(campana_id);

-- =====================================================
-- COMENTARIOS
-- =====================================================
COMMENT ON TABLE usuarios IS 'Información de clientes registrados';
COMMENT ON TABLE productos IS 'Catálogo de productos electrónicos refurbished';
COMMENT ON TABLE pedidos IS 'Órdenes de compra de clientes';
COMMENT ON TABLE detalles_pedido IS 'Líneas de items en cada pedido';
COMMENT ON TABLE carrito IS 'Carritos de compra activos de usuarios';
COMMENT ON TABLE carrito_items IS 'Items dentro del carrito';
COMMENT ON TABLE cupones_descuento IS 'Códigos promocionales disponibles';
COMMENT ON TABLE envios IS 'Seguimiento de envíos de pedidos';
COMMENT ON TABLE metodos_pago IS 'Métodos de pago guardados de usuarios';
COMMENT ON COLUMN productos.precio_venta IS 'Precio en céntimos (ej: 139900 = 1399€)';
