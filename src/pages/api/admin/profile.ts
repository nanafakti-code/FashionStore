// =====================================================
// API: Admin Profile — GET / PUT
// GET  → Devuelve datos del perfil admin
// PUT  → Actualiza nombre, telefono, ciudad, pais
// =====================================================

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import {
  getAdminTokenFromCookie,
  verifyAdminSessionToken,
} from '@/lib/admin-auth';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = 'admin@fashionstore.com';

// ── Helpers ──

function unauthorized(msg = 'No autorizado') {
  return new Response(JSON.stringify({ error: msg }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

function badRequest(msg: string) {
  return new Response(JSON.stringify({ error: msg }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
}

function ok(data: unknown) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function serverError(msg: string) {
  return new Response(JSON.stringify({ error: msg }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Valida sesión admin desde cookies */
function requireAdmin(request: Request): boolean {
  const cookie = request.headers.get('cookie') || '';
  const token = getAdminTokenFromCookie(cookie);
  if (!token) return false;
  const session = verifyAdminSessionToken(token);
  return !!session?.isAdmin;
}

// ── GET: Fetch admin profile ──

export const GET: APIRoute = async ({ request }) => {
  try {
    if (!requireAdmin(request)) return unauthorized();

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar el usuario admin por email
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nombre, email, telefono, ciudad, pais, rol, fecha_registro')
      .eq('email', ADMIN_EMAIL)
      .limit(1)
      .single();

    if (error && error.code === 'PGRST116') {
      // No existe → crear usuario admin automáticamente
      const { data: newUser, error: insertError } = await supabase
        .from('usuarios')
        .insert({
          email: ADMIN_EMAIL,
          nombre: 'Administrador',
          telefono: '',
          ciudad: '',
          pais: 'España',
          rol: 'Administrador',
          activo: true,
          verificado: true,
        })
        .select('id, nombre, email, telefono, ciudad, pais, rol, fecha_registro')
        .single();

      if (insertError) {
        console.error('[PROFILE] Error creating admin user:', insertError);
        return serverError('Error creando perfil de administrador');
      }

      return ok(newUser);
    }

    if (error) {
      console.error('[PROFILE] Error fetching profile:', error);
      return serverError('Error al obtener perfil');
    }

    return ok(data);
  } catch (err: any) {
    console.error('[PROFILE] Unexpected error (GET)');
    return serverError('Error interno');
  }
};

// ── PUT: Update admin profile ──

export const PUT: APIRoute = async ({ request }) => {
  try {
    if (!requireAdmin(request)) return unauthorized();

    const body = await request.json();
    const { nombre, telefono, ciudad, pais } = body as {
      nombre?: string;
      telefono?: string;
      ciudad?: string;
      pais?: string;
    };

    // ─ Validación ─
    if (!nombre || !nombre.trim()) {
      return badRequest('El nombre es obligatorio.');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar ID del admin
    const { data: existing, error: findError } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', ADMIN_EMAIL)
      .limit(1)
      .single();

    if (findError || !existing) {
      return badRequest('No se encontró el perfil de administrador.');
    }

    // Actualizar
    const { data: updated, error: updateError } = await supabase
      .from('usuarios')
      .update({
        nombre: nombre.trim(),
        telefono: (telefono || '').trim(),
        ciudad: (ciudad || '').trim(),
        pais: (pais || '').trim(),
        actualizado_en: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select('id, nombre, email, telefono, ciudad, pais, rol, fecha_registro')
      .single();

    if (updateError) {
      console.error('[PROFILE] Error updating profile:', updateError);
      return serverError('Error al guardar los cambios.');
    }
    return ok(updated);
  } catch (err: any) {
    console.error('[PROFILE] Unexpected error (PUT)');
    return serverError('Error interno');
  }
};
