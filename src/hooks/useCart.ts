import { useState, useCallback, useEffect } from 'react';
import {
  getCartSummary,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartItemCount,
  migrateGuestCartToUser,
  addToCart as addToCartService,
  type CartItem,
  type CartSummary,
} from '@/lib/cartService';
import { getCurrentUser } from '@/lib/auth';

/**
 * Hook personalizado para manejar el carrito
 * Proporciona funcionalidad completa del carrito (autenticado e invitado)
 */
export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [summary, setSummary] = useState<CartSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Cargar carrito inicial y detectar cambios
  useEffect(() => {
    loadCart();

    // Escuchar cambios en autenticación
    const checkAuth = async () => {
      const user = await getCurrentUser();
      setIsAuthenticated(!!user);
      
      // Si se autenticó, migrar carrito invitado
      if (user) {
        await migrateGuestCartToUser();
        await loadCart();
      }
    };

    checkAuth();

    // Escuchar cambios en el carrito (tanto autenticado como invitado)
    const handleAuthCartUpdate = () => {
      loadCart();
    };

    const handleGuestCartUpdate = () => {
      loadCart();
    };

    window.addEventListener('authCartUpdated', handleAuthCartUpdate);
    window.addEventListener('guestCartUpdated', handleGuestCartUpdate);
    
    return () => {
      window.removeEventListener('authCartUpdated', handleAuthCartUpdate);
      window.removeEventListener('guestCartUpdated', handleGuestCartUpdate);
    };
  }, []);

  /**
   * Carga el carrito actual
   */
  const loadCart = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const summary = await getCartSummary();
      setItems(summary.items);
      setSummary(summary);
    } catch (err: any) {
      setError(err.message || 'Error al cargar el carrito');
      setItems([]);
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Añade un producto al carrito
   */
  const addItem = useCallback(
    async (
      productId: string,
      productName: string,
      price: number,
      image: string,
      quantity: number = 1,
      talla?: string,
      color?: string
    ) => {
      setIsProcessing(true);
      setError(null);
      try {
        const success = await addToCartService(
          productId,
          productName,
          price,
          image,
          quantity,
          talla,
          color
        );

        if (success) {
          await loadCart();
          return true;
        }
        return false;
      } catch (err: any) {
        setError(err.message || 'Error al añadir producto');
        return false;
      } finally {
        setIsProcessing(false);
      }
    },
    [loadCart]
  );

  /**
   * Actualiza la cantidad de un producto
   */
  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      if (quantity <= 0) {
        return removeItem(itemId);
      }

      setIsProcessing(true);
      setError(null);
      try {
        const success = await updateCartItem(itemId, quantity);
        if (success) {
          await loadCart();
          return true;
        }
        return false;
      } catch (err: any) {
        setError(err.message || 'Error al actualizar cantidad');
        return false;
      } finally {
        setIsProcessing(false);
      }
    },
    [loadCart]
  );

  /**
   * Elimina un producto del carrito
   */
  const removeItem = useCallback(
    async (itemId: string) => {
      setIsProcessing(true);
      setError(null);
      try {
        const success = await removeFromCart(itemId);
        if (success) {
          await loadCart();
          return true;
        }
        return false;
      } catch (err: any) {
        setError(err.message || 'Error al eliminar producto');
        return false;
      } finally {
        setIsProcessing(false);
      }
    },
    [loadCart]
  );

  /**
   * Vacía el carrito completo
   */
  const clear = useCallback(async () => {
    if (!confirm('¿Estás seguro de que deseas vaciar todo el carrito?')) {
      return false;
    }

    setIsProcessing(true);
    setError(null);
    try {
      const success = await clearCart();
      if (success) {
        await loadCart();
        return true;
      }
      return false;
    } catch (err: any) {
      setError(err.message || 'Error al vaciar carrito');
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [loadCart]);

  /**
   * Obtiene el número de items en el carrito
   */
  const getItemCount = useCallback(async () => {
    try {
      return await getCartItemCount();
    } catch (err: any) {
      console.error('Error getting item count:', err);
      return 0;
    }
  }, []);

  /**
   * Migra el carrito invitado al usuario
   */
  const migrateCart = useCallback(async () => {
    try {
      const success = await migrateGuestCartToUser();
      if (success) {
        await loadCart();
      }
      return success;
    } catch (err: any) {
      console.error('Error migrating cart:', err);
      return false;
    }
  }, [loadCart]);

  return {
    // Estado
    items,
    summary,
    isLoading,
    error,
    isProcessing,
    isAuthenticated,

    // Métodos
    loadCart,
    addItem,
    updateQuantity,
    removeItem,
    clear,
    getItemCount,
    migrateCart,
  };
}
