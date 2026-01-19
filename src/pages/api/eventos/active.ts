import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const GET: APIRoute = async () => {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar evento activo actual
    const now = new Date().toISOString();
    
    const { data: events, error } = await supabase
      .from('eventos_promocionales')
      .select('*')
      .eq('activo', true)
      .lte('fecha_inicio', now)
      .gte('fecha_fin', now)
      .order('fecha_inicio', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching active events:', error);
      return new Response(
        JSON.stringify({ event: null }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ event: events?.[0] || null }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in active events API:', error);
    return new Response(
      JSON.stringify({ event: null }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
