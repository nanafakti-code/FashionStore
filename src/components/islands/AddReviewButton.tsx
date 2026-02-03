import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface AddReviewButtonProps {
  productId: string;
  orderId?: string;
  onReviewAdded?: () => void;
  existingReview?: {
    id: string;
    calificacion: number;
    titulo: string;
    comentario: string;
    estado: string;
    verificada_compra?: boolean;
  } | null;
}

export default function AddReviewButton({ productId, orderId, onReviewAdded, existingReview }: AddReviewButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(existingReview?.calificacion || 5);
  const [title, setTitle] = useState(existingReview?.titulo || '');
  const [comment, setComment] = useState(existingReview?.comentario || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isVerified = existingReview?.estado === 'Verificada' || existingReview?.estado === 'Aprobada' || existingReview?.verificada_compra === true;

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (isVerified) {
    return (
      <div className="w-full bg-green-50 border-2 border-green-200 text-green-700 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        Reseña Verificada
      </div>
    );
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const target = e.currentTarget;
    const titleInput = target.querySelector('input[type="text"]') as HTMLInputElement;
    const commentInput = target.querySelector('textarea') as HTMLTextAreaElement;

    const titleValue = titleInput?.value || '';
    const commentValue = commentInput?.value || '';

    if (!titleValue.trim() || !commentValue.trim()) {
      showNotification('error', 'Por favor completa el título y comentario');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        showNotification('error', 'Debes iniciar sesión para reseñar');
        setIsSubmitting(false);
        return;
      }

      const response = await fetch('/api/reviews/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          productId,
          orderId,
          calificacion: rating,
          titulo: titleValue,
          comentario: commentValue,
          id: existingReview?.id // Pass ID for upsert logic
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al guardar reseña');
      }

      showNotification('success', existingReview ? 'Reseña actualizada. Pendiente de verificación.' : 'Reseña agregada. Pendiente de verificación.');
      setIsOpen(false);

      if (!existingReview) {
        setTitle('');
        setComment('');
        setRating(5);
      }

      if (onReviewAdded) {
        onReviewAdded();
      }
    } catch (error) {
      showNotification('error', (error as any).message || 'Error al guardar la reseña');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (

    <>
      {/* Notificación Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg text-white font-semibold max-w-sm animate-in fade-in z-[60] ${notification.type === 'success' ? 'bg-[#00aa45]' : 'bg-red-600'
          }`}>
          {notification.message}
        </div>
      )}

      {/* Botón Activador */}
      <button
        onClick={() => setIsOpen(true)}
        className={`w-full font-bold py-2.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 group shadow-sm hover:shadow-md ${existingReview
          ? 'bg-amber-50 border-2 border-amber-200 text-amber-700 hover:bg-amber-100'
          : 'bg-white border-2 border-[#00aa45] text-[#00aa45] hover:bg-[#00aa45] hover:text-white'
          }`}
      >
        {existingReview ? (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
            Editar Reseña
          </>
        ) : (
          <>
            <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            Escribir reseña
          </>
        )}
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop con blur */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          ></div>

          {/* Formulario Modal */}
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-lg shadow-2xl relative animate-in zoom-in-95 duration-200 z-10 max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
          >
            {/* Header del Modal */}
            <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4 sticky top-0 bg-white z-20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-[#00aa45]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-gray-900 leading-tight">Comparte tu opinión</h3>
                  <p className="text-xs md:text-sm text-gray-500">Valora tu experiencia</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            {/* Calificación */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                ¿Qué tal el producto?
              </label>
              <div className="flex gap-2 justify-center py-4 bg-gray-50 rounded-xl">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                  >
                    <svg
                      className={`w-8 h-8 md:w-10 md:h-10 cursor-pointer transition-colors duration-200 ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300 fill-gray-300'
                        }`}
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            {/* Título */}
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Título breve
              </label>
              <input
                type="text"
                value={title}
                onChange={(e: any) => setTitle(e.target.value)}
                placeholder="Ej: Me encantó la calidad..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00aa45] focus:border-transparent transition-all"
                maxLength={100}
              />
            </div>

            {/* Comentario */}
            <div className="mb-6 md:mb-8">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Tu experiencia detallada
              </label>
              <textarea
                value={comment}
                onChange={(e: any) => setComment(e.target.value)}
                placeholder="Cuéntanos qué te gustó y qué se podría mejorar..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00aa45] focus:border-transparent transition-all resize-none"
                maxLength={500}
              />
            </div>

            {/* Botones */}
            <div className="flex gap-4 mb-4">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 bg-gray-100 text-gray-700 font-bold py-3.5 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-[2] bg-[#00aa45] text-white font-bold py-3.5 rounded-xl hover:bg-[#009340] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-green-500/30"
              >
                {isSubmitting ? 'Publicando...' : 'Publicar Reseña'}
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
              </svg>
              Reseña verificada · Solo compradores reales
            </p>
          </form>
        </div>
      )}
    </>
  );

}
