import React, { useState, useEffect, useRef } from 'react';
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

const AdminReviews: React.FC = () => {
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
        .select('*', { count: 'exact' });

      if (filter === 'verificadas') {
        query = query.eq('verificada_compra', true);
      } else if (filter === 'no-verificadas') {
        query = query.eq('verificada_compra', false);
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
        <div className={`fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg text-white font-semibold max-w-sm animate-in fade-in z-50 ${
          notification.type === 'success' ? 'bg-[#00aa45]' :
          notification.type === 'error' ? 'bg-red-600' :
          'bg-blue-600'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' && (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
              </svg>
            )}
            {notification.type === 'error' && (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
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
            <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
            </svg>
            <h3 className="text-2xl font-bold text-gray-900">Reseñas de Productos</h3>
          </div>

          <div className="flex gap-2 flex-wrap">
            {['todas', 'verificadas', 'no-verificadas'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filter === status
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {status === 'todas' ? 'Todas' : status === 'verificadas' ? 'Verificadas' : 'No Verificadas'}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {reviews.map((review) => {
            // Obtener propiedades con fallback a diferentes nombres
            const rating = review.calificacion || 0;
            const isVerified = review.verificada_compra === true;
            const helpful = review.util || review.utiles || 0;
            const date = review.fecha_creacion || review.created_at || review.creada_en || new Date().toISOString();
            const title = review.titulo || review.title || '';
            const text = review.comentario || review.comment || review.texto || '';

            return (
              <div key={review.id} className="px-6 py-4 hover:bg-gray-50 transition">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${i < rating ? 'fill-current' : 'text-gray-300'}`}
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                          </svg>
                        ))}
                      </div>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                        isVerified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {isVerified ? '✓ Compra verificada' : 'Compra no verificada'}
                      </span>
                    </div>
                    {title && <h4 className="font-bold text-gray-900 mb-1">{title}</h4>}
                    <p className="text-gray-700 mb-2">{text || 'Sin comentario'}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(date).toLocaleDateString('es-ES')} • {helpful} útiles
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => toggleVerified(review.id, isVerified)}
                    disabled={isVerified}
                    className={`px-3 py-1 rounded text-xs font-semibold transition ${
                      isVerified
                        ? 'bg-green-100 text-green-700 cursor-not-allowed opacity-50'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                    title={isVerified ? 'Esta reseña ya está verificada' : 'Verificar esta compra'}
                  >
                    {isVerified ? '✓ Compra verificada' : 'Verificar compra'}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(review.id)}
                    className="px-3 py-1 rounded text-xs font-semibold bg-red-100 text-red-700 hover:bg-red-200"
                  >
                    Eliminar
                  </button>
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
