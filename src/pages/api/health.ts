/**
 * ENDPOINT DE DIAGNÓSTICO / HEALTH CHECK
 * ========================================
 * Verifica el estado de conexión con Supabase y configuración
 * Accesible en: /api/health
 */

import type { APIRoute } from 'astro';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const GET: APIRoute = async () => {
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    environment: import.meta.env.PROD ? 'production' : 'development',
    supabase: {
      configured: isSupabaseConfigured,
      url_set: Boolean(import.meta.env.PUBLIC_SUPABASE_URL),
      key_set: Boolean(import.meta.env.PUBLIC_SUPABASE_ANON_KEY),
    },
    database: {
      connected: false,
      productos_count: 0,
      categorias_count: 0,
      error: null,
    },
  };

  // Test de conexión a Supabase
  try {
    // Intentar obtener productos
    const { data: productos, error: prodError } = await supabase
      .from('productos')
      .select('id')
      .limit(10);

    if (prodError) {
      diagnostics.database.error = prodError.message || JSON.stringify(prodError);
      diagnostics.database.connected = false;
    } else {
      diagnostics.database.connected = true;
      diagnostics.database.productos_count = productos?.length || 0;
    }

    // Intentar obtener categorías
    const { data: categorias, error: catError } = await supabase
      .from('categorias')
      .select('id')
      .limit(10);

    if (!catError && categorias) {
      diagnostics.database.categorias_count = categorias.length;
    }

  } catch (error: any) {
    diagnostics.database.error = error.message || 'Error desconocido';
    diagnostics.database.connected = false;
  }

  // Determinar estado general
  const isHealthy = diagnostics.supabase.configured && diagnostics.database.connected;

  return new Response(
    JSON.stringify({
      status: isHealthy ? 'healthy' : 'unhealthy',
      ...diagnostics,
      recommendations: !isHealthy ? [
        !diagnostics.supabase.url_set && 'Configurar PUBLIC_SUPABASE_URL en Coolify',
        !diagnostics.supabase.key_set && 'Configurar PUBLIC_SUPABASE_ANON_KEY en Coolify',
        diagnostics.database.error && `Error de BD: ${diagnostics.database.error}`,
      ].filter(Boolean) : [],
    }, null, 2),
    { 
      status: isHealthy ? 200 : 503,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      } 
    }
  );
};
