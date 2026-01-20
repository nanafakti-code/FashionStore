import { useState, useEffect } from 'react';
import { getCartForCurrentUser, updateCartItemQuantity, removeFromCart, clearCart, cleanupExpiredGuestCartItems } from '@/lib/cartService';
import { cleanupExpiredReservations } from '@/lib/reservationService';
import type { CartItem } from '@/lib/cartService';
import CouponInput from './CouponInput';
import { AlertIcon } from '@/components/ui/Icons';

interface AppliedCoupon {
  codigo: string;
  tipo: string;
  valor: number;
  descuento: number;
  cupon_id: string;
}

export default function Cart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [descuento, setDescuento] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  useEffect(() => {
    loadCart();

    // Escuchar cambios en el carrito
    const handleCartUpdate = () => {
      loadCart();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    window.addEventListener('authCartUpdated', handleCartUpdate);
    window.addEventListener('guestCartUpdated', handleCartUpdate);

    // Countdown timer cada segundo
    const countdownInterval = setInterval(() => {
      setCartItems(prev => {
        const updated = prev.map(item => ({
          ...item,
          expires_in_seconds: item.expires_in_seconds !== undefined && item.expires_in_seconds > 0 
            ? item.expires_in_seconds - 1 
            : item.expires_in_seconds
        }));
        
        // Verificar items expirados (expires_in_seconds llegó a 0)
        const expiredItems = updated.filter(item => 
          item.expires_in_seconds !== undefined && item.expires_in_seconds <= 0
        );
        
        if (expiredItems.length > 0) {
          console.log(`[Cart] Items expirados detectados:`, expiredItems.map(i => i.id));
          // Eliminar items expirados del carrito
          expiredItems.forEach(item => {
            removeItem(item.id);
          });
          // Recargar carrito después de eliminar
          loadCart();
        }
        
        return updated;
      });
    }, 1000);

    // Limpiar reservas expiradas y carrito invitado cada 30 segundos
    const cleanupInterval = setInterval(() => {
      cleanupExpiredReservations();
      cleanupExpiredGuestCartItems(); // Limpiar items expirados del carrito invitado
    }, 30000);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('authCartUpdated', handleCartUpdate);
      window.removeEventListener('guestCartUpdated', handleCartUpdate);
      clearInterval(countdownInterval);
      clearInterval(cleanupInterval);
    };
  }, []);

  const loadCart = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Limpiar items expirados del carrito invitado antes de cargar
      cleanupExpiredGuestCartItems();
      
      const cart = await getCartForCurrentUser();
      
      // Validar que cart es un array
      if (!Array.isArray(cart)) {
        console.error('Cart is not an array:', cart);
        setError('Error al cargar el carrito. Formato inválido.');
        setCartItems([]);
        return;
      }
      
      // Usar expires_in_seconds si existe
      const itemsWithTimer = cart.map((item: CartItem) => {
        // Si item tiene expires_in_seconds, lo mostramos directamente
        if (item.expires_in_seconds !== undefined && item.expires_in_seconds > 0) {
          return item;
        }
        
        return item;
      });
      
      setCartItems(itemsWithTimer);
      calculateTotals(itemsWithTimer);
    } catch (err: any) {
      console.error('Error loading cart:', err);
      setError(err.message || 'Error al cargar el carrito.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotals = (items: CartItem[], coupon: AppliedCoupon | null = appliedCoupon) => {
    const subtotalPrice = items.reduce((sum: number, item: CartItem) => sum + (item.precio_unitario * item.quantity), 0);
    
    // Calcular descuento del cupón
    let discount = 0;
    if (coupon) {
      if (coupon.tipo === 'Porcentaje') {
        discount = Math.round((subtotalPrice * coupon.valor) / 100);
      } else {
        discount = Math.min(coupon.valor * 100, subtotalPrice);
      }
    }
    
    const subtotalConDescuento = subtotalPrice - discount;
    const taxPrice = Math.round(subtotalConDescuento * 0.21); // 21% IVA
    const totalPrice = subtotalConDescuento + taxPrice;
    
    setSubtotal(subtotalPrice);
    setDescuento(discount);
    setTax(taxPrice);
    setTotal(totalPrice);
  };

  const handleCouponApplied = (coupon: AppliedCoupon | null) => {
    setAppliedCoupon(coupon);
    calculateTotals(cartItems, coupon);
  };

  const updateQuantity = async (carritoItemId: string, newQuantity: number, maxStock?: number) => {
    if (newQuantity <= 0) {
      removeItem(carritoItemId);
      return;
    }

    // Si se especifica stock máximo, ajustar cantidad
    const item = cartItems.find(i => i.id === carritoItemId);
    const maxAllowed = maxStock || item?.product_stock || 999;
    const adjustedQuantity = Math.min(newQuantity, maxAllowed);

    setIsProcessing(true);
    setError(null);
    try {
      const success = await updateCartItemQuantity(carritoItemId, adjustedQuantity);
      if (success) {
        loadCart();
      }
    } catch (err: any) {
      setError(err.message || 'Error al actualizar la cantidad');
    } finally {
      setIsProcessing(false);
    }
  };

  const removeItem = async (carritoItemId: string) => {
    setIsProcessing(true);
    setError(null);
    try {
      const success = await removeFromCart(carritoItemId);
      if (success) {
        loadCart();
      }
    } catch (err: any) {
      setError(err.message || 'Error al eliminar el producto');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearCart = async () => {
    setShowClearConfirm(true);
  };

  const confirmClearCart = async () => {
    setShowClearConfirm(false);
    setIsProcessing(true);
    setError(null);
    try {
      await clearCart();
      loadCart();
    } catch (err: any) {
      setError(err.message || 'Error al vaciar el carrito');
    } finally {
      setIsProcessing(false);
    }
  };

  // Error state - mostrar error genérico sin bloquear
  if (error) {
    return (
      <div className="text-center py-20">
        <svg className="w-24 h-24 mx-auto mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-2xl text-gray-600 mb-2 font-semibold">Error al cargar el carrito</p>
        <p className="text-gray-500 mb-6">{error}</p>
        <button onClick={() => { setError(null); loadCart(); }} className="inline-block bg-[#00aa45] text-white px-8 py-3 rounded-lg font-bold hover:bg-green-700 transition-colors">
          Reintentar
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-spin">
          <svg className="w-12 h-12 text-[#00aa45]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <p className="mt-4 text-gray-600">Cargando carrito...</p>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="text-center py-20">
        <svg className="w-24 h-24 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        <p className="text-2xl text-gray-600 mb-2 font-semibold">Tu carrito está vacío</p>
        <p className="text-gray-500 mb-6">¡Agrega productos para comenzar a comprar!</p>
        <a href="/" className="inline-block bg-[#00aa45] text-white px-8 py-3 rounded-lg font-bold hover:bg-green-700 transition-colors">
          Explorar productos
        </a>
      </div>
    );
  }

  return (
    <>
      {/* Modal de confirmación para vaciar carrito */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Vaciar carrito</h2>
              <p className="text-gray-600 mb-6">¿Estás seguro de que deseas vaciar todo el carrito? Esta acción no se puede deshacer.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-900 rounded-lg font-bold hover:bg-gray-50 transition-colors"
                  disabled={isProcessing}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmClearCart}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Vaciando...' : 'Vaciar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Mensaje de error */}
      {error && (
        <div className="lg:col-span-2">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 flex items-center gap-2">
            <AlertIcon size={18} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Productos */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Artículos en tu carrito ({cartItems.length})</h2>
            {cartItems.length > 0 && (
              <button
                onClick={handleClearCart}
                disabled={isProcessing}
                className="text-sm text-red-600 hover:text-red-800 hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Vaciar carrito
              </button>
            )}
          </div>
          
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="flex gap-4 pb-4 border-b border-gray-200 last:border-b-0 opacity-75 hover:opacity-100 transition-opacity">
                {/* Imagen */}
                <div className="flex-shrink-0">
                  <img 
                    src={item.product_image || '/placeholder.png'} 
                    alt={item.product_name} 
                    className="w-24 h-24 object-contain rounded-lg bg-white border border-gray-200 p-1"
                    onError={(e: any) => {
                      e.target.src = '/placeholder.png';
                    }}
                  />
                </div>

                {/* Detalles */}
                <div className="flex-grow">
                  <h3 className="font-semibold text-gray-900 mb-1">{item.product_name}</h3>
                  {item.talla && <p className="text-sm text-gray-500">Talla: {item.talla}</p>}
                  {item.color && <p className="text-sm text-gray-500">Color: {item.color}</p>}
                  {item.product_stock && item.product_stock > 1 && <p className="text-xs text-green-600 mt-1">Stock disponible: {item.product_stock}</p>}
                  {item.product_stock === 1 && (
                    <p className="text-xs text-amber-600 font-semibold mt-1 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Último en stock
                    </p>
                  )}
                  {item.product_stock === 0 && <p className="text-xs text-red-600 mt-1">Agotado</p>}
                  <p className="text-lg font-bold text-gray-900 mt-2">{(item.precio_unitario / 100).toFixed(2)}€</p>
                </div>

                {/* Cantidad y Precio Total */}
                <div className="flex flex-col items-end gap-2">
                  {item.product_stock !== 1 && (
                    <div className="flex items-center gap-2 border border-gray-300 rounded-lg bg-gray-50">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={isProcessing || item.quantity <= 1}
                        className="px-3 py-1 text-gray-600 hover:text-[#00aa45] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={item.product_stock || 999}
                        value={item.quantity}
                        onChange={(e: any) => {
                          const newQty = parseInt(e.target.value) || 1;
                          if (newQty > 0) {
                            updateQuantity(item.id, newQty, item.product_stock);
                          }
                        }}
                        disabled={isProcessing}
                        className="w-12 text-center py-1 border-l border-r border-gray-300 text-gray-900 font-semibold disabled:bg-white"
                      />
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1, item.product_stock)}
                        disabled={isProcessing || item.quantity >= (item.product_stock || 999)}
                        className="px-3 py-1 text-gray-600 hover:text-[#00aa45] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        +
                      </button>
                    </div>
                  )}
                  <p className="text-lg font-bold text-gray-900">
                    {((item.precio_unitario * item.quantity) / 100).toFixed(2)}€
                  </p>
                  {item.expires_in_seconds && item.expires_in_seconds > 0 ? (
                    <p className="text-xs text-red-600 font-semibold bg-red-50 px-2 py-1 rounded flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                      </svg>
                      Expira en {formatTime(item.expires_in_seconds)}
                    </p>
                  ) : null}
                  <button
                    onClick={() => removeItem(item.id)}
                    disabled={isProcessing}
                    className="text-sm text-red-600 hover:text-red-800 hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Resumen de Pedido */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-4">
          <h2 className="text-xl font-bold mb-6 text-gray-900">Resumen del pedido</h2>
          
          {/* Cupón de descuento */}
          <div className="mb-6">
            <CouponInput subtotal={subtotal} onCouponApplied={handleCouponApplied} />
          </div>
          
          <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
            <div className="flex justify-between text-gray-700">
              <span>Subtotal ({cartItems.length} {cartItems.length === 1 ? 'artículo' : 'artículos'})</span>
              <span className="font-semibold">{(subtotal / 100).toFixed(2)}€</span>
            </div>
            {descuento > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Descuento</span>
                <span className="font-semibold">-{(descuento / 100).toFixed(2)}€</span>
              </div>
            )}
            <div className="flex justify-between text-gray-700">
              <span>Impuesto (IVA 21%)</span>
              <span className="font-semibold">{(tax / 100).toFixed(2)}€</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Envío</span>
              <span className="font-semibold text-green-600">Gratis</span>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between text-2xl font-black text-gray-900">
              <span>Total:</span>
              <span className="text-[#00aa45]">{(total / 100).toFixed(2)}€</span>
            </div>
          </div>

          <a
            href="/checkout"
            className="w-full block text-center bg-[#00aa45] text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors mb-3 disabled:opacity-50"
          >
            Tramitar pedido
          </a>

          <a
            href="/"
            className="w-full block text-center border-2 border-[#00aa45] text-[#00aa45] py-3 rounded-lg font-bold hover:bg-green-50 transition-colors"
          >
            Seguir comprando
          </a>

          <p className="text-xs text-gray-500 text-center mt-4">
            ✓ Envío gratis en pedidos mayores a 50€<br/>
            ✓ Garantía en todos los productos<br/>
            ✓ Devolución en 30 días
          </p>
        </div>
      </div>
    </div>
    </>
  );
}
