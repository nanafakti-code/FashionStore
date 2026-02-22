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
import { Bar } from 'react-chartjs-2';

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
}

export default function SalesChart({ data }: SalesChartProps) {
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
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)',
                },
                ticks: {
                    callback: (value: any) => `${value}€`,
                    font: { size: 12 },
                    color: '#64748b',
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
                backgroundColor: 'rgba(37, 99, 235, 0.8)',
                hoverBackgroundColor: 'rgba(37, 99, 235, 1)',
                borderRadius: 6,
                barThickness: 32,
            },
        ],
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Rendimiento de Ventas</h3>
                    <p className="text-sm text-gray-500 font-medium">Últimos 7 días de actividad</p>
                </div>
                <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    Actualizado
                </div>
            </div>
            <div className="h-[350px] w-full">
                <Bar options={options} data={chartData} />
            </div>
        </div>
    );
}
