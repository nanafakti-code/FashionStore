-- =====================================================
-- FORZAR RECREACIÓN DE TABLA VARIANTES_PRODUCTO
-- =====================================================
-- Este script ELIMINA completamente la tabla antigua
-- y crea la nueva estructura
-- ⚠️ ADVERTENCIA: Esto eliminará todos los datos actuales
-- =====================================================

-- PASO 1: Eliminar tabla completamente (con CASCADE)
DROP TABLE IF EXISTS variantes_producto CASCADE;

-- PASO 2: Crear nueva tabla con estructura correcta
CREATE TABLE variantes_producto (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  
  -- Identificación única
  nombre_variante TEXT NOT NULL,
  sku_variante TEXT UNIQUE NOT NULL,
  
  -- Precios independientes (en centavos)
  precio_venta INTEGER NOT NULL CHECK (precio_venta > 0),
  precio_original INTEGER,
  costo INTEGER,
  
  -- Stock independiente
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  stock_minimo INTEGER DEFAULT 5,
  
  -- Atributos de la variante
  capacidad TEXT,
  color TEXT,
  talla TEXT,
  estado TEXT,
  conectividad TEXT,
  
  -- Control de disponibilidad
  disponible BOOLEAN DEFAULT TRUE,
  es_principal BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  peso_gramos INTEGER,
  dimensiones TEXT,
  imagen_url TEXT,
  
  -- Timestamps
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- PASO 3: Crear índices
CREATE INDEX IF NOT EXISTS idx_variantes_producto_id ON variantes_producto(producto_id);
CREATE INDEX IF NOT EXISTS idx_variantes_sku ON variantes_producto(sku_variante);
CREATE INDEX IF NOT EXISTS idx_variantes_disponible ON variantes_producto(disponible);
CREATE INDEX IF NOT EXISTS idx_variantes_stock ON variantes_producto(stock);

-- PASO 4: Crear trigger
DROP TRIGGER IF EXISTS trigger_variantes_actualizado ON variantes_producto;
CREATE TRIGGER trigger_variantes_actualizado
  BEFORE UPDATE ON variantes_producto
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_timestamp();

-- PASO 5: Funciones RPC
CREATE OR REPLACE FUNCTION get_product_variants(product_slug TEXT)
RETURNS TABLE (
  variant_id UUID,
  variant_name TEXT,
  sku TEXT,
  price INTEGER,
  original_price INTEGER,
  stock INTEGER,
  capacity TEXT,
  color TEXT,
  size TEXT,
  connectivity TEXT,
  available BOOLEAN,
  is_default BOOLEAN,
  image_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id AS variant_id,
    v.nombre_variante AS variant_name,
    v.sku_variante AS sku,
    v.precio_venta AS price,
    v.precio_original AS original_price,
    v.stock,
    v.capacidad AS capacity,
    v.color,
    v.talla AS size,
    v.conectividad AS connectivity,
    v.disponible AS available,
    v.es_principal AS is_default,
    v.imagen_url AS image_url
  FROM variantes_producto v
  INNER JOIN productos p ON v.producto_id = p.id
  WHERE p.slug = product_slug
    AND v.disponible = TRUE
  ORDER BY v.es_principal DESC, v.precio_venta ASC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_product_price_range(product_slug TEXT)
RETURNS TABLE (
  min_price INTEGER,
  max_price INTEGER,
  has_variants BOOLEAN,
  total_variants INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    MIN(v.precio_venta)::INTEGER AS min_price,
    MAX(v.precio_venta)::INTEGER AS max_price,
    COUNT(v.id) > 1 AS has_variants,
    COUNT(v.id)::INTEGER AS total_variants
  FROM variantes_producto v
  INNER JOIN productos p ON v.producto_id = p.id
  WHERE p.slug = product_slug
    AND v.disponible = TRUE
    AND v.stock > 0;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_variant_stock(variant_sku TEXT, quantity INTEGER)
RETURNS TABLE (
  available BOOLEAN,
  current_stock INTEGER,
  message TEXT
) AS $$
DECLARE
  v_stock INTEGER;
  v_disponible BOOLEAN;
BEGIN
  SELECT stock, disponible INTO v_stock, v_disponible
  FROM variantes_producto
  WHERE sku_variante = variant_sku;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0, 'Variante no encontrada'::TEXT;
  ELSIF NOT v_disponible THEN
    RETURN QUERY SELECT FALSE, v_stock, 'Variante no disponible'::TEXT;
  ELSIF v_stock < quantity THEN
    RETURN QUERY SELECT FALSE, v_stock, 'Stock insuficiente'::TEXT;
  ELSE
    RETURN QUERY SELECT TRUE, v_stock, 'Stock disponible'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- PASO 6: Políticas RLS
ALTER TABLE variantes_producto ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "variantes_select_publico" ON variantes_producto;
CREATE POLICY "variantes_select_publico" 
  ON variantes_producto 
  FOR SELECT 
  USING (disponible = TRUE AND stock > 0);

DROP POLICY IF EXISTS "variantes_admin_all" ON variantes_producto;
CREATE POLICY "variantes_admin_all" 
  ON variantes_producto 
  FOR ALL 
  USING (auth.jwt() ->> 'role' = 'admin');

-- VERIFICACIÓN
SELECT 'Tabla variantes_producto recreada correctamente' AS mensaje;

-- Ver estructura de la nueva tabla
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'variantes_producto'
ORDER BY ordinal_position;
