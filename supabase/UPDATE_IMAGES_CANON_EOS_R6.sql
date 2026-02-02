-- =====================================================
-- PRODUCT IMAGE NORMALIZATION - Canon EOS R6
-- =====================================================
-- Product: Canon EOS R6
-- Variants: Black, White, Grey
-- =====================================================

-- =====================================================
-- Canon EOS R6 - VARIANT IMAGE MAPPING
-- =====================================================

-- Variant: Black
UPDATE variantes_producto
SET imagen_url = 'https://assets.mmsrg.com/isr/166325/c1/-/ASSET_MP_106572164?x=536&y=402&format=jpg&quality=80&sp=yes&strip=yes&trim&ex=536&ey=402&align=center&resizesource&unsharp=1.5x1+0.7+0.02&cox=0&coy=0&cdx=536&cdy=402'
WHERE producto_id = (SELECT id FROM productos WHERE slug = 'canon-eos-r6')
AND color = 'Negro';

-- Variant: White
UPDATE variantes_producto
SET imagen_url = 'https://lh3.googleusercontent.com/gg-dl/AOI_d_9Oyqr-PqsU6BZ5_K7rD9dnxYIfOpCTTaOPKwfWwcTSJ99K2DlVbYq8P7Bre1Qe5aSTlkDrtB6yFyQrywmB6t6jFfCJQkh-KXQ0YVH5Vvin4c9imnd7NlyZfe7i2rKYzUvSsEtxyp8VeIyXgDfncenXpJloSoSS4UUXuNup19Dr4izmwQ=s1024-rj'
WHERE producto_id = (SELECT id FROM productos WHERE slug = 'canon-eos-r6')
AND color = 'Blanco';

-- Variant: Grey
UPDATE variantes_producto
SET imagen_url = 'https://lh3.googleusercontent.com/gg-dl/AOI_d_9_UTBf6jiUNVyyjxMLm2OauMa8CfthUkN0HaJtBZMW2dfMG3LQlDV-qM22jIFYJA9nMiIy1NGWGVb4xRDpNRE4O0jr0dBgCpIyJU7fNt07REsMC5kifGYE3s4UhMkF_jFu8Ae5HWggBYrg19JQcnQ4NSwoX0E_8BxdeVBeGSxz57Waiw=s1024-rj'
WHERE producto_id = (SELECT id FROM productos WHERE slug = 'canon-eos-r6')
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
WHERE p.slug = 'canon-eos-r6'
ORDER BY v.color;
