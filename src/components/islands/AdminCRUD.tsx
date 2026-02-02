import { useState, useEffect } from 'react';

interface Product {
  id: string;
  nombre: string;
  precio_venta: number;
  categoria?: string;
  creado_en?: string;
  slug?: string;
  descripcion?: string;
  stock_total?: number;
  activo?: boolean;
}

interface AdminCRUDProps {
  initialProducts?: Product[];
}

export default function AdminCRUD({ initialProducts = [] }: AdminCRUDProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    nombre: '',
    precio_venta: '',
    descripcion: '',
    stock_total: '',
    categoria: 'general',
  });

  // Cargar productos
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/admin/productos');
      if (response.ok) {
        const data = await response.json();
        setProducts(data || []);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      // Fallback a localStorage si la API falla
      const stored = localStorage.getItem('admin_products');
      if (stored) {
        try {
          setProducts(JSON.parse(stored));
        } catch (e) {
          console.error('Error loading from localStorage:', e);
        }
      }
    }
  };

  // Manejar cambios en el formulario
  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Crear nuevo producto
  const handleCreateProduct = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.nombre.trim() || !formData.precio_venta || isNaN(Number(formData.precio_venta))) {
        setMessage('Completa todos los campos correctamente');
        setLoading(false);
        return;
      }

      const newProduct = {
        nombre: formData.nombre,
        precio_venta: Number(formData.precio_venta),
        descripcion: formData.descripcion,
        stock_total: Number(formData.stock_total) || 0,
        slug: formData.nombre.toLowerCase().replace(/\s+/g, '-'),
      };

      const response = await fetch('/api/admin/productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      });

      if (response.ok) {
        await fetchProducts();
        setFormData({ nombre: '', precio_venta: '', descripcion: '', stock_total: '', categoria: 'general' });
        setShowForm(false);
        setMessage('Producto creado exitosamente ✓');
        setTimeout(() => setMessage(''), 3000);
      } else {
        throw new Error('Error al crear producto');
      }
    } catch (error) {
      setMessage('Error al crear el producto');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Eliminar producto
  const handleDeleteProduct = async (id: string) => {
    // if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/productos/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchProducts();
        setMessage('Producto eliminado exitosamente ✓');
        setTimeout(() => setMessage(''), 3000);
      } else {
        throw new Error('Error al eliminar');
      }
    } catch (error) {
      setMessage('Error al eliminar el producto');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
    // }
  };

  // Editar producto
  const handleEditProduct = (product: Product) => {
    setFormData({
      nombre: product.nombre,
      precio_venta: product.precio_venta.toString(),
      descripcion: product.descripcion || '',
      stock_total: (product.stock_total || 0).toString(),
      categoria: product.categoria || 'general',
    });
    setEditingId(product.id);
    setShowForm(true);
  };

  // Actualizar producto
  const handleUpdateProduct = async (e: any) => {
    e.preventDefault();
    if (!editingId) return;

    setLoading(true);
    try {
      if (!formData.nombre.trim() || !formData.precio_venta || isNaN(Number(formData.precio_venta))) {
        setMessage('Completa todos los campos correctamente');
        setLoading(false);
        return;
      }

      const updatedProduct = {
        nombre: formData.nombre,
        precio_venta: Number(formData.precio_venta),
        descripcion: formData.descripcion,
        stock_total: Number(formData.stock_total) || 0,
      };

      const response = await fetch(`/api/admin/productos/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProduct),
      });

      if (response.ok) {
        await fetchProducts();
        setFormData({ nombre: '', precio_venta: '', descripcion: '', stock_total: '', categoria: 'general' });
        setEditingId(null);
        setShowForm(false);
        setMessage('Producto actualizado exitosamente ✓');
        setTimeout(() => setMessage(''), 3000);
      } else {
        throw new Error('Error al actualizar');
      }
    } catch (error) {
      setMessage('Error al actualizar el producto');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({ nombre: '', precio_venta: '', descripcion: '', stock_total: '', categoria: 'general' });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Mensaje de estado */}
      {message && (
        <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg animate-pulse">
          {message}
        </div>
      )}

      {/* Botón crear producto */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="bg-[#00aa45] text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition-colors inline-flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Crear Nuevo Producto
        </button>
      )}

      {/* Formulario */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg border-2 border-[#00aa45]">
          <h3 className="text-2xl font-bold mb-4">
            {editingId ? 'Editar Producto' : 'Crear Nuevo Producto'}
          </h3>

          <form onSubmit={editingId ? handleUpdateProduct : handleCreateProduct} className="space-y-4">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre del Producto
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                placeholder="Ej: Vestido Midi Floral"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aa45]"
                required
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange as any}
                placeholder="Ej: Vestido Midi Floral - describe los detalles..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aa45]"
                rows={3}
              />
            </div>

            {/* Precio */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Precio de Venta (€) *
                </label>
                <input
                  type="number"
                  name="precio_venta"
                  value={formData.precio_venta}
                  onChange={handleInputChange}
                  placeholder="Ej: 89.99"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aa45]"
                  required
                />
              </div>

              {/* Stock */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Stock Total (unidades) *
                </label>
                <input
                  type="number"
                  name="stock_total"
                  value={formData.stock_total}
                  onChange={handleInputChange}
                  placeholder="Ej: 25"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aa45]"
                />
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-[#00aa45] text-white rounded-lg font-bold hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Procesando...' : editingId ? 'Actualizar' : 'Crear Producto'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla de Productos */}
      {products.length > 0 ? (
        <div className="bg-white rounded-lg overflow-hidden shadow">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Nombre</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Precio</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Stock</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Estado</th>
                  <th className="px-6 py-3 text-right text-sm font-bold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-800 font-semibold">{product.nombre}</td>
                    <td className="px-6 py-4 text-gray-600">{product.precio_venta.toFixed(2)}€</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${(product.stock_total || 0) > 0
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                        }`}>
                        {product.stock_total || 0} uds
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${product.activo
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                        }`}>
                        {product.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm font-semibold"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        disabled={loading}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm font-semibold disabled:opacity-50"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-gray-100 rounded-lg p-8 text-center">
          <p className="text-gray-600 text-lg">No hay productos registrados</p>
          <p className="text-gray-500 text-sm mt-2">Crea el primer producto haciendo clic en el botón superior</p>
        </div>
      )}

      {/* Estadísticas */}
      {products.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h4 className="font-bold text-gray-700 mb-4">📊 Estadísticas del Inventario</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-gray-600 text-sm">Total Productos</p>
              <p className="text-3xl font-bold text-[#00aa45]">{products.length}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-gray-600 text-sm">Stock Total</p>
              <p className="text-3xl font-bold text-blue-600">
                {products.reduce((sum, p) => sum + (p.stock_total || 0), 0)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-gray-600 text-sm">Valor Total</p>
              <p className="text-3xl font-bold text-green-600">
                {products.reduce((sum, p) => sum + p.precio_venta, 0).toFixed(2)}€
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-gray-600 text-sm">Productos Activos</p>
              <p className="text-3xl font-bold text-purple-600">
                {products.filter(p => p.activo).length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
