-- =====================================================
-- DATOS COMPLETOS - TIENDA ONLINE FUNCIONAL
-- =====================================================
-- Incluye ejemplos para todas las tablas de la BD

-- =====================================================
-- INSERTAR DIRECCIONES DE EJEMPLO
-- =====================================================
INSERT INTO direcciones (usuario_id, tipo, nombre_destinatario, calle, numero, piso, codigo_postal, ciudad, provincia, pais) VALUES
(
  (SELECT id FROM usuarios WHERE email = 'maria.garcia@email.com'),
  'Ambas',
  'María García López',
  'Calle Gran Vía',
  '123',
  '4B',
  '28001',
  'Madrid',
  'Madrid',
  'España'
),
(
  (SELECT id FROM usuarios WHERE email = 'carlos.rodriguez@email.com'),
  'Envío',
  'Carlos Rodríguez Martín',
  'Paseo de la Castellana',
  '456',
  NULL,
  '28046',
  'Madrid',
  'Madrid',
  'España'
),
(
  (SELECT id FROM usuarios WHERE email = 'laura.martin@email.com'),
  'Facturación',
  'Laura Martín Sánchez',
  'Avenida Diagonal',
  '789',
  '1A',
  '08014',
  'Barcelona',
  'Barcelona',
  'España'
),
(
  (SELECT id FROM usuarios WHERE email = 'antonio.lopez@email.com'),
  'Ambas',
  'Antonio López García',
  'Calle Colón',
  '234',
  '2C',
  '46004',
  'Valencia',
  'Valencia',
  'España'
),
(
  (SELECT id FROM usuarios WHERE email = 'isabel.fernandez@email.com'),
  'Envío',
  'Isabel Fernández Ruiz',
  'Paseo de Almería',
  '567',
  NULL,
  '04001',
  'Almería',
  'Almería',
  'España'
);

-- =====================================================
-- INSERTAR CARRITOS
-- =====================================================
INSERT INTO carrito (usuario_id) VALUES
  ((SELECT id FROM usuarios WHERE email = 'maria.garcia@email.com')),
  ((SELECT id FROM usuarios WHERE email = 'carlos.rodriguez@email.com')),
  ((SELECT id FROM usuarios WHERE email = 'laura.martin@email.com'));

-- =====================================================
-- INSERTAR ITEMS EN CARRITO
-- =====================================================
INSERT INTO carrito_items (carrito_id, producto_id, cantidad, talla, color, precio_unitario) VALUES
(
  (SELECT id FROM carrito WHERE usuario_id = (SELECT id FROM usuarios WHERE email = 'maria.garcia@email.com')),
  (SELECT id FROM productos WHERE slug = 'vestido-midi-floral'),
  1,
  'M',
  'Multicolor',
  8999
),
(
  (SELECT id FROM carrito WHERE usuario_id = (SELECT id FROM usuarios WHERE email = 'maria.garcia@email.com')),
  (SELECT id FROM productos WHERE slug = 'blusa-blanca-clasica'),
  2,
  'S',
  'Blanco',
  3999
),
(
  (SELECT id FROM carrito WHERE usuario_id = (SELECT id FROM usuarios WHERE email = 'carlos.rodriguez@email.com')),
  (SELECT id FROM productos WHERE slug = 'abrigo-largo-lana-camel'),
  1,
  'L',
  'Camel',
  19999
),
(
  (SELECT id FROM carrito WHERE usuario_id = (SELECT id FROM usuarios WHERE email = 'laura.martin@email.com')),
  (SELECT id FROM productos WHERE slug = 'pijama-seda-blanco'),
  1,
  'M',
  'Blanco',
  12999
);

-- =====================================================
-- INSERTAR CUPONES DE DESCUENTO
-- =====================================================
INSERT INTO cupones_descuento (codigo, descripcion, tipo, valor, minimo_compra, maximo_uses, activo, fecha_inicio, fecha_fin) VALUES
('PRIMERACOMPRA10', 'Descuento 10% en primera compra', 'Porcentaje', 10.00, 0, NULL, TRUE, NOW(), NOW() + INTERVAL '90 days'),
('VERANO20', 'Descuento 20% en todas las categorías', 'Porcentaje', 20.00, 0, 100, TRUE, NOW(), NOW() + INTERVAL '30 days'),
('ENVIOGRATIS', 'Envío gratis en compras mayores a 50€', 'Cantidad Fija', 10.00, 5000, 500, TRUE, NOW(), NOW() + INTERVAL '60 days'),
('VENTA2024', 'Descuento especial Black Friday 25€', 'Cantidad Fija', 25.00, 10000, 200, TRUE, NOW() - INTERVAL '5 days', NOW() + INTERVAL '10 days'),
('SUSCRIPTOR15', 'Descuento 15% para suscriptores', 'Porcentaje', 15.00, 0, NULL, TRUE, NOW(), NOW() + INTERVAL '180 days');

-- =====================================================
-- INSERTAR MÉTODOS DE PAGO
-- =====================================================
INSERT INTO metodos_pago (usuario_id, tipo, es_predeterminado, ultimos_digitos, fecha_expiracion, nombre_titular, referencia_externa, activo) VALUES
(
  (SELECT id FROM usuarios WHERE email = 'maria.garcia@email.com'),
  'Tarjeta Crédito',
  TRUE,
  '4242',
  '12/26',
  'María García López',
  'card_1abc123xyz',
  TRUE
),
(
  (SELECT id FROM usuarios WHERE email = 'maria.garcia@email.com'),
  'PayPal',
  FALSE,
  NULL,
  NULL,
  'María García López',
  'paypal_maria.garcia@email.com',
  TRUE
),
(
  (SELECT id FROM usuarios WHERE email = 'carlos.rodriguez@email.com'),
  'Tarjeta Débito',
  TRUE,
  '5555',
  '06/25',
  'Carlos Rodríguez Martín',
  'card_2def456uvw',
  TRUE
),
(
  (SELECT id FROM usuarios WHERE email = 'laura.martin@email.com'),
  'Tarjeta Crédito',
  TRUE,
  '3782',
  '09/27',
  'Laura Martín Sánchez',
  'card_3ghi789rst',
  TRUE
),
(
  (SELECT id FROM usuarios WHERE email = 'antonio.lopez@email.com'),
  'Transferencia',
  FALSE,
  NULL,
  NULL,
  'Antonio López García',
  'bank_1234567890',
  TRUE
);

-- =====================================================
-- INSERTAR PEDIDOS
-- =====================================================
INSERT INTO pedidos (numero_pedido, usuario_id, estado, subtotal, impuestos, coste_envio, descuento, total, metodo_pago, referencia_pago, direccion_envio_id, direccion_facturacion_id, notas, fecha_creacion, fecha_confirmacion, fecha_pago) VALUES
(
  'PED-000001001',
  (SELECT id FROM usuarios WHERE email = 'maria.garcia@email.com'),
  'Entregado',
  8999,
  1710,
  1299,
  0,
  12008,
  'Tarjeta Crédito',
  'TXN_12345abc',
  (SELECT id FROM direcciones WHERE usuario_id = (SELECT id FROM usuarios WHERE email = 'maria.garcia@email.com') LIMIT 1),
  (SELECT id FROM direcciones WHERE usuario_id = (SELECT id FROM usuarios WHERE email = 'maria.garcia@email.com') LIMIT 1),
  'Entregar entre semana preferentemente',
  NOW() - INTERVAL '15 days',
  NOW() - INTERVAL '14 days',
  NOW() - INTERVAL '14 days'
),
(
  'PED-000001002',
  (SELECT id FROM usuarios WHERE email = 'carlos.rodriguez@email.com'),
  'Enviado',
  19999,
  3800,
  1299,
  2500,
  22598,
  'Tarjeta Débito',
  'TXN_67890def',
  (SELECT id FROM direcciones WHERE usuario_id = (SELECT id FROM usuarios WHERE email = 'carlos.rodriguez@email.com') LIMIT 1),
  (SELECT id FROM direcciones WHERE usuario_id = (SELECT id FROM usuarios WHERE email = 'carlos.rodriguez@email.com') LIMIT 1),
  'Contactar antes de entregar',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '4 days'
),
(
  'PED-000001003',
  (SELECT id FROM usuarios WHERE email = 'laura.martin@email.com'),
  'Pagado',
  25997,
  4939,
  0,
  5000,
  25936,
  'PayPal',
  'PAYPAL_123456',
  (SELECT id FROM direcciones WHERE usuario_id = (SELECT id FROM usuarios WHERE email = 'laura.martin@email.com') LIMIT 1),
  (SELECT id FROM direcciones WHERE usuario_id = (SELECT id FROM usuarios WHERE email = 'laura.martin@email.com') LIMIT 1),
  NULL,
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days'
),
(
  'PED-000001004',
  (SELECT id FROM usuarios WHERE email = 'antonio.lopez@email.com'),
  'Confirmado',
  12999,
  2470,
  1299,
  1300,
  15468,
  'Transferencia',
  'TRF_789012ghi',
  (SELECT id FROM direcciones WHERE usuario_id = (SELECT id FROM usuarios WHERE email = 'antonio.lopez@email.com') LIMIT 1),
  (SELECT id FROM direcciones WHERE usuario_id = (SELECT id FROM usuarios WHERE email = 'antonio.lopez@email.com') LIMIT 1),
  'Dejar en conserjería',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day',
  NULL
),
(
  'PED-000001005',
  (SELECT id FROM usuarios WHERE email = 'isabel.fernandez@email.com'),
  'Pendiente',
  8000,
  1520,
  999,
  0,
  10519,
  'Tarjeta Crédito',
  'TXN_456jkl',
  (SELECT id FROM direcciones WHERE usuario_id = (SELECT id FROM usuarios WHERE email = 'isabel.fernandez@email.com') LIMIT 1),
  (SELECT id FROM direcciones WHERE usuario_id = (SELECT id FROM usuarios WHERE email = 'isabel.fernandez@email.com') LIMIT 1),
  NULL,
  NOW() - INTERVAL '6 hours',
  NULL,
  NULL
);

-- =====================================================
-- INSERTAR DETALLES DE PEDIDOS
-- =====================================================
INSERT INTO detalles_pedido (pedido_id, producto_id, cantidad, talla, color, precio_unitario, subtotal, total) VALUES
(
  (SELECT id FROM pedidos WHERE numero_pedido = 'PED-000001001'),
  (SELECT id FROM productos WHERE slug = 'vestido-midi-floral'),
  1,
  'M',
  'Multicolor',
  8999,
  8999,
  8999
),
(
  (SELECT id FROM pedidos WHERE numero_pedido = 'PED-000001002'),
  (SELECT id FROM productos WHERE slug = 'abrigo-largo-lana-camel'),
  1,
  'L',
  'Camel',
  19999,
  19999,
  19999
),
(
  (SELECT id FROM pedidos WHERE numero_pedido = 'PED-000001003'),
  (SELECT id FROM productos WHERE slug = 'pijama-seda-blanco'),
  1,
  'M',
  'Blanco',
  12999,
  12999,
  12999
),
(
  (SELECT id FROM pedidos WHERE numero_pedido = 'PED-000001003'),
  (SELECT id FROM productos WHERE slug = 'blusa-blanca-clasica'),
  1,
  'S',
  'Blanco',
  3999,
  3999,
  3999
),
(
  (SELECT id FROM pedidos WHERE numero_pedido = 'PED-000001004'),
  (SELECT id FROM productos WHERE slug = 'bolso-tote-negro-leather'),
  1,
  NULL,
  'Negro',
  9999,
  9999,
  9999
),
(
  (SELECT id FROM pedidos WHERE numero_pedido = 'PED-000001004'),
  (SELECT id FROM productos WHERE slug = 'cinturon-piel-marron'),
  1,
  NULL,
  'Marrón',
  2999,
  2999,
  2999
),
(
  (SELECT id FROM pedidos WHERE numero_pedido = 'PED-000001005'),
  (SELECT id FROM productos WHERE slug = 'pantalon-vaquero-skinny'),
  1,
  '34',
  'Azul Oscuro',
  4999,
  4999,
  4999
),
(
  (SELECT id FROM pedidos WHERE numero_pedido = 'PED-000001005'),
  (SELECT id FROM productos WHERE slug = 'leggins-deportivo-negro'),
  1,
  'M',
  'Negro',
  3499,
  3499,
  3499
);

-- =====================================================
-- INSERTAR SEGUIMIENTO DE PEDIDOS
-- =====================================================
INSERT INTO seguimiento_pedido (pedido_id, estado, descripcion, numero_tracking, ubicacion, fecha_actualizacion) VALUES
(
  (SELECT id FROM pedidos WHERE numero_pedido = 'PED-000001001'),
  'Entregado',
  'Paquete entregado correctamente',
  'ES123456789',
  'Madrid',
  NOW() - INTERVAL '3 hours'
),
(
  (SELECT id FROM pedidos WHERE numero_pedido = 'PED-000001001'),
  'Entrega',
  'Enviado a reparto final',
  'ES123456789',
  'Madrid',
  NOW() - INTERVAL '1 day'
),
(
  (SELECT id FROM pedidos WHERE numero_pedido = 'PED-000001002'),
  'En tránsito',
  'Paquete en camino hacia destino',
  'ES987654321',
  'Centro de distribución regional',
  NOW() - INTERVAL '12 hours'
),
(
  (SELECT id FROM pedidos WHERE numero_pedido = 'PED-000001002'),
  'Enviado',
  'Paquete despachado desde almacén',
  'ES987654321',
  'Almacén principal',
  NOW() - INTERVAL '2 days'
);

-- =====================================================
-- INSERTAR ENVÍOS
-- =====================================================
INSERT INTO envios (pedido_id, tipo_envio, numero_tracking, transportista, costo, peso_kg, estado, fecha_envio, fecha_entrega_estimada, fecha_entrega_real) VALUES
(
  (SELECT id FROM pedidos WHERE numero_pedido = 'PED-000001001'),
  'Estándar',
  'ES123456789',
  'Correos Express',
  1299,
  0.5,
  'Entregado',
  NOW() - INTERVAL '15 days',
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '3 days'
),
(
  (SELECT id FROM pedidos WHERE numero_pedido = 'PED-000001002'),
  'Express',
  'ES987654321',
  'DHL',
  1299,
  0.8,
  'En tránsito',
  NOW() - INTERVAL '4 days',
  NOW() + INTERVAL '1 day',
  NULL
),
(
  (SELECT id FROM pedidos WHERE numero_pedido = 'PED-000001003'),
  'Estándar',
  'ES555666777',
  'GLS',
  0,
  1.2,
  'Entregado',
  NOW() - INTERVAL '1 day',
  NOW() + INTERVAL '1 day',
  NOW() - INTERVAL '12 hours'
),
(
  (SELECT id FROM pedidos WHERE numero_pedido = 'PED-000001004'),
  'Estándar',
  'ES444555666',
  'Correos Express',
  1299,
  0.6,
  'Enviado',
  NOW(),
  NOW() + INTERVAL '3 days',
  NULL
);

-- =====================================================
-- INSERTAR EVENTOS DE ENVÍO
-- =====================================================
INSERT INTO eventos_envio (envio_id, tipo_evento, descripcion, ubicacion) VALUES
(
  (SELECT id FROM envios WHERE numero_tracking = 'ES123456789'),
  'Entregado',
  'Paquete entregado y firmado',
  'Madrid - Dirección del cliente'
),
(
  (SELECT id FROM envios WHERE numero_tracking = 'ES123456789'),
  'En reparto',
  'Paquete en proceso de entrega',
  'Madrid'
),
(
  (SELECT id FROM envios WHERE numero_tracking = 'ES987654321'),
  'En tránsito',
  'Paquete en tránsito',
  'Centro de distribución regional'
),
(
  (SELECT id FROM envios WHERE numero_tracking = 'ES987654321'),
  'Despachado',
  'Paquete despachado desde almacén',
  'Almacén principal'
);

-- =====================================================
-- INSERTAR DEVOLUCIONES
-- =====================================================
INSERT INTO devoluciones (pedido_id, usuario_id, motivo, descripcion, estado, numero_autorizacion, monto_reembolso, fecha_solicitud, fecha_procesamiento) VALUES
(
  (SELECT id FROM pedidos WHERE numero_pedido = 'PED-000001001'),
  (SELECT id FROM usuarios WHERE email = 'maria.garcia@email.com'),
  'Talla no corresponde',
  'El vestido es una talla más pequeña de lo esperado',
  'Recibida',
  'DEV-0001-2024',
  8999,
  NOW() - INTERVAL '7 days',
  NOW() - INTERVAL '5 days'
);

-- =====================================================
-- INSERTAR NOTIFICACIONES
-- =====================================================
INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, referencia_id, leida) VALUES
(
  (SELECT id FROM usuarios WHERE email = 'maria.garcia@email.com'),
  'Pedido',
  'Pedido confirmado',
  'Tu pedido PED-000001001 ha sido confirmado y está siendo preparado',
  (SELECT id FROM pedidos WHERE numero_pedido = 'PED-000001001'),
  TRUE
),
(
  (SELECT id FROM usuarios WHERE email = 'maria.garcia@email.com'),
  'Envío',
  'Tu pedido ha sido enviado',
  'Tu pedido PED-000001001 ha sido enviado. Número de seguimiento: ES123456789',
  (SELECT id FROM pedidos WHERE numero_pedido = 'PED-000001001'),
  TRUE
),
(
  (SELECT id FROM usuarios WHERE email = 'maria.garcia@email.com'),
  'Envío',
  'Tu pedido ha sido entregado',
  'Tu pedido PED-000001001 ha sido entregado correctamente',
  (SELECT id FROM pedidos WHERE numero_pedido = 'PED-000001001'),
  TRUE
),
(
  (SELECT id FROM usuarios WHERE email = 'carlos.rodriguez@email.com'),
  'Pedido',
  'Pedido pagado',
  'El pago de tu pedido PED-000001002 ha sido procesado',
  (SELECT id FROM pedidos WHERE numero_pedido = 'PED-000001002'),
  TRUE
),
(
  (SELECT id FROM usuarios WHERE email = 'carlos.rodriguez@email.com'),
  'Envío',
  'Tu pedido está en tránsito',
  'Tu pedido PED-000001002 está en tránsito hacia tu dirección',
  (SELECT id FROM pedidos WHERE numero_pedido = 'PED-000001002'),
  FALSE
),
(
  (SELECT id FROM usuarios WHERE email = 'laura.martin@email.com'),
  'Reseña',
  'Comparte tu opinión',
  'Nos gustaría conocer tu opinión sobre los productos que compraste',
  (SELECT id FROM pedidos WHERE numero_pedido = 'PED-000001003'),
  FALSE
),
(
  (SELECT id FROM usuarios WHERE email = 'antonio.lopez@email.com'),
  'Promoción',
  'Descuento especial',
  'Tienes un descuento de 20% en tu próxima compra con código VERANO20',
  NULL,
  FALSE
);

-- =====================================================
-- INSERTAR GUSTOS DE USUARIO
-- =====================================================
INSERT INTO gustos_usuario (usuario_id, categoria_id, talla_preferida, puntuacion_interes) VALUES
(
  (SELECT id FROM usuarios WHERE email = 'maria.garcia@email.com'),
  (SELECT id FROM categorias WHERE slug = 'vestidos'),
  'M',
  5
),
(
  (SELECT id FROM usuarios WHERE email = 'maria.garcia@email.com'),
  (SELECT id FROM categorias WHERE slug = 'accesorios'),
  NULL,
  4
),
(
  (SELECT id FROM usuarios WHERE email = 'carlos.rodriguez@email.com'),
  (SELECT id FROM categorias WHERE slug = 'abrigos-chaquetas'),
  'L',
  5
),
(
  (SELECT id FROM usuarios WHERE email = 'laura.martin@email.com'),
  (SELECT id FROM categorias WHERE slug = 'pijamas'),
  'M',
  4
),
(
  (SELECT id FROM usuarios WHERE email = 'laura.martin@email.com'),
  (SELECT id FROM categorias WHERE slug = 'blusas-camisas'),
  'S',
  5
);

-- =====================================================
-- INSERTAR MOVIMIENTOS DE INVENTARIO
-- =====================================================
INSERT INTO inventario_movimientos (producto_id, tipo_movimiento, cantidad, referencia, notas) VALUES
(
  (SELECT id FROM productos WHERE slug = 'vestido-midi-floral'),
  'Compra',
  -1,
  'PED-000001001',
  'Vendido a María García López'
),
(
  (SELECT id FROM productos WHERE slug = 'vestido-midi-floral'),
  'Devolucion',
  1,
  'DEV-0001-2024',
  'Devuelto por María García López - Talla no corresponde'
),
(
  (SELECT id FROM productos WHERE slug = 'abrigo-largo-lana-camel'),
  'Compra',
  -1,
  'PED-000001002',
  'Vendido a Carlos Rodríguez Martín'
),
(
  (SELECT id FROM productos WHERE slug = 'blusa-blanca-clasica'),
  'Compra',
  -1,
  'PED-000001003',
  'Vendido a Laura Martín Sánchez'
),
(
  (SELECT id FROM productos WHERE slug = 'pijama-seda-blanco'),
  'Compra',
  -1,
  'PED-000001003',
  'Vendido a Laura Martín Sánchez'
),
(
  (SELECT id FROM productos WHERE slug = 'bolso-tote-negro-leather'),
  'Compra',
  -1,
  'PED-000001004',
  'Vendido a Antonio López García'
),
(
  (SELECT id FROM productos WHERE slug = 'cinturon-piel-marron'),
  'Compra',
  -1,
  'PED-000001004',
  'Vendido a Antonio López García'
),
(
  (SELECT id FROM productos WHERE slug = 'pantalon-vaquero-skinny'),
  'Compra',
  -1,
  'PED-000001005',
  'Vendido a Isabel Fernández Ruiz'
),
(
  (SELECT id FROM productos WHERE slug = 'leggins-deportivo-negro'),
  'Compra',
  -1,
  'PED-000001005',
  'Vendido a Isabel Fernández Ruiz'
),
(
  (SELECT id FROM productos WHERE slug = 'vestido-midi-floral'),
  'Entrada',
  10,
  'COMPRA-PROVEEDOR-001',
  'Nueva compra a proveedor'
),
(
  (SELECT id FROM productos WHERE slug = 'blusa-blanca-clasica'),
  'Ajuste',
  5,
  'AJUSTE-INVENTARIO-001',
  'Corrección por error de conteo'
);

-- =====================================================
-- INSERTAR CAMPAÑAS DE EMAIL
-- =====================================================
INSERT INTO campanas_email (nombre, descripcion, asunto, contenido_html, estado, tipo_segmento, total_destinatarios, total_enviados, total_abiertos, total_clicks) VALUES
(
  'Bienvenida a nuevos clientes',
  'Campaña de bienvenida para usuarios registrados',
  '¡Bienvenido a FashionStore! 10% de descuento en tu primera compra',
  '<h1>¡Bienvenido a FashionStore!</h1><p>Como cliente nuevo, tienes un descuento de 10% en tu primera compra.</p><p>Usa el código: PRIMERACOMPRA10</p>',
  'Enviada',
  'Todos',
  6,
  6,
  5,
  3
),
(
  'Oferta de verano',
  'Promoción de colecciones de verano',
  'Ofertas de verano: hasta 20% de descuento',
  '<h1>Ofertas de Verano</h1><p>Disfruta de hasta 20% de descuento en nuestras colecciones de verano.</p><p>Código: VERANO20</p>',
  'Enviada',
  'Ofertas',
  250,
  245,
  180,
  87
),
(
  'Abandono de carrito',
  'Recordatorio para carritos abandonados',
  '¿Olvidaste algo en tu carrito?',
  '<h1>¡No olvides completar tu compra!</h1><p>Tienes productos en tu carrito esperando.</p><p>Recuerda que tienes envío gratis con el código ENVIOGRATIS</p>',
  'Programada',
  'Abandono',
  15,
  0,
  0,
  0
),
(
  'Reseña de producto',
  'Solicitud de reseña después de entrega',
  'Comparte tu opinión sobre tu compra',
  '<h1>¿Qué te pareció tu compra?</h1><p>Tu opinión es muy importante para nosotros. Comparte tu reseña.</p>',
  'Borrador',
  'Premium',
  NULL,
  0,
  0,
  0
);

-- =====================================================
-- INSERTAR LOGS DE CAMPAÑAS
-- =====================================================
INSERT INTO campana_email_logs (campana_id, usuario_id, estado) VALUES
(
  (SELECT id FROM campanas_email WHERE nombre = 'Bienvenida a nuevos clientes'),
  (SELECT id FROM usuarios WHERE email = 'maria.garcia@email.com'),
  'Abierto'
),
(
  (SELECT id FROM campanas_email WHERE nombre = 'Bienvenida a nuevos clientes'),
  (SELECT id FROM usuarios WHERE email = 'maria.garcia@email.com'),
  'Click'
),
(
  (SELECT id FROM campanas_email WHERE nombre = 'Bienvenida a nuevos clientes'),
  (SELECT id FROM usuarios WHERE email = 'carlos.rodriguez@email.com'),
  'Enviado'
),
(
  (SELECT id FROM campanas_email WHERE nombre = 'Oferta de verano'),
  (SELECT id FROM usuarios WHERE email = 'laura.martin@email.com'),
  'Abierto'
),
(
  (SELECT id FROM campanas_email WHERE nombre = 'Oferta de verano'),
  (SELECT id FROM usuarios WHERE email = 'laura.martin@email.com'),
  'Click'
),
(
  (SELECT id FROM campanas_email WHERE nombre = 'Oferta de verano'),
  (SELECT id FROM usuarios WHERE email = 'antonio.lopez@email.com'),
  'Abierto'
);

-- =====================================================
-- ACTUALIZAR STOCK DESPUÉS DE LAS COMPRAS
-- =====================================================
UPDATE productos 
SET stock_total = stock_total - 1 
WHERE slug IN ('vestido-midi-floral', 'abrigo-largo-lana-camel', 'blusa-blanca-clasica', 'pijama-seda-blanco', 'bolso-tote-negro-leather', 'cinturon-piel-marron', 'pantalon-vaquero-skinny', 'leggins-deportivo-negro');

-- =====================================================
-- ACTUALIZAR CONTADORES EN PRODUCTOS
-- =====================================================
UPDATE productos 
SET 
  valoracion_promedio = 4.75,
  total_resenas = 4
WHERE slug IN ('vestido-midi-floral', 'blusa-blanca-clasica', 'abrigo-largo-lana-camel', 'pantalon-vaquero-skinny');
