// =====================================================
// GET /api/cron/reports
// =====================================================
// Endpoint diseñado para ser invocado por un cron job
// externo (ej. cron-job.org, Coolify cron, GitHub Actions).
//
// Parámetro ?type=daily|weekly|monthly
//
// Flujo:
// 1. Consulta las stats reales de Supabase
// 2. Llama a notifyDailySummary / notifyWeeklyReport / notifyMonthlyReport
// 3. handleSystemEvent() comprueba internamente el toggle en admin_preferences
// 4. IF AND ONLY IF el toggle está activo → sendEmail()
// =====================================================

import type { APIRoute } from 'astro';
import { supabase } from '@/lib/supabase';
import {
  notifyDailySummary,
  notifyWeeklyReport,
  notifyMonthlyReport,
} from '@/lib/notificationService';
import type { DispatchResult } from '@/lib/notificationService';

// Helpers de fecha
function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
}
function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return startOfDay(d);
}

// Obtener stats del rango
async function getStats(since: string) {
  const [ordersRes, usersRes] = await Promise.all([
    supabase
      .from('ordenes')
      .select('id, total, estado')
      .gte('fecha_creacion', since)
      .neq('estado', 'pendiente'),
    supabase
      .from('usuarios')
      .select('id')
      .gte('fecha_creacion', since),
  ]);

  const orders = ordersRes.data || [];
  const users = usersRes.data || [];

  const ingresos = orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
  const devoluciones = orders.filter((o: any) => o.estado === 'reembolsado' || o.estado === 'cancelado').length;

  return {
    pedidos: orders.length,
    ingresos,
    clientes: users.length,
    productos_vendidos: orders.length, // Simplificación; idealmente sumar items
    devoluciones,
  };
}

export const GET: APIRoute = async ({ url }) => {
  const type = url.searchParams.get('type') || 'daily';
  const authHeader = url.searchParams.get('secret');

  // Protección básica con secret (configurar en env)
  const cronSecret = import.meta.env.CRON_SECRET || '';
  if (cronSecret && authHeader !== cronSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    let result: DispatchResult;

    if (type === 'daily') {
      const stats = await getStats(daysAgo(1));
      result = await notifyDailySummary({
        pedidos_hoy: stats.pedidos,
        ingresos_hoy: stats.ingresos,
        nuevos_clientes: stats.clientes,
        productos_vendidos: stats.productos_vendidos,
      });
    } else if (type === 'weekly') {
      const stats = await getStats(daysAgo(7));

      // Producto más vendido (simplificado)
      const { data: topProduct } = await supabase
        .from('ordenes')
        .select('nombre_cliente')
        .gte('fecha_creacion', daysAgo(7))
        .neq('estado', 'pendiente')
        .limit(1);

      result = await notifyWeeklyReport({
        pedidos_semana: stats.pedidos,
        ingresos_semana: stats.ingresos,
        mejor_producto: topProduct?.[0]?.nombre_cliente || 'N/A',
        tasa_conversion: `${stats.pedidos > 0 ? ((stats.pedidos / Math.max(stats.clientes, 1)) * 100).toFixed(1) : 0}%`,
      });
    } else if (type === 'monthly') {
      const stats = await getStats(daysAgo(30));
      result = await notifyMonthlyReport({
        pedidos_mes: stats.pedidos,
        ingresos_mes: stats.ingresos,
        clientes_nuevos: stats.clientes,
        devoluciones: stats.devoluciones,
      });
    } else {
      return new Response(
        JSON.stringify({ error: 'Tipo inválido. Usa: daily, weekly, monthly' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Cron Reports] ${type} → sent: ${result.sent}, reason: ${result.reason || 'OK'}`);

    return new Response(JSON.stringify({
      type,
      sent: result.sent,
      event: result.event,
      reason: result.reason || null,
      errorCode: result.errorCode || null,
    }), {
      status: result.sent ? 200 : 202, // 202 = accepted but not sent (disabled)
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[Cron Reports] Error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
