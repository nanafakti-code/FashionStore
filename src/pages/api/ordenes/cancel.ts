import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { ordenId } = await request.json();

    if (!ordenId) {
      return new Response(
        JSON.stringify({ success: false, message: 'ID de orden requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener el token del usuario
    const accessToken = cookies.get('sb-access-token')?.value;
    if (!accessToken) {
      return new Response(
        JSON.stringify({ success: false, message: 'No autenticado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar usuario
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, message: 'Usuario no válido' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener la orden y verificar que pertenece al usuario
    const { data: orden, error: ordenError } = await supabase
      .from('ordenes')
      .select('*, items_orden(*)')
      .eq('id', ordenId)
      .eq('usuario_id', user.id)
      .single();

    if (ordenError || !orden) {
      return new Response(
        JSON.stringify({ success: false, message: 'Orden no encontrada' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar que la orden está en estado Pagado
    if (orden.estado !== 'Pagado') {
      return new Response(
        JSON.stringify({ success: false, message: `No se puede cancelar. Estado actual: ${orden.estado}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // OPERACIÓN ATÓMICA: Restaurar stock y cancelar orden
    // Restaurar stock de cada producto
    for (const item of orden.items_orden || []) {
      await supabase
        .from('productos')
        .update({ 
          stock_total: supabase.rpc('increment_stock', { 
            producto_id: item.producto_id, 
            cantidad: item.cantidad 
          })
        })
        .eq('id', item.producto_id);
      
      // Alternativa directa si no existe el RPC
      const { data: producto } = await supabase
        .from('productos')
        .select('stock_total')
        .eq('id', item.producto_id)
        .single();
      
      if (producto) {
        await supabase
          .from('productos')
          .update({ stock_total: producto.stock_total + item.cantidad })
          .eq('id', item.producto_id);
      }
    }

    // Actualizar estado de la orden
    const { error: updateError } = await supabase
      .from('ordenes')
      .update({ 
        estado: 'Cancelado',
        fecha_cancelacion: new Date().toISOString(),
        actualizado_en: new Date().toISOString()
      })
      .eq('id', ordenId);

    if (updateError) {
      console.error('Error updating order:', updateError);
      return new Response(
        JSON.stringify({ success: false, message: 'Error al cancelar la orden' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Orden cancelada correctamente' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error canceling order:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Error del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
