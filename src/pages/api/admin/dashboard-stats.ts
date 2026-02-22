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
        const ahora = new Date();
        const hace7Dias = new Date(ahora);
        hace7Dias.setDate(ahora.getDate() - 7);
        const fechaLimite7Dias = hace7Dias.toISOString();

        const mesActualInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString();

        // Ejecutar todas las queries en paralelo para máxima eficiencia
        const [
            pedidosResult,
            usuariosResult,
            devolucionesResult,
            reseniasResult,
            ventas7DiasResult,
            topProductosResult
        ] = await Promise.all([
            // Todos los pedidos para el total histórico (usando la tabla 'ordenes')
            supabaseAdmin.from('ordenes').select('id, total, estado, fecha_creacion').order('fecha_creacion', { ascending: false }),
            // Usuarios activos
            supabaseAdmin.from('usuarios').select('id').eq('activo', true),
            // Devoluciones pendientes
            supabaseAdmin.from('devoluciones').select('id').eq('estado', 'Pendiente'),
            // Promedio de reseñas
            supabaseAdmin.from('resenas').select('calificacion'),
            // Ventas de los últimos 7 días para el gráfico
            supabaseAdmin.from('ordenes')
                .select('total, fecha_creacion')
                .neq('estado', 'Cancelado')
                .gte('fecha_creacion', fechaLimite7Dias),
            // Obtener productos más vendidos (vía items_orden)
            supabaseAdmin.from('items_orden')
                .select('producto_id, cantidad, producto_nombre')
                .order('cantidad', { ascending: false })
                .limit(50)
        ]);

        const pedidos = pedidosResult.data || [];
        const usuarios = usuariosResult.data || [];
        const devoluciones = devolucionesResult.data || [];
        const resenas = reseniasResult.data || [];
        const ventas7DiasRaw = ventas7DiasResult.data || [];
        const topProductosRaw = topProductosResult.data || [];

        // 1. KPI: Ventas Totales del Mes (Pagados o Entregados)
        const ventasMes = pedidos
            .filter(p => p.fecha_creacion >= mesActualInicio && !['Cancelado', 'Pendiente'].includes(p.estado))
            .reduce((sum, p) => sum + (p.total || 0), 0);

        // 2. KPI: Pedidos Pendientes
        const pedidosPendientes = pedidos.filter(p => p.estado === 'Pendiente').length;

        // 3. KPI: Producto Más Vendido (Agregación manual de los top 50 detalles)
        const counts: Record<string, { nombre: string, cantidad: number }> = {};
        topProductosRaw.forEach((item: any) => {
            const id = item.producto_id;
            const nombre = item.producto_nombre || 'Producto desconocido';
            if (!counts[id]) counts[id] = { nombre, cantidad: 0 };
            counts[id].cantidad += item.cantidad;
        });
        const productoMasVendido = Object.values(counts).sort((a, b) => b.cantidad - a.cantidad)[0]?.nombre || 'N/A';

        // 4. Datos para el gráfico: Ventas últimos 7 días
        const ventasMap = new Map();
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            ventasMap.set(dateStr, 0);
        }

        ventas7DiasRaw.forEach((p: any) => {
            const dateStr = p.fecha_creacion.split('T')[0];
            if (ventasMap.has(dateStr)) {
                ventasMap.set(dateStr, ventasMap.get(dateStr) + (p.total || 0));
            }
        });

        const graficoVentas = Array.from(ventasMap.entries())
            .map(([fecha, total]) => ({ fecha, total: total / 100 }))
            .reverse();

        // 5. Estadísticas de Reseñas
        const reseniasPromedio = resenas.length > 0
            ? Math.round((resenas.reduce((sum, r) => sum + (r.calificacion || 0), 0) / resenas.length) * 10) / 10
            : 0;

        return new Response(JSON.stringify({
            kpis: {
                ventasMes: ventasMes / 100,
                pedidosPendientes,
                productoMasVendido,
                clientesActivos: usuarios.length,
                devolucionesActivas: devoluciones.length,
                valoracionMedia: reseniasPromedio
            },
            grafico: graficoVentas,
            ultimosPedidos: pedidos.slice(0, 10).map(p => ({
                id: p.id,
                total: p.total / 100,
                estado: p.estado,
                fecha: p.fecha_creacion
            }))
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('[API] Error fetching dashboard stats:', error);
        return new Response(
            JSON.stringify({ error: 'Error interno del servidor', details: error instanceof Error ? error.message : String(error) }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
