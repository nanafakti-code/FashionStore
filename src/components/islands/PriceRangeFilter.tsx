import { useState, useEffect, useRef } from 'react';

interface Props {
  maxPrice: number;
}

export default function PriceRangeFilter({ maxPrice }: Props) {
  // Inicializar desde URL params si existen
  const getInitialMinPrice = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlMinPrice = params.get('minPrice');
      return urlMinPrice ? Number(urlMinPrice) : 0;
    }
    return 0;
  };

  const getInitialMaxPrice = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlMaxPrice = params.get('maxPrice');
      return urlMaxPrice ? Number(urlMaxPrice) : maxPrice;
    }
    return maxPrice;
  };

  const [minPrice, setMinPrice] = useState(getInitialMinPrice());
  const [maxPriceValue, setMaxPriceValue] = useState(getInitialMaxPrice());
  const [isOpen, setIsOpen] = useState(true);
  const isFirstRender = useRef(true);

  // Actualizar maxPriceValue cuando cambie maxPrice prop (solo si no hay parámetro en URL)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlMaxPrice = params.get('maxPrice');
      if (!urlMaxPrice) {
        setMaxPriceValue(maxPrice);
      }
    }
  }, [maxPrice]);

  // Auto-actualizar URL cuando cambien los precios (con debounce)
  useEffect(() => {
    // No actualizar en el primer render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timeoutId = setTimeout(() => {
      const url = new URL(window.location.href);
      url.searchParams.set('minPrice', minPrice.toString());
      url.searchParams.set('maxPrice', maxPriceValue.toString());
      // Usar replaceState en lugar de cambiar location para no recargar la página
      window.history.replaceState(null, '', url.toString());
    }, 300); // Esperar 300ms después de que el usuario deje de mover el slider

    return () => clearTimeout(timeoutId);
  }, [minPrice, maxPriceValue]);

  // Calcular porcentajes para la barra de rango
  const priceRange = maxPrice;
  const minPercent = (minPrice / priceRange) * 100;
  const maxPercent = (maxPriceValue / priceRange) * 100;

  return (
    <div className="w-full">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center py-3 px-0 font-bold text-gray-900 text-base"
      >
        <span>Precio</span>
        <span className={`transition-transform duration-200 ${isOpen ? '' : 'rotate-180'}`}>
          <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 6.5L6 1.5L11 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      {/* Content */}
      {isOpen && (
        <div className="space-y-5 pt-2">
          {/* Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-gray-300 rounded-lg p-3">
              <label className="block text-xs text-gray-500 mb-1">Desde (€)</label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => {
                  const val = Math.max(0, Math.min(Number(e.target.value), maxPriceValue));
                  setMinPrice(val);
                }}
                className="w-full text-lg font-normal text-gray-900 bg-transparent focus:outline-none"
              />
            </div>
            <div className="border border-gray-300 rounded-lg p-3">
              <label className="block text-xs text-gray-500 mb-1">Hasta (€)</label>
              <input
                type="number"
                value={maxPriceValue}
                onChange={(e) => {
                  const val = Math.max(minPrice, Math.min(Number(e.target.value), maxPrice));
                  setMaxPriceValue(val);
                }}
                className="w-full text-lg font-normal text-gray-900 bg-transparent focus:outline-none"
              />
            </div>
          </div>

          {/* Dual Range Slider */}
          <div className="relative h-1 mx-2 my-8">

            {/* Active range (dark bar between handles) */}
            <div
              className="absolute h-full bg-gray-800 rounded-full"
              style={{
                left: `${minPercent}%`,
                width: `${maxPercent - minPercent}%`
              }}
            ></div>

            {/* Min handle */}
            <div
              className="absolute w-5 h-5 bg-white border-2 border-blue-400 rounded-full shadow-md cursor-pointer transform -translate-y-1/2 -translate-x-1/2"
              style={{
                left: `${minPercent}%`,
                top: '50%',
                zIndex: 10
              }}
            ></div>

            {/* Max handle */}
            <div
              className="absolute w-5 h-5 bg-gray-900 border-2 border-gray-900 rounded-full shadow-md cursor-pointer transform -translate-y-1/2 -translate-x-1/2"
              style={{
                left: `${maxPercent}%`,
                top: '50%',
                zIndex: 10
              }}
            ></div>

            {/* Invisible range inputs for interaction */}
            <input
              type="range"
              min={0}
              max={maxPrice}
              value={minPrice}
              onChange={(e) => {
                const val = Math.min(Number(e.target.value), maxPriceValue - 1);
                setMinPrice(Math.max(0, val));
              }}
              className="price-range-input absolute w-full h-6 top-1/2 -translate-y-1/2 appearance-none bg-transparent cursor-pointer"
              style={{ zIndex: minPrice > maxPrice - 100 ? 15 : 11 }}
            />

            <input
              type="range"
              min={0}
              max={maxPrice}
              value={maxPriceValue}
              onChange={(e) => {
                const val = Math.max(Number(e.target.value), minPrice + 1);
                setMaxPriceValue(Math.min(maxPrice, val));
              }}
              className="price-range-input absolute w-full h-6 top-1/2 -translate-y-1/2 appearance-none bg-transparent cursor-pointer"
              style={{ zIndex: 12 }}
            />
          </div>
        </div>
      )}

      <style>{`
        .price-range-input {
          pointer-events: auto;
          outline: none !important;
          border: none !important;
          box-shadow: none !important;
        }

        .price-range-input:focus {
          outline: none !important;
          border: none !important;
          box-shadow: none !important;
        }

        .price-range-input:focus-visible {
          outline: none !important;
          border: none !important;
          box-shadow: none !important;
        }

        .price-range-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: transparent;
          cursor: pointer;
          border: none;
          pointer-events: auto;
        }

        .price-range-input::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: transparent;
          cursor: pointer;
          border: none;
          pointer-events: auto;
        }

        .price-range-input::-webkit-slider-runnable-track {
          background: transparent;
          border: none;
          height: 4px;
        }

        .price-range-input::-moz-range-track {
          background: transparent;
          border: none;
          height: 4px;
        }
      `}</style>
    </div>
  );
}
