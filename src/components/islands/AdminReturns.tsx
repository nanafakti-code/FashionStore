import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

interface Return {
  id: string;
  pedido_id: string;
  producto_id: string;
  razon: string;
  estado: string;
  fecha_solicitud: string;
  fecha_aprobacion?: string;
  monto_reembolso?: number;
  notas?: string;
}

const AdminReturns = () => {
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('todos');

  const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    loadReturns();
  }, [filter]);

  const loadReturns = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('devoluciones')
        .select('*')
        .order('fecha_solicitud', { ascending: false });

      if (filter !== 'todos') {
        query = query.eq('estado', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setReturns(data || []);
    } catch (error) {
      console.error('Error loading returns:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await supabase
        .from('devoluciones')
        .update({
          estado: newStatus,
          fecha_aprobacion: newStatus === 'aprobada' ? new Date().toISOString() : null
        })
        .eq('id', id);
      loadReturns();
    } catch (error) {
      console.error('Error updating return:', error);
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
            <svg className="w-6 h-6 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 10l5 5 5-5z"/>
            </svg>
            <h3 className="text-2xl font-bold text-gray-900">Gestión de Devoluciones</h3>
          </div>

          <div className="flex gap-2 flex-wrap">
            {['todos', 'pendiente', 'aprobada', 'rechazada', 'reembolsada'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filter === status
                    ? 'bg-pink-600 text-white'
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
                <th className="px-6 py-3 text-left font-semibold text-gray-700">ID Devolución</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Razón</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Estado</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Reembolso</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Fecha Solicitud</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {returns.map((ret) => (
                <tr key={ret.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-mono text-xs text-gray-600">{ret.id.substring(0, 8)}...</td>
                  <td className="px-6 py-4 text-gray-600">{ret.razon}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      ret.estado === 'aprobada' ? 'bg-green-100 text-green-800'
                      : ret.estado === 'rechazada' ? 'bg-red-100 text-red-800'
                      : ret.estado === 'reembolsada' ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {ret.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900">
                    {(ret.monto_reembolso || 0) / 100}€
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-xs">{new Date(ret.fecha_solicitud).toLocaleDateString('es-ES')}</td>
                  <td className="px-6 py-4">
                    <select
                      defaultValue={ret.estado}
                      onChange={(e: any) => updateStatus(ret.id, e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-500"
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="aprobada">Aprobada</option>
                      <option value="rechazada">Rechazada</option>
                      <option value="reembolsada">Reembolsada</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {returns.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-600 font-semibold">No hay devoluciones</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReturns;
