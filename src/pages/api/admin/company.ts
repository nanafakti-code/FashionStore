// =====================================================
// GET  /api/admin/company — Leer datos de empresa
// PUT  /api/admin/company — Actualizar datos de empresa
// =====================================================

import type { APIRoute } from 'astro';
import { supabase } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin-guard';

// ---- GET: cargar datos de la empresa ----
export const GET: APIRoute = async () => {
  try {
    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      // Si la tabla no existe, devolver defaults
      console.error('[API company] Error:', error.message);
      return new Response(
        JSON.stringify({
          nombre: 'FashionStore',
          nif: 'B-12345678',
          email: 'fashionstorerbv@gmail.com',
          telefono: '+34 910 000 000',
          direccion: 'Calle Gran Vía 28, 3ª Planta',
          ciudad: 'Madrid',
          codigo_postal: '28013',
          pais: 'España',
          _fallback: true,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[API company] Error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// ---- PUT: actualizar datos de la empresa ----
export const PUT: APIRoute = async ({ request }) => {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    const { nombre, nif, email, telefono, direccion, ciudad, codigo_postal, pais } = body;

    // Validación email
    if (email && !email.includes('@')) {
      return new Response(
        JSON.stringify({ error: 'El email de contacto no tiene un formato válido.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validación campos requeridos
    if (!nombre?.trim()) {
      return new Response(
        JSON.stringify({ error: 'El nombre comercial es obligatorio.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Intentar obtener el registro existente
    const { data: existing, error: fetchErr } = await supabase
      .from('company_settings')
      .select('id')
      .limit(1)
      .single();

    const updateData = {
      nombre: nombre?.trim(),
      nif: nif?.trim() || '',
      email: email?.trim() || 'fashionstorerbv@gmail.com',
      telefono: telefono?.trim() || '',
      direccion: direccion?.trim() || '',
      ciudad: ciudad?.trim() || '',
      codigo_postal: codigo_postal?.trim() || '',
      pais: pais?.trim() || '',
    };

    if (fetchErr || !existing) {
      // Crear registro si no existe
      const { error: insertErr } = await supabase
        .from('company_settings')
        .insert(updateData);

      if (insertErr) {
        console.error('[API company] Error insertando:', insertErr.message);
        return new Response(
          JSON.stringify({ error: 'Error al guardar. Asegúrate de ejecutar el SQL de company_settings.' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Actualizar registro existente
      const { error: updateErr } = await supabase
        .from('company_settings')
        .update(updateData)
        .eq('id', existing.id);

      if (updateErr) {
        console.error('[API company] Error actualizando:', updateErr.message);
        return new Response(
          JSON.stringify({ error: updateErr.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    return new Response(
      JSON.stringify({ success: true, message: 'Datos de empresa guardados correctamente.' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[API company] Error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Error interno' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
