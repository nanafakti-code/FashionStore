/**
 * FASHIONSTORE - COUPON INPUT COMPONENT
 * =====================================
 * Componente para aplicar cupones de descuento
 */

import { useState, useEffect } from 'preact/hooks';

interface AppliedCoupon {
  codigo: string;
  tipo: string;
  valor: number;
  descuento: number;
  cupon_id: string;
}

interface CouponInputProps {
  subtotal: number; // En céntimos
  onCouponApplied: (coupon: AppliedCoupon | null) => void;
}

export default function CouponInput({ subtotal, onCouponApplied }: CouponInputProps) {
  const [codigo, setCodigo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  // Cargar cupón del localStorage al iniciar
  useEffect(() => {
    try {
      const savedCoupon = localStorage.getItem('fashionstore_applied_coupon');
      if (savedCoupon) {
        const coupon = JSON.parse(savedCoupon);
        setAppliedCoupon(coupon);
        onCouponApplied(coupon);
      }
    } catch (e) {
      console.error('Error loading saved coupon:', e);
    }
  }, []);

  const handleApplyCoupon = async () => {
    if (!codigo.trim()) {
      setMessage({ type: 'error', text: 'Introduce un código de cupón' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/cupones/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: codigo.trim(), subtotal })
      });

      const result = await response.json();

      if (result.valid) {
        const coupon: AppliedCoupon = {
          codigo: codigo.toUpperCase(),
          tipo: result.tipo,
          valor: result.valor,
          descuento: result.descuento_calculado,
          cupon_id: result.cupon_id
        };

        setAppliedCoupon(coupon);
        localStorage.setItem('fashionstore_applied_coupon', JSON.stringify(coupon));
        onCouponApplied(coupon);
        setMessage({ type: 'success', text: result.message });
        setCodigo('');
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      console.error('Error applying coupon:', error);
      setMessage({ type: 'error', text: 'Error al aplicar el cupón' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    localStorage.removeItem('fashionstore_applied_coupon');
    onCouponApplied(null);
    setMessage(null);
  };

  // Si ya hay un cupón aplicado, mostrar resumen
  if (appliedCoupon) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-bold text-green-800">Cupón aplicado: {appliedCoupon.codigo}</p>
              <p className="text-sm text-green-600">
                {appliedCoupon.tipo === 'Porcentaje'
                  ? `${appliedCoupon.valor}% de descuento`
                  : `${appliedCoupon.valor}€ de descuento`
                }
                {' '}(-{(appliedCoupon.descuento / 100).toFixed(2)}€)
              </p>
            </div>
          </div>
          <button
            onClick={handleRemoveCoupon}
            className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
          >
            Eliminar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        ¿Tienes un código de descuento?
      </label>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={codigo}
          onInput={(e) => setCodigo((e.target as HTMLInputElement).value.toUpperCase())}
          placeholder="Código de cupón"
          className="w-full flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00aa45] focus:border-transparent uppercase"
          disabled={isLoading}
        />
        <button
          onClick={handleApplyCoupon}
          disabled={isLoading || !codigo.trim()}
          className="w-full sm:w-auto px-6 py-2 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            'Aplicar'
          )}
        </button>
      </div>

      {message && (
        <p className={`mt-2 text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
