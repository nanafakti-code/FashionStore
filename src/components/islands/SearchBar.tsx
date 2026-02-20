import { useState, useEffect, useRef } from "preact/hooks";

interface ProductResult {
  id: string;
  nombre: string;
  precio: number;
  imagen: string;
  slug: string;
}

export default function SearchBar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<ProductResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeout = useRef<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Cerrar dropdown al hacer click fuera
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearchInput = (e: any) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Limpiar timeout anterior
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (value.trim().length === 0) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    setShowDropdown(true);

    // Debounce de 300ms
    searchTimeout.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
        if (response.ok) {
          const data = await response.json();
          setResults(data);
        } else {
          console.error("Error fetching search results");
          setResults([]);
        }
      } catch (error) {
        console.error("Error search:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleSearchSubmit = (e: Event) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      window.location.href = `/productos?q=${encodeURIComponent(searchTerm)}`;
      setShowDropdown(false);
    }
  };

  const handleResultClick = (slug: string) => {
    window.location.href = `/productos/${slug}`;
    setShowDropdown(false); // Should redirect anyway
  };

  return (
    <div className="hidden md:flex flex-1 max-w-md mx-8 relative" ref={dropdownRef}>
      <form onSubmit={handleSearchSubmit} className="flex w-full gap-2 relative">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Busca productos..."
            value={searchTerm}
            onInput={handleSearchInput}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#00aa45] text-sm pr-10"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#00aa45]"></div>
            </div>
          )}
        </div>
        <button
          type="submit"
          className="bg-[#00aa45] text-white px-6 py-2 rounded-lg hover:bg-[#009340] font-bold transition text-sm"
        >
          Buscar
        </button>
      </form>

      {/* RESULTADOS DROPDOWN */}
      {showDropdown && (searchTerm.trim().length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-[100]">
          {loading ? (
            <div className="p-4 text-center text-gray-500 text-sm">Buscando...</div>
          ) : results.length > 0 ? (
            <>
              <ul className="max-h-96 overflow-y-auto">
                {results.map((product) => (
                  <li key={product.id}>
                    <a
                      href={`/productos/${product.slug}`}
                      className="flex items-center gap-4 p-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 block"
                      onClick={(e) => {
                        e.preventDefault();
                        handleResultClick(product.slug);
                      }}
                    >
                      <img
                        src={product.imagen}
                        alt={product.nombre}
                        className="w-12 h-12 object-cover rounded-md flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate text-sm">{product.nombre}</p>
                        <p className="text-[#00aa45] font-bold text-xs">{(product.precio).toFixed(2)} €</p>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
              <a
                href={`/productos?q=${encodeURIComponent(searchTerm)}`}
                className="block p-3 text-center text-sm font-bold text-[#00aa45] bg-gray-50 hover:bg-gray-100 transition-colors border-t border-gray-100"
              >
                Ver todos los resultados ({results.length}+)
              </a>
            </>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500 text-sm font-medium">No se encontraron productos</p>
              <p className="text-xs text-gray-400 mt-1">Intenta con otro término</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
