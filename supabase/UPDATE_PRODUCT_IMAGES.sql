-- =====================================================
-- PRODUCT IMAGE NORMALIZATION
-- Canon EOS R6 + MacBook Pro 16 M3 Max
-- =====================================================

-- =====================================================
-- CANON EOS R6 - VARIANT IMAGE MAPPING
-- =====================================================

-- Variant: Black -> Negro
UPDATE variantes_producto
SET imagen_url = 'https://res.cloudinary.com/djvj32zic/image/upload/v1769962745/e08bdfcf-e16b-48af-b254-40869bd4c212_jfno6g.jpg'
WHERE producto_id = (SELECT id FROM productos WHERE slug = 'canon-eos-r6')
AND color = 'Negro';

-- Variant: White -> Blanco
UPDATE variantes_producto
SET imagen_url = 'https://res.cloudinary.com/djvj32zic/image/upload/v1769962746/Gemini_Generated_Image_cbsrjtcbsrjtcbsr_jzje1x.png'
WHERE producto_id = (SELECT id FROM productos WHERE slug = 'canon-eos-r6')
AND color = 'Blanco';

-- Variant: Grey -> Gris
UPDATE variantes_producto
SET imagen_url = 'https://res.cloudinary.com/djvj32zic/image/upload/v1769962746/Gemini_Generated_Image_jn7zrhjn7zrhjn7z_krnl19.png'
WHERE producto_id = (SELECT id FROM productos WHERE slug = 'canon-eos-r6')
AND color = 'Gris';

-- =====================================================
-- MACBOOK PRO 16 M3 MAX - VARIANT IMAGE MAPPING
-- =====================================================

-- Variant: Black -> Negro
UPDATE variantes_producto
SET imagen_url = 'https://res.cloudinary.com/djvj32zic/image/upload/v1769962747/Gemini_Generated_Image_g5l4zsg5l4zsg5l4_rjnjoj.png'
WHERE producto_id = (SELECT id FROM productos WHERE slug = 'macbook-pro-16-m3-max')
AND color = 'Negro';

-- Variant: White -> Blanco
UPDATE variantes_producto
SET imagen_url = 'https://res.cloudinary.com/djvj32zic/image/upload/v1769962746/Gemini_Generated_Image_ultslkultslkults_uvxouj.png'
WHERE producto_id = (SELECT id FROM productos WHERE slug = 'macbook-pro-16-m3-max')
AND color = 'Blanco';

-- Variant: Grey -> Gris
UPDATE variantes_producto
SET imagen_url = 'https://res.cloudinary.com/djvj32zic/image/upload/v1769962746/refurb-mbp16-m3-max-pro-silver-202402_nvvrdy.jpg'
WHERE producto_id = (SELECT id FROM productos WHERE slug = 'macbook-pro-16-m3-max')
AND color = 'Gris';

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
SELECT 
  p.nombre AS producto,
  v.color AS variante_color,
  v.imagen_url AS imagen_asignada
FROM variantes_producto v
INNER JOIN productos p ON v.producto_id = p.id
WHERE p.slug IN ('canon-eos-r6', 'macbook-pro-16-m3-max')
ORDER BY p.nombre, v.color;
