/**
 * FASHIONSTORE - NEWSLETTER POPUP
 * ================================
 * Modal promocional para suscripción a newsletter
 * - Genera código de descuento único
 * - No se repite si ya fue cerrado/completado
 */

import { useState, useEffect } from 'preact/hooks';
import type { JSX } from 'preact';

interface NewsletterPopupProps {
  delay?: number; // Delay en ms antes de mostrar el popup
}

export default function NewsletterPopup({ delay = 5000 }: NewsletterPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [discountCode, setDiscountCode] = useState('');

  useEffect(() => {
    // Verificar si el popup ya fue cerrado o completado
    const popupDismissed = localStorage.getItem('fashionstore_newsletter_dismissed');
    const popupCompleted = localStorage.getItem('fashionstore_newsletter_completed');

    if (popupDismissed || popupCompleted) {
      return;
    }

    // Mostrar popup después del delay
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  // Bloquear scroll cuando el popup está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    // Guardar que el usuario cerró el popup (expira en 7 días)
    localStorage.setItem('fashionstore_newsletter_dismissed', Date.now().toString());
  };

  const handleSubmit = async (e: JSX.TargetedEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage('Por favor, introduce un email válido');
      return;
    }

    setIsLoading(true);
    setStatus('idle');

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setMessage(data.message);
        setDiscountCode(data.codigo);
        // Marcar como completado
        localStorage.setItem('fashionstore_newsletter_completed', 'true');
      } else {
        setStatus('error');
        setMessage(data.message || 'Error al suscribirse');
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      setStatus('error');
      setMessage('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(discountCode);
    setMessage('¡Código copiado al portapapeles!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-slideUp">
        {/* Botón cerrar */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors z-10"
          aria-label="Cerrar"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-[#00aa45] to-green-600 px-6 py-8 text-white text-center">
          <h2 className="text-2xl font-black mb-2">¡10% de DESCUENTO!</h2>
          <p className="text-white/90">Solo para nuevos suscriptores</p>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {status === 'success' ? (
            // Estado de éxito
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">¡Gracias por suscribirte!</h3>
              <p className="text-gray-600 mb-4">Tu código de descuento:</p>

              {/* Código de descuento */}
              <div className="bg-gray-100 rounded-lg p-4 mb-4">
                <p className="text-2xl font-mono font-bold text-[#00aa45] tracking-wider">{discountCode}</p>
              </div>

              <button
                onClick={copyCode}
                className="w-full bg-[#00aa45] text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors mb-3"
              >
                Copiar código
              </button>

              <button
                onClick={handleClose}
                className="w-full text-gray-600 py-2 font-medium hover:text-gray-900 transition-colors"
              >
                Continuar comprando
              </button>

              <p className="text-xs text-gray-500 mt-4">
                También te hemos enviado el código por email. Válido por 30 días.
              </p>
            </div>
          ) : (
            // Formulario de suscripción
            <form onSubmit={handleSubmit}>
              <p className="text-gray-600 text-center mb-6">
                Suscríbete a nuestra newsletter y recibe un <strong>10% de descuento</strong> en tu primera compra, además de ofertas exclusivas.
              </p>

              <div className="mb-4">
                <input
                  type="email"
                  value={email}
                  onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
                  placeholder="tu@email.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00aa45] focus:border-transparent text-center text-lg"
                  disabled={isLoading}
                  required
                />
              </div>

              {status === 'error' && (
                <p className="text-red-600 text-sm text-center mb-4">{message}</p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#00aa45] text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-3"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Procesando...
                  </span>
                ) : (
                  '¡Quiero mi 10% de descuento!'
                )}
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="w-full text-gray-500 py-2 text-sm hover:text-gray-700 transition-colors"
              >
                No, gracias. Continuar sin descuento.
              </button>

              <p className="text-xs text-gray-400 text-center mt-4">
                Al suscribirte aceptas recibir emails promocionales. Puedes darte de baja en cualquier momento.
              </p>
            </form>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
      `}</style>
    </div>
  );
}
