import { useState, useEffect } from 'react';
import { addToCart } from '@/lib/cartService';
import { getCurrentUser } from '@/lib/auth';
import { reservationClient } from '@/lib/cart-reservation-client';

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
      // Verificar autenticación
      const user = await getCurrentUser();

      // Agregar al carrito (funciona para usuarios y invitados)
      const success = await addToCart(productId, productName, price, image, 1);
      
      if (!success) {
        setError('Error al añadir producto');
        setLoading(false);
        return;
      }

      // Intentar crear reserva en BD (solo usuarios autenticados)
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
          // Si falla la reserva pero se agregó al carrito, mostrar warning
          setError('Agregado al carrito pero sin reserva de stock');
        }
      }

      setIsAdded(true);

      // Sincronizar carrito entre localStorage y sessionStorage
      try {
        const cartKey = 'fashionstore_guest_cart';
        const localCart = localStorage.getItem(cartKey);
        if (localCart) {
          sessionStorage.setItem(cartKey, localCart);
          console.log('[AddToCart] Carrito sincronizado a sessionStorage');
        }
      } catch (error) {
        console.warn('[AddToCart] Error sincronizando carrito:', error);
      }

      // Disparar eventos para actualizar UI
      window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { productId } }));
      window.dispatchEvent(new CustomEvent('authCartUpdated', { detail: { productId } }));
      window.dispatchEvent(new CustomEvent('guestCartUpdated', { detail: { productId } }));

      // Limpiar estado de "añadido"
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
      <div className="mt-4 w-full">
        <button
          disabled
          className="w-full py-2 sm:py-3 font-bold rounded-lg transition-all duration-300 text-sm sm:text-base bg-gray-400 text-white cursor-not-allowed opacity-50"
        >
          <span>Cargando...</span>
        </button>
      </div>
    );
  }

  const isDisabled = loading || stock <= 0;
  const buttonText = loading
    ? 'Añadiendo...'
    : stock <= 0
    ? 'No disponible'
    : stock === 1
    ? 'Último en stock'
    : isAdded
    ? '✓ Añadido al carrito'
    : 'Añadir al carrito';

  return (
    <div className="mt-4 w-full">
      <button
        onClick={handleAddToCart}
        disabled={isDisabled}
        className={`w-full py-2 sm:py-3 font-bold rounded-lg transition-all duration-300 text-sm sm:text-base ${
          stock <= 0
            ? 'bg-gray-400 text-white cursor-not-allowed opacity-60'
            : stock === 1
            ? 'bg-amber-500 text-white hover:bg-amber-600'
            : isAdded
            ? 'bg-green-600 text-white'
            : 'bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50'
        }`}
        aria-label={`Añadir ${productName} al carrito`}
        title={stock <= 0 ? 'Producto agotado' : stock === 1 ? 'Último en stock' : ''}
      >
        <span>{buttonText}</span>
      </button>
      {error && (
        <p className="mt-2 text-red-600 text-sm text-center">{error}</p>
      )}
      {stock <= 0 && (
        <p className="mt-2 text-gray-600 text-xs text-center font-semibold">
          Este producto está agotado
        </p>
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
