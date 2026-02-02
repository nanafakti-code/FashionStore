    -- =====================================================
    -- CREAR/ACTUALIZAR FUNCIONES RPC PARA CARRITO CON VARIANTES
    -- =====================================================

    -- 1. Función para obtener el carrito del usuario
    DROP FUNCTION IF EXISTS get_user_cart();

    CREATE OR REPLACE FUNCTION get_user_cart()
    RETURNS TABLE (
    id UUID,
    product_id UUID,
    product_name TEXT,
    quantity INT,
    talla TEXT,
    color TEXT,
    precio_unitario INTEGER,
    product_image TEXT,
    product_stock INT,
    expires_in_seconds INT,
    variant_name TEXT,
    capacity TEXT
    ) 
    SECURITY DEFINER
    SET search_path = public
    LANGUAGE plpgsql
    AS $$
    BEGIN
    RETURN QUERY
    SELECT 
        ci.id,
        ci.product_id,
        p.nombre as product_name,
        ci.quantity,
        ci.talla,
        v.color,
        ci.precio_unitario,
        COALESCE(v.imagen_url, p.imagen_principal) as product_image,
        COALESCE(v.stock, p.stock_total) as product_stock,
        CASE 
        WHEN cr.expires_at IS NOT NULL THEN EXTRACT(EPOCH FROM (cr.expires_at - NOW()))::INT
        ELSE 0
        END as expires_in_seconds,
        v.nombre_variante as variant_name,
        v.capacidad as capacity
    FROM cart_items ci
    JOIN productos p ON ci.product_id = p.id
    LEFT JOIN variantes_producto v ON ci.variante_id = v.id
    LEFT JOIN cart_reservations cr ON cr.user_id = auth.uid() AND cr.product_id = ci.product_id
    WHERE ci.user_id = auth.uid()
    ORDER BY ci.created_at DESC;
    END;
    $$;

    -- 2. Función para limpiar el carrito
    DROP FUNCTION IF EXISTS clear_user_cart();

    CREATE OR REPLACE FUNCTION clear_user_cart()
    RETURNS void
    SECURITY DEFINER
    SET search_path = public
    LANGUAGE plpgsql
    AS $$
    BEGIN
    DELETE FROM cart_items WHERE user_id = auth.uid();
    END;
    $$;

    -- 3. Función para migrar carrito de invitado
    DROP FUNCTION IF EXISTS migrate_guest_cart_to_user(jsonb);

    CREATE OR REPLACE FUNCTION migrate_guest_cart_to_user(guest_items jsonb)
    RETURNS void
    SECURITY DEFINER
    SET search_path = public
    LANGUAGE plpgsql
    AS $$
    DECLARE
    item jsonb;
    BEGIN
    FOR item IN SELECT * FROM jsonb_array_elements(guest_items)
    LOOP
        INSERT INTO cart_items (
        user_id,
        product_id,
        variante_id,
        quantity,
        talla,
        color,
        precio_unitario
        )
        VALUES (
        auth.uid(),
        (item->>'product_id')::uuid,
        (item->>'variant_id')::uuid,
        (item->>'quantity')::int,
        item->>'talla',
        item->>'color',
        (item->>'precio_unitario')::int
        )
        ON CONFLICT (user_id, product_id, variante_id) 
        DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity;
    END LOOP;
    END;
    $$;

    -- Verificar creación
    SELECT 'RPC functions created successfully' as resultado;
