-- =====================================================
-- TEST: VERIFICAR COLUMNAS DE CART_ITEMS
-- =====================================================
-- Ejecuta este script y mira la pestaña "Messages" o "Results".
-- Si dice "Error capturado: column ... does not exist", falta esa columna.
-- Si dice "Error capturado: ... violates foreign key...", entonces LAS COLUMNAS ESTÁN BIEN.
-- =====================================================

DO $$
BEGIN
  -- Intentamos insertar un dato falso. 
  -- Lo normal es que falle por Foreign Key (FK), pero si falla por columna, nos lo dirá.
  INSERT INTO cart_items (user_id, product_id, variante_id, quantity, precio_unitario)
  VALUES (
    '00000000-0000-0000-0000-000000000000', -- user_id falso
    '00000000-0000-0000-0000-000000000000', -- product_id falso
    '00000000-0000-0000-0000-000000000000', -- variante_id falso
    1, 
    100
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'RESULTADO DEL TEST: %', SQLERRM;
END $$;
