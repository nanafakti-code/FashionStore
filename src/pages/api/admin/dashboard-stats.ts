import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/admin-guard';

const supabaseAdmin = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export const GET: APIRoute = async ({ request }) => {
    const denied = requireAdmin(request);
    if (denied) return denied;

    try {
        // Ejecutar todas las queries en paralelo
        const [
            pedidosResult,
            usuariosResult,
            devolucionesResult,
            reseniasResult,
        ] = await Promise.all([
            supabaseAdmin.from('ordenes').select('*').order('creado_en', { ascending: false }),
            supabaseAdmin.from('usuarios').select('id, nombre, email, activo').eq('activo', true),
            supabaseAdmin.from('devoluciones').select('id, estado').eq('estado', 'pendiente'),
            supabaseAdmin.from('resenas').select('puntuacion'),
        ]);

        const pedidos = pedidosResult.data || [];
        const usuarios = usuariosResult.data || [];
        const devoluciones = devolucionesResult.data || [];
        const resenas = reseniasResult.data || [];

        // Calcular estadísticas de pedidos
        const hoy = new Date().toISOString().split('T')[0];
        const mesActual = new Date().toISOString().substring(0, 7);

        const ventasHoy = pedidos
            .filter((p: any) => p.creado_en?.startsWith(hoy))
            .reduce((sum: number, p: any) => sum + (p.total_precio || 0), 0);

        const ventasMes = pedidos
            .filter((p: any) => p.creado_en?.startsWith(mesActual))
            .reduce((sum: number, p: any) => sum + (p.total_precio || 0), 0);

        const ordenesEnProceso = pedidos.filter(
            (p: any) => p.estado?.toLowerCase() === 'en_proceso'
        ).length;

        const pedidosPagados = pedidos
            .filter((p: any) => p.estado?.toLowerCase() === 'pagado')
            .slice(0, 10);

        // Calcular promedio de reseñas
        const reseniasPromedio = resenas.length > 0
            ? Math.round((resenas.reduce((sum: number, r: any) => sum + (r.puntuacion || 0), 0) / resenas.length) * 10) / 10
            : 0;

        return new Response(JSON.stringify({
            pedidos: {
                total: pedidos.length,
                ventasHoy: ventasHoy / 100,
                ventasMes: ventasMes / 100,
                ordenesEnProceso,
                ultimos10Pagados: pedidosPagados,
            },
            usuarios: {
                total: usuarios.length,
                lista: usuarios.slice(0, 10),
            },
            devoluciones: {
                activas: devoluciones.length,
            },
            resenas: {
                promedio: reseniasPromedio,
                total: resenas.length,
            },
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('[API] Error fetching dashboard stats:', error);
        return new Response(
            JSON.stringify({ error: 'Error interno del servidor' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
