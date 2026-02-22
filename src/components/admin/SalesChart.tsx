import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    PointElement,
    LineElement,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface SalesChartProps {
    data: { fecha: string; total: number }[];
    startDate?: string;
    endDate?: string;
    onDateRangeChange?: (start: string, end: string) => void;
}

export default function SalesChart({ data, startDate, endDate, onDateRangeChange }: SalesChartProps) {
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: false,
            },
            tooltip: {
                backgroundColor: '#1e293b',
                titleFont: { size: 14, weight: 'bold' as const },
                bodyFont: { size: 13 },
                padding: 12,
                cornerRadius: 8,
                displayColors: false,
                callbacks: {
                    label: (context: any) => `Ventas: ${context.parsed.y.toFixed(2)}€`,
                },
            },
        },
        interaction: {
            intersect: false,
            mode: 'index' as const,
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)',
                    drawTicks: false
                },
                border: { display: false },
                ticks: {
                    callback: (value: any) => `${value}€`,
                    font: { size: 12 },
                    color: '#64748b',
                    padding: 8
                },
            },
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    font: { size: 12 },
                    color: '#64748b',
                },
            },
        },
    };

    const chartData = {
        labels: data.map(d => {
            const date = new Date(d.fecha);
            return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
        }),
        datasets: [
            {
                label: 'Ventas Diarias',
                data: data.map(d => d.total),
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.05)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointRadius: 0,
                pointHoverRadius: 5,
                pointHoverBackgroundColor: '#2563eb',
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 2,
            },
        ],
    };

    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Rendimiento de Ventas</h3>
                    <p className="text-sm text-gray-500 font-medium">
                        {startDate && endDate
                            ? `Del ${new Date(startDate).toLocaleDateString('es-ES')} al ${new Date(endDate).toLocaleDateString('es-ES')}`
                            : 'Últimos 7 días de actividad'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1 shadow-sm">
                        <input
                            type="date"
                            max={today}
                            className="text-xs font-semibold text-gray-700 border-none focus:ring-0 p-0"
                            value={startDate || ''}
                            onChange={(e) => onDateRangeChange?.((e.target as HTMLInputElement).value, endDate || '')}
                        />
                        <span className="text-gray-400 text-xs">-</span>
                        <input
                            type="date"
                            max={today}
                            className="text-xs font-semibold text-gray-700 border-none focus:ring-0 p-0"
                            value={endDate || ''}
                            onChange={(e) => onDateRangeChange?.(startDate || '', (e.target as HTMLInputElement).value)}
                        />
                    </div>
                    <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider hidden md:block">
                        Filtrar datos
                    </div>
                </div>
            </div>
            <div className="h-[350px] w-full">
                <Line options={options} data={chartData} />
            </div>
        </div>
    );
}
