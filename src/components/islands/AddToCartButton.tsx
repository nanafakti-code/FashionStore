import { useState, useEffect } from 'react';
import { addToCart } from '@/lib/cartService';
import { getCurrentUser } from '@/lib/auth';
import { reservationClient } from '@/lib/cart-reservation-client';
import { motion, AnimatePresence } from 'framer-motion';

interface AddToCartButtonProps {
  productId: string;
  productName: string;
  price: number;
  image: string;
  stock?: number;
}

export default function AddToCartButton({
  productId,
  productName,
  price,
  image,
  stock = 1,
}: AddToCartButtonProps) {
  const [isAdded, setIsAdded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Verificar autenticación
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        setIsAuthenticated(!!user);
      } catch (error) {
        console.warn('Error al verificar autenticación:', error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, [productId]);

  const handleAddToCart = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Verificar autenticación (opcional, ya lo hacemos en useEffect pero por seguridad)
      const user = await getCurrentUser();

      // Agregar al carrito
      const success = await addToCart(productId, productName, price, image, 1);

      if (!success) {
        setError('Error al añadir producto');
        setLoading(false);
        return;
      }

      // Intentar crear reserva
      if (user) {
        try {
          const reserved = await reservationClient.createReservation(productId, 1);
          if (!reserved) {
            setError('Stock insuficiente');
            setLoading(false);
            return;
          }
        } catch (err) {
          console.warn('Error al crear reserva:', err);
        }
      }

      setIsAdded(true);

      // Sincronizar carrito
      try {
        const cartKey = 'fashionstore_guest_cart';
        const localCart = localStorage.getItem(cartKey);
        if (localCart && typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem(cartKey, localCart);
        }
      } catch (error) { }

      // Disparar eventos
      window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { productId } }));
      window.dispatchEvent(new CustomEvent('authCartUpdated', { detail: { productId } }));
      window.dispatchEvent(new CustomEvent('guestCartUpdated', { detail: { productId } }));

      // Resetear estado después de 2s
      setTimeout(() => setIsAdded(false), 2000);
    } catch (err) {
      console.error('Error al añadir al carrito:', err);
      setError('Error al procesar producto');
    } finally {
      setLoading(false);
    }
  };

  // Si aún estamos verificando autenticación, mostrar estado de carga
  if (isAuthenticated === null) {
    return (
      <div className="mt-4 w-full h-12 bg-gray-200 rounded-xl animate-pulse"></div>
    );
  }

  const isDisabled = loading || stock <= 0;

  return (
    <div className="mt-4 w-full">
      <motion.button
        onClick={handleAddToCart}
        disabled={isDisabled}
        whileTap={{ scale: 0.95 }}
        initial={false}
        animate={{
          backgroundColor: stock <= 0 ? '#e5e7eb' : isAdded ? '#22c55e' : '#111827',
          color: stock <= 0 ? '#9ca3af' : '#ffffff',
        }}
        transition={{ duration: 0.3 }}
        className={`w-full py-3.5 px-6 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-sm
          ${stock <= 0 ? 'cursor-not-allowed' : 'hover:shadow-lg hover:-translate-y-0.5 transition-shadow'}
        `}
        aria-label={`Añadir ${productName} al carrito`}
      >
        <AnimatePresence mode="wait">
          {(loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-2"
            >
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Añadiendo...</span>
            </motion.div>
          ) : isAdded ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2"
            >
              <motion.svg
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
              >
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.3 }}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </motion.svg>
              <span>¡Añadido!</span>
            </motion.div>
          ) : stock <= 0 ? (
            <motion.span
              key="out-of-stock"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              Agotado
            </motion.span>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span>Añadir al carrito</span>
            </motion.div>
          )) as any}
        </AnimatePresence>
      </motion.button>

      {error && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-2 text-red-600 text-sm text-center"
        >
          {error}
        </motion.p>
      )}

      {stock === 1 && stock > 0 && (
        <p className="mt-2 text-amber-600 text-xs text-center font-semibold flex items-center justify-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Solo queda 1 unidad
        </p>
      )}
    </div>
  );
}
