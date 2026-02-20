import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

interface Review {
  id: string;
  producto_id?: string;
  usuario_id?: string;
  calificacion?: number;
  titulo?: string;
  comentario?: string;
  fecha_creacion?: string;
  created_at?: string;
  creada_en?: string;
  verificada?: boolean;
  utiles?: number;
  [key: string]: any; // Permitir propiedades dinámicas
}

const AdminReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('todas');
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    loadReviews();
  }, [filter]);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadReviews = async () => {
    try {
      setLoading(true);

      // Cargar de tabla resenas SIN orden (para evitar errores de columnas)
      console.log('Cargando de resenas...');
      let query = supabase
        .from('resenas')
        .select('*, producto:productos(nombre, slug)', { count: 'exact' });

      if (filter === 'verificadas') {
        query = query.eq('verificada_compra', true);
      } else if (filter === 'no-verificadas') {
        query = query.eq('verificada_compra', false);
      } else if (filter === 'pendientes') {
        query = query.eq('estado', 'Pendiente');
      } else if (filter === 'aprobadas') {
        query = query.eq('estado', 'Aprobada');
      } else if (filter === 'rechazadas') {
        query = query.eq('estado', 'Rechazada');
      }

      const { data, error, count } = await query;

      console.log('Resultado resenas:', { data, error, count });

      if (error) {
        console.error('Error detallado:', error);
        throw error;
      }

      // Ordenar por cliente si es necesario
      let sortedData = data || [];
      if (sortedData.length > 0) {
        sortedData.sort((a: any, b: any) => {
          // Intentar ordenar por fecha_creacion, si no existe ignorar
          const dateA = new Date((a.fecha_creacion || a.created_at || a.creada_en) as string).getTime();
          const dateB = new Date((b.fecha_creacion || b.created_at || b.creada_en) as string).getTime();
          return dateB - dateA; // Descendente
        });
      }

      console.log(`Reseñas cargadas: ${count} registros`, sortedData);
      setReviews(sortedData);
    } catch (error: any) {
      console.error('Error completo loading reviews:', error);
      console.error('Mensaje de error:', error?.message);
      console.error('Detalles de error:', error?.details);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleVerified = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/admin/resenas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle-verified',
          id,
          data: { verificada_compra: !currentStatus }
        })
      });

      const result = await response.json();

      if (!response.ok) {
        showNotification('error', `Error: ${result.error || 'Error desconocido'}`);
        return;
      }

      showNotification('success', !currentStatus ? 'Compra verificada correctamente' : 'Verificación de compra eliminada');
      loadReviews();
    } catch (error) {
      console.error('Error updating review:', error);
      showNotification('error', 'Error al actualizar la reseña');
    }
  };

  const updateStatus = async (id: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch('/api/admin/resenas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, id })
      });

      const result = await response.json();

      if (!response.ok) {
        showNotification('error', `Error: ${result.error || 'Error desconocido'}`);
        return;
      }

      showNotification('success', action === 'approve' ? 'Reseña aprobada' : 'Reseña rechazada');
      loadReviews();
    } catch (error) {
      console.error('Error updating review status:', error);
      showNotification('error', 'Error al actualizar el estado de la reseña');
    }
  };

  const deleteReview = async (id: string) => {
    try {
      const response = await fetch('/api/admin/resenas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id })
      });

      const result = await response.json();

      if (!response.ok) {
        showNotification('error', `Error: ${result.error || 'Error desconocido'}`);
        return;
      }

      showNotification('success', 'Reseña eliminada correctamente');
      setDeleteConfirm(null);
      loadReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
      showNotification('error', 'Error al eliminar la reseña');
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
      {/* Notificación Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg text-white font-semibold max-w-sm animate-in fade-in z-50 ${notification.type === 'success' ? 'bg-[#00aa45]' :
          notification.type === 'error' ? 'bg-red-600' :
            'bg-blue-600'
          }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' && (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
              </svg>
            )}
            {notification.type === 'error' && (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
              </svg>
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminar */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Eliminar reseña</h3>
            <p className="text-gray-600 mb-6">¿Está seguro que desea eliminar esta reseña? Esta acción no se puede deshacer.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg font-semibold bg-gray-300 text-gray-700 hover:bg-gray-400 transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteReview(deleteConfirm)}
                className="px-4 py-2 rounded-lg font-semibold bg-red-600 text-white hover:bg-red-700 transition"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Reseñas de Productos</h3>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2 sm:mx-0 sm:px-0 sm:flex-wrap">
            {['todas', 'pendientes', 'aprobadas', 'rechazadas', 'verificadas', 'no-verificadas'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-xl font-bold text-sm transition-all duration-200 whitespace-nowrap shadow-sm ${filter === status
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-green-200 ring-2 ring-green-400 ring-offset-1'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
                  }`}
              >
                {status === 'todas' ? 'Todas' :
                  status === 'pendientes' ? 'Pendientes' :
                    status === 'aprobadas' ? 'Aprobadas' :
                      status === 'rechazadas' ? 'Rechazadas' :
                        status === 'verificadas' ? 'Verificadas' : 'No Verificadas'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6 p-4 lg:p-0">
          {reviews.map((review) => {
            // Obtener propiedades con fallback a diferentes nombres
            const rating = review.calificacion || 0;
            const isVerified = review.verificada_compra === true;
            const date = review.fecha_creacion || review.created_at || review.creada_en || new Date().toISOString();
            const title = review.titulo || review.title || '';
            const text = review.comentario || review.comment || review.texto || '';

            return (
              <div key={review.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
                <div className="flex flex-col space-y-4">
                  {/* Header: Rating & Status Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 sm:w-5 sm:h-5 ${i < rating ? 'fill-current' : 'text-gray-200'}`}
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                          </svg>
                        ))}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-sm border ${review.estado === 'Aprobada' ? 'bg-green-100 text-green-800 border-green-200' :
                        review.estado === 'Rechazada' ? 'bg-red-100 text-red-800 border-red-200' :
                          'bg-yellow-100 text-yellow-800 border-yellow-200'
                        }`}>
                        {review.estado || 'Pendiente'}
                      </span>
                    </div>

                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold shadow-sm border ${isVerified ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-gray-50 text-gray-500 border-gray-100'
                      }`}>
                      {isVerified && (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {isVerified ? 'Compra Verificada' : 'No Verificada'}
                    </span>
                  </div>

                  {/* Body: Title & Text */}
                  <div>
                    {title && <h4 className="font-black text-gray-900 mb-1 leading-tight sm:text-lg">{title}</h4>}
                    <p className="text-gray-600 text-sm sm:text-base leading-relaxed group-hover:line-clamp-none transition-all duration-300">
                      {text || 'Sin comentario'}
                    </p>
                  </div>

                  {/* Footer: Date & Metadata */}
                  <div className="flex items-center justify-between text-[10px] sm:text-xs font-medium text-gray-400 uppercase tracking-widest border-t border-gray-50 pt-3">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      <span className="flex items-center gap-1 text-gray-900 font-bold bg-gray-100 px-2 py-0.5 rounded">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7l-4 2-4-2v4M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H5a2 2 0 00-2 2v5a2 2 0 002 2z" /></svg>
                        {review.producto?.nombre || 'Producto Desconocido'}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        {new Date(date).toLocaleDateString('es-ES')}
                      </span>

                    </div>
                  </div>

                  {/* Actions: Grid/Flex for mobile accessibility */}
                  <div className="flex flex-wrap gap-2.5 pt-2 border-t border-gray-100 mt-2">
                    <button
                      onClick={() => toggleVerified(review.id, isVerified)}
                      disabled={isVerified}
                      className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-tight transition-all duration-200 border-2 ${isVerified
                        ? 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed opacity-60'
                        : 'bg-white text-emerald-700 border-emerald-100 hover:bg-emerald-50 hover:border-emerald-200 hover:shadow-md active:scale-95'
                        }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {isVerified ? 'Verificada' : 'Verificar'}
                    </button>

                    {review.estado !== 'Aprobada' && (
                      <button
                        onClick={() => updateStatus(review.id, 'approve')}
                        className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-tight bg-blue-600 text-white hover:bg-blue-700 border-2 border-blue-600 shadow-md hover:shadow-lg active:scale-95 transition-all duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                        Aprobar
                      </button>
                    )}

                    {review.estado !== 'Rechazada' && review.estado !== 'Aprobada' && (
                      <button
                        onClick={() => updateStatus(review.id, 'reject')}
                        className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-tight bg-white text-gray-700 border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                        Rechazar
                      </button>
                    )}

                    <button
                      onClick={() => setDeleteConfirm(review.id)}
                      className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-tight bg-red-50 text-red-600 border-2 border-red-100 hover:bg-red-100 hover:border-red-200 active:scale-95 transition-all duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {reviews.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-600 font-semibold">No hay reseñas</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReviews;
