import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/emailService';
import { requireAdmin } from '@/lib/admin-guard';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

function getSupabase() {
  return createClient(supabaseUrl, supabaseKey);
}

const JSON_HEADERS = { 'Content-Type': 'application/json' };

// ─── Sanitizar HTML básico (eliminar scripts maliciosos) ───
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed[^>]*>/gi, '');
}

// ─── Template wrapper para newsletter ───
function wrapNewsletterHtml(content: string): string {
  const BRAND_COLOR = '#00aa45';
  const LOGO_URL = 'https://res.cloudinary.com/djvj32zic/image/upload/v1769980559/admin-logo_qq0qlz.png';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FashionStore Newsletter</title>
  <style>
    body { margin: 0; padding: 0; width: 100% !important; background-color: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    img { border: 0; outline: none; text-decoration: none; }
    table { border-collapse: collapse; }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .mobile-padding { padding-left: 15px !important; padding-right: 15px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f5f5f7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:30px 0;">
    <tr><td align="center">
      <table class="container" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,${BRAND_COLOR},#008836);padding:30px;text-align:center;">
            <img src="${LOGO_URL}" alt="FashionStore" width="180" style="max-width:180px;height:auto;">
          </td>
        </tr>
        <!-- Content -->
        <tr>
          <td class="mobile-padding" style="padding:30px 40px;">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#111827;padding:25px 40px;text-align:center;">
            <p style="color:#9ca3af;font-size:12px;margin:0 0 8px;">
              © ${new Date().getFullYear()} FashionStore. Todos los derechos reservados.
            </p>
            <p style="margin:0;">
              <!-- Enlaces eliminados por petición del usuario -->
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET — Listar campañas + suscriptores + estadísticas
// ═══════════════════════════════════════════════════════════════════════════════
export const GET: APIRoute = async ({ url, request }) => {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const supabase = getSupabase();
    const type = url.searchParams.get('type') || 'campaigns';

    // ─── Suscriptores ───
    if (type === 'subscribers') {
      const { data, error } = await supabase
        .from('newsletter_subscriptions')
        .select('id, email, nombre, activo, created_at')
        .eq('activo', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify({ success: true, subscribers: data || [] }), { headers: JSON_HEADERS });
    }

    // ─── Estadísticas ───
    if (type === 'stats') {
      const [subsResult, campaignsResult, sentResult] = await Promise.all([
        supabase.from('newsletter_subscriptions').select('id', { count: 'exact', head: true }).eq('activo', true),
        supabase.from('campanas_email').select('id', { count: 'exact', head: true }),
        supabase.from('campanas_email').select('id', { count: 'exact', head: true }).eq('estado', 'Enviada'),
      ]);

      return new Response(JSON.stringify({
        success: true,
        stats: {
          total_suscriptores: subsResult.count || 0,
          total_campanas: campaignsResult.count || 0,
          campanas_enviadas: sentResult.count || 0,
        }
      }), { headers: JSON_HEADERS });
    }

    // ─── Detalle campaña ───
    if (type === 'campaign-detail') {
      const id = url.searchParams.get('id');
      if (!id) return new Response(JSON.stringify({ error: 'ID requerido' }), { status: 400, headers: JSON_HEADERS });

      const { data: campaign, error } = await supabase
        .from('campanas_email')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      const { data: logs } = await supabase
        .from('campana_email_logs')
        .select('*')
        .eq('campana_id', id)
        .order('fecha_evento', { ascending: false })
        .limit(100);

      return new Response(JSON.stringify({ success: true, campaign, logs: logs || [] }), { headers: JSON_HEADERS });
    }

    // ─── Listar campañas (default) ───
    const { data, error } = await supabase
      .from('campanas_email')
      .select('*')
      .order('creada_en', { ascending: false });

    if (error) throw error;
    return new Response(JSON.stringify({ success: true, campaigns: data || [] }), { headers: JSON_HEADERS });

  } catch (error: any) {
    console.error('[CAMPAIGNS API] GET Error:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500, headers: JSON_HEADERS });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// POST — Crear, actualizar, eliminar, enviar campañas
// ═══════════════════════════════════════════════════════════════════════════════
export const POST: APIRoute = async ({ request }) => {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const supabase = getSupabase();
    const body = await request.json();
    const { action } = body;

    // ─── CREAR campaña ───
    if (action === 'create') {
      const { nombre, asunto, contenido_html, descripcion, tipo_segmento } = body;

      if (!nombre || !asunto || !contenido_html) {
        return new Response(JSON.stringify({ error: 'Nombre, asunto y contenido son obligatorios' }), { status: 400, headers: JSON_HEADERS });
      }

      const sanitized = sanitizeHtml(contenido_html);

      const { data, error } = await supabase
        .from('campanas_email')
        .insert({
          nombre: nombre.trim(),
          asunto: asunto.trim(),
          contenido_html: sanitized,
          descripcion: descripcion?.trim() || null,
          tipo_segmento: tipo_segmento || 'Todos',
          estado: 'Borrador',
        })
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ success: true, campaign: data }), { headers: JSON_HEADERS });
    }

    // ─── ACTUALIZAR campaña ───
    if (action === 'update') {
      const { id, nombre, asunto, contenido_html, descripcion, tipo_segmento } = body;

      if (!id) return new Response(JSON.stringify({ error: 'ID requerido' }), { status: 400, headers: JSON_HEADERS });

      // Verificar que no esté ya enviada
      const { data: existing } = await supabase.from('campanas_email').select('estado').eq('id', id).single();
      if (existing?.estado === 'Enviada') {
        return new Response(JSON.stringify({ error: 'No se puede editar una campaña ya enviada' }), { status: 400, headers: JSON_HEADERS });
      }

      const updateData: Record<string, any> = { actualizada_en: new Date().toISOString() };
      if (nombre) updateData.nombre = nombre.trim();
      if (asunto) updateData.asunto = asunto.trim();
      if (contenido_html) updateData.contenido_html = sanitizeHtml(contenido_html);
      if (descripcion !== undefined) updateData.descripcion = descripcion?.trim() || null;
      if (tipo_segmento) updateData.tipo_segmento = tipo_segmento;

      const { data, error } = await supabase
        .from('campanas_email')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ success: true, campaign: data }), { headers: JSON_HEADERS });
    }

    // ─── ELIMINAR campaña ───
    if (action === 'delete') {
      const { id } = body;
      if (!id) return new Response(JSON.stringify({ error: 'ID requerido' }), { status: 400, headers: JSON_HEADERS });

      const { error } = await supabase.from('campanas_email').delete().eq('id', id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: JSON_HEADERS });
    }

    // ─── ENVIAR campaña ───
    if (action === 'send') {
      const { id } = body;
      if (!id) return new Response(JSON.stringify({ error: 'ID requerido' }), { status: 400, headers: JSON_HEADERS });

      // 1) Obtener campaña
      const { data: campaign, error: campError } = await supabase
        .from('campanas_email')
        .select('*')
        .eq('id', id)
        .single();

      if (campError || !campaign) {
        return new Response(JSON.stringify({ error: 'Campaña no encontrada' }), { status: 404, headers: JSON_HEADERS });
      }

      if (campaign.estado === 'Enviada') {
        return new Response(JSON.stringify({ error: 'Esta campaña ya fue enviada' }), { status: 400, headers: JSON_HEADERS });
      }

      // 2) Obtener suscriptores activos
      const { data: subscribers, error: subsError } = await supabase
        .from('newsletter_subscriptions')
        .select('email, nombre')
        .eq('activo', true);

      if (subsError) throw subsError;
      if (!subscribers || subscribers.length === 0) {
        return new Response(JSON.stringify({ error: 'No hay suscriptores activos' }), { status: 400, headers: JSON_HEADERS });
      }

      // 3) Marcar como enviándose
      await supabase
        .from('campanas_email')
        .update({
          estado: 'Enviada',
          fecha_envio: new Date().toISOString(),
          total_destinatarios: subscribers.length,
        })
        .eq('id', id);

      // 4) Enviar emails en lotes (máx 5 concurrentes para no saturar SMTP)
      const BATCH_SIZE = 5;
      let totalEnviados = 0;
      let totalFallidos = 0;
      const logs: Array<{ campana_id: string; email: string; estado: string; error_mensaje: string | null }> = [];

      const SITE_URL = import.meta.env.APP_URL || 'https://fashionstorerbv3.victoriafp.online';

      for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
        const batch = subscribers.slice(i, i + BATCH_SIZE);

        const results = await Promise.allSettled(
          batch.map(async (sub) => {
            const htmlWithWrapper = wrapNewsletterHtml(campaign.contenido_html);

            const sent = await sendEmail({
              to: sub.email,
              subject: campaign.asunto,
              html: htmlWithWrapper,
            });

            return { email: sub.email, sent };
          })
        );

        for (const result of results) {
          if (result.status === 'fulfilled') {
            if (result.value.sent) {
              totalEnviados++;
              logs.push({ campana_id: id, email: result.value.email, estado: 'Enviado', error_mensaje: null });
            } else {
              totalFallidos++;
              logs.push({ campana_id: id, email: result.value.email, estado: 'Fallido', error_mensaje: 'Error al enviar' });
            }
          } else {
            totalFallidos++;
            logs.push({ campana_id: id, email: 'unknown', estado: 'Fallido', error_mensaje: result.reason?.message || 'Error desconocido' });
          }
        }

        // Pequeña pausa entre lotes para no saturar
        if (i + BATCH_SIZE < subscribers.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // 5) Guardar logs
      if (logs.length > 0) {
        await supabase.from('campana_email_logs').insert(logs);
      }

      // 6) Actualizar totales
      await supabase
        .from('campanas_email')
        .update({
          total_enviados: totalEnviados,
          actualizada_en: new Date().toISOString(),
        })
        .eq('id', id);

      return new Response(JSON.stringify({
        success: true,
        total_destinatarios: subscribers.length,
        total_enviados: totalEnviados,
        total_fallidos: totalFallidos,
      }), { headers: JSON_HEADERS });
    }

    // ─── DUPLICAR campaña ───
    if (action === 'duplicate') {
      const { id } = body;
      if (!id) return new Response(JSON.stringify({ error: 'ID requerido' }), { status: 400, headers: JSON_HEADERS });

      const { data: original, error: getErr } = await supabase
        .from('campanas_email')
        .select('nombre, asunto, contenido_html, descripcion, tipo_segmento')
        .eq('id', id)
        .single();

      if (getErr || !original) {
        return new Response(JSON.stringify({ error: 'Campaña no encontrada' }), { status: 404, headers: JSON_HEADERS });
      }

      const { data, error } = await supabase
        .from('campanas_email')
        .insert({
          nombre: `${original.nombre} (copia)`,
          asunto: original.asunto,
          contenido_html: original.contenido_html,
          descripcion: original.descripcion,
          tipo_segmento: original.tipo_segmento,
          estado: 'Borrador',
        })
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ success: true, campaign: data }), { headers: JSON_HEADERS });
    }

    // ─── RESETEAR campaña (para reenviar) ───
    if (action === 'reset') {
      const { id } = body;
      if (!id) return new Response(JSON.stringify({ error: 'ID requerido' }), { status: 400, headers: JSON_HEADERS });

      const { data, error } = await supabase
        .from('campanas_email')
        .update({
          estado: 'Borrador',
          fecha_envio: null,
          total_enviados: 0,
          total_destinatarios: 0,
          actualizada_en: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ success: true, campaign: data }), { headers: JSON_HEADERS });
    }

    return new Response(JSON.stringify({ error: 'Acción no válida' }), { status: 400, headers: JSON_HEADERS });

  } catch (error: any) {
    console.error('[CAMPAIGNS API] POST Error:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500, headers: JSON_HEADERS });
  }
};
