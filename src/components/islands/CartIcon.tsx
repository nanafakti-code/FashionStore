/**
 * FASHIONSTORE - CART ICON (INTERACTIVE ISLAND)
 * ==============================================
 * Icono del carrito con contador de items
 * Se actualiza reactivamente desde Supabase o localStorage
 */

import { useState, useEffect } from 'react';
import { getCartForCurrentUser } from '@/lib/cartService';

interface CartIconProps {
    className?: string;
}

export default function CartIcon({ className = '' }: CartIconProps) {
    const [itemCount, setItemCount] = useState(0);

    useEffect(() => {
        loadCartCount();

        // Actualizar cuando cambia el carrito (ambos eventos)
        const handleCartUpdate = () => {
            loadCartCount();
        };

        window.addEventListener('cartUpdated', handleCartUpdate);
        window.addEventListener('authCartUpdated', handleCartUpdate);
        window.addEventListener('guestCartUpdated', handleCartUpdate);
        
        return () => {
            window.removeEventListener('cartUpdated', handleCartUpdate);
            window.removeEventListener('authCartUpdated', handleCartUpdate);
            window.removeEventListener('guestCartUpdated', handleCartUpdate);
        };
    }, []);

    const loadCartCount = async () => {
        try {
            const cart = await getCartForCurrentUser();
            setItemCount(cart.reduce((sum, item) => sum + item.quantity, 0));
        } catch (error) {
            console.error('Error loading cart count:', error);
            setItemCount(0);
        }
    };

    return (
        <a
            href="/carrito"
            className={`
        relative inline-flex items-center justify-center
        p-2 rounded-lg
        text-gray-900 hover:text-[#00aa45]
        transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-[#00aa45] focus:ring-offset-2
        ${className}
      `}
            aria-label={`Carrito de compra (${itemCount} items)`}
        >
            {/* Icono del carrito */}
            <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
            </svg>

            {/* Badge con contador */}
            {itemCount > 0 && (
                <span
                    className="
            absolute -top-1 -right-1
            flex items-center justify-center
            min-w-[20px] h-5 px-1
            text-xs font-bold text-white
            bg-[#00aa45] rounded-full
          "
                >
                    {itemCount > 99 ? '99+' : itemCount}
                </span>
            )}
        </a>
    );
}
