-- =====================================================
-- AGREGAR IMÁGENES A VARIANTES
-- =====================================================

-- Actualizar variantes de tablets con imágenes por color
UPDATE variantes_producto
SET imagen_url = CASE 
  WHEN color = 'Negro' THEN 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&h=800&fit=crop'
  WHEN color = 'Blanco' THEN 'https://images.unsplash.com/photo-1585790050230-5dd28404f1e4?w=800&h=800&fit=crop'
  WHEN color = 'Gris Espacial' THEN 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=800&fit=crop'
  ELSE 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&h=800&fit=crop'
END
WHERE producto_id IN (
  SELECT id FROM productos WHERE categoria_id = (SELECT id FROM categorias WHERE slug = 'tablets' LIMIT 1)
);

-- Actualizar variantes de portátiles con imágenes por color
UPDATE variantes_producto
SET imagen_url = CASE 
  WHEN color = 'Gris' THEN 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=800&fit=crop'
  WHEN color = 'Plata' THEN 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=800&fit=crop'
  WHEN color = 'Negro' THEN 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800&h=800&fit=crop'
  ELSE 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=800&fit=crop'
END
WHERE producto_id IN (
  SELECT id FROM productos WHERE categoria_id = (SELECT id FROM categorias WHERE slug = 'portatiles' LIMIT 1)
);

-- Actualizar variantes de smartphones con imágenes por color
UPDATE variantes_producto
SET imagen_url = CASE 
  WHEN color = 'Negro' THEN 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=800&fit=crop'
  WHEN color = 'Blanco' THEN 'https://images.unsplash.com/photo-1592286927505-2fd0f3a0e6e4?w=800&h=800&fit=crop'
  WHEN color = 'Azul' THEN 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&h=800&fit=crop'
  WHEN color = 'Rojo' THEN 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800&h=800&fit=crop'
  ELSE 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=800&fit=crop'
END
WHERE producto_id IN (
  SELECT id FROM productos WHERE categoria_id = (SELECT id FROM categorias WHERE slug = 'smartphones' LIMIT 1)
);

-- Actualizar otras categorías con imagen genérica por color
UPDATE variantes_producto
SET imagen_url = CASE 
  WHEN color = 'Negro' THEN 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop'
  WHEN color = 'Blanco' THEN 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&h=800&fit=crop'
  WHEN color = 'Gris' THEN 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800&h=800&fit=crop'
  ELSE 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop'
END
WHERE imagen_url IS NULL;

-- Verificar imágenes asignadas
SELECT 
  p.nombre AS producto,
  v.color,
  v.capacidad,
  CASE 
    WHEN v.imagen_url IS NOT NULL THEN 'Sí'
    ELSE 'No'
  END AS tiene_imagen
FROM variantes_producto v
INNER JOIN productos p ON v.producto_id = p.id
ORDER BY p.nombre, v.capacidad, v.color;
