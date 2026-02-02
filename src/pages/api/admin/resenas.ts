import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY
);

export const POST: APIRoute = async (context) => {
  try {
    const body = await context.request.json();
    const { action, id, data } = body;

    // Actualizar verificada_compra o estado
    if (action === 'toggle-verified' || action === 'approve' || action === 'reject') {
      let updateData: any = {};

      if (action === 'toggle-verified') {
        updateData.verificada_compra = data.verificada_compra;
      } else if (action === 'approve') {
        updateData.estado = 'Aprobada';
      } else if (action === 'reject') {
        updateData.estado = 'Rechazada';
      }

      console.log('Actualizando reseña:', id, updateData);

      const { error } = await supabase
        .from('resenas')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Error updating review:', error);
        throw error;
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Eliminar reseña
    if (action === 'delete') {
      console.log('Eliminando reseña:', id);

      const { error } = await supabase
        .from('resenas')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting review:', error);
        throw error;
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Acción no válida' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in admin reviews endpoint:', error);
    return new Response(
      JSON.stringify({ error: (error as any).message || 'Error interno' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
