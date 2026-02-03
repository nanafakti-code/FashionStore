import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

interface Return {
  id: string;
  orden_id: string;
  numero_devolucion: string;
  motivo: string;
  notas_admin?: string;
  estado: string;
  fecha_solicitud: string;
  fecha_aprobacion?: string;
  fecha_recepcion?: string;
  fecha_reembolso?: string;
  importe_reembolso?: number;
  metodo_reembolso?: string;
  creado_en: string;
  actualizado_en: string;
  orden?: {
    numero_orden: string;
    total: number;
    nombre_cliente: string;
    email_cliente: string;
  };
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

      // If we have returns, try to load orden info for each
      if (data && data.length > 0) {
        const ordenIds = [...new Set(data.map(r => r.orden_id).filter(Boolean))];

        // Fetch ordenes (orders)
        let ordenMap = new Map();
        if (ordenIds.length > 0) {
          const { data: ordenes } = await supabase
            .from('ordenes')
            .select('id, numero_orden, total, nombre_cliente, email_cliente')
            .in('id', ordenIds);
          ordenMap = new Map((ordenes || []).map(o => [o.id, o]));
        }

        // Attach orden info to returns
        const returnsWithData = data.map(ret => ({
          ...ret,
          orden: ordenMap.get(ret.orden_id) || null
        }));

        setReturns(returnsWithData);
        return;
      }

      setReturns(data || []);
    } catch (error) {
      console.error('Error loading returns:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const updateData: any = { estado: newStatus };
      if (newStatus === 'aprobada') {
        updateData.fecha_aprobacion = new Date().toISOString();
      } else if (newStatus === 'recibida') {
        updateData.fecha_recepcion = new Date().toISOString();
      } else if (newStatus === 'reembolsada') {
        updateData.fecha_reembolso = new Date().toISOString();
      }
      await supabase
        .from('devoluciones')
        .update(updateData)
        .eq('id', id);
      loadReturns();
    } catch (error) {
      console.error('Error updating return:', error);
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'aprobada':
      case 'reembolsada':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rechazada':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'recibida':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default: // pendiente
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
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
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
            </svg>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Gestión de Devoluciones</h3>
            <span className="ml-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
              {returns.length}
            </span>
          </div>

          {/* Filter buttons - horizontally scrollable on mobile */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2 sm:mx-0 sm:px-0 sm:flex-wrap">
            {['todos', 'pendiente', 'aprobada', 'recibida', 'reembolsada', 'rechazada'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-xl font-bold text-sm transition-all duration-200 whitespace-nowrap shadow-sm ${filter === status
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-green-200 ring-2 ring-green-400 ring-offset-1'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
                  }`}
              >
                {status === 'todos' ? 'Todos' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {returns.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
            </svg>
            <p className="text-gray-600 font-semibold">No hay devoluciones</p>
            <p className="text-sm text-gray-500">Las solicitudes de devolución aparecerán aquí</p>
          </div>
        ) : (
          <div>
            {/* Desktop Header - only visible on lg screens */}
            <div className="hidden lg:flex lg:items-center lg:gap-4 px-5 py-3 bg-gray-50 border-b border-gray-200 text-[11px] uppercase tracking-wider font-semibold text-gray-500">
              <div className="w-[120px] flex-shrink-0">ID / Orden</div>
              <div className="flex-1 min-w-0">Motivo</div>
              <div className="w-[160px] flex-shrink-0">Cliente</div>
              <div className="w-[110px] flex-shrink-0">Estado</div>
              <div className="w-[90px] flex-shrink-0">Reembolso</div>
              <div className="w-[100px] flex-shrink-0">Fecha</div>
              <div className="w-[130px] flex-shrink-0 text-right">Acción</div>
            </div>

            <div className="space-y-4 lg:space-y-0 lg:divide-y lg:divide-gray-100 p-4 lg:p-0">
              {returns.map((ret) => {
                const refundAmount = ret.importe_reembolso || ret.orden?.total || 0;

                return (
                  <div key={ret.id} className="bg-white lg:bg-transparent border lg:border-none rounded-xl lg:rounded-none p-4 sm:p-5 hover:bg-gray-50/50 transition-colors duration-200 shadow-sm lg:shadow-none">
                    {/* Desktop: Horizontal row layout */}
                    <div className="hidden lg:flex lg:items-center lg:gap-4">
                      <div className="w-[120px] flex-shrink-0">
                        <span className="font-mono text-xs font-bold text-gray-900">{ret.id.substring(0, 8)}...</span>
                        {ret.orden && (
                          <p className="text-[10px] text-gray-500 mt-0.5">{ret.orden.numero_orden}</p>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <p className="text-sm text-gray-700 truncate" title={ret.motivo}>{ret.motivo}</p>
                      </div>
                      <div className="w-[160px] flex-shrink-0 overflow-hidden">
                        <p className="text-sm text-gray-900 font-medium truncate">{ret.orden?.nombre_cliente || 'N/A'}</p>
                        {ret.orden?.email_cliente && (
                          <p className="text-[10px] text-gray-500 truncate">{ret.orden.email_cliente}</p>
                        )}
                      </div>
                      <div className="w-[110px] flex-shrink-0">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(ret.estado.toLowerCase())}`}>
                          {ret.estado}
                        </span>
                      </div>
                      <div className="w-[90px] flex-shrink-0">
                        <span className="font-bold text-green-600">{(refundAmount / 100).toFixed(2)}€</span>
                      </div>
                      <div className="w-[100px] flex-shrink-0 text-xs text-gray-500">
                        {new Date(ret.fecha_solicitud).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                      <div className="w-[130px] flex-shrink-0 flex justify-end">
                        <select
                          value={ret.estado.toLowerCase()}
                          onChange={(e: any) => updateStatus(ret.id, e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg text-xs font-medium bg-white text-gray-700 border border-gray-200 hover:border-gray-300 focus:outline-none focus:ring-1 focus:ring-green-500 cursor-pointer"
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="aprobada">Aprobada</option>
                          <option value="recibida">Recibida</option>
                          <option value="reembolsada">Reembolsada</option>
                          <option value="rechazada">Rechazada</option>
                        </select>
                      </div>
                    </div>

                    {/* Mobile/Tablet: Card layout */}
                    <div className="lg:hidden flex flex-col space-y-3">
                      {/* Header: ID & Status */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex flex-col">
                          <span className="font-mono text-xs font-black text-gray-900">{ret.id.substring(0, 8)}...</span>
                          {ret.orden && (
                            <span className="text-[10px] text-gray-500 mt-0.5">{ret.orden.numero_orden}</span>
                          )}
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(ret.estado)}`}>
                          {ret.estado}
                        </span>
                      </div>

                      {/* Client & Refund Amount - moved above reason */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium mb-0.5">Cliente</p>
                          <p className="font-bold text-gray-900 text-sm leading-tight">
                            {ret.orden?.nombre_cliente || 'N/A'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium mb-0.5">Reembolso</p>
                          <p className="font-black text-lg text-green-600">{(refundAmount / 100).toFixed(2)}€</p>
                        </div>
                      </div>

                      {/* Reason - prominently displayed */}
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium mb-1">Motivo de devolución</p>
                        <p className="text-sm text-gray-800 font-medium leading-tight">{ret.motivo || 'Sin especificar'}</p>
                        {ret.notas_admin && (
                          <p className="text-xs text-gray-500 mt-1">Notas: {ret.notas_admin}</p>
                        )}
                      </div>

                      {/* Date */}
                      <div className="flex items-center text-[10px] font-medium text-gray-400 uppercase tracking-widest border-t border-gray-100 pt-2">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        {new Date(ret.fecha_solicitud).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>

                      {/* Action */}
                      <div className="pt-1">
                        <select
                          value={ret.estado.toLowerCase()}
                          onChange={(e: any) => updateStatus(ret.id, e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-xs font-bold bg-white text-gray-700 border border-gray-200 hover:border-gray-300 focus:outline-none focus:ring-1 focus:ring-green-500 cursor-pointer text-center"
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="aprobada">Aprobada</option>
                          <option value="recibida">Recibida</option>
                          <option value="reembolsada">Reembolsada</option>
                          <option value="rechazada">Rechazada</option>
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReturns;
