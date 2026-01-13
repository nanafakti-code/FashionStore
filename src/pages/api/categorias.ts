import type { APIRoute } from 'astro';
import { supabase } from '@/lib/supabase';

export const GET: APIRoute = async () => {
  try {
    // Obtener todas las categorías activas
    const { data: categorias, error } = await supabase
      .from('categorias')
      .select('id, nombre, slug, descripcion')
      .eq('activa', true)
      .order('orden', { ascending: true });

    if (error) {
      return new Response(
        JSON.stringify({ error: 'Error al obtener categorías' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        categorias: categorias || [],
        total: (categorias || []).length,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
