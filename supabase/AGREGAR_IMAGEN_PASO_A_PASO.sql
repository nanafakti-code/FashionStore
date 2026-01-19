-- PASO 1: OBTENER EL ID EXACTO DEL IPHONE 17
SELECT id, nombre FROM productos WHERE nombre ILIKE '%iphone%17%';

-- PASO 2: Una vez que tengas el ID, copia aquí y ejecuta:
-- INSERT INTO imagenes_producto (
--   producto_id,
--   url,
--   alt_text,
--   orden,
--   es_principal
-- ) VALUES (
--   '73e2eb37-6d44-489c-aa96-d219d69a6a93',  -- REEMPLAZA CON EL ID DEL PASO 1
--   'https://via.placeholder.com/500x700?text=iPhone+17',
--   'iPhone 17',
--   1,
--   true
-- );
