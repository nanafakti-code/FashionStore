import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY
);

export const POST: APIRoute = async (context) => {
  try {
    const body = await context.request.json();
    const { productId, count, orderId, calificacion, titulo, comentario, id } = body;

    // Validar datos
    if (!productId || !calificacion || !titulo || !comentario) {
      return new Response(
        JSON.stringify({ error: 'Faltan datos requeridos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener usuario logueado usando el token Bearer
    const authHeader = context.request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'No estás autenticado (Token missing)' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar token con Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Sesión inválida o expirada' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const usuario_id = user.id;

    const payload: any = {
      producto_id: productId,
      orden_id: orderId, // Add order_id to payload
      usuario_id: usuario_id,
      calificacion: parseInt(calificacion),
      titulo: titulo.trim(),
      comentario: comentario.trim(),
      verificada_compra: false,
      estado: 'Pendiente'
    };

    if (id) {
      payload.id = id;
    } else {
      payload.util = 0;
      payload.no_util = 0;
    }

    const { data, error } = await supabase
      .from('resenas')
      .upsert(payload)
      .select();

    if (error) {
      console.error('Error inserting review:', error);
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Reseña agregada correctamente',
        review: data?.[0]
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in add review endpoint:', error);
    return new Response(
      JSON.stringify({ error: (error as any).message || 'Error interno' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
