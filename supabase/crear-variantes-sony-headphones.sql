-- =====================================================
-- CREAR VARIANTES PARA PRODUCTO: SONY WH-1000XM5
-- =====================================================

-- Primero buscar el producto
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  -- Obtener ID del producto
  SELECT id INTO v_product_id FROM productos WHERE slug = 'sony-wh-1000xm5';
  
  IF v_product_id IS NULL THEN
    RAISE NOTICE 'Producto sony-wh-1000xm5 no encontrado';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Producto encontrado: %', v_product_id;
  
  -- Eliminar variantes existentes
  DELETE FROM variantes_producto WHERE producto_id = v_product_id;
  
  -- Insertar variantes por color
  INSERT INTO variantes_producto (
    producto_id,
    nombre_variante,
    sku_variante,
    capacidad,
    color,
    talla,
    conectividad,
    precio_venta,
    precio_original,
    stock,
    disponible,
    es_principal,
    imagen_url
  ) VALUES 
  -- Negro
  (v_product_id, 'Sony WH-1000XM5 - Negro', 'SONY-WH1000XM5-BLK', NULL, 'Negro', NULL, 'Bluetooth 5.2', 39900, 44900, 15, true, true, 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800&h=800&fit=crop'),
  -- Plata
  (v_product_id, 'Sony WH-1000XM5 - Plata', 'SONY-WH1000XM5-SLV', NULL, 'Plata', NULL, 'Bluetooth 5.2', 39900, 44900, 10, true, false, 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&h=800&fit=crop'),
  -- Azul medianoche
  (v_product_id, 'Sony WH-1000XM5 - Azul Medianoche', 'SONY-WH1000XM5-BLU', NULL, 'Azul Medianoche', NULL, 'Bluetooth 5.2', 41900, 46900, 8, true, false, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop');
  
  RAISE NOTICE 'Variantes creadas para Sony WH-1000XM5';
END $$;

-- Verificar
SELECT 
  p.nombre,
  v.nombre_variante,
  v.color,
  v.precio_venta / 100.0 as precio_eur,
  v.stock,
  v.disponible,
  v.es_principal
FROM variantes_producto v
JOIN productos p ON v.producto_id = p.id
WHERE p.slug = 'sony-wh-1000xm5'
ORDER BY v.es_principal DESC, v.precio_venta;
