/**
 * EJEMPLO: Cómo usar el carrito en un componente de producto
 * Este archivo muestra las mejores prácticas para integrar el carrito
 */

import { useState } from 'react';
import { addToCart } from '@/lib/cartService';

interface ProductPageProps {
  productId: string;
  productName: string;
  price: number;
  image: string;
  stock: number;
  sizes?: string[];
  colors?: string[];
}

export default function ProductPageExample({
  productId,
  productName,
  price,
  image,
  stock,
  sizes = ['XS', 'S', 'M', 'L', 'XL'],
  colors = ['Negro', 'Blanco', 'Azul'],
}: ProductPageProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | undefined>();
  const [selectedColor, setSelectedColor] = useState<string | undefined>();
  const [isAdding, setIsAdding] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAddToCart = async () => {
    // Validar cantidad
    if (quantity <= 0 || quantity > stock) {
      setMessage({
        type: 'error',
        text: `La cantidad debe estar entre 1 y ${stock}`,
      });
      return;
    }

    setIsAdding(true);
    setMessage(null);

    try {
      // Agregar al carrito
      const success = await addToCart(
        productId,
        productName,
        price,
        image,
        quantity,
        selectedSize,
        selectedColor
      );

      if (success) {
        setMessage({
          type: 'success',
          text: `✅ ${quantity} ${quantity === 1 ? 'producto' : 'productos'} agregado${quantity === 1 ? '' : 's'} al carrito`,
        });

        // Limpiar selección después de agregar
        setTimeout(() => {
          setQuantity(1);
          setSelectedSize(undefined);
          setSelectedColor(undefined);
          setMessage(null);
        }, 2000);
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: `❌ Error: ${error.message || 'No se pudo agregar el producto'}`,
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Imagen */}
        <div className="flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden">
          <img src={image} alt={productName} className="w-full h-full object-cover" />
        </div>

        {/* Detalles */}
        <div className="flex flex-col justify-center">
          <h1 className="text-4xl font-bold mb-2">{productName}</h1>

          <div className="mb-6">
            <p className="text-3xl font-bold text-[#00aa45]">{(price / 100).toFixed(2)}€</p>
            <p className={`text-sm font-medium ${stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stock > 0 ? `En stock: ${stock} disponibles` : 'Agotado'}
            </p>
          </div>

          {/* Selector de Talla */}
          {sizes && sizes.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">Talla</label>
              <div className="flex gap-2 flex-wrap">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(selectedSize === size ? undefined : size)}
                    className={`px-4 py-2 border-2 rounded font-semibold transition-colors ${
                      selectedSize === size
                        ? 'border-[#00aa45] bg-[#00aa45] text-white'
                        : 'border-gray-300 text-gray-700 hover:border-[#00aa45]'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selector de Color */}
          {colors && colors.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">Color</label>
              <div className="flex gap-2 flex-wrap">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(selectedColor === color ? undefined : color)}
                    className={`px-4 py-2 border-2 rounded font-semibold transition-colors ${
                      selectedColor === color
                        ? 'border-[#00aa45] bg-[#00aa45] text-white'
                        : 'border-gray-300 text-gray-700 hover:border-[#00aa45]'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selector de Cantidad */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2">Cantidad</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1 || isAdding}
                className="px-4 py-2 border border-gray-300 rounded font-bold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                −
              </button>
              <input
                type="number"
                min="1"
                max={stock}
                value={quantity}
                onChange={(e: any) => setQuantity(Math.min(stock, Math.max(1, parseInt(e.target?.value || 1) || 1)))}
                disabled={isAdding}
                className="w-16 text-center py-2 border border-gray-300 rounded font-semibold disabled:bg-gray-100"
              />
              <button
                onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                disabled={quantity >= stock || isAdding}
                className="px-4 py-2 border border-gray-300 rounded font-bold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>
          </div>

          {/* Botón Agregar al Carrito */}
          <button
            onClick={handleAddToCart}
            disabled={isAdding || stock === 0}
            className={`w-full py-4 rounded-lg font-bold text-lg text-white transition-all ${
              isAdding
                ? 'bg-gray-400 cursor-not-allowed'
                : stock === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-[#00aa45] hover:bg-green-700 active:scale-95'
            }`}
          >
            {isAdding ? 'Agregando...' : stock === 0 ? 'Agotado' : 'Agregar al Carrito'}
          </button>

          {/* Mensaje de Feedback */}
          {message && (
            <div
              className={`mt-4 p-4 rounded-lg text-center font-semibold ${
                message.type === 'success'
                  ? 'bg-green-100 text-green-800 border border-green-300'
                  : 'bg-red-100 text-red-800 border border-red-300'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Información Adicional */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <ul className="space-y-2 text-sm text-gray-600">
              <li>✓ Envío gratis en pedidos mayores a 50€</li>
              <li>✓ Garantía de 2 años en todos los productos</li>
              <li>✓ Devolución sin preguntas en 30 días</li>
              <li>✓ Soporte al cliente 24/7</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
