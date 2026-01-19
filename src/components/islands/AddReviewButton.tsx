import { useState } from 'react';

interface AddReviewButtonProps {
  productId: string;
  onReviewAdded?: () => void;
}

export default function AddReviewButton({ productId, onReviewAdded }: AddReviewButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

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
      const response = await fetch('/api/reviews/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          calificacion: rating,
          titulo: titleValue,
          comentario: commentValue,
          verificada_compra: false
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al agregar reseña');
      }

      showNotification('success', 'Reseña agregada correctamente. Será verificada por nuestro equipo.');
      setTitle('');
      setComment('');
      setRating(5);
      setIsOpen(false);
      
      if (onReviewAdded) {
        onReviewAdded();
      }
    } catch (error) {
      showNotification('error', (error as any).message || 'Error al agregar la reseña');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Notificación Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg text-white font-semibold max-w-sm animate-in fade-in z-50 ${
          notification.type === 'success' ? 'bg-[#00aa45]' : 'bg-red-600'
        }`}>
          {notification.message}
        </div>
      )}

      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full bg-[#00aa45] text-white font-semibold py-3 rounded-lg hover:bg-[#009a3a] transition-colors"
        >
          ✍️ Escribe tu reseña
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 border border-gray-200 space-y-4">
          <h3 className="text-xl font-bold text-gray-900">Comparte tu opinión</h3>

          {/* Calificación */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Calificación
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none transition-transform"
                >
                  <svg
                    className={`w-8 h-8 cursor-pointer ${
                      star <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300 fill-gray-300'
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
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Título de la reseña *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e: any) => setTitle(e.target.value)}
              placeholder="Ej: Excelente producto, muy recomendado"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aa45]"
              maxLength={100}
            />
          </div>

          {/* Comentario */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Tu comentario *
            </label>
            <textarea
              value={comment}
              onChange={(e: any) => setComment(e.target.value)}
              placeholder="Comparte tu experiencia con este producto (calidad, durabilidad, servicio, etc.)..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aa45]"
              maxLength={500}
            />
          </div>

          {/* Botones */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-[#00aa45] text-white font-semibold py-2 rounded-lg hover:bg-[#009a3a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar reseña'}
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 bg-gray-200 text-gray-900 font-semibold py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
          </div>

          <p className="text-xs text-gray-600 text-center">
            ⏳ Tu reseña será verificada por nuestro equipo antes de ser publicada
          </p>
        </form>
      )}
    </>
  );
}
