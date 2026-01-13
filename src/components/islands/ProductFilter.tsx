import { useState, useEffect } from 'react';

interface Product {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  categoryName?: string;
  slug: string;
  image: string;
  originalPrice: number;
  badge?: string;
  badge_color?: string;
  condition?: string;
  rating?: number;
  reviews?: number;
}

interface Category {
  id: string;
  nombre: string;
  slug: string;
}

interface ProductFilterProps {
  products: Product[];
  categories: Category[];
}

export default function ProductFilter({ products, categories }: ProductFilterProps) {
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 3000]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products);

  // Calcular rango de precios máximo
  const maxPrice = Math.max(...products.map(p => p.price / 100), 1000);

  // Filtrar productos
  useEffect(() => {
    let filtered = products.filter(product => {
      const productPrice = product.price / 100;
      const inPriceRange = productPrice >= priceRange[0] && productPrice <= priceRange[1];
      const inCategory = !selectedCategory || product.categoryId === selectedCategory;
      
      return inPriceRange && inCategory;
    });

    setFilteredProducts(filtered);

    // Actualizar el texto del contador
    const count = document.getElementById('product-count');
    if (count) {
      count.textContent = filtered.length.toString();
    }

    // Renderizar el grid de productos filtrados
    const grid = document.getElementById('products-grid');
    if (grid) {
      if (filtered.length > 0) {
        grid.innerHTML = filtered.map(product => `
          <a href="/productos/${product.slug}" class="group">
            <div class="relative overflow-hidden rounded-lg bg-gray-100 mb-3 aspect-square">
              <img
                src="${product.image}"
                alt="${product.name}"
                class="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
              />
              ${product.badge ? `<div class="absolute top-3 left-3 ${product.badge_color} text-gray-900 px-3 py-1 rounded-full text-xs font-black">${product.badge}</div>` : ''}
            </div>
            <h3 class="text-sm font-semibold text-gray-900 group-hover:text-[#00aa45] transition-colors line-clamp-2">
              ${product.name}
            </h3>
            <p class="text-xs text-gray-500 mt-1">${product.condition || 'Excelente estado'}</p>
            <div class="mt-2 flex items-center gap-2">
              <span class="text-lg font-black text-gray-900">${(product.price / 100).toFixed(2)}€</span>
              ${product.originalPrice && product.originalPrice > product.price ? `<span class="text-sm text-gray-400 line-through">${(product.originalPrice / 100).toFixed(2)}€</span>` : ''}
            </div>
            ${product.rating ? `
            <div class="mt-2 flex items-center gap-1">
              <span class="text-sm font-semibold text-gray-900">${product.rating}</span>
              <span class="text-yellow-400">★</span>
              <span class="text-xs text-gray-500">(${product.reviews})</span>
            </div>
            ` : ''}
          </a>
        `).join('');
      } else {
        grid.innerHTML = '<div class="col-span-full text-center py-12"><p class="text-xl text-gray-600">No hay productos disponibles con esos filtros</p></div>';
      }
    }
  }, [priceRange, selectedCategory, products]);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.currentTarget.value);
    setPriceRange([priceRange[0], value]);
  };

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.currentTarget.value);
    setPriceRange([value, priceRange[1]]);
  };

  const resetFilters = () => {
    setPriceRange([0, maxPrice]);
    setSelectedCategory('');
  };

  return (
    <div className="bg-white rounded-lg p-6 sticky top-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-black text-gray-900">Filtros</h2>
        <button
          onClick={resetFilters}
          className="text-sm text-[#00aa45] hover:text-[#009340] font-semibold transition-colors"
        >
          Limpiar
        </button>
      </div>

      {/* Filtro de Precio */}
      <div className="mb-8 pb-8 border-b border-gray-200">
        <h3 className="text-lg font-black text-gray-900 mb-4">Rango de Precio</h3>
        
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs text-gray-600 font-semibold block mb-2">
                Mín: {priceRange[0]}€
              </label>
              <input
                type="range"
                min="0"
                max={maxPrice}
                value={priceRange[0]}
                onChange={handleMinPriceChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#00aa45]"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-600 font-semibold block mb-2">
                Máx: {Math.round(priceRange[1])}€
              </label>
              <input
                type="range"
                min="0"
                max={maxPrice}
                value={priceRange[1]}
                onChange={handlePriceChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#00aa45]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filtro de Categoría */}
      <div className="mb-8">
        <h3 className="text-lg font-black text-gray-900 mb-4">Categoría</h3>
        
        <div className="space-y-3">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="category"
              value=""
              checked={selectedCategory === ''}
              onChange={(e) => setSelectedCategory(e.currentTarget.value)}
              className="w-4 h-4 rounded accent-[#00aa45] cursor-pointer"
            />
            <span className="ml-3 text-gray-700 font-semibold">Todas las categorías</span>
          </label>

          {categories.map(category => (
            <label key={category.id} className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="category"
                value={category.id}
                checked={selectedCategory === category.id}
                onChange={(e) => setSelectedCategory(e.currentTarget.value)}
                className="w-4 h-4 rounded accent-[#00aa45] cursor-pointer"
              />
              <span className="ml-3 text-gray-700 font-semibold">{category.nombre}</span>
              <span className="ml-auto text-xs text-gray-500">
                {products.filter(p => p.categoryId === category.id).length}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Información de Filtros Activos */}
      {(priceRange[1] < maxPrice || selectedCategory) && (
        <div className="p-4 bg-[#e2ff7a] rounded-lg text-sm text-gray-900">
          <p className="font-semibold">
            {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
