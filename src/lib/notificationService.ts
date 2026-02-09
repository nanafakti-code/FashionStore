// =====================================================
// NOTIFICATION SERVICE — Event-Driven Architecture
// =====================================================
// Central handler that enforces STRICT conditional logic:
//   1. Fetch admin_preferences from Supabase
//   2. Check the boolean flag for the event type
//   3. IF AND ONLY IF true → sendEmail()
//
// Environment variables (set in .env):
//   SMTP_HOST=smtp.gmail.com
//   SMTP_PORT=587
//   SMTP_USER=fashionstorerbv@gmail.com
//   SMTP_PASS=xxxx xxxx xxxx xxxx   ← Gmail App Password
//   SMTP_FROM=FashionStore <fashionstorerbv@gmail.com>
// =====================================================

import { supabase } from './supabase';
import { sendEmail, verifySmtpConnection } from './emailService';

// =====================================================
// TYPES
// =====================================================

/** Every system event the notification service handles */
export type NotificationEvent =
  | 'new_order'       // Email: Nuevos pedidos
  | 'low_stock'       // Email: Stock bajo
  | 'new_user'        // Email: Nuevos usuarios
  | 'urgent_order'    // Push:  Pedidos urgentes
  | 'returns'         // Push:  Devoluciones
  | 'daily_summary'   // Cron:  Resumen diario
  | 'weekly_report'   // Cron:  Informe semanal
  | 'monthly_report'; // Cron:  Informe mensual

/** Maps each event to its human-readable label (for logs) */
const EVENT_LABELS: Record<NotificationEvent, string> = {
  new_order:      'Nuevos pedidos',
  low_stock:      'Stock bajo',
  new_user:       'Nuevos usuarios',
  urgent_order:   'Pedidos urgentes',
  returns:        'Devoluciones',
  daily_summary:  'Resumen diario',
  weekly_report:  'Informe semanal',
  monthly_report: 'Informe mensual',
};

/** Events classified as "push" (not transactional email) */
const PUSH_EVENTS: NotificationEvent[] = ['urgent_order', 'returns'];

/** Shape of the admin_preferences DB row */
export interface AdminPreferences {
  id: string;
  new_order: boolean;
  low_stock: boolean;
  new_user: boolean;
  urgent_order: boolean;
  returns: boolean;
  daily_summary: boolean;
  weekly_report: boolean;
  monthly_report: boolean;
  admin_email: string;
  updated_at: string;
}

/** Result returned by every dispatch function */
export interface DispatchResult {
  sent: boolean;
  event: NotificationEvent;
  reason?: string;
  errorCode?: string;
}

const ADMIN_EMAIL = 'fashionstorerbv@gmail.com';

// =====================================================
// 1. DATABASE — Fetch & Update preferences
// =====================================================

/**
 * Read the singleton admin_preferences row.
 * Returns null only if the table doesn't exist / is empty.
 */
export async function getAdminPreferences(): Promise<AdminPreferences | null> {
  try {
    const { data, error } = await supabase
      .from('admin_preferences')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      console.error('[NotificationService] ❌ Error loading preferences:', error.code, error.message);
      return null;
    }
    return data as AdminPreferences;
  } catch (err: any) {
    console.error('[NotificationService] ❌ Exception loading preferences:', err.message);
    return null;
  }
}

/**
 * Toggle a single preference flag in the DB.
 */
export async function updatePreference(
  key: NotificationEvent,
  value: boolean,
): Promise<{ success: boolean; error?: string }> {
  const prefs = await getAdminPreferences();
  if (!prefs) return { success: false, error: 'No preferences row found in DB.' };

  const { error } = await supabase
    .from('admin_preferences')
    .update({ [key]: value })
    .eq('id', prefs.id);

  if (error) {
    console.error(`[NotificationService] ❌ Error updating ${key}:`, error.code, error.message);
    return { success: false, error: error.message };
  }

  console.log(`[NotificationService] ✅ ${EVENT_LABELS[key]} → ${value ? 'ON' : 'OFF'}`);
  return { success: true };
}

// =====================================================
// 2. CENTRAL HANDLER — handleSystemEvent()
// =====================================================
//
// This is THE entry point. Every caller must go through here.
// Flow:
//   1. Fetch preferences from DB
//   2. Check the boolean flag for eventType
//   3. IF AND ONLY IF flag === true → execute send
//   4. For "push" events → high-priority email + console alert
//

/**
 * Central event handler with strict conditional checks.
 *
 * @param eventType  The system event that occurred
 * @param payload    { subject, html } for the email body
 * @returns          DispatchResult with sent status and reason
 */
export async function handleSystemEvent(
  eventType: NotificationEvent,
  payload: { subject: string; html: string },
): Promise<DispatchResult> {
  const label = EVENT_LABELS[eventType];

  // ── Step 1: Fetch current preferences ──
  const prefs = await getAdminPreferences();
  if (!prefs) {
    console.error(`[NotificationService] ⛔ Cannot dispatch "${label}" — preferences unavailable.`);
    return { sent: false, event: eventType, reason: 'Preferences table unreachable.' };
  }

  // ── Step 2: Strict boolean check ──
  const isEnabled: boolean = prefs[eventType];
  if (!isEnabled) {
    console.log(`[NotificationService] ⏭️  "${label}" is DISABLED → skipping.`);
    return { sent: false, event: eventType, reason: `"${label}" desactivado por el admin.` };
  }

  // ── Step 3: Dispatch ──
  const isPush = PUSH_EVENTS.includes(eventType);
  const targetEmail = prefs.admin_email || ADMIN_EMAIL;

  try {
    if (isPush) {
      // Push notification group → simulate with high-priority console + fallback email alert
      console.log(`[NotificationService] 🔔 PUSH ALERT [${label}]: ${payload.subject}`);
      console.log(`[NotificationService] 🔔 Payload preview: ${payload.subject}`);

      // Also send as high-priority email alert (since real push not set up)
      const sent = await sendEmail({
        to: targetEmail,
        subject: `🔔 [URGENTE] ${payload.subject}`,
        html: payload.html,
      });

      if (!sent) {
        console.error(`[NotificationService] ❌ Push-email fallback FAILED for "${label}".`);
        return { sent: false, event: eventType, reason: 'Email transport error (see server logs).' };
      }

      console.log(`[NotificationService] 📧 Push-email fallback sent → ${targetEmail}`);
      return { sent: true, event: eventType };
    }

    // Regular email group
    const sent = await sendEmail({
      to: targetEmail,
      subject: payload.subject,
      html: payload.html,
    });

    if (!sent) {
      console.error(`[NotificationService] ❌ Email FAILED for "${label}" → ${targetEmail}`);
      return { sent: false, event: eventType, reason: 'SMTP transport error (check server logs for error code).' };
    }

    console.log(`[NotificationService] 📧 Email sent [${label}] → ${targetEmail}`);
    return { sent: true, event: eventType };
  } catch (err: any) {
    const errorCode = err.code || err.responseCode || 'UNKNOWN';
    console.error(`[NotificationService] ❌ Exception [${label}]:`, errorCode, err.message);
    return { sent: false, event: eventType, reason: err.message, errorCode };
  }
}

// =====================================================
// Alias — keeps backward compatibility
// =====================================================
export const checkAndSendEmail = handleSystemEvent;

// =====================================================
// 3. SMTP HEALTH CHECK (call on server startup)
// =====================================================

/**
 * Verify SMTP connection is alive. Call this once on startup.
 * Logs OK or the specific error code.
 */
export async function verifyNotificationSystem(): Promise<boolean> {
  console.log('[NotificationService] 🔌 Verifying SMTP connection...');
  const ok = await verifySmtpConnection();
  if (ok) {
    console.log('[NotificationService] ✅ SMTP connection verified — notifications ready.');
  } else {
    console.error('[NotificationService] ❌ SMTP connection FAILED — emails will not send.');
  }

  // Also verify DB access
  const prefs = await getAdminPreferences();
  if (prefs) {
    console.log('[NotificationService] ✅ Preferences loaded from DB — admin_email:', prefs.admin_email);
  } else {
    console.warn('[NotificationService] ⚠️  Could not load preferences — run SQL in Supabase first.');
  }

  return ok && prefs !== null;
}

// =====================================================
// 4. EMAIL TEMPLATES — Rich HTML builders
// =====================================================

const BRAND = '#00aa45';
const LOGO = 'https://res.cloudinary.com/djvj32zic/image/upload/v1769980559/admin-logo_qq0qlz.png';

function emailWrapper(title: string, body: string): string {
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f7;padding:40px 0;">
      <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.06);">
        <div style="background:${BRAND};padding:24px 32px;text-align:center;">
          <img src="${LOGO}" alt="FashionStore" style="height:28px;" />
        </div>
        <div style="padding:32px;">
          <h2 style="margin:0 0 16px;font-size:20px;color:#1e293b;">${title}</h2>
          ${body}
        </div>
        <div style="padding:16px 32px;background:#f8fafc;text-align:center;font-size:11px;color:#94a3b8;">
          FashionStore Admin — Notificación automática
        </div>
      </div>
    </div>`;
}

// =====================================================
// 5. TYPED EVENT DISPATCHERS
// =====================================================
// Each function builds the email HTML and delegates to handleSystemEvent().
// The handler ALWAYS checks the DB preference before sending.

// ── A. EMAIL GROUP ──

/** Event: NEW_ORDER → Check setting: "Nuevos pedidos" */
export async function notifyNewOrder(order: {
  numero_orden: string;
  nombre_cliente: string;
  email_cliente: string;
  total: number;
}): Promise<DispatchResult> {
  const body = `
    <p style="color:#475569;font-size:14px;line-height:1.6;">
      Se ha registrado un nuevo pedido en la tienda.
    </p>
    <table style="width:100%;font-size:14px;color:#334155;border-collapse:collapse;">
      <tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-weight:600;">Pedido</td><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;">#${order.numero_orden}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-weight:600;">Cliente</td><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;">${order.nombre_cliente}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-weight:600;">Email</td><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;">${order.email_cliente}</td></tr>
      <tr><td style="padding:8px 0;font-weight:600;">Total</td><td style="padding:8px 0;font-weight:700;color:${BRAND};">${(order.total / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td></tr>
    </table>`;

  return handleSystemEvent('new_order', {
    subject: `🛒 Nuevo pedido #${order.numero_orden}`,
    html: emailWrapper('Nuevo Pedido Recibido', body),
  });
}

/** Event: LOW_STOCK → Check setting: "Stock bajo" */
export async function notifyLowStock(product: {
  nombre: string;
  stock_actual: number;
  umbral: number;
}): Promise<DispatchResult> {
  const body = `
    <p style="color:#475569;font-size:14px;line-height:1.6;">
      Un producto ha alcanzado un nivel de stock crítico.
    </p>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="margin:0;font-weight:700;color:#dc2626;font-size:14px;">⚠️ ${product.nombre}</p>
      <p style="margin:4px 0 0;font-size:13px;color:#991b1b;">Stock actual: <strong>${product.stock_actual}</strong> unidades (umbral: ${product.umbral})</p>
    </div>`;

  return handleSystemEvent('low_stock', {
    subject: `⚠️ Stock bajo: ${product.nombre}`,
    html: emailWrapper('Alerta de Stock Bajo', body),
  });
}

/** Event: NEW_USER → Check setting: "Nuevos usuarios" */
export async function notifyNewUser(user: {
  nombre: string;
  email: string;
}): Promise<DispatchResult> {
  const body = `
    <p style="color:#475569;font-size:14px;line-height:1.6;">
      Un nuevo cliente se ha registrado en la tienda.
    </p>
    <table style="width:100%;font-size:14px;color:#334155;border-collapse:collapse;">
      <tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-weight:600;">Nombre</td><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;">${user.nombre}</td></tr>
      <tr><td style="padding:8px 0;font-weight:600;">Email</td><td style="padding:8px 0;">${user.email}</td></tr>
    </table>`;

  return handleSystemEvent('new_user', {
    subject: `👤 Nuevo cliente: ${user.nombre}`,
    html: emailWrapper('Nuevo Cliente Registrado', body),
  });
}

// ── B. PUSH NOTIFICATION GROUP ──
// (Backend logic triggers a high-priority email alert as push fallback)

/** Event: URGENT_ORDER → Check setting: "Pedidos urgentes" */
export async function notifyUrgentOrder(order: {
  numero_orden: string;
  nombre_cliente: string;
  motivo: string;
}): Promise<DispatchResult> {
  const body = `
    <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:16px;margin:0 0 16px;">
      <p style="margin:0;font-weight:700;color:#92400e;font-size:14px;">🔥 Pedido urgente #${order.numero_orden}</p>
      <p style="margin:4px 0 0;font-size:13px;color:#78350f;">Cliente: ${order.nombre_cliente}</p>
      <p style="margin:4px 0 0;font-size:13px;color:#78350f;">Motivo: ${order.motivo}</p>
    </div>`;

  return handleSystemEvent('urgent_order', {
    subject: `🔥 Pedido urgente #${order.numero_orden}`,
    html: emailWrapper('Pedido Urgente', body),
  });
}

/** Event: RETURN_REQUEST → Check setting: "Devoluciones" */
export async function notifyReturn(data: {
  numero_orden: string;
  nombre_cliente: string;
  motivo: string;
  total: number;
}): Promise<DispatchResult> {
  const body = `
    <p style="color:#475569;font-size:14px;line-height:1.6;">
      Un cliente ha solicitado una devolución.
    </p>
    <table style="width:100%;font-size:14px;color:#334155;border-collapse:collapse;">
      <tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-weight:600;">Pedido</td><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;">#${data.numero_orden}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-weight:600;">Cliente</td><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;">${data.nombre_cliente}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-weight:600;">Motivo</td><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;">${data.motivo}</td></tr>
      <tr><td style="padding:8px 0;font-weight:600;">Importe</td><td style="padding:8px 0;font-weight:700;color:#dc2626;">${(data.total / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td></tr>
    </table>`;

  return handleSystemEvent('returns', {
    subject: `↩️ Devolución solicitada — Pedido #${data.numero_orden}`,
    html: emailWrapper('Solicitud de Devolución', body),
  });
}

// ── C. SCHEDULED REPORTS (Cron) ──

/** Cron Daily: "Resumen diario" → Check setting → Send summary */
export async function notifyDailySummary(stats: {
  pedidos_hoy: number;
  ingresos_hoy: number;
  nuevos_clientes: number;
  productos_vendidos: number;
}): Promise<DispatchResult> {
  const body = `
    <p style="color:#475569;font-size:14px;line-height:1.6;">Resumen de actividad del día anterior.</p>
    <div style="display:flex;flex-wrap:wrap;gap:12px;margin:16px 0;">
      ${[
        { label: 'Pedidos', value: stats.pedidos_hoy, color: BRAND },
        { label: 'Ingresos', value: (stats.ingresos_hoy / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }), color: '#3b82f6' },
        { label: 'Nuevos clientes', value: stats.nuevos_clientes, color: '#8b5cf6' },
        { label: 'Productos vendidos', value: stats.productos_vendidos, color: '#f59e0b' },
      ].map(s => `
        <div style="flex:1;min-width:120px;background:#f8fafc;border-radius:8px;padding:14px;text-align:center;">
          <p style="margin:0;font-size:22px;font-weight:800;color:${s.color};">${s.value}</p>
          <p style="margin:4px 0 0;font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;">${s.label}</p>
        </div>
      `).join('')}
    </div>`;

  const today = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  return handleSystemEvent('daily_summary', {
    subject: `📊 Resumen diario — ${today}`,
    html: emailWrapper(`Resumen del Día — ${today}`, body),
  });
}

/** Cron Weekly: "Informe semanal" → Check setting → Send analysis */
export async function notifyWeeklyReport(stats: {
  pedidos_semana: number;
  ingresos_semana: number;
  mejor_producto: string;
  tasa_conversion: string;
}): Promise<DispatchResult> {
  const body = `
    <p style="color:#475569;font-size:14px;line-height:1.6;">Informe de rendimiento semanal.</p>
    <table style="width:100%;font-size:14px;color:#334155;border-collapse:collapse;margin:16px 0;">
      <tr><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-weight:600;">Pedidos</td><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:700;">${stats.pedidos_semana}</td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-weight:600;">Ingresos</td><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:700;color:${BRAND};">${(stats.ingresos_semana / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-weight:600;">Producto estrella</td><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;text-align:right;">${stats.mejor_producto}</td></tr>
      <tr><td style="padding:10px 0;font-weight:600;">Tasa conversión</td><td style="padding:10px 0;text-align:right;font-weight:700;">${stats.tasa_conversion}</td></tr>
    </table>`;

  return handleSystemEvent('weekly_report', {
    subject: '📈 Informe semanal — FashionStore',
    html: emailWrapper('Informe Semanal', body),
  });
}

/** Cron Monthly: "Informe mensual" → Check setting → Send report */
export async function notifyMonthlyReport(stats: {
  pedidos_mes: number;
  ingresos_mes: number;
  clientes_nuevos: number;
  devoluciones: number;
}): Promise<DispatchResult> {
  const month = new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const body = `
    <p style="color:#475569;font-size:14px;line-height:1.6;">Reporte de rendimiento del mes de <strong>${month}</strong>.</p>
    <table style="width:100%;font-size:14px;color:#334155;border-collapse:collapse;margin:16px 0;">
      <tr><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-weight:600;">Pedidos totales</td><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:700;">${stats.pedidos_mes}</td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-weight:600;">Facturación</td><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:700;color:${BRAND};">${(stats.ingresos_mes / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-weight:600;">Nuevos clientes</td><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;text-align:right;">${stats.clientes_nuevos}</td></tr>
      <tr><td style="padding:10px 0;font-weight:600;">Devoluciones</td><td style="padding:10px 0;text-align:right;color:#dc2626;font-weight:700;">${stats.devoluciones}</td></tr>
    </table>`;

  return handleSystemEvent('monthly_report', {
    subject: `📋 Informe mensual — ${month}`,
    html: emailWrapper(`Informe Mensual — ${month}`, body),
  });
}
