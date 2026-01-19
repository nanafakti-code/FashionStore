import type { APIRoute } from 'astro';
import { createServerClient } from '@/lib/supabase';

export const GET: APIRoute = async (context) => {
  try {
    // Obtener userId de los query parameters
    const userId = context.url.searchParams.get('userId');
    
    if (!userId) {
      return new Response(
        JSON.stringify({ 
          error: 'userId requerido',
          items: []
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[API/cart/get] Obteniendo carrito para userId:', userId);

    const supabase = createServerClient();

    // Método 1: Intentar usar la RPC get_user_cart (la misma que usa Cart.tsx)
    // Pero necesitamos autenticarnos como el usuario, así que usamos consulta directa
    
    // Consultar la tabla cart_items directamente con el userId
    const { data: cartItems, error: cartError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', userId);

    console.log('[API/cart/get] Cart items encontrados:', cartItems?.length || 0);

    if (cartError) {
      console.error('[API/cart/get] Error fetching cart:', cartError);
      return new Response(
        JSON.stringify({ 
          error: cartError.message,
          items: []
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const productIds = (cartItems || []).map((item: any) => item.product_id);
    
    if (productIds.length === 0) {
      console.log('[API/cart/get] Carrito vacío, no hay productos');
      return new Response(
        JSON.stringify({
          items: [],
          success: true
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener información de los productos (buscamos en 'productos' primero, luego 'products')
    let products: any[] = [];
    let productsError: any = null;

    // Intentar tabla 'productos' (español)
    const { data: productosData, error: productosErr } = await supabase
      .from('productos')
      .select('id, nombre, precio_venta, imagenes')
      .in('id', productIds);
    
    if (!productosErr && productosData && productosData.length > 0) {
      console.log('[API/cart/get] Productos encontrados en tabla "productos":', productosData.length);
      products = productosData.map((p: any) => ({
        id: p.id,
        name: p.nombre,
        price: p.precio_venta,
        image: p.imagenes?.[0]?.url || p.imagenes?.[0] || '/placeholder.png'
      }));
    } else {
      // Intentar tabla 'products' (inglés)
      const { data: productsData, error: productsErr } = await supabase
        .from('products')
        .select('id, name, price, image')
        .in('id', productIds);
      
      if (!productsErr && productsData) {
        console.log('[API/cart/get] Productos encontrados en tabla "products":', productsData.length);
        products = productsData;
      } else {
        productsError = productsErr || productosErr;
      }
    }

    if (productsError) {
      console.error('[API/cart/get] Error fetching products:', productsError);
    }

    // Transformar el resultado al formato esperado
    const productMap: any = {};
    products.forEach((p: any) => {
      productMap[p.id] = p;
    });

    const items = (cartItems || []).map((item: any) => {
      const product = productMap[item.product_id];
      return {
        id: item.id,
        product_id: item.product_id,
        product_name: product?.name || item.product_name || 'Producto',
        product_image: product?.image || item.product_image || '/placeholder.png',
        price: product?.price || item.precio_unitario || 0,
        precio_unitario: product?.price || item.precio_unitario || 0,
        quantity: item.quantity || 1,
        talla: item.talla,
        color: item.color
      };
    });

    console.log('[API/cart/get] Items del carrito formateados:', items);

    return new Response(
      JSON.stringify({
        items: items,
        success: true
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[API/cart/get] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error interno del servidor',
        items: []
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
