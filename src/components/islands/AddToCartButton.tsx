import React, { useState } from 'react';
import { addToCart } from '@/lib/cartService';

interface AddToCartButtonProps {
  productId: string;
  productName: string;
  price: number;
  image: string;
}

export default function AddToCartButton({
  productId,
  productName,
  price,
  image,
}: AddToCartButtonProps) {
  const [isAdded, setIsAdded] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Adding to cart:', { productId, productName, price });
      
      const success = await addToCart(productId, productName, price, image, 1);
      console.log('Add to cart result:', success);

      // Siempre disparar el evento, independientemente del resultado
      window.dispatchEvent(
        new CustomEvent('cartUpdated', {
          detail: { productId },
        })
      );

      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);
    } catch (error) {
      console.error('Error al añadir al carrito:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleAddToCart}
      disabled={loading}
      className={`mt-4 w-full py-2 sm:py-3 font-bold rounded-lg transition-all duration-300 text-sm sm:text-base ${
        isAdded
          ? 'bg-green-600 text-white'
          : 'bg-slate-900 text-white hover:bg-slate-800'
      }`}
      aria-label={`Añadir ${productName} al carrito`}
    >
      {loading ? (
        <span>Añadiendo...</span>
      ) : isAdded ? (
        <span>✓ Añadido al carrito</span>
      ) : (
        <span>Añadir al carrito</span>
      )}
    </button>
  );
}
