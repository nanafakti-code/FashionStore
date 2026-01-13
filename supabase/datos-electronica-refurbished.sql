-- =====================================================
-- FASHIONSTORE - BASE DE DATOS ELECTRÓNICA REFURBISHED
-- Similar a Back Market
-- =====================================================

-- Limpiar datos anteriores
DELETE FROM imagenes_producto;
DELETE FROM productos;
DELETE FROM categorias;
DELETE FROM marcas;

-- =====================================================
-- CATEGORÍAS
-- =====================================================
INSERT INTO categorias (nombre, slug, descripcion, imagen_portada, activa) VALUES
  ('Smartphones', 'smartphones', 'Teléfonos inteligentes reacondicionados con garantía', 'https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=800&h=400&fit=crop', true),
  ('Laptops', 'laptops', 'Computadoras portátiles de última generación', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=400&fit=crop', true),
  ('Tablets', 'tablets', 'Tablets iPad y Android reacondicionadas', 'https://images.unsplash.com/photo-1587614382346-4ec2e51c7966?w=800&h=400&fit=crop', true),
  ('Audio', 'audio', 'Auriculares y altavoces premium', 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&h=400&fit=crop', true),
  ('Wearables', 'wearables', 'Smartwatches y pulseras inteligentes', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=400&fit=crop', true),
  ('Cámaras', 'camaras', 'Cámaras digitales y acción', 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&h=400&fit=crop', true),
  ('Monitores', 'monitores', 'Monitores gaming y profesionales', 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=800&h=400&fit=crop', true),
  ('Consolas', 'consolas', 'Consolas gaming refurbished', 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800&h=400&fit=crop', true);

-- =====================================================
-- MARCAS
-- =====================================================
INSERT INTO marcas (nombre, slug, logo, activa) VALUES
  ('Apple', 'apple', 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg', true),
  ('Samsung', 'samsung', 'https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg', true),
  ('Google', 'google', 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg', true),
  ('Sony', 'sony', 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Sony_logo.svg', true),
  ('Microsoft', 'microsoft', 'https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg', true),
  ('LG', 'lg', 'https://upload.wikimedia.org/wikipedia/commons/2/2f/LG_logo.svg', true),
  ('Dell', 'dell', 'https://upload.wikimedia.org/wikipedia/commons/1/18/Dell_logo.svg', true),
  ('Lenovo', 'lenovo', 'https://upload.wikimedia.org/wikipedia/commons/9/9e/Lenovo_logo.svg', true);

-- =====================================================
-- PRODUCTOS - SMARTPHONES
-- =====================================================
INSERT INTO productos (nombre, slug, descripcion, descripcion_larga, precio_venta, precio_original, categoria_id, marca_id, genero, color, material, destacado, activo) VALUES
  ('iPhone 15 Pro Max', 'iphone-15-pro-max', 'Aspecto excelente', 'iPhone 15 Pro Max en perfecto estado. Pantalla OLED 6.7", A17 Pro, cámara 48MP. Incluye carcasa y cable original. Garantía 24 meses.', 139900, 199900, (SELECT id FROM categorias WHERE slug = 'smartphones'), (SELECT id FROM marcas WHERE slug = 'apple'), 'Unisex', 'Titanio Blanco', 'Metal/Cristal', true, true),
  ('iPhone 14 Pro', 'iphone-14-pro', 'Buen estado', 'iPhone 14 Pro con A16 Bionic. Pantalla ProMotion 120Hz, cámara profesional. Batería al 95%. Sin accesorios. Garantía 24 meses.', 94900, 139900, (SELECT id FROM categorias WHERE slug = 'smartphones'), (SELECT id FROM marcas WHERE slug = 'apple'), 'Unisex', 'Gris Espacial', 'Metal/Cristal', false, true),
  ('Samsung Galaxy S24 Ultra', 'samsung-galaxy-s24-ultra', 'Aspecto excelente', 'Samsung Galaxy S24 Ultra con Snapdragon 8 Gen 3. Pantalla AMOLED 6.8", cámara 200MP, batería 5000mAh. Prácticamente nuevo.', 129900, 189900, (SELECT id FROM categorias WHERE slug = 'smartphones'), (SELECT id FROM marcas WHERE slug = 'samsung'), 'Unisex', 'Negro Fantasma', 'Metal/Cristal', true, true),
  ('Samsung Galaxy S23', 'samsung-galaxy-s23', 'Como nuevo', 'Galaxy S23 con Snapdragon 8 Gen 2. Pantalla AMOLED 6.1", cámara 50MP, solo 2 meses de uso.', 79900, 119900, (SELECT id FROM categorias WHERE slug = 'smartphones'), (SELECT id FROM marcas WHERE slug = 'samsung'), 'Unisex', 'Crema', 'Metal/Cristal', false, true),
  ('Google Pixel 8 Pro', 'google-pixel-8-pro', 'Aspecto excelente', 'Google Pixel 8 Pro con Tensor G3. IA en fotografía, pantalla OLED 6.7". Mejor cámara de software. Garantía 24 meses.', 99900, 149900, (SELECT id FROM categorias WHERE slug = 'smartphones'), (SELECT id FROM marcas WHERE slug = 'google'), 'Unisex', 'Obsidiana', 'Metal/Cristal', true, true),
  ('Google Pixel 7a', 'google-pixel-7a', 'Buen estado', 'Pixel 7a con Tensor, cámara excelente, pantalla OLED 6.1". Batería al 85%. Sin caja original.', 39900, 59900, (SELECT id FROM categorias WHERE slug = 'smartphones'), (SELECT id FROM marcas WHERE slug = 'google'), 'Unisex', 'Blanco Tiza', 'Metal/Cristal', false, true);

-- =====================================================
-- PRODUCTOS - LAPTOPS
-- =====================================================
INSERT INTO productos (nombre, slug, descripcion, descripcion_larga, precio_venta, precio_original, categoria_id, marca_id, genero, color, material, destacado, activo) VALUES
  ('MacBook Pro 16" M3 Max', 'macbook-pro-16-m3-max', 'Aspecto excelente', 'MacBook Pro 16 pulgadas con chip M3 Max, 36GB RAM, 512GB SSD. Batería al 98%. Incluye cargador original. Garantía 24 meses.', 239900, 349900, (SELECT id FROM categorias WHERE slug = 'laptops'), (SELECT id FROM marcas WHERE slug = 'apple'), 'Unisex', 'Gris Espacial', 'Aluminio', true, true),
  ('MacBook Air M2', 'macbook-air-m2', 'Como nuevo', 'MacBook Air 13" con M2, 16GB RAM, 512GB SSD. Solo 1 mes de uso. Con caja original e impecable.', 139900, 199900, (SELECT id FROM categorias WHERE slug = 'laptops'), (SELECT id FROM marcas WHERE slug = 'apple'), 'Unisex', 'Medianoche', 'Aluminio', true, true),
  ('Dell XPS 15', 'dell-xps-15', 'Buen estado', 'Dell XPS 15 con Intel i7 13700H, RTX 4060, 16GB RAM, pantalla 4K OLED. Pequeños arañazos. Garantía 12 meses.', 119900, 179900, (SELECT id FROM categorias WHERE slug = 'laptops'), (SELECT id FROM marcas WHERE slug = 'dell'), 'Unisex', 'Platino Oscuro', 'Metal', false, true),
  ('Lenovo ThinkPad X1 Carbon', 'lenovo-thinkpad-x1-carbon', 'Aspecto excelente', 'ThinkPad X1 Carbon Gen 11 con Intel i5, 16GB RAM, SSD 512GB. Pantalla 14" IPS. Para profesionales. Garantía 12 meses.', 89900, 139900, (SELECT id FROM categorias WHERE slug = 'laptops'), (SELECT id FROM marcas WHERE slug = 'lenovo'), 'Unisex', 'Negro', 'Aluminio/Magnesio', false, true),
  ('ASUS VivoBook 15', 'asus-vivobook-15', 'Buen estado', 'ASUS VivoBook 15 con AMD Ryzen 5, 8GB RAM, 256GB SSD. Pantalla 15.6" IPS. Ligera y portátil.', 34900, 54900, (SELECT id FROM categorias WHERE slug = 'laptops'), (SELECT id FROM marcas WHERE slug = 'asus'), 'Unisex', 'Plata', 'Plástico', false, true);

-- =====================================================
-- PRODUCTOS - TABLETS
-- =====================================================
INSERT INTO productos (nombre, slug, descripcion, descripcion_larga, precio_venta, precio_original, categoria_id, marca_id, genero, color, material, destacado, activo) VALUES
  ('iPad Pro 12.9" M2', 'ipad-pro-129-m2', 'Aspecto excelente', 'iPad Pro 12.9 con chip M2, pantalla Liquid Retina XDR, 256GB almacenamiento. Incluye Apple Pencil. Garantía 24 meses.', 89900, 129900, (SELECT id FROM categorias WHERE slug = 'tablets'), (SELECT id FROM marcas WHERE slug = 'apple'), 'Unisex', 'Gris Espacial', 'Aluminio', true, true),
  ('iPad Air 11"', 'ipad-air-11', 'Como nuevo', 'iPad Air 11 con M1, pantalla Liquid Retina, 128GB. Casi sin usar, incluye caja original.', 64900, 99900, (SELECT id FROM categorias WHERE slug = 'tablets'), (SELECT id FROM marcas WHERE slug = 'apple'), 'Unisex', 'Púrpura', 'Aluminio', true, true),
  ('iPad 10', 'ipad-10', 'Buen estado', 'iPad 10ª generación con A14, pantalla Liquid Retina 10.9", 64GB. Batería al 90%.', 29900, 44900, (SELECT id FROM categorias WHERE slug = 'tablets'), (SELECT id FROM marcas WHERE slug = 'apple'), 'Unisex', 'Azul', 'Aluminio', false, true),
  ('Samsung Galaxy Tab S9 Ultra', 'samsung-galaxy-tab-s9-ultra', 'Aspecto excelente', 'Galaxy Tab S9 Ultra con Snapdragon 8 Gen 2, pantalla AMOLED 14.6", 512GB. Para profesionales.', 79900, 129900, (SELECT id FROM categorias WHERE slug = 'tablets'), (SELECT id FROM marcas WHERE slug = 'samsung'), 'Unisex', 'Gris', 'Metal', false, true);

-- =====================================================
-- PRODUCTOS - AUDIO
-- =====================================================
INSERT INTO productos (nombre, slug, descripcion, descripcion_larga, precio_venta, precio_original, categoria_id, marca_id, genero, color, material, destacado, activo) VALUES
  ('AirPods Pro 2', 'airpods-pro-2', 'Aspecto excelente', 'AirPods Pro 2 con cancelación de ruido activa, audio espacial, carga inalámbrica. Garantía 24 meses.', 19900, 27900, (SELECT id FROM categorias WHERE slug = 'audio'), (SELECT id FROM marcas WHERE slug = 'apple'), 'Unisex', 'Blanco', 'Plástico', true, true),
  ('Sony WH-1000XM5', 'sony-wh-1000xm5', 'Aspecto excelente', 'Sony WH-1000XM5 - Los mejores auriculares con cancelación de ruido. Autonomía 30 horas, sonido premium.', 34900, 47900, (SELECT id FROM categorias WHERE slug = 'audio'), (SELECT id FROM marcas WHERE slug = 'sony'), 'Unisex', 'Negro', 'Plástico/Metal', true, true),
  ('Beats Studio Pro', 'beats-studio-pro', 'Como nuevo', 'Beats Studio Pro con cancelación de ruido, sonido personalizado, carga rápida. Incluye estuche.', 24900, 39900, (SELECT id FROM categorias WHERE slug = 'audio'), (SELECT id FROM marcas WHERE slug = 'apple'), 'Unisex', 'Gris Antracita', 'Plástico/Metal', false, true),
  ('Samsung Galaxy Buds2 Pro', 'samsung-galaxy-buds2-pro', 'Buen estado', 'Galaxy Buds2 Pro con cancelación activa, sonido 360, carga inalámbrica. Batería al 90%.', 12900, 19900, (SELECT id FROM categorias WHERE slug = 'audio'), (SELECT id FROM marcas WHERE slug = 'samsung'), 'Unisex', 'Negro', 'Plástico', false, true);

-- =====================================================
-- PRODUCTOS - WEARABLES
-- =====================================================
INSERT INTO productos (nombre, slug, descripcion, descripcion_larga, precio_venta, precio_original, categoria_id, marca_id, genero, color, material, destacado, activo) VALUES
  ('Apple Watch Ultra', 'apple-watch-ultra', 'Aspecto excelente', 'Apple Watch Ultra con titanio, pantalla LTPO OLED, resistencia extrema. Garantía 24 meses.', 39900, 59900, (SELECT id FROM categorias WHERE slug = 'wearables'), (SELECT id FROM marcas WHERE slug = 'apple'), 'Unisex', 'Titanio Natural', 'Titanio', true, true),
  ('Apple Watch Series 9', 'apple-watch-series-9', 'Como nuevo', 'Apple Watch Series 9 de 41mm, pantalla LTPO OLED, salud y fitness avanzado. Incluye bandas.', 24900, 39900, (SELECT id FROM categorias WHERE slug = 'wearables'), (SELECT id FROM marcas WHERE slug = 'apple'), 'Unisex', 'Starlight', 'Aluminio', true, true),
  ('Samsung Galaxy Watch 6 Classic', 'samsung-galaxy-watch-6-classic', 'Buen estado', 'Galaxy Watch 6 Classic con bisel giratorio, AMOLED 1.4", Wear OS 3. Batería excelente.', 19900, 34900, (SELECT id FROM categorias WHERE slug = 'wearables'), (SELECT id FROM marcas WHERE slug = 'samsung'), 'Unisex', 'Negro Gráfito', 'Metal', false, true),
  ('Fitbit Sense 2', 'fitbit-sense-2', 'Aspecto excelente', 'Fitbit Sense 2 con EDA sensor, salud cardiovascular, SpO2, estrés. Ideal para fitness.', 14900, 24900, (SELECT id FROM categorias WHERE slug = 'wearables'), (SELECT id FROM marcas WHERE slug = 'google'), 'Unisex', 'Blanco', 'Goma/Metal', false, true);

-- =====================================================
-- PRODUCTOS - CÁMARAS
-- =====================================================
INSERT INTO productos (nombre, slug, descripcion, descripcion_larga, precio_venta, precio_original, categoria_id, marca_id, genero, color, material, destacado, activo) VALUES
  ('Canon EOS R6', 'canon-eos-r6', 'Aspecto excelente', 'Canon EOS R6 - Cámara profesional sin espejo, sensor full-frame 20MP, video 4K. Incluye lentes. Garantía 12 meses.', 179900, 269900, (SELECT id FROM categorias WHERE slug = 'camaras'), (SELECT id FROM marcas WHERE slug = 'canon'), 'Unisex', 'Negro', 'Metal/Polímero', true, true),
  ('Sony Alpha 6700', 'sony-alpha-6700', 'Como nuevo', 'Sony Alpha 6700 con sensor APS-C, autofoco de 759 puntos, video 4K rápido. Perfecto para contenido.', 129900, 189900, (SELECT id FROM categorias WHERE slug = 'camaras'), (SELECT id FROM marcas WHERE slug = 'sony'), 'Unisex', 'Negro', 'Metal/Polímero', true, true),
  ('GoPro Hero 12', 'gopro-hero-12', 'Aspecto excelente', 'GoPro Hero 12 Black - 5.3K video, HyperSmooth, resistente al agua. Perfecta para aventura.', 39900, 54900, (SELECT id FROM categorias WHERE slug = 'camaras'), (SELECT id FROM marcas WHERE slug = 'gopro'), 'Unisex', 'Negro', 'Plástico/Metal', false, true),
  ('DJI Mini 4 Pro', 'dji-mini-4-pro', 'Buen estado', 'DJI Mini 4 Pro - Drone 4K, tiempo vuelo 31 min, resistencia viento 10m/s. Incluye maletin.', 59900, 89900, (SELECT id FROM categorias WHERE slug = 'camaras'), (SELECT id FROM marcas WHERE slug = 'dji'), 'Unisex', 'Gris', 'Plástico', false, true);

-- =====================================================
-- PRODUCTOS - MONITORES
-- =====================================================
INSERT INTO productos (nombre, slug, descripcion, descripcion_larga, precio_venta, precio_original, categoria_id, marca_id, genero, color, material, destacado, activo) VALUES
  ('LG UltraWide 34"', 'lg-ultrawide-34', 'Aspecto excelente', 'LG 34" OLED UltraWide, 3440x1440, 240Hz, color perfecto para profesionales. Garantía 24 meses.', 79900, 119900, (SELECT id FROM categorias WHERE slug = 'monitores'), (SELECT id FROM marcas WHERE slug = 'lg'), 'Unisex', 'Negro', 'Metal/Plástico', true, true),
  ('Dell S3721DGF', 'dell-s3721dgf', 'Aspecto excelente', 'Dell 37" IPS, 3840x1600, 165Hz, para gaming multitarea y profesionales.', 59900, 89900, (SELECT id FROM categorias WHERE slug = 'monitores'), (SELECT id FROM marcas WHERE slug = 'dell'), 'Unisex', 'Negro', 'Metal/Plástico', true, true),
  ('ASUS ProArt PA278QV', 'asus-proart-pa278qv', 'Como nuevo', 'ASUS ProArt 27" QHD IPS, calibrado de fábrica, color accuracy para edición.', 34900, 54900, (SELECT id FROM categorias WHERE slug = 'monitores'), (SELECT id FROM marcas WHERE slug = 'asus'), 'Unisex', 'Negro', 'Metal/Plástico', false, true),
  ('LG 27GP850', 'lg-27gp850', 'Buen estado', 'LG 27" Gaming 1440p 180Hz, IPS, tiempo respuesta 1ms, ideal para competitivo.', 24900, 39900, (SELECT id FROM categorias WHERE slug = 'monitores'), (SELECT id FROM marcas WHERE slug = 'lg'), 'Unisex', 'Negro', 'Metal/Plástico', false, true);

-- =====================================================
-- PRODUCTOS - CONSOLAS
-- =====================================================
INSERT INTO productos (nombre, slug, descripcion, descripcion_larga, precio_venta, precio_original, categoria_id, marca_id, genero, color, material, destacado, activo) VALUES
  ('PlayStation 5', 'playstation-5', 'Aspecto excelente', 'PS5 con 2 controles DualSense, incluye juegos y cables. Garantía 12 meses.', 39900, 59900, (SELECT id FROM categorias WHERE slug = 'consolas'), (SELECT id FROM marcas WHERE slug = 'sony'), 'Unisex', 'Blanco/Negro', 'Plástico', true, true),
  ('Xbox Series X', 'xbox-series-x', 'Como nuevo', 'Xbox Series X - La consola más potente. Incluye Game Pass 3 meses y controles.', 44900, 64900, (SELECT id FROM categorias WHERE slug = 'consolas'), (SELECT id FROM marcas WHERE slug = 'microsoft'), 'Unisex', 'Negro', 'Plástico', true, true),
  ('Nintendo Switch OLED', 'nintendo-switch-oled', 'Aspecto excelente', 'Nintendo Switch OLED con pantalla 7", controles Joy-Con, base. Incluye juegos.', 29900, 44900, (SELECT id FROM categorias WHERE slug = 'consolas'), (SELECT id FROM marcas WHERE slug = 'nintendo'), 'Unisex', 'Blanco', 'Plástico', false, true),
  ('Steam Deck 512GB', 'steam-deck-512gb', 'Buen estado', 'Steam Deck 512GB - Juega PC en cualquier lugar. Batería al 90%.', 34900, 54900, (SELECT id FROM categorias WHERE slug = 'consolas'), (SELECT id FROM marcas WHERE slug = 'valve'), 'Unisex', 'Negro', 'Metal/Plástico', false, true);

-- =====================================================
-- AGREGAR IMÁGENES A LOS PRODUCTOS
-- =====================================================

-- Smartphones
INSERT INTO imagenes_producto (producto_id, url, alt_text, es_principal) VALUES
  ((SELECT id FROM productos WHERE slug = 'iphone-15-pro-max'), 'https://images.unsplash.com/photo-1592286927505-1def25115558?w=600&q=80', 'iPhone 15 Pro Max', true),
  ((SELECT id FROM productos WHERE slug = 'iphone-14-pro'), 'https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=600&q=80', 'iPhone 14 Pro', true),
  ((SELECT id FROM productos WHERE slug = 'samsung-galaxy-s24-ultra'), 'https://images.unsplash.com/photo-1511454941351-3406841bd33c?w=600&q=80', 'Samsung Galaxy S24 Ultra', true),
  ((SELECT id FROM productos WHERE slug = 'samsung-galaxy-s23'), 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=600&q=80', 'Samsung Galaxy S23', true),
  ((SELECT id FROM productos WHERE slug = 'google-pixel-8-pro'), 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&q=80', 'Google Pixel 8 Pro', true),
  ((SELECT id FROM productos WHERE slug = 'google-pixel-7a'), 'https://images.unsplash.com/photo-1516321318423-f06f70674e90?w=600&q=80', 'Google Pixel 7a', true),

-- Laptops
  ((SELECT id FROM productos WHERE slug = 'macbook-pro-16-m3-max'), 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80', 'MacBook Pro 16', true),
  ((SELECT id FROM productos WHERE slug = 'macbook-air-m2'), 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=600&q=80', 'MacBook Air M2', true),
  ((SELECT id FROM productos WHERE slug = 'dell-xps-15'), 'https://images.unsplash.com/photo-1592286927505-1def25115558?w=600&q=80', 'Dell XPS 15', true),
  ((SELECT id FROM productos WHERE slug = 'lenovo-thinkpad-x1-carbon'), 'https://images.unsplash.com/photo-1587614382346-4ec2e51c7966?w=600&q=80', 'Lenovo ThinkPad X1', true),
  ((SELECT id FROM productos WHERE slug = 'asus-vivobook-15'), 'https://images.unsplash.com/photo-1554080221-cbf3b5b92908?w=600&q=80', 'ASUS VivoBook 15', true),

-- Tablets
  ((SELECT id FROM productos WHERE slug = 'ipad-pro-129-m2'), 'https://images.unsplash.com/photo-1542751371-69fde4a84776?w=600&q=80', 'iPad Pro 12.9', true),
  ((SELECT id FROM productos WHERE slug = 'ipad-air-11'), 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80', 'iPad Air 11', true),
  ((SELECT id FROM productos WHERE slug = 'ipad-10'), 'https://images.unsplash.com/photo-1517437132885-fd3ee5ab7e0f?w=600&q=80', 'iPad 10', true),
  ((SELECT id FROM productos WHERE slug = 'samsung-galaxy-tab-s9-ultra'), 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&q=80', 'Samsung Galaxy Tab S9', true),

-- Audio
  ((SELECT id FROM productos WHERE slug = 'airpods-pro-2'), 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&q=80', 'AirPods Pro 2', true),
  ((SELECT id FROM productos WHERE slug = 'sony-wh-1000xm5'), 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80', 'Sony WH-1000XM5', true),
  ((SELECT id FROM productos WHERE slug = 'beats-studio-pro'), 'https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=600&q=80', 'Beats Studio Pro', true),
  ((SELECT id FROM productos WHERE slug = 'samsung-galaxy-buds2-pro'), 'https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=600&q=80', 'Samsung Galaxy Buds2', true),

-- Wearables
  ((SELECT id FROM productos WHERE slug = 'apple-watch-ultra'), 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80', 'Apple Watch Ultra', true),
  ((SELECT id FROM productos WHERE slug = 'apple-watch-series-9'), 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80', 'Apple Watch Series 9', true),
  ((SELECT id FROM productos WHERE slug = 'samsung-galaxy-watch-6-classic'), 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80', 'Samsung Galaxy Watch 6', true),
  ((SELECT id FROM productos WHERE slug = 'fitbit-sense-2'), 'https://images.unsplash.com/photo-1575311373937-040b3e6be5b0?w=600&q=80', 'Fitbit Sense 2', true),

-- Cámaras
  ((SELECT id FROM productos WHERE slug = 'canon-eos-r6'), 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600&q=80', 'Canon EOS R6', true),
  ((SELECT id FROM productos WHERE slug = 'sony-alpha-6700'), 'https://images.unsplash.com/photo-1614008375890-cb53b6c5f8d5?w=600&q=80', 'Sony Alpha 6700', true),
  ((SELECT id FROM productos WHERE slug = 'gopro-hero-12'), 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&q=80', 'GoPro Hero 12', true),
  ((SELECT id FROM productos WHERE slug = 'dji-mini-4-pro'), 'https://images.unsplash.com/photo-1506080773721-48c6a2a2f801?w=600&q=80', 'DJI Mini 4 Pro', true),

-- Monitores
  ((SELECT id FROM productos WHERE slug = 'lg-ultrawide-34'), 'https://images.unsplash.com/photo-1587578924270-fda4d20bc29f?w=600&q=80', 'LG UltraWide 34', true),
  ((SELECT id FROM productos WHERE slug = 'dell-s3721dgf'), 'https://images.unsplash.com/photo-1587578924270-fda4d20bc29f?w=600&q=80', 'Dell S3721DGF', true),
  ((SELECT id FROM productos WHERE slug = 'asus-proart-pa278qv'), 'https://images.unsplash.com/photo-1587578924270-fda4d20bc29f?w=600&q=80', 'ASUS ProArt PA278QV', true),
  ((SELECT id FROM productos WHERE slug = 'lg-27gp850'), 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=600&q=80', 'LG 27GP850', true),

-- Consolas
  ((SELECT id FROM productos WHERE slug = 'playstation-5'), 'https://images.unsplash.com/photo-1580522862550-8ddb75ed3e6e?w=600&q=80', 'PlayStation 5', true),
  ((SELECT id FROM productos WHERE slug = 'xbox-series-x'), 'https://images.unsplash.com/photo-1606841838979-c90ecc10152f?w=600&q=80', 'Xbox Series X', true),
  ((SELECT id FROM productos WHERE slug = 'nintendo-switch-oled'), 'https://images.unsplash.com/photo-1559163499-641c0ac8179e?w=600&q=80', 'Nintendo Switch OLED', true),
  ((SELECT id FROM productos WHERE slug = 'steam-deck-512gb'), 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=600&q=80', 'Steam Deck 512GB', true);
