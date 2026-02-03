import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

// Función para generar número de autorización
function generateRMANumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `RMA-${year}${month}${day}-${random}`;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { ordenId, motivo } = await request.json();

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
      .select('*')
      .eq('id', ordenId)
      .eq('usuario_id', user.id)
      .single();

    if (ordenError || !orden) {
      return new Response(
        JSON.stringify({ success: false, message: 'Orden no encontrada' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar que la orden está en estado Entregado
    if (orden.estado !== 'Entregado') {
      return new Response(
        JSON.stringify({ success: false, message: `Solo se pueden devolver pedidos entregados. Estado actual: ${orden.estado}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generar número de autorización
    const numeroAutorizacion = generateRMANumber();

    // Crear registro de devolución
    const { error: devolucionError } = await supabase
      .from('devoluciones')
      .insert({
        pedido_id: ordenId,
        usuario_id: user.id,
        motivo: motivo || 'No especificado',
        estado: 'Solicitada',
        numero_autorizacion: numeroAutorizacion,
        monto_reembolso: orden.total
      });

    if (devolucionError) {
      console.error('Error creating return:', devolucionError);
      return new Response(
        JSON.stringify({ success: false, message: 'Error al crear la solicitud de devolución' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Actualizar estado de la orden
    const { error: updateError } = await supabase
      .from('ordenes')
      .update({
        estado: 'Devolucion_Solicitada',
        actualizado_en: new Date().toISOString()
      })
      .eq('id', ordenId);

    if (updateError) {
      console.error('Error updating order:', updateError);
      return new Response(
        JSON.stringify({ success: false, message: 'Error al actualizar la orden' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // TODO: Enviar email con etiqueta de devolución

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Solicitud de devolución creada correctamente',
        numeroAutorizacion: numeroAutorizacion
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error requesting return:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Error del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
