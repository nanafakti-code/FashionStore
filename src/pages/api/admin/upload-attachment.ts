// =====================================================
// POST /api/admin/upload-attachment
// DELETE /api/admin/upload-attachment
// =====================================================
// Recibe un PDF via multipart/form-data, lo guarda en
// public/uploads/attachments/ y almacena la ruta en
// company_settings.invoice_attachment_path.
// =====================================================

import type { APIRoute } from 'astro';
import { supabase } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin-guard';
import fs from 'node:fs';
import path from 'node:path';

const UPLOAD_DIR = path.resolve('public/uploads/attachments');
const FILENAME = 'global_invoice.pdf';
const RELATIVE_PATH = '/uploads/attachments/global_invoice.pdf';

function ensureDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

// ---- POST: subir PDF ----
export const POST: APIRoute = async ({ request }) => {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return new Response(
        JSON.stringify({ error: 'Se esperaba multipart/form-data' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const formData = await request.formData();
    const file = formData.get('attachment') as File | null;

    if (!file || !(file instanceof File)) {
      return new Response(
        JSON.stringify({ error: 'No se recibió ningún archivo.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validar que sea PDF
    if (file.type !== 'application/pdf') {
      return new Response(
        JSON.stringify({ error: 'Solo se permiten archivos PDF.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Limitar tamaño a 10 MB
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return new Response(
        JSON.stringify({ error: 'El archivo no puede superar 10 MB.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Guardar en disco (sobreescribir si existe)
    ensureDir();
    const buffer = Buffer.from(await file.arrayBuffer());
    const dest = path.join(UPLOAD_DIR, FILENAME);
    fs.writeFileSync(dest, buffer);
    // Guardar ruta en company_settings
    const { data: existing } = await supabase
      .from('company_settings')
      .select('id')
      .limit(1)
      .single();

    if (existing) {
      await supabase
        .from('company_settings')
        .update({ invoice_attachment_path: RELATIVE_PATH })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('company_settings')
        .insert({ invoice_attachment_path: RELATIVE_PATH });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        path: RELATIVE_PATH,
        size: file.size,
        name: file.name,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[UPLOAD] Error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// ---- DELETE: eliminar PDF adjunto ----
export const DELETE: APIRoute = async ({ request }) => {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    // Eliminar archivo del disco
    const dest = path.join(UPLOAD_DIR, FILENAME);
    if (fs.existsSync(dest)) {
      fs.unlinkSync(dest);
    }

    // Limpiar ruta en BD
    const { data: existing } = await supabase
      .from('company_settings')
      .select('id')
      .limit(1)
      .single();

    if (existing) {
      await supabase
        .from('company_settings')
        .update({ invoice_attachment_path: null })
        .eq('id', existing.id);
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[UPLOAD] Error al eliminar:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
