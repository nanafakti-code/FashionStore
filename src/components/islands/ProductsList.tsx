import { useState, useEffect } from 'react';

interface Product {
  id: string | number;
  slug: string;
  nombre: string;
  precio_venta: number;
  precio_original?: number;
  imagen_principal: string;
  rating: number;
  resenas: number;
  condicion: string;
  badge?: string;
  stock_total: number;
  categoria_id?: number;
}

interface Props {
  products: Product[];
  categories: any[];
  searchQuery: string;
  selectedCategory: string;
}

export default function ProductsList({
  products,
  categories: _categories,
  searchQuery: _initialSearchQuery,
  selectedCategory: _initialSelectedCategory,
}: Props) {
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products);

  // Función para filtrar productos basado en los parámetros de URL
  const applyFilters = () => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const searchQuery = params.get('q') || '';
    const selectedCategory = params.get('categoria') || '';
    const minPrice = (Number(params.get('minPrice')) || 0) * 100; // Convertir a céntimos
    const maxPrice = (Number(params.get('maxPrice')) || 999999) * 100;
    const orden = params.get('orden') || 'relevancia';

    let filtered = [...products];

    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      filtered = filtered.filter((p) =>
        p.nombre?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtrar por categoría
    if (selectedCategory) {
      filtered = filtered.filter((p) =>
        p.categoria_id?.toString() === selectedCategory
      );
    }

    // Filtrar por precio (en céntimos)
    filtered = filtered.filter(
      (p) => (p.precio_venta || 0) >= minPrice && (p.precio_venta || 0) <= maxPrice
    );

    // Aplicar ordenamiento
    switch (orden) {
      case 'precio-menor':
        filtered.sort((a, b) => (a.precio_venta || 0) - (b.precio_venta || 0));
        break;
      case 'precio-mayor':
        filtered.sort((a, b) => (b.precio_venta || 0) - (a.precio_venta || 0));
        break;
      case 'mejor-valorado':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'relevancia':
      default:
        break;
    }

    setFilteredProducts(filtered);
  };

  // Aplicar filtros al montar el componente
  useEffect(() => {
    applyFilters();
  }, [products]);

  // Escuchar cambios en los parámetros de URL
  useEffect(() => {
    window.addEventListener('popstate', applyFilters);

    // También escuchar cambios en la URL usando MutationObserver indirectamente
    // Usamos un intervalo para chequear cambios (no es ideal pero funciona)
    const observer = setInterval(() => {
      applyFilters();
    }, 100);

    return () => {
      window.removeEventListener('popstate', applyFilters);
      clearInterval(observer);
    };
  }, [products]);

  return (
    <>
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <a
              key={product.id}
              href={`/productos/${product.slug || product.id}`}
              className="group bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow overflow-hidden"
            >
              {/* Imagen */}
              <div className="relative overflow-hidden bg-white h-64 flex items-center justify-center">
                <img
                  src={product.imagen_principal || '/placeholder.png'}
                  alt={product.nombre}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 p-2"
                />
                {product.badge && (
                  <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded text-xs font-bold">
                    {product.badge}
                  </div>
                )}
              </div>

              {/* Contenido */}
              <div className="p-4">
                {/* Nombre */}
                <h3 className="font-bold text-gray-900 text-sm line-clamp-2 mb-2">
                  {product.nombre}
                </h3>

                {/* Condición */}
                <p className="text-xs text-gray-600 mb-3">
                  {product.condicion}
                </p>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex text-yellow-400 text-sm">
                    {[...Array(5)].map((_, i) => (
                      <span key={i}>
                        {i < Math.round(product.rating || 0) ? '★' : '☆'}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-gray-500">
                    ({product.resenas})
                  </span>
                </div>

                {/* Precios */}
                <div className="space-y-1">
                  <p className="text-2xl font-black text-gray-900">
                    €{((product.precio_venta || 0) / 100).toFixed(2)}
                  </p>
                  {product.precio_original && (
                    <div>
                      <p className="text-xs text-gray-500 line-through">
                        €{((product.precio_original) / 100).toFixed(2)}
                      </p>
                      <p className="text-xs text-green-600 font-bold">
                        Ahorra €{(((product.precio_original - product.precio_venta) || 0) / 100).toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="col-span-full text-center py-20">
          <svg
            className="w-40 h-40 mx-auto text-gray-300 mb-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            No se encontraron productos
          </h2>
          <p className="text-gray-600 text-lg">
            Intenta ajustando tus filtros
          </p>
        </div>
      )}
    </>
  );
}
