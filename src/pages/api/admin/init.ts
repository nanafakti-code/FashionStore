/**
 * ADMIN INITIALIZATION ENDPOINT
 * =============================
 * Endpoint para crear/resetear el admin por defecto
 * Solo funciona en modo desarrollo (DEV)
 * Email: admin@fashionstore.com
 * Contraseña: 1234
 */

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAIL = 'admin@fashionstore.com';
const ADMIN_PASSWORD = '1234';
const ADMIN_PASSWORD_HASHED = '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lm'; // bcrypt hash of "1234"

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('[ADMIN-INIT] Supabase URL o Service Role Key no configuradas');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

export const POST: APIRoute = async ({ request }) => {
  // Solo permitir en desarrollo
  if (!import.meta.env.DEV) {
    return new Response(
      JSON.stringify({ error: 'Este endpoint solo está disponible en desarrollo' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'create') {
      // 1. Verificar si ya existe
      const { data: existing } = await supabase
        .from('admin_credentials')
        .select('id')
        .eq('email', ADMIN_EMAIL)
        .limit(1)
        .single();

      if (existing) {
        // Actualizar la contraseña existente
        const { error: updateError } = await supabase
          .from('admin_credentials')
          .update({ password: ADMIN_PASSWORD_HASHED })
          .eq('email', ADMIN_EMAIL);

        if (updateError) {
          return new Response(
            JSON.stringify({ error: `Error al actualizar: ${updateError.message}` }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Admin credenciales actualizadas', email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } else {
        // Crear registro nuevo
        const { error: insertError } = await supabase
          .from('admin_credentials')
          .insert({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD_HASHED,
          });

        if (insertError) {
          return new Response(
            JSON.stringify({ error: `Error al crear: ${insertError.message}` }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Admin inicializado correctamente', email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'Acción no especificada. Use action: "create"' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: any) {
    console.error('[ADMIN-INIT] Error:', error.message);
    return new Response(
      JSON.stringify({ error: `Error: ${error.message}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
