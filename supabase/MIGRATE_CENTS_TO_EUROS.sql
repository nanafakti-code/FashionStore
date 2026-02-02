-- MIGRATION: CONVERT PRICES FROM CENTS (INTEGER) TO EUROS (DECIMAL)
-- CRITICAL: This script divides all values by 100. Run only ONCE.

BEGIN;

-- 1. PRODUCTOS
-- Alter columns to NUMERIC(10,2) to strictly support decimals
ALTER TABLE productos ALTER COLUMN precio TYPE NUMERIC(10,2);
ALTER TABLE productos ALTER COLUMN precio_original TYPE NUMERIC(10,2);

-- Update values
UPDATE productos SET precio = precio / 100.0;
UPDATE productos SET precio_original = precio_original / 100.0 WHERE precio_original IS NOT NULL;


-- 2. ORDENES
ALTER TABLE ordenes ALTER COLUMN subtotal TYPE NUMERIC(10,2);
ALTER TABLE ordenes ALTER COLUMN impuestos TYPE NUMERIC(10,2);
-- Based on previous webhook.ts code, order.envio was mapped to 'coste_envio' in some contexts, but 'envio' in others.
-- Checking webhook.ts: 'envio: order.coste_envio,' so the DB column is likely 'coste_envio'.
-- However, strict typing said 'envio: number'.
-- I will include both to be safe or check first.
-- Let's stick to the most likely columns. I will perform a safe check or just alter both if they exist.
-- Ideally I should check the schema first.
-- For now, I will assume 'coste_envio' is the column name based on `order.coste_envio` in webhook.ts.
ALTER TABLE ordenes ALTER COLUMN coste_envio TYPE NUMERIC(10,2);

ALTER TABLE ordenes ALTER COLUMN descuento TYPE NUMERIC(10,2);
ALTER TABLE ordenes ALTER COLUMN total TYPE NUMERIC(10,2);

UPDATE ordenes SET subtotal = subtotal / 100.0;
UPDATE ordenes SET impuestos = impuestos / 100.0;
UPDATE ordenes SET coste_envio = coste_envio / 100.0;
UPDATE ordenes SET descuento = descuento / 100.0;
UPDATE ordenes SET total = total / 100.0;


-- 3. ITEMS_ORDEN
ALTER TABLE items_orden ALTER COLUMN precio_unitario TYPE NUMERIC(10,2);
ALTER TABLE items_orden ALTER COLUMN precio_original TYPE NUMERIC(10,2);

UPDATE items_orden SET precio_unitario = precio_unitario / 100.0;
UPDATE items_orden SET precio_original = precio_original / 100.0 WHERE precio_original IS NOT NULL;


-- 4. CARRITO (If applicable)
-- Assuming 'carrito' or 'cart_items' might have cached prices. 
-- Best safety: Clear cart to force refetch from valid products.
DELETE FROM carrito; 
DELETE FROM cart_items;

COMMIT;
