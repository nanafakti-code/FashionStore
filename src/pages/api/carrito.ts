import type { APIRoute } from 'astro';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

// GET: Obtiene el carrito del usuario actual
export const GET: APIRoute = async (context) => {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'No authenticated' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener carrito del usuario
    const { data: carritoData, error: carritoError } = await supabase
      .from('carrito')
      .select('id')
      .eq('usuario_id', user.id)
      .single();

    if (carritoError && carritoError.code !== 'PGRST116') {
      throw carritoError;
    }

    if (!carritoData) {
      // Carrito vacío
      return new Response(
        JSON.stringify({ items: [] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener items del carrito
    const { data: itemsData, error: itemsError } = await supabase
      .from('carrito_items')
      .select(`
        id,
        cantidad,
        talla,
        color,
        precio_unitario,
        productos:producto_id (
          id,
          nombre,
          imagen_principal
        )
      `)
      .eq('carrito_id', carritoData.id);

    if (itemsError) {
      throw itemsError;
    }

    const items = (itemsData || []).map((item: any) => ({
      id: item.productos.id,
      carrito_item_id: item.id,
      nombre: item.productos.nombre,
      precio: item.precio_unitario,
      imagen: item.productos.imagen_principal,
      cantidad: item.cantidad,
      talla: item.talla,
      color: item.color,
    }));

    return new Response(
      JSON.stringify({ items }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error getting cart:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// POST: Añade un producto al carrito
export const POST: APIRoute = async (context) => {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'No authenticated' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await context.request.json();
    const { producto_id, cantidad = 1, talla, color, precio } = body;

    if (!producto_id || !precio) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener o crear carrito
    let { data: carritoData } = await supabase
      .from('carrito')
      .select('id')
      .eq('usuario_id', user.id)
      .single();

    if (!carritoData) {
      const { data: newCarrito, error: createError } = await supabase
        .from('carrito')
        .insert({ usuario_id: user.id })
        .select('id')
        .single();

      if (createError) throw createError;
      carritoData = newCarrito;
    }

    // Verificar si el producto ya está en el carrito
    const { data: existingItem } = await supabase
      .from('carrito_items')
      .select('id, cantidad')
      .eq('carrito_id', carritoData.id)
      .eq('producto_id', producto_id)
      .single();

    if (existingItem) {
      // Actualizar cantidad
      const { error: updateError } = await supabase
        .from('carrito_items')
        .update({ cantidad: existingItem.cantidad + cantidad })
        .eq('id', existingItem.id);

      if (updateError) throw updateError;
    } else {
      // Crear nuevo item
      const { error: insertError } = await supabase
        .from('carrito_items')
        .insert({
          carrito_id: carritoData.id,
          producto_id,
          cantidad,
          talla: talla || null,
          color: color || null,
          precio_unitario: precio,
        });

      if (insertError) throw insertError;
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error adding to cart:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// DELETE: Elimina el carrito completo o un item específico
export const DELETE: APIRoute = async (context) => {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'No authenticated' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { searchParams } = new URL(context.request.url);
    const itemId = searchParams.get('item_id');

    // Obtener carrito del usuario
    const { data: carritoData } = await supabase
      .from('carrito')
      .select('id')
      .eq('usuario_id', user.id)
      .single();

    if (!carritoData) {
      return new Response(
        JSON.stringify({ error: 'Cart not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (itemId) {
      // Eliminar un item específico
      const { error } = await supabase
        .from('carrito_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
    } else {
      // Vaciar el carrito completo
      const { error } = await supabase
        .from('carrito_items')
        .delete()
        .eq('carrito_id', carritoData.id);

      if (error) throw error;
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error deleting cart:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
