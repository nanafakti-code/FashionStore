import type { ReactNode } from 'react';
import {
    TrendingUp,
    Clock,
    Award,
    Users,
    RotateCcw,
    Star
} from 'lucide-react';

interface KPICardProps {
    title: string;
    value: string | number;
    icon: ReactNode;
    color: string;
    description?: string;
}

export function KPICard({ title, value, icon, color, description }: KPICardProps) {
    return (
        <div className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${color} transition-all hover:shadow-md`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-2">{value}</h3>
                    {description && (
                        <p className="text-xs text-gray-400 mt-1 font-medium">{description}</p>
                    )}
                </div>
                <div className={`p-3 rounded-lg ${color.replace('border-', 'bg-opacity-10 bg-')}`}>
                    <div className={`${color.replace('border-', 'text-')}`}>
                        {icon}
                    </div>
                </div>
            </div>
        </div>
    );
}

interface KPICardsProps {
    stats: {
        ventasMes: number;
        pedidosPendientes: number;
        productoMasVendido: string;
        clientesActivos: number;
        devolucionesActivas: number;
        valoracionMedia: number;
    };
}

export default function KPICards({ stats }: KPICardsProps) {
    const cards = [
        {
            title: 'Ventas del Mes',
            value: `${stats.ventasMes.toFixed(2)}€`,
            icon: <TrendingUp size={24} />,
            color: 'border-blue-600',
            description: 'Ingresos totales (Excl. Cancelados)'
        },
        {
            title: 'Pedidos Pendientes',
            value: stats.pedidosPendientes,
            icon: <Clock size={24} />,
            color: 'border-amber-500',
            description: 'Esperando procesamiento'
        },
        {
            title: 'Top Producto',
            value: stats.productoMasVendido,
            icon: <Award size={24} />,
            color: 'border-purple-600',
            description: 'Más vendido (30 días)'
        },
        {
            title: 'Clientes Activos',
            value: stats.clientesActivos,
            icon: <Users size={24} />,
            color: 'border-green-600',
            description: 'Cuentas verificadas'
        },
        {
            title: 'Devoluciones',
            value: stats.devolucionesActivas,
            icon: <RotateCcw size={24} />,
            color: 'border-rose-500',
            description: 'Solicitudes abiertas'
        },
        {
            title: 'Valoración Media',
            value: `${stats.valoracionMedia}/5`,
            icon: <Star size={24} />,
            color: 'border-indigo-600',
            description: 'Feedback de clientes'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {cards.map((card, index) => (
                <KPICard key={index} {...card} />
            ))}
        </div>
    );
}
