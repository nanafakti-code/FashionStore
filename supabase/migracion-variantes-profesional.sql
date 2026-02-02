-- =====================================================
-- SISTEMA DE VARIANTES PROFESIONAL - MIGRACIÓN
-- =====================================================
-- Este script actualiza la base de datos para soportar
-- variantes de productos con precios y stock independientes
-- =====================================================

-- =====================================================
-- PASO 1: Crear nueva tabla de variantes mejorada
-- =====================================================

-- Eliminar tabla antigua si existe
DROP TABLE IF EXISTS variantes_producto_old CASCADE;

-- Renombrar tabla actual como backup
ALTER TABLE IF EXISTS variantes_producto RENAME TO variantes_producto_old;

-- Crear nueva tabla de variantes profesional
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

-- Índices para optimización
CREATE INDEX idx_variantes_producto_id ON variantes_producto(producto_id);
CREATE INDEX idx_variantes_sku ON variantes_producto(sku_variante);
CREATE INDEX idx_variantes_disponible ON variantes_producto(disponible);
CREATE INDEX idx_variantes_stock ON variantes_producto(stock);

-- Trigger para actualizar timestamp
CREATE TRIGGER trigger_variantes_actualizado
  BEFORE UPDATE ON variantes_producto
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_timestamp();

-- =====================================================
-- PASO 2: Migrar datos existentes (si existen)
-- =====================================================

-- Migrar variantes antiguas a nuevo formato (solo si existe la tabla antigua)
DO $$
BEGIN
  -- Verificar si existe la tabla antigua
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'variantes_producto_old') THEN
    
    -- Migrar datos de la tabla antigua
    INSERT INTO variantes_producto (
      producto_id,
      nombre_variante,
      sku_variante,
      precio_venta,
      stock,
      capacidad,
      color,
      talla,
      disponible,
      creado_en
    )
    SELECT 
      vp.producto_id,
      COALESCE(vp.talla, '') || ' ' || COALESCE(vp.color, '') AS nombre_variante,
      COALESCE(vp.sku_variante, 'SKU-' || gen_random_uuid()::text) AS sku_variante,
      p.precio_venta + COALESCE(vp.precio_adicional, 0) AS precio_venta,
      vp.stock,
      vp.talla AS capacidad,  -- Usar talla como capacidad temporalmente
      vp.color,
      vp.talla,
      vp.stock > 0 AS disponible,
      vp.creada_en
    FROM variantes_producto_old vp
    INNER JOIN productos p ON vp.producto_id = p.id
    WHERE vp.id IS NOT NULL
    ON CONFLICT (sku_variante) DO NOTHING;
    
    RAISE NOTICE 'Datos migrados desde variantes_producto_old';
  ELSE
    RAISE NOTICE 'No existe tabla variantes_producto_old, omitiendo migración de datos';
  END IF;
END $$;

-- =====================================================
-- PASO 3: Actualizar tabla carrito_items
-- =====================================================

-- Agregar columna variante_id si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'carrito_items' AND column_name = 'variante_id'
  ) THEN
    ALTER TABLE carrito_items 
      ADD COLUMN variante_id UUID REFERENCES variantes_producto(id) ON DELETE CASCADE;
    
    CREATE INDEX idx_carrito_items_variante_id ON carrito_items(variante_id);
  END IF;
END $$;

-- =====================================================
-- PASO 4: Actualizar tabla detalles_pedido
-- =====================================================

-- Agregar columna variante_id si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'detalles_pedido' AND column_name = 'variante_id'
  ) THEN
    ALTER TABLE detalles_pedido 
      ADD COLUMN variante_id UUID REFERENCES variantes_producto(id) ON DELETE RESTRICT;
    
    CREATE INDEX idx_detalles_pedido_variante_id ON detalles_pedido(variante_id);
  END IF;
END $$;

-- =====================================================
-- PASO 5: Funciones RPC para consultas
-- =====================================================

-- Función: Obtener variantes de un producto
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

-- Función: Obtener rango de precios de un producto
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

-- Función: Verificar stock de variante
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

-- Función: Obtener variante por defecto de un producto
CREATE OR REPLACE FUNCTION get_default_variant(product_slug TEXT)
RETURNS TABLE (
  variant_id UUID,
  variant_name TEXT,
  sku TEXT,
  price INTEGER,
  stock INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id,
    v.nombre_variante,
    v.sku_variante,
    v.precio_venta,
    v.stock
  FROM variantes_producto v
  INNER JOIN productos p ON v.producto_id = p.id
  WHERE p.slug = product_slug
    AND v.disponible = TRUE
    AND v.stock > 0
  ORDER BY v.es_principal DESC, v.precio_venta ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PASO 6: Vista para listado de productos con precios
-- =====================================================

CREATE OR REPLACE VIEW productos_con_precios AS
SELECT 
  p.id,
  p.nombre,
  p.slug,
  p.descripcion,
  p.categoria_id,
  p.marca_id,
  p.destacado,
  p.activo,
  MIN(v.precio_venta) AS precio_desde,
  MAX(v.precio_venta) AS precio_hasta,
  SUM(v.stock) AS stock_total,
  COUNT(v.id) AS total_variantes,
  BOOL_OR(v.stock > 0) AS tiene_stock,
  (SELECT imagen_url FROM variantes_producto WHERE producto_id = p.id AND es_principal = TRUE LIMIT 1) AS imagen_principal
FROM productos p
LEFT JOIN variantes_producto v ON p.id = v.producto_id AND v.disponible = TRUE
WHERE p.activo = TRUE
GROUP BY p.id, p.nombre, p.slug, p.descripcion, p.categoria_id, p.marca_id, p.destacado, p.activo;

-- =====================================================
-- PASO 7: Políticas RLS para variantes
-- =====================================================

ALTER TABLE variantes_producto ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden ver variantes disponibles
DROP POLICY IF EXISTS "variantes_select_publico" ON variantes_producto;
CREATE POLICY "variantes_select_publico" 
  ON variantes_producto 
  FOR SELECT 
  USING (disponible = TRUE AND stock > 0);

-- Política: Solo admins pueden modificar variantes
DROP POLICY IF EXISTS "variantes_admin_all" ON variantes_producto;
CREATE POLICY "variantes_admin_all" 
  ON variantes_producto 
  FOR ALL 
  USING (auth.jwt() ->> 'role' = 'admin');

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar que la migración fue exitosa
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM variantes_producto;
  RAISE NOTICE 'Total de variantes migradas: %', v_count;
  
  SELECT COUNT(*) INTO v_count FROM variantes_producto WHERE es_principal = TRUE;
  RAISE NOTICE 'Variantes principales: %', v_count;
  
  SELECT COUNT(*) INTO v_count FROM variantes_producto WHERE stock > 0;
  RAISE NOTICE 'Variantes con stock: %', v_count;
END $$;

-- =====================================================
-- FIN DE MIGRACIÓN
-- =====================================================
