import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY
);

export const POST: APIRoute = async (context) => {
  try {
    const body = await context.request.json();
    const { productId, calificacion, titulo, comentario } = body;

    // Validar datos
    if (!productId || !calificacion || !titulo || !comentario) {
      return new Response(
        JSON.stringify({ error: 'Faltan datos requeridos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener usuario logueado desde sesión
    const session = context.cookies.get('sb-session');
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'No estás autenticado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener usuario_id del token
    let usuario_id: string;
    try {
      const sessionData = JSON.parse(decodeURIComponent(session.value));
      usuario_id = sessionData.user?.id;
      if (!usuario_id) {
        throw new Error('No user ID found');
      }
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Sesión inválida' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Insertar reseña con verificada_compra = false por defecto
    const { data, error } = await supabase
      .from('resenas')
      .insert([{
        producto_id: productId,
        usuario_id: usuario_id,
        calificacion: parseInt(calificacion),
        titulo: titulo.trim(),
        comentario: comentario.trim(),
        verificada_compra: false, // Las nuevas reseñas siempre se crean desverificadas
        estado: 'Pendiente', // Esperando aprobación del admin
        util: 0,
        no_util: 0
      }])
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
