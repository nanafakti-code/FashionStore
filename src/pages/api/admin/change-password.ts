// =====================================================
// POST /api/admin/change-password
// =====================================================
// Cambia la contraseña del admin (admin@fashionstore.com)
// en la tabla admin_credentials de Supabase.
// Requiere sesión admin válida.
//
// Body: { currentPassword, newPassword }
// =====================================================

import type { APIRoute } from 'astro';
import { supabase } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin-guard';
import { verifyPassword, hashPassword } from '@/lib/admin-auth';

export const POST: APIRoute = async ({ request }) => {
  // Verificar sesión admin
  const denied = requireAdmin(request);
  if (denied) return denied;

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

    // 1. Obtener credenciales actuales de la BD (sin fallback)
    const { data: creds, error: fetchErr } = await supabase
      .from('admin_credentials')
      .select('id, email, password')
      .eq('email', 'admin@fashionstore.com')
      .limit(1)
      .single();

    if (fetchErr || !creds) {
      return new Response(
        JSON.stringify({ error: 'No se pudieron obtener las credenciales. Asegúrate de ejecutar el SQL de admin_credentials.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Verificar contraseña actual con bcrypt (soporta legacy plaintext)
    const isValid = await verifyPassword(currentPassword, creds.password);

    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'La contraseña actual es incorrecta.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Hashear y guardar la nueva contraseña
    const hashedNewPassword = await hashPassword(newPassword);
    const { error: updateErr } = await supabase
      .from('admin_credentials')
      .update({ password: hashedNewPassword })
      .eq('id', creds.id);

    if (updateErr) {
      return new Response(
        JSON.stringify({ error: 'Error al guardar los cambios.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Contraseña actualizada correctamente.' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[change-password] Error interno');
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
