-- =====================================================
-- LIMPIAR DATOS ACTUALES
-- =====================================================

-- Eliminar todos los productos primero
DELETE FROM products;

-- Eliminar todas las categorías
DELETE FROM categories;

-- =====================================================
-- NUEVAS CATEGORÍAS - Tech Store
-- =====================================================

INSERT INTO categories (name, slug, description) VALUES
  ('Procesadores', 'procesadores', 'CPUs de última generación para gaming y productividad'),
  ('Tarjetas Gráficas', 'tarjetas-graficas', 'GPUs potentes para gaming y renderizado'),
  ('Memoria RAM', 'memoria-ram', 'Módulos de memoria rápida DDR4 y DDR5'),
  ('Discos Duros SSD', 'discos-duros-ssd', 'Almacenamiento rápido NVMe y SATA'),
  ('Placas Base', 'placas-base', 'Placas madre de todas las marcas principales'),
  ('Fuentes de Poder', 'fuentes-de-poder', 'Fuentes confiables para tu PC gamer'),
  ('Refrigeración', 'refrigeracion', 'Sistemas de refrigeración aire y líquido'),
  ('Carcasas PC', 'carcasas-pc', 'Carcasas para tu build personalizado'),
  ('Móviles', 'moviles', 'Smartphones de última tecnología'),
  ('Accesorios Móvil', 'accesorios-movil', 'Fundas, protectores y accesorios'),
  ('Teclados Mecánicos', 'teclados-mecanicos', 'Teclados gaming mecánicos de alta calidad'),
  ('Ratones Gaming', 'ratones-gaming', 'Ratones de precisión para gamers'),
  ('Monitores', 'monitores', 'Monitores 4K y gaming de alta frecuencia'),
  ('Auriculares', 'auriculares', 'Auriculares wireless y gaming');

-- =====================================================
-- NUEVOS PRODUCTOS - Procesadores
-- =====================================================

INSERT INTO products (name, slug, description, price, stock, category_id, featured, active, images) VALUES
  ('Intel Core i9-14900K', 'intel-core-i9-14900k', 'Procesador flagship de Intel con 24 núcleos. Perfecto para gaming extremo y streaming simultáneo.', 69999, 12, (SELECT id FROM categories WHERE slug = 'procesadores'), true, true, ARRAY['https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&q=80']),
  ('AMD Ryzen 9 7950X3D', 'amd-ryzen-9-7950x3d', 'Procesador top de AMD con 3D V-Cache. El mejor para gaming puro en 2024.', 64999, 8, (SELECT id FROM categories WHERE slug = 'procesadores'), true, true, ARRAY['https://images.unsplash.com/photo-1515187029838-6ad9e70b0e19?w=500&q=80']),
  ('Intel Core i7-14700K', 'intel-core-i7-14700k', 'Excelente relación precio-rendimiento con 20 núcleos. Ideal para streamers.', 49999, 15, (SELECT id FROM categories WHERE slug = 'procesadores'), false, true, ARRAY['https://images.unsplash.com/photo-1559092202-8f4baf0746d5?w=500&q=80']),
  ('AMD Ryzen 7 7700X', 'amd-ryzen-7-7700x', 'CPU de 8 núcleos muy equilibrada para gaming y trabajo profesional.', 39999, 20, (SELECT id FROM categories WHERE slug = 'procesadores'), false, true, ARRAY['https://images.unsplash.com/photo-1591536912155-716226fbf752?w=500&q=80']),
  ('Intel Core i5-14600K', 'intel-core-i5-14600k', 'Perfecto entry-level para 1440p gaming a alto rendimiento.', 29999, 25, (SELECT id FROM categories WHERE slug = 'procesadores'), false, true, ARRAY['https://images.unsplash.com/photo-1565043666747-69f6646db940?w=500&q=80']);

-- =====================================================
-- NUEVOS PRODUCTOS - Tarjetas Gráficas
-- =====================================================

INSERT INTO products (name, slug, description, price, stock, category_id, featured, active, images) VALUES
  ('NVIDIA RTX 4090', 'nvidia-rtx-4090', 'La tarjeta gráfica más potente del mercado. Domina cualquier juego en 4K.', 189999, 5, (SELECT id FROM categories WHERE slug = 'tarjetas-graficas'), true, true, ARRAY['https://images.unsplash.com/photo-1611532736579-6b16e2b50449?w=500&q=80']),
  ('NVIDIA RTX 4080', 'nvidia-rtx-4080', 'Excelente para 4K gaming y ray tracing ultra. Mejor rendimiento por precio.', 129999, 8, (SELECT id FROM categories WHERE slug = 'tarjetas-graficas'), true, true, ARRAY['https://images.unsplash.com/photo-1587614382346-4ec2e51c7966?w=500&q=80']),
  ('AMD RX 7900 XTX', 'amd-rx-7900-xtx', 'Competencia seria para RTX 4090 con mejor rendimiento en algunos juegos.', 119999, 6, (SELECT id FROM categories WHERE slug = 'tarjetas-graficas'), false, true, ARRAY['https://images.unsplash.com/photo-1588872657840-218e86e3dd34?w=500&q=80']),
  ('NVIDIA RTX 4070', 'nvidia-rtx-4070', 'Ideal para 1440p gaming ultra con ray tracing completo.', 79999, 12, (SELECT id FROM categories WHERE slug = 'tarjetas-graficas'), false, true, ARRAY['https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=500&q=80']),
  ('NVIDIA RTX 4060 Ti', 'nvidia-rtx-4060-ti', 'Entry level con DLSS 3. Perfecto para 1080p gaming competitivo.', 49999, 18, (SELECT id FROM categories WHERE slug = 'tarjetas-graficas'), false, true, ARRAY['https://images.unsplash.com/photo-1519762211715-31a731b7a629?w=500&q=80']);

-- =====================================================
-- NUEVOS PRODUCTOS - Memoria RAM
-- =====================================================

INSERT INTO products (name, slug, description, price, stock, category_id, featured, active, images) VALUES
  ('Corsair Dominator DDR5 32GB 6000MHz', 'corsair-dominator-ddr5-32gb', 'RAM DDR5 ultra rápida para generación más reciente. Incluye RGB Corsair iCUE.', 29999, 10, (SELECT id FROM categories WHERE slug = 'memoria-ram'), true, true, ARRAY['https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=500&q=80']),
  ('G.SKILL Trident Z5 RGB 32GB DDR5', 'gskill-trident-z5-32gb', 'DDR5 de alto rendimiento con RGB integrado. Compatible con todas las placas base nuevas.', 27999, 12, (SELECT id FROM categories WHERE slug = 'memoria-ram'), false, true, ARRAY['https://images.unsplash.com/photo-1550355291-bbee04a92027?w=500&q=80']),
  ('Kingston Fury Beast 32GB DDR4 3600MHz', 'kingston-fury-beast-32gb', 'Excelente DDR4 para presupuestos ajustados. Buena velocidad y estabilidad.', 17999, 20, (SELECT id FROM categories WHERE slug = 'memoria-ram'), false, true, ARRAY['https://images.unsplash.com/photo-1595225476933-0efcc8988ede?w=500&q=80']),
  ('Corsair Vengeance RGB Pro 16GB DDR4', 'corsair-vengeance-rgb-16gb', 'RAM DDR4 versátil con RGB configurable. Gran valor para gaming.', 12999, 25, (SELECT id FROM categories WHERE slug = 'memoria-ram'), false, true, ARRAY['https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&q=80']);

-- =====================================================
-- NUEVOS PRODUCTOS - Discos Duros SSD
-- =====================================================

INSERT INTO products (name, slug, description, price, stock, category_id, featured, active, images) VALUES
  ('Samsung 990 Pro 4TB NVMe M.2', 'samsung-990-pro-4tb', 'SSD PCIe Gen 4 más rápido del mercado. Velocidades de lectura hasta 7400 MB/s.', 79999, 8, (SELECT id FROM categories WHERE slug = 'discos-duros-ssd'), true, true, ARRAY['https://images.unsplash.com/photo-1468276311594-df7cb65d8b0d?w=500&q=80']),
  ('WD Black SN850X 2TB NVMe', 'wd-black-sn850x-2tb', 'SSD gaming con velocidades de hasta 7100 MB/s. Perfecto para cargas rápidas.', 39999, 15, (SELECT id FROM categories WHERE slug = 'discos-duros-ssd'), true, true, ARRAY['https://images.unsplash.com/photo-1531689594112-1fda6c5f7e50?w=500&q=80']),
  ('Kingston A3000 1TB NVMe', 'kingston-a3000-1tb', 'NVMe asequible pero rápido. Opción budget-friendly sin comprometer rendimiento.', 14999, 30, (SELECT id FROM categories WHERE slug = 'discos-duros-ssd'), false, true, ARRAY['https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=500&q=80']),
  ('Seagate BarraCuda 2TB SSD SATA', 'seagate-barracuda-2tb', 'SSD SATA confiable para actualizar tu viejo disco. Excelente relación precio-rendimiento.', 11999, 25, (SELECT id FROM categories WHERE slug = 'discos-duros-ssd'), false, true, ARRAY['https://images.unsplash.com/photo-1563861826100-9cb868fdbe1e?w=500&q=80']);

-- =====================================================
-- NUEVOS PRODUCTOS - Placas Base
-- =====================================================

INSERT INTO products (name, slug, description, price, stock, category_id, featured, active, images) VALUES
  ('ASUS ROG Maximus Z890-E', 'asus-rog-maximus-z890-e', 'Placa base flagship para Intel con conectividad premium. Socket LGA1700.', 79999, 6, (SELECT id FROM categories WHERE slug = 'placas-base'), true, true, ARRAY['https://images.unsplash.com/photo-1587614382346-4ec2e51c7966?w=500&q=80']),
  ('MSI MPG B850 EDGE WIFI', 'msi-mpg-b850-edge-wifi', 'Placa base AM5 excelente para Ryzen 7000 series. WiFi 6E incluido.', 49999, 10, (SELECT id FROM categories WHERE slug = 'placas-base'), false, true, ARRAY['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80']),
  ('Gigabyte Z890 AORUS Master', 'gigabyte-z890-aorus-master', 'Placa premium para Intel gen 14. Diseño robusto y buena VRM.', 69999, 8, (SELECT id FROM categories WHERE slug = 'placas-base'), false, true, ARRAY['https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500&q=80']),
  ('ASUS Prime B850-Plus', 'asus-prime-b850-plus', 'Placa base AM5 budget-friendly pero confiable. Buen balance.', 24999, 18, (SELECT id FROM categories WHERE slug = 'placas-base'), false, true, ARRAY['https://images.unsplash.com/photo-1570129477492-45f003313e78?w=500&q=80']);

-- =====================================================
-- NUEVOS PRODUCTOS - Móviles
-- =====================================================

INSERT INTO products (name, slug, description, price, stock, category_id, featured, active, images) VALUES
  ('iPhone 16 Pro Max 1TB', 'iphone-16-pro-max-1tb', 'El mejor móvil del mercado. Cámara profesional y rendimiento incomparable.', 169999, 10, (SELECT id FROM categories WHERE slug = 'moviles'), true, true, ARRAY['https://images.unsplash.com/photo-1592286927505-1def25115558?w=500&q=80']),
  ('Samsung Galaxy S24 Ultra 512GB', 'samsung-galaxy-s24-ultra-512gb', 'Android de gama alta con pantalla increíble y cámaras versátiles.', 149999, 12, (SELECT id FROM categories WHERE slug = 'moviles'), true, true, ARRAY['https://images.unsplash.com/photo-1511454941351-3406841bd33c?w=500&q=80']),
  ('Google Pixel 9 Pro XL 512GB', 'google-pixel-9-pro-xl-512gb', 'Mejor fotografía computacional. IA integrada en el procesamiento.', 139999, 8, (SELECT id FROM categories WHERE slug = 'moviles'), false, true, ARRAY['https://images.unsplash.com/photo-1556656793-08538906a9f8?w=500&q=80']),
  ('Xiaomi 14 Ultra 512GB', 'xiaomi-14-ultra-512gb', 'Flagship chino a precio competitivo. Lente Leica premium.', 89999, 15, (SELECT id FROM categories WHERE slug = 'moviles'), false, true, ARRAY['https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=500&q=80']);

-- =====================================================
-- NUEVOS PRODUCTOS - Teclados Mecánicos
-- =====================================================

INSERT INTO products (name, slug, description, price, stock, category_id, featured, active, images) VALUES
  ('Corsair K100 RGB', 'corsair-k100-rgb', 'Teclado mecánico gaming con switches Cherry MX y macros programables.', 34999, 12, (SELECT id FROM categories WHERE slug = 'teclados-mecanicos'), true, true, ARRAY['https://images.unsplash.com/photo-1587829191301-11aa5bf54b51?w=500&q=80']),
  ('Razer Huntsman V3', 'razer-huntsman-v3', 'Switches ópticos ultra rápidos. Perfectamente diseñado para esports.', 29999, 14, (SELECT id FROM categories WHERE slug = 'teclados-mecanicos'), true, true, ARRAY['https://images.unsplash.com/photo-1595225476933-0efcc8988ede?w=500&q=80']),
  ('SteelSeries Apex Pro', 'steelseries-apex-pro', 'Switches ajustables OmniPoint. Personalización total de actuation.', 27999, 10, (SELECT id FROM categories WHERE slug = 'teclados-mecanicos'), false, true, ARRAY['https://images.unsplash.com/photo-1578992046677-fdc79c596b0b?w=500&q=80']),
  ('Keychron C3 Pro', 'keychron-c3-pro', 'Teclado mecánico asequible con excelente relación calidad-precio.', 12999, 25, (SELECT id FROM categories WHERE slug = 'teclados-mecanicos'), false, true, ARRAY['https://images.unsplash.com/photo-1595684645544-cef5dd19a2f6?w=500&q=80']);

-- =====================================================
-- NUEVOS PRODUCTOS - Ratones Gaming
-- =====================================================

INSERT INTO products (name, slug, description, price, stock, category_id, featured, active, images) VALUES
  ('Logitech G Pro X 2 Lightspeed', 'logitech-g-pro-x-2', 'Ratón profesional de esports. Sensor de 32000 DPI.', 19999, 15, (SELECT id FROM categories WHERE slug = 'ratones-gaming'), true, true, ARRAY['https://images.unsplash.com/photo-1527814050087-3793815479db?w=500&q=80']),
  ('Razer DeathAdder V3', 'razer-deathadder-v3', 'Ratón icónico gaming con sensor de precisión máxima.', 17999, 18, (SELECT id FROM categories WHERE slug = 'ratones-gaming'), true, true, ARRAY['https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=500&q=80']),
  ('SteelSeries Rival 5', 'steelseries-rival-5', 'Ratón versátil con 9 botones programables. Excelente ergonomía.', 14999, 20, (SELECT id FROM categories WHERE slug = 'ratones-gaming'), false, true, ARRAY['https://images.unsplash.com/photo-1527814050087-3793815479db?w=500&q=80']);

-- =====================================================
-- NUEVOS PRODUCTOS - Monitores
-- =====================================================

INSERT INTO products (name, slug, description, price, stock, category_id, featured, active, images) VALUES
  ('ASUS ROG Swift PG27UQDP 4K 144Hz', 'asus-rog-swift-4k-144hz', 'Monitor 4K 144Hz con DisplayPort 2.1. Panel IPS. El mejor para gaming 4K.', 99999, 5, (SELECT id FROM categories WHERE slug = 'monitores'), true, true, ARRAY['https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&q=80']),
  ('LG 27GP850-B 1440p 180Hz', 'lg-27gp850-1440p-180hz', 'Monitor gaming 1440p con 180Hz. Excelente para competitive gaming.', 49999, 10, (SELECT id FROM categories WHERE slug = 'monitores'), true, true, ARRAY['https://images.unsplash.com/photo-1598884868975-60db21a5e87c?w=500&q=80']),
  ('Dell S3721DGF 1440p 165Hz Curved', 'dell-s3721dgf-1440p-165hz', 'Monitor curvado para experiencia inmersiva. VA panel con buen contraste.', 39999, 8, (SELECT id FROM categories WHERE slug = 'monitores'), false, true, ARRAY['https://images.unsplash.com/photo-1604205139519-f1fa29f98cef?w=500&q=80']);

-- =====================================================
-- NUEVOS PRODUCTOS - Auriculares
-- =====================================================

INSERT INTO products (name, slug, description, price, stock, category_id, featured, active, images) VALUES
  ('Sony WH-1000XM5', 'sony-wh-1000xm5', 'Los mejores auriculares con ANC. Sonido premium y comodidad excepcional.', 39999, 10, (SELECT id FROM categories WHERE slug = 'auriculares'), true, true, ARRAY['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80']),
  ('Logitech G Pro X 2 Lightspeed', 'logitech-g-pro-x-2-audio', 'Auriculares gaming inalámbricos con latencia ultra-baja.', 29999, 12, (SELECT id FROM categories WHERE slug = 'auriculares'), true, true, ARRAY['https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500&q=80']),
  ('SteelSeries Arctis Nova 1', 'steelseries-arctis-nova-1', 'Auriculares gaming versátiles. Micrófono retráctil de muy buena calidad.', 21999, 15, (SELECT id FROM categories WHERE slug = 'auriculares'), false, true, ARRAY['https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=500&q=80']),
  ('JBL Tune 770NC', 'jbl-tune-770nc', 'Auriculares con ANC a buen precio. Buena duración de batería.', 14999, 18, (SELECT id FROM categories WHERE slug = 'auriculares'), false, true, ARRAY['https://images.unsplash.com/photo-1434653714784-403d979e1e4e?w=500&q=80']);

-- =====================================================
-- NUEVOS PRODUCTOS - Accesorios Móvil
-- =====================================================

INSERT INTO products (name, slug, description, price, stock, category_id, featured, active, images) VALUES
  ('Protector de pantalla vidrio templado iPhone 16 Pro', 'protector-pantalla-iphone-16-pro', 'Protector tempered glass con aplicación fácil y máxima claridad.', 1999, 50, (SELECT id FROM categories WHERE slug = 'accesorios-movil'), false, true, ARRAY['https://images.unsplash.com/photo-1599391811694-e1a2c1c9c3f8?w=500&q=80']),
  ('Funda silicona Samsung Galaxy S24 Ultra', 'funda-samsung-s24-ultra', 'Funda protectora suave con grip antideslizante.', 2499, 40, (SELECT id FROM categories WHERE slug = 'accesorios-movil'), false, true, ARRAY['https://images.unsplash.com/photo-1611532736579-6b16e2b50449?w=500&q=80']),
  ('Cargador rápido USB-C 65W', 'cargador-usb-c-65w', 'Cargador universal para cualquier dispositivo con USB-C. Carga rápida garantizada.', 4999, 35, (SELECT id FROM categories WHERE slug = 'accesorios-movil'), true, true, ARRAY['https://images.unsplash.com/photo-1609042231290-64851c1cf002?w=500&q=80']),
  ('Powerbank 30000mAh 100W', 'powerbank-30000mah', 'Batería externa de alta capacidad. Carga varios dispositivos simultáneamente.', 7999, 25, (SELECT id FROM categories WHERE slug = 'accesorios-movil'), false, true, ARRAY['https://images.unsplash.com/photo-1581092341563-40db08dcc531?w=500&q=80']);

-- =====================================================
-- NUEVOS PRODUCTOS - Fuentes de Poder
-- =====================================================

INSERT INTO products (name, slug, description, price, stock, category_id, featured, active, images) VALUES
  ('Corsair HX1500i 1500W 80 Plus Platinum', 'corsair-hx1500i-1500w', 'Fuente modular para builds extremos. Certificación Platinum.', 54999, 6, (SELECT id FROM categories WHERE slug = 'fuentes-de-poder'), true, true, ARRAY['https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=500&q=80']),
  ('Seasonic Focus GX 850W 80 Plus Gold', 'seasonic-focus-gx-850w', 'Fuente estable y silenciosa. Perfecta para la mayoría de builds.', 24999, 12, (SELECT id FROM categories WHERE slug = 'fuentes-de-poder'), true, true, ARRAY['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&q=80']),
  ('MSI MAG A850GL 850W 80 Plus Gold', 'msi-mag-a850gl-850w', 'Fuente confiable con buen diseño y ventilador silencioso.', 19999, 15, (SELECT id FROM categories WHERE slug = 'fuentes-de-poder'), false, true, ARRAY['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&q=80']);

-- =====================================================
-- NUEVOS PRODUCTOS - Refrigeración
-- =====================================================

INSERT INTO products (name, slug, description, price, stock, category_id, featured, active, images) VALUES
  ('Corsair iCUE Link H150i Elite LCD', 'corsair-icue-link-h150i', 'AIO refrigeración líquida con pantalla LCD integrada. Rendimiento excelente.', 34999, 8, (SELECT id FROM categories WHERE slug = 'refrigeracion'), true, true, ARRAY['https://images.unsplash.com/photo-1602524206684-88ccc95f4cae?w=500&q=80']),
  ('Noctua NH-D15', 'noctua-nh-d15', 'Mejor disipador de aire del mercado. Silencioso y eficiente. Legendario.', 14999, 15, (SELECT id FROM categories WHERE slug = 'refrigeracion'), false, true, ARRAY['https://images.unsplash.com/photo-1561070791-2526d30994b5?w=500&q=80']),
  ('NZXT Kraken X73', 'nzxt-kraken-x73', 'AIO 360mm con pantalla OLED. RGB sincronizable.', 27999, 10, (SELECT id FROM categories WHERE slug = 'refrigeracion'), true, true, ARRAY['https://images.unsplash.com/photo-1606933248051-5ce98adc5c2e?w=500&q=80']);

-- =====================================================
-- NUEVOS PRODUCTOS - Carcasas PC
-- =====================================================

INSERT INTO products (name, slug, description, price, stock, category_id, featured, active, images) VALUES
  ('Corsair 5000T RGB', 'corsair-5000t-rgb', 'Carcasa gaming premium con cristal templado y RGB integrado.', 39999, 8, (SELECT id FROM categories WHERE slug = 'carcasas-pc'), true, true, ARRAY['https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=500&q=80']),
  ('Lian Li LANCOOL 216 RGB', 'lian-li-lancool-216-rgb', 'Carcasa con buen flujo de aire y diseño moderno. Muy buena relación precio.', 14999, 15, (SELECT id FROM categories WHERE slug = 'carcasas-pc'), true, true, ARRAY['https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=500&q=80']),
  ('Thermaltake Level 20 HT Snow Edition', 'thermaltake-level-20-ht', 'Carcasa grande para builds extremos. Diseño único y modular.', 34999, 6, (SELECT id FROM categories WHERE slug = 'carcasas-pc'), false, true, ARRAY['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&q=80']);
