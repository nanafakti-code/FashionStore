// =====================================================
// POST /api/admin/change-password
// =====================================================
// Cambia la contraseña del admin (admin@fashionstore.com)
// en la tabla admin_credentials de Supabase.
//
// Body: { currentPassword, newPassword }
// =====================================================

import type { APIRoute } from 'astro';
import { supabase } from '@/lib/supabase';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { currentPassword, newPassword } = body as {
      currentPassword: string;
      newPassword: string;
    };

    // Validaciones básicas
    if (!currentPassword || !newPassword) {
      return new Response(
        JSON.stringify({ error: 'Se requieren la contraseña actual y la nueva.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (newPassword.length < 8) {
      return new Response(
        JSON.stringify({ error: 'La nueva contraseña debe tener al menos 8 caracteres.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 1. Obtener credenciales actuales de la BD
    const { data: creds, error: fetchErr } = await supabase
      .from('admin_credentials')
      .select('id, email, password')
      .eq('email', 'admin@fashionstore.com')
      .limit(1)
      .single();

    if (fetchErr || !creds) {
      // Fallback: si la tabla no existe, comparar con hardcoded
      const FALLBACK_PASSWORD = '1234';
      if (currentPassword !== FALLBACK_PASSWORD) {
        return new Response(
          JSON.stringify({ error: 'La contraseña actual es incorrecta.' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Intentar crear la fila si no existe
      const { error: insertErr } = await supabase
        .from('admin_credentials')
        .insert({ email: 'admin@fashionstore.com', password: newPassword });

      if (insertErr) {
        console.error('[change-password] Error creando credenciales:', insertErr.message);
        return new Response(
          JSON.stringify({ error: 'Error al guardar. Asegúrate de ejecutar el SQL de admin_credentials.' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Contraseña actualizada correctamente.' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Verificar contraseña actual
    if (creds.password !== currentPassword) {
      return new Response(
        JSON.stringify({ error: 'La contraseña actual es incorrecta.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Actualizar a la nueva contraseña
    const { error: updateErr } = await supabase
      .from('admin_credentials')
      .update({ password: newPassword })
      .eq('id', creds.id);

    if (updateErr) {
      console.error('[change-password] Error actualizando:', updateErr.message);
      return new Response(
        JSON.stringify({ error: 'Error al guardar los cambios.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[change-password] ✅ Contraseña actualizada para admin@fashionstore.com');

    return new Response(
      JSON.stringify({ success: true, message: 'Contraseña actualizada correctamente.' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[change-password] Error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Error interno del servidor.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
