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
        const url = new URL(request.url);
        const startParam = url.searchParams.get('start');
        const endParam = url.searchParams.get('end');

        const ahora = new Date();

        // Determinar rango para el gráfico
        let fechaInicio: Date;
        let fechaFin: Date;

        if (startParam && endParam) {
            fechaInicio = new Date(startParam);
            fechaFin = new Date(endParam);
            // Asegurar que fechaFin sea al final del día
            fechaFin.setHours(23, 59, 59, 999);
        } else {
            fechaFin = ahora;
            fechaInicio = new Date(ahora);
            fechaInicio.setDate(ahora.getDate() - 7);
        }

        const fechaLimiteISO = fechaInicio.toISOString();
        const fechaFinISO = fechaFin.toISOString();

        const mesActualInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString();

        // Ejecutar todas las queries en paralelo
        const [
            pedidosResult,
            usuariosResult,
            devolucionesResult,
            reseniasResult,
            ventasPeriodoResult,
            topProductosResult
        ] = await Promise.all([
            // Pedidos generales para KPIs
            supabaseAdmin.from('ordenes').select('id, total, estado, fecha_creacion').order('fecha_creacion', { ascending: false }),
            // Usuarios activos
            supabaseAdmin.from('usuarios').select('id').eq('activo', true),
            // Devoluciones pendientes
            supabaseAdmin.from('devoluciones').select('id').eq('estado', 'Pendiente'),
            // Promedio de reseñas
            supabaseAdmin.from('resenas').select('calificacion'),
            // Ventas del periodo seleccionado para el gráfico
            supabaseAdmin.from('ordenes')
                .select('total, fecha_creacion')
                .neq('estado', 'Cancelado')
                .gte('fecha_creacion', fechaLimiteISO)
                .lte('fecha_creacion', fechaFinISO),
            // Productos más vendidos
            supabaseAdmin.from('items_orden')
                .select('producto_id, cantidad, producto_nombre')
                .order('cantidad', { ascending: false })
                .limit(50)
        ]);

        const pedidos = pedidosResult.data || [];
        const usuarios = usuariosResult.data || [];
        const devoluciones = devolucionesResult.data || [];
        const resenas = reseniasResult.data || [];
        const ventasPeriodoRaw = ventasPeriodoResult.data || [];
        const topProductosRaw = topProductosResult.data || [];

        // 1. KPI: Ventas Totales del Mes
        const ventasMes = pedidos
            .filter(p => p.fecha_creacion >= mesActualInicio && !['Cancelado', 'Pendiente'].includes(p.estado))
            .reduce((sum, p) => sum + (p.total || 0), 0);

        // 2. KPI: Pedidos Pendientes
        const pedidosPendientes = pedidos.filter(p => p.estado === 'Pendiente').length;

        // 3. KPI: Producto Más Vendido
        const counts: Record<string, { nombre: string, cantidad: number }> = {};
        topProductosRaw.forEach((item: any) => {
            const id = item.producto_id;
            const nombre = item.producto_nombre || 'Producto desconocido';
            if (!counts[id]) counts[id] = { nombre, cantidad: 0 };
            counts[id].cantidad += item.cantidad;
        });
        const productoMasVendido = Object.values(counts).sort((a, b) => b.cantidad - a.cantidad)[0]?.nombre || 'N/A';

        // 4. Datos para el gráfico: Ventas del periodo seleccionado
        const ventasMap = new Map();

        // Calcular número de días en el rango
        const diffTime = Math.abs(fechaFin.getTime() - fechaInicio.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Inicializar el mapa para todos los días del rango (máximo 60 días para evitar saturación)
        const maxDays = Math.min(diffDays, 60);
        for (let i = 0; i <= maxDays; i++) {
            const d = new Date(fechaInicio);
            d.setDate(d.getDate() + i);
            const dateStr = d.toISOString().split('T')[0];
            ventasMap.set(dateStr, 0);
        }

        ventasPeriodoRaw.forEach((p: any) => {
            const dateStr = p.fecha_creacion.split('T')[0];
            if (ventasMap.has(dateStr)) {
                ventasMap.set(dateStr, ventasMap.get(dateStr) + (p.total || 0));
            }
        });

        const graficoVentas = Array.from(ventasMap.entries())
            .map(([fecha, total]) => ({ fecha, total: total / 100 }));

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
