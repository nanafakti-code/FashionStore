import React, { useState, useEffect } from 'react';
import { getCartForCurrentUser, updateCartItemQuantity, removeFromCart } from '@/lib/cartService';
import type { CartItem } from '@/lib/cartService';

export default function Cart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCart();

    // Escuchar cambios en el carrito
    const handleCartUpdate = () => {
      loadCart();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, []);

  const loadCart = async () => {
    setIsLoading(true);
    try {
      const cart = await getCartForCurrentUser();
      setCartItems(cart);
      calculateTotals(cart);
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotals = (items: CartItem[]) => {
    const subtotalPrice = items.reduce((sum: number, item: CartItem) => sum + (item.price * item.quantity), 0);
    const taxPrice = Math.round(subtotalPrice * 0.21); // 21% IVA
    const totalPrice = subtotalPrice + taxPrice;
    
    setSubtotal(subtotalPrice);
    setTax(taxPrice);
    setTotal(totalPrice);
  };

  const updateQuantity = async (carritoItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(carritoItemId);
      return;
    }

    const success = await updateCartItemQuantity(carritoItemId, newQuantity);
    if (success) {
      loadCart();
    }
  };

  const removeItem = async (carritoItemId: string) => {
    const success = await removeFromCart(carritoItemId);
    if (success) {
      loadCart();
    }
  };

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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Productos */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Artículos en tu carrito ({cartItems.length})</h2>
          
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div key={item.carrito_item_id || item.id} className="flex gap-4 pb-4 border-b border-gray-200 last:border-b-0">
                {/* Imagen */}
                <div className="flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-24 h-24 object-cover rounded-lg bg-gray-100" />
                </div>

                {/* Detalles */}
                <div className="flex-grow">
                  <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
                  <p className="text-sm text-gray-500 mb-3">SKU: {item.id.slice(0, 8)}</p>
                  <p className="text-lg font-bold text-gray-900">{(item.price / 100).toFixed(2)}€</p>
                </div>

                {/* Cantidad y Precio Total */}
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2 border border-gray-300 rounded-lg">
                    <button
                      onClick={() => updateQuantity(item.carrito_item_id || item.id, item.quantity - 1)}
                      className="px-3 py-1 text-gray-600 hover:text-[#00aa45]"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.carrito_item_id || item.id, parseInt(e.target.value))}
                      className="w-12 text-center py-1 border-l border-r border-gray-300 text-gray-900 font-semibold"
                    />
                    <button
                      onClick={() => updateQuantity(item.carrito_item_id || item.id, item.quantity + 1)}
                      className="px-3 py-1 text-gray-600 hover:text-[#00aa45]"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {((item.price * item.quantity) / 100).toFixed(2)}€
                  </p>
                  <button
                    onClick={() => removeItem(item.carrito_item_id || item.id)}
                    className="text-sm text-red-600 hover:text-red-800 hover:underline font-medium"
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
          
          <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
            <div className="flex justify-between text-gray-700">
              <span>Subtotal ({cartItems.length} {cartItems.length === 1 ? 'artículo' : 'artículos'})</span>
              <span className="font-semibold">{(subtotal / 100).toFixed(2)}€</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Impuesto (IVA 21%)</span>
              <span className="font-semibold">{(tax / 100).toFixed(2)}€</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Envío</span>
              <span className="font-semibold text-gray-900">Gratis</span>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between text-2xl font-black text-gray-900">
              <span>Total:</span>
              <span className="text-gray-900">{(total / 100).toFixed(2)}€</span>
            </div>
          </div>

          <a
            href="/checkout"
            className="w-full block text-center bg-[#00aa45] text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors mb-3"
          >
            Tramitar pedido
          </a>

          <a
            href="/productos"
            className="w-full block text-center border-2 border-[#00aa45] text-[#00aa45] py-3 rounded-lg font-bold hover:bg-green-50 transition-colors"
          >
            Seguir comprando
          </a>

          <p className="text-xs text-gray-500 text-center mt-4">
            Envío gratis en pedidos mayores a 50€. Garantía en todos los productos.
          </p>
        </div>
      </div>
    </div>
  );
}
