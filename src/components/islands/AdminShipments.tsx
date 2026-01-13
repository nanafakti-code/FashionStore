import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

interface Shipment {
  id: string;
  pedido_id: string;
  numero_seguimiento: string;
  transportista: string;
  estado: string;
  fecha_envio: string;
  fecha_entrega_estimada?: string;
  fecha_entrega_real?: string;
  direccion_destino?: string;
}

const AdminShipments: React.FC = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('todos');

  const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    loadShipments();
  }, [filter]);

  const loadShipments = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('envios')
        .select('*')
        .order('fecha_envio', { ascending: false });

      if (filter !== 'todos') {
        query = query.eq('estado', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setShipments(data || []);
    } catch (error) {
      console.error('Error loading shipments:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await supabase
        .from('envios')
        .update({
          estado: newStatus,
          fecha_entrega_real: newStatus === 'entregado' ? new Date().toISOString() : null
        })
        .eq('id', id);
      loadShipments();
    } catch (error) {
      console.error('Error updating shipment:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin text-4xl">⏳</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 18.5a1.5 1.5 0 01-1.5-1.5 1.5 1.5 0 011.5-1.5 1.5 1.5 0 011.5 1.5 1.5 1.5 0 01-1.5 1.5m1.5-9l1.96 2.5H17V9.5m-11 9a1.5 1.5 0 01-1.5-1.5 1.5 1.5 0 011.5-1.5 1.5 1.5 0 011.5 1.5 1.5 1.5 0 01-1.5 1.5M1 3h16v12H1zm2.5 5h9v2h-9z"/>
            </svg>
            <h3 className="text-2xl font-bold text-gray-900">Seguimiento de Envíos</h3>
          </div>

          <div className="flex gap-2 flex-wrap">
            {['todos', 'pendiente', 'en_transito', 'entregado', 'retrasado'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filter === status
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {status === 'todos' ? 'Todos' : status}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Número Seguimiento</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Transportista</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Estado</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Fecha Envío</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Entrega Estimada</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {shipments.map((shipment) => (
                <tr key={shipment.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-mono text-xs text-gray-600">{shipment.numero_seguimiento}</td>
                  <td className="px-6 py-4 font-semibold text-gray-900">{shipment.transportista}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      shipment.estado === 'entregado' ? 'bg-green-100 text-green-800'
                      : shipment.estado === 'en_transito' ? 'bg-blue-100 text-blue-800'
                      : shipment.estado === 'retrasado' ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {shipment.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-xs">{new Date(shipment.fecha_envio).toLocaleDateString('es-ES')}</td>
                  <td className="px-6 py-4 text-gray-600 text-xs">
                    {shipment.fecha_entrega_estimada
                      ? new Date(shipment.fecha_entrega_estimada).toLocaleDateString('es-ES')
                      : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      defaultValue={shipment.estado}
                      onChange={(e) => updateStatus(shipment.id, e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-500"
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="en_transito">En Tránsito</option>
                      <option value="entregado">Entregado</option>
                      <option value="retrasado">Retrasado</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminShipments;
