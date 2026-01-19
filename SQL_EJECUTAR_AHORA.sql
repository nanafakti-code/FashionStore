-- ============================================
-- FASHIONSTORE - SQL EJECUTAR AHORA
-- ============================================
-- INSTRUCCIONES:
-- 1. Copia TODO este contenido
-- 2. Ve a Supabase > SQL Editor
-- 3. Pega y haz click en "Run"
-- ============================================

-- PASO 1: TABLA ORDENES
DROP TABLE IF EXISTS devoluciones CASCADE;
DROP TABLE IF EXISTS items_orden CASCADE;
DROP TABLE IF EXISTS ordenes CASCADE;

CREATE TABLE ordenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_orden TEXT NOT NULL UNIQUE,
  usuario_id UUID,
  estado TEXT NOT NULL DEFAULT 'Pendiente',
  subtotal INTEGER NOT NULL DEFAULT 0,
  impuestos INTEGER NOT NULL DEFAULT 0,
  coste_envio INTEGER NOT NULL DEFAULT 0,
  descuento INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL,
  cupon_id UUID,
  metodo_pago TEXT,
  stripe_payment_intent TEXT,
  is_guest BOOLEAN DEFAULT FALSE,
  nombre_cliente TEXT,
  email_cliente TEXT,
  telefono_cliente TEXT,
  direccion_envio JSONB,
  fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
  fecha_pago TIMESTAMPTZ,
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- PASO 2: TABLA ITEMS_ORDEN
CREATE TABLE items_orden (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id UUID NOT NULL,
  producto_id UUID,
  producto_nombre TEXT NOT NULL,
  producto_imagen TEXT,
  cantidad INTEGER NOT NULL DEFAULT 1,
  talla TEXT,
  color TEXT,
  precio_unitario INTEGER NOT NULL,
  subtotal INTEGER NOT NULL,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_items_orden FOREIGN KEY (orden_id) REFERENCES ordenes(id) ON DELETE CASCADE
);

-- PASO 3: TABLA DEVOLUCIONES
CREATE TABLE devoluciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id UUID NOT NULL,
  numero_devolucion TEXT NOT NULL UNIQUE,
  motivo TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'Pendiente',
  notas_admin TEXT,
  fecha_solicitud TIMESTAMPTZ DEFAULT NOW(),
  fecha_aprobacion TIMESTAMPTZ,
  fecha_recepcion TIMESTAMPTZ,
  fecha_reembolso TIMESTAMPTZ,
  importe_reembolso INTEGER,
  metodo_reembolso TEXT,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_devoluciones_orden FOREIGN KEY (orden_id) REFERENCES ordenes(id) ON DELETE CASCADE
);

-- PASO 4: INDICES
CREATE INDEX idx_ordenes_numero ON ordenes(numero_orden);
CREATE INDEX idx_ordenes_email ON ordenes(email_cliente);
CREATE INDEX idx_ordenes_estado ON ordenes(estado);
CREATE INDEX idx_items_orden_id ON items_orden(orden_id);
CREATE INDEX idx_devoluciones_orden ON devoluciones(orden_id);

-- PASO 5: RLS
ALTER TABLE ordenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE items_orden ENABLE ROW LEVEL SECURITY;
ALTER TABLE devoluciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_ordenes" ON ordenes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_items" ON items_orden FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_devoluciones" ON devoluciones FOR ALL USING (true) WITH CHECK (true);

-- VERIFICAR
SELECT 'SUCCESS' as status, 
  (SELECT count(*) FROM information_schema.tables WHERE table_name = 'ordenes') as ordenes_exists,
  (SELECT count(*) FROM information_schema.tables WHERE table_name = 'items_orden') as items_exists,
  (SELECT count(*) FROM information_schema.tables WHERE table_name = 'devoluciones') as devoluciones_exists;
