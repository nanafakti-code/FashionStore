import { useState, useEffect } from 'react';

interface StripePaymentProps {
  total?: number;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  userEmail?: string;
  userName?: string;
  userPhone?: string;
  userAddress?: Record<string, string>;
  userId?: string;
  accessToken?: string;
  items?: Array<{
    producto_id: string;
    nombre: string;
    cantidad: number;
    precio_unitario: number;
    imagen?: string;
    talla?: string;
    color?: string;
  }>;
  discountAmount?: number;
  couponId?: string;
}

export default function StripePayment({
  total = 0,
  onSuccess: _onSuccess = () => { },
  onError = () => { },
  userEmail = '',
  userName = '',
  userPhone = '',
  userAddress,
  userId,
  accessToken,
  items = [],
  discountAmount = 0,
  couponId,
}: StripePaymentProps) {
  const [loading, setLoading] = useState(false);
  const [currentTotal, setCurrentTotal] = useState(total);

  useEffect(() => {
    if (total > 0) {
      setCurrentTotal(total);
    }
  }, [total]);

  const handleCheckout = async () => {
    setLoading(true);

    try {
      if (currentTotal <= 0) {
        onError('El total del carrito no puede ser 0');
        setLoading(false);
        return;
      }

      if (!userEmail) {
        onError('Email es requerido para proceder al pago');
        setLoading(false);
        return;
      }

      // Crear sesión de Stripe Checkout a través del backend
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch('/api/stripe/create-session', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          totalAmount: currentTotal,
          userEmail,
          nombre: userName,
          telefono: userPhone,
          direccion: userAddress,
          descuento: discountAmount,
          cuponId: couponId,
          items,
          userId,
          isGuest: !userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        onError(data.error || 'Error al iniciar el pago');
        setLoading(false);
        return;
      }

      // Redirigir a Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        onError('No se pudo obtener la URL de pago');
        setLoading(false);
      }
    } catch (error) {
      onError('Error al conectar con el servicio de pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      {/* Información de seguridad */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2 mb-4">
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
          Tu pago será procesado de forma segura por Stripe. No almacenamos datos de tarjeta.
        </p>
      </div>

      {/* Total a pagar */}
      <div className="bg-gray-100 p-4 rounded-lg mb-4">
        <div className="flex justify-between items-center">
          <span className="font-medium">Total a pagar:</span>
          <span className="text-2xl font-bold text-[#00aa45]">{(currentTotal / 100).toFixed(2)}€</span>
        </div>
      </div>

      {/* Botón de pago */}
      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading || currentTotal <= 0}
        className="w-full px-4 py-3 bg-[#00aa45] text-white rounded-lg font-bold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Redirigiendo a Stripe...
          </>
        ) : (
          `Pagar ${(currentTotal / 100).toFixed(2)}€ con Stripe`
        )}
      </button>

      <p className="text-xs text-gray-500 text-center mt-2">
        Serás redirigido a la página segura de Stripe para completar tu pago.
      </p>
    </div>
  );
}
