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

    // Actualizar verificada_compra
    if (action === 'toggle-verified') {
      const { verificada_compra } = data;

      console.log('Actualizando reseña:', id, { verificada_compra });

      const { error } = await supabase
        .from('resenas')
        .update({ verificada_compra })
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
