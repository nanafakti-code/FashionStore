import { useState, useEffect, useRef } from "preact/hooks";

interface ProductResult {
  id: string;
  nombre: string;
  precio: number;
  imagen: string;
  slug: string;
}

export default function MobileSearchBar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<ProductResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeout = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null); // Changed to container div

  useEffect(() => {
    // Cerrar dropdown al hacer click fuera
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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

    searchTimeout.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
        if (response.ok) {
          const data = await response.json();
          setResults(data);
        } else {
          setResults([]);
        }
      } catch (error) {
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
    setShowDropdown(false);
  };

  return (
    <div className="md:hidden relative" ref={containerRef}>
      <form onSubmit={handleSearchSubmit} className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex gap-2 items-center relative">
          <input
            type="text"
            placeholder="Busca productos..."
            value={searchTerm}
            onInput={handleSearchInput}
            className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#00aa45] text-sm"
          />
          {loading && (
            <div className="absolute right-14 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#00aa45]"></div>
            </div>
          )}
          <button
            type="submit"
            className="bg-[#00aa45] text-white px-4 py-2 rounded-lg hover:bg-[#009340] font-bold transition text-sm"
          >
            🔍
          </button>
        </div>
      </form>

      {/* RESULTADOS DROPDOWN MÓVIL */}
      {showDropdown && (searchTerm.trim().length > 0) && (
        <div className="absolute top-full left-0 right-0 bg-white shadow-xl border-b border-gray-200 z-[100] max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500 text-sm">Buscando...</div>
          ) : results.length > 0 ? (
            <>
              <ul>
                {results.map((product) => (
                  <li key={product.id}>
                    <a
                      href={`/productos/${product.slug}`}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 block"
                      onClick={(e) => {
                        e.preventDefault();
                        handleResultClick(product.slug);
                      }}
                    >
                      <img
                        src={product.imagen}
                        alt={product.nombre}
                        className="w-10 h-10 object-cover rounded-md flex-shrink-0"
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
                className="block p-3 text-center text-sm font-bold text-[#00aa45] bg-gray-50"
              >
                Ver todos ({results.length}+)
              </a>
            </>
          ) : (
            <div className="p-4 text-center">
              <p className="text-gray-500 text-xs">No se encontraron productos</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
