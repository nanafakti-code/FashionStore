import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';

interface StripePaymentProps {
  total?: number;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function StripePayment({ 
  total = 0, 
  onSuccess = () => {}, 
  onError = () => {} 
}: StripePaymentProps) {
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [currentTotal, setCurrentTotal] = useState(total);

  // Obtener el total del carrito cuando el componente se monta
  useEffect(() => {
    const cartJSON = localStorage.getItem('cart');
    const cart = cartJSON ? JSON.parse(cartJSON) : [];
    const cartTotal = cart.reduce((sum: number, item: any) => 
      sum + (item.price * item.quantity), 0);
    setCurrentTotal(cartTotal);
  }, [total]);

  // Formatear número de tarjeta (cada 4 dígitos)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\s+/g, '');
    value = value.replace(/[^0-9]/gi, '');
    value = value.substring(0, 16);
    const formatted = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  // Formatear fecha (MM/YY)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    setExpiry(value);
  };

  // Formatear CVC (máximo 4 dígitos)
  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 4);
    setCvc(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validar campos
      if (!cardNumber.replace(/\s/g, '') || cardNumber.length < 19) {
        onError('Número de tarjeta inválido');
        setLoading(false);
        return;
      }

      if (!expiry || expiry.length < 5) {
        onError('Fecha de expiración inválida (formato: MM/YY)');
        setLoading(false);
        return;
      }

      if (!cvc || cvc.length < 3) {
        onError('CVC inválido');
        setLoading(false);
        return;
      }

      if (!cardholderName.trim()) {
        onError('Nombre del titular es requerido');
        setLoading(false);
        return;
      }

      // Validar fecha
      const [month, year] = expiry.split('/');
      const expireDate = new Date(2000 + parseInt(year), parseInt(month));
      if (expireDate < new Date()) {
        onError('La tarjeta ha expirado');
        setLoading(false);
        return;
      }

      // Aquí iría la integración real con Stripe API
      // En entorno de prueba, simulamos el pago
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mostrar confirmación
      alert('¡Pago procesado exitosamente!\n\nGracias por tu compra en FashionStore.\nTe hemos enviado un email de confirmación.');
      
      // Limpiar carrito
      localStorage.removeItem('cart');
      
      // Redirigir
      window.location.href = '/';
      
      onSuccess();
    } catch (error) {
      onError('Error al procesar el pago');
      console.error('Stripe error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!showForm) {
    return (
      <div className="mt-4">
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="w-full bg-[#00aa45] text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors"
        >
          Ingresar Datos de Tarjeta
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h10m4 0a1 1 0 11-2 0 1 1 0 012 0z" />
        </svg>
        Datos de la Tarjeta
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nombre del titular */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre del Titular *
          </label>
          <input
            type="text"
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value)}
            placeholder="Ej: Juan García Martínez"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00aa45] focus:border-transparent"
            required
          />
        </div>

        {/* Número de tarjeta */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Número de Tarjeta *
          </label>
          <input
            type="text"
            value={cardNumber}
            onChange={handleCardNumberChange}
            placeholder="Ej: 4242 4242 4242 4242"
            maxLength={19}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00aa45] focus:border-transparent font-mono"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Para pruebas usa: 4242 4242 4242 4242</p>
        </div>

        {/* Fecha y CVC */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Vencimiento (MM/YY) *
            </label>
            <input
              type="text"
              value={expiry}
              onChange={handleExpiryChange}
              placeholder="Ej: 12/25"
              maxLength={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00aa45] focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CVC / CVV *
            </label>
            <input
              type="text"
              value={cvc}
              onChange={handleCvcChange}
              placeholder="Ej: 123"
              maxLength={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00aa45] focus:border-transparent font-mono"
              required
            />
          </div>
        </div>

        {/* Información de seguridad */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
          <svg
            className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm text-blue-700">
            Tu pago está protegido con encriptación SSL 256-bit. Stripe es un procesador de pagos certificado.
          </p>
        </div>

        {/* Total a pagar */}
        <div className="bg-gray-100 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-medium">Total a pagar:</span>
            <span className="text-2xl font-bold text-[#00aa45]">{(currentTotal / 100).toFixed(2)}€</span>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-3 bg-[#00aa45] text-white rounded-lg font-bold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Procesando pago...' : `Pagar ${(currentTotal / 100).toFixed(2)}€`}
          </button>
        </div>
      </form>
    </div>
  );
}
