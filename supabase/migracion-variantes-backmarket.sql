-- =====================================================
-- MIGRACION: Actualizar variantes_producto para BackMarket
-- =====================================================
-- Estructura mejorada para productos reacondicionados
-- Soporta: Color + Capacidad (GB) + Estado + Precio dinámico

-- 1. Crear tabla temporal con la nueva estructura
CREATE TABLE IF NOT EXISTS variantes_producto_nueva (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  
  -- Especificaciones del producto
  color TEXT NOT NULL,                          -- Ej: "Negro", "Blanco", "Gris"
  capacidad TEXT,                               -- Ej: "64GB", "128GB", "256GB" (para móviles)
  
  -- Estado del producto reacondicionado
  estado TEXT NOT NULL CHECK (estado IN ('Correcto', 'Muy Bueno', 'Excelente')),
  descripcion_estado TEXT,                      -- Descripción adicional del estado
  
  -- Precios y stock
  precio_base INTEGER NOT NULL,                 -- Precio en céntimos (sin descuentos de estado)
  precio_ajustado INTEGER NOT NULL,             -- Precio final según estado
  descuento_estado INTEGER DEFAULT 0,           -- Descuento aplicado por el estado
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  
  -- Control
  sku_variante TEXT UNIQUE,                     -- Código único de la variante
  activo BOOLEAN DEFAULT TRUE,
  creada_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_variantes_producto_nueva_id ON variantes_producto_nueva(producto_id);
CREATE INDEX IF NOT EXISTS idx_variantes_producto_nueva_color ON variantes_producto_nueva(color);
CREATE INDEX IF NOT EXISTS idx_variantes_producto_nueva_estado ON variantes_producto_nueva(estado);
CREATE INDEX IF NOT EXISTS idx_variantes_producto_nueva_capacidad ON variantes_producto_nueva(capacidad);
CREATE INDEX IF NOT EXISTS idx_variantes_producto_nueva_sku ON variantes_producto_nueva(sku_variante);

-- 2. Copiar datos de la tabla anterior (si existen)
INSERT INTO variantes_producto_nueva (
  producto_id, color, capacidad, estado, precio_base, precio_ajustado, stock, sku_variante, creada_en
)
SELECT 
  producto_id,
  COALESCE(color, 'Sin especificar'),
  talla,                                        -- Convertir talla a capacidad
  'Excelente',                                  -- Estado por defecto para datos existentes
  precio_adicional,
  precio_adicional,
  stock,
  sku_variante,
  creada_en
FROM variantes_producto
ON CONFLICT (sku_variante) DO NOTHING;

-- 3. Renombrar tablas
ALTER TABLE variantes_producto RENAME TO variantes_producto_old;
ALTER TABLE variantes_producto_nueva RENAME TO variantes_producto;

-- 4. (Opcional) Eliminar tabla antigua después de verificar
-- DROP TABLE variantes_producto_old;

-- =====================================================
-- TABLA: estados_producto
-- =====================================================
-- Tabla de referencia para estados estándar
CREATE TABLE IF NOT EXISTS estados_producto (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL UNIQUE,                  -- Ej: "Correcto", "Muy Bueno", "Excelente"
  descripcion TEXT,
  descuento_porcentaje INT DEFAULT 0,           -- Descuento aplicado como porcentaje
  icono TEXT,                                   -- Ej: emoji o icono
  orden INT DEFAULT 0,
  creada_en TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar estados estándar
INSERT INTO estados_producto (nombre, descripcion, descuento_porcentaje, icono, orden) VALUES
  ('Correcto', 'Funciona perfectamente, pero puede tener marcas de uso visibles', 30, '✓', 1),
  ('Muy Bueno', 'Funciona perfectamente, marcas de uso mínimas', 15, '✓✓', 2),
  ('Excelente', 'Como nuevo, sin marcas de uso visibles', 0, '✓✓✓', 3)
ON CONFLICT (nombre) DO NOTHING;

-- =====================================================
-- Ejemplo de datos para producto Samsung
-- =====================================================
-- Primero, obtener el ID del producto Samsung (ajustar según tu BD)
-- SELECT id FROM productos WHERE nombre ILIKE '%Samsung%' LIMIT 1;

-- Insertar variantes para Samsung Galaxy S21
-- INSERT INTO variantes_producto (
--   producto_id, color, capacidad, estado, precio_base, precio_ajustado, stock, sku_variante
-- ) VALUES
--   -- Negro 128GB
--   ('UUID_SAMSUNG', 'Negro', '128GB', 'Correcto', 30000, 21000, 5, 'SGS21-NEG-128GB-CORRECTO'),
--   ('UUID_SAMSUNG', 'Negro', '128GB', 'Muy Bueno', 30000, 25500, 8, 'SGS21-NEG-128GB-MUY-BUENO'),
--   ('UUID_SAMSUNG', 'Negro', '128GB', 'Excelente', 30000, 30000, 3, 'SGS21-NEG-128GB-EXCELENTE'),
--   
--   ('UUID_SAMSUNG', 'Negro', '256GB', 'Correcto', 35000, 24500, 4, 'SGS21-NEG-256GB-CORRECTO'),
--   ('UUID_SAMSUNG', 'Negro', '256GB', 'Muy Bueno', 35000, 29750, 6, 'SGS21-NEG-256GB-MUY-BUENO'),
--   ('UUID_SAMSUNG', 'Negro', '256GB', 'Excelente', 35000, 35000, 2, 'SGS21-NEG-256GB-EXCELENTE'),
--   
--   -- Gris 128GB
--   ('UUID_SAMSUNG', 'Gris', '128GB', 'Correcto', 30000, 21000, 3, 'SGS21-GRI-128GB-CORRECTO'),
--   ('UUID_SAMSUNG', 'Gris', '128GB', 'Muy Bueno', 30000, 25500, 7, 'SGS21-GRI-128GB-MUY-BUENO'),
--   ('UUID_SAMSUNG', 'Gris', '128GB', 'Excelente', 30000, 30000, 5, 'SGS21-GRI-128GB-EXCELENTE'),
--   
--   -- Blanco 128GB
--   ('UUID_SAMSUNG', 'Blanco', '128GB', 'Correcto', 30000, 21000, 2, 'SGS21-BLA-128GB-CORRECTO'),
--   ('UUID_SAMSUNG', 'Blanco', '128GB', 'Muy Bueno', 30000, 25500, 4, 'SGS21-BLA-128GB-MUY-BUENO'),
--   ('UUID_SAMSUNG', 'Blanco', '128GB', 'Excelente', 30000, 30000, 1, 'SGS21-BLA-128GB-EXCELENTE');
