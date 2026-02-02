-- CHECK VARIANT COLORS
SELECT p.nombre, p.slug, v.color, v.imagen_url 
FROM variantes_producto v 
JOIN productos p ON v.producto_id = p.id
WHERE p.slug IN (
  'dell-xps-15',
  'gopro-hero-12',
  'ipad-pro-129-m2',
  'apple-watch-ultra',
  'lg-ultrawide-34',
  'xbox-series-x',
  'samsung-galaxy-watch-6-classic',
  'playstation-5',
  'airpods-pro-2',
  'sony-wh-1000xm5',
  'samsung-galaxy-s24-ultra',
  'iphone-15-pro-max',
  'iphone-17'
)
ORDER BY p.nombre, v.color;
