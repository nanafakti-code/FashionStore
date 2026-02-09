// =====================================================
// GET /api/admin/preferences  — Leer preferencias
// PATCH /api/admin/preferences — Actualizar un toggle
// =====================================================

import type { APIRoute } from 'astro';
import { getAdminPreferences, updatePreference } from '@/lib/notificationService';
import type { NotificationEvent } from '@/lib/notificationService';

const VALID_KEYS: NotificationEvent[] = [
  'new_order', 'low_stock', 'new_user',
  'urgent_order', 'returns',
  'daily_summary', 'weekly_report', 'monthly_report',
];

// ---- GET: cargar todas las preferencias ----
export const GET: APIRoute = async () => {
  try {
    const prefs = await getAdminPreferences();

    if (!prefs) {
      return new Response(
        JSON.stringify({ error: 'No se encontraron preferencias. Ejecuta el SQL de admin_preferences.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(prefs), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[API preferences] Error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Error interno' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// ---- PATCH: toggle individual { key, value } ----
export const PATCH: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { key, value } = body as { key: string; value: boolean };

    if (!key || typeof value !== 'boolean') {
      return new Response(
        JSON.stringify({ error: 'Body inválido. Se requiere { key: string, value: boolean }.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!VALID_KEYS.includes(key as NotificationEvent)) {
      return new Response(
        JSON.stringify({ error: `Clave inválida: "${key}". Válidas: ${VALID_KEYS.join(', ')}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await updatePreference(key as NotificationEvent, value);

    if (!result.success) {
      return new Response(
        JSON.stringify({ error: result.error }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, key, value }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[API preferences PATCH] Error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Error interno' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
