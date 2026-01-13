import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

interface Product {
  id: string;
  nombre: string;
  descripcion?: string;
  precio_venta: number;
  costo?: number;
  stock_total: number;
  imagen_url?: string;
  categoria_id?: string;
  marca_id?: string;
  sku?: string;
  activo: boolean;
  creado_en: string;
}

interface Category {
  id: string;
  nombre: string;
}

interface Brand {
  id: string;
  nombre: string;
}

const AdminProductos: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio_venta: '',
    costo: '',
    stock_total: '',
    imagen_url: '',
    categoria_id: '',
    marca_id: '',
    sku: '',
    activo: true
  });
  const [searchTerm, setSearchTerm] = useState('');
  const formRef = useRef<HTMLDivElement>(null);
  const productRefMap = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [productsRes, categoriesRes, brandsRes, imagesRes] = await Promise.all([
        fetch('/api/admin/productos').then(r => r.json()),
        supabase.from('categorias').select('id, nombre').order('nombre'),
        supabase.from('marcas').select('id, nombre').order('nombre'),
        supabase.from('imagenes_producto').select('*')
      ]);

      console.log('Datos de productos cargados:', productsRes);
      console.log('Imágenes cargadas:', imagesRes.data);

      // Mapear imágenes a productos
      let productsWithImages = Array.isArray(productsRes) ? productsRes : productsRes.data || [];
      if (imagesRes.data && imagesRes.data.length > 0) {
        const imageMap: { [key: string]: string } = {};
        imagesRes.data.forEach((img: any) => {
          if (!imageMap[img.producto_id]) {
            imageMap[img.producto_id] = img.url || img.imagen_url || img.ruta;
          }
        });
        
        productsWithImages = productsWithImages.map(p => ({
          ...p,
          imagen_url: imageMap[p.id] || p.imagen_url
        }));
      }

      setProducts(productsWithImages);
      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (brandsRes.data) setBrands(brandsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.nombre) {
      showNotification('error', 'El nombre del producto es obligatorio');
      return;
    }

    try {
      // Generar slug automáticamente a partir del nombre
      const generateSlug = (nombre: string) => {
        return nombre
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '') // Remover caracteres especiales
          .replace(/\s+/g, '-') // Reemplazar espacios con guiones
          .replace(/-+/g, '-') // Remover guiones múltiples
          .replace(/^-+|-+$/g, ''); // Remover guiones del inicio y fin
      };

      const dataToSave: any = {
        nombre: formData.nombre,
        slug: generateSlug(formData.nombre),
        descripcion: formData.descripcion,
        precio_venta: Math.round((formData.precio_venta || 0) * 100),
        costo: Math.round((formData.costo || 0) * 100),
        stock_total: formData.stock_total || 0,
        categoria_id: formData.categoria_id || null,
        marca_id: formData.marca_id || null,
        activo: formData.activo
      };

      // Solo incluir SKU si estamos editando (nunca incluir en crear, lo genera la BD)
      if (editingId && formData.sku && formData.sku.trim()) {
        dataToSave.sku = formData.sku;
      }

      let productId = editingId;
      const action = editingId ? 'update' : 'create';

      console.log('Enviando datos:', { action, dataToSave, id: editingId });

      const response = await fetch('/api/admin/productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, data: dataToSave, id: editingId })
      });

      const result = await response.json();

      if (!response.ok) {
        showNotification('error', `Error al guardar: ${result.error || 'Error desconocido'}`);
        console.error('Error response:', result);
        return;
      }

      productId = result.data?.id || editingId;
      console.log('Producto guardado:', productId);

      // Guardar imagen si se proporciona
      if (formData.imagen_url && productId) {
        console.log('Guardando imagen para producto:', productId);
        const imageResponse = await fetch('/api/admin/productos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'save-image', 
            data: { productId, url: formData.imagen_url } 
          })
        });

        const imageResult = await imageResponse.json();
        
        if (!imageResponse.ok) {
          console.error('Error al guardar imagen:', imageResult.error);
          showNotification('error', `Producto guardado pero hubo un problema con la imagen: ${imageResult.error || 'Error desconocido'}`);
        } else {
          console.log('Imagen guardada correctamente');
        }
      }

      const mensaje = editingId ? 'Producto actualizado correctamente' : 'Producto creado correctamente';
      showNotification('success', mensaje);
      loadData();
      
      // Scroll hacia el producto actualizado
      setTimeout(() => {
        if (editingId && productRefMap.current[editingId]) {
          productRefMap.current[editingId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
      
      resetForm();
    } catch (error) {
      console.error('Error saving product:', error);
      showNotification('error', `Error inesperado: ${(error as any).message}`);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteConfirm(null);
    try {
      const response = await fetch('/api/admin/productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id })
      });

      if (!response.ok) {
        showNotification('error', 'No se pudo eliminar el producto');
        return;
      }

      showNotification('success', 'Producto eliminado correctamente');
      loadData();
    } catch (error) {
      console.error('Error deleting product:', error);
      showNotification('error', 'Error al eliminar el producto');
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      precio_venta: 0,
      costo: 0,
      stock_total: '',
      imagen_url: '',
      categoria_id: '',
      marca_id: '',
      sku: '',
      activo: true
    });
    setEditingId(null);
    setShowForm(false);
  };

  const filteredProducts = products.filter(p =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin">
          <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notificación Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg text-white font-semibold max-w-sm animate-in fade-in z-50 ${
          notification.type === 'success' ? 'bg-[#00aa45]' :
          notification.type === 'error' ? 'bg-red-600' :
          'bg-blue-600'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' && (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
              </svg>
            )}
            {notification.type === 'error' && (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
              </svg>
            )}
            {notification.type === 'info' && (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
              </svg>
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Búsqueda y Botón Crear */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-0.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l0.03-.12 0.9-1.63h7.45c0.75 0 1.41-.41 1.75-1.03l3.58-6.49c0.08-.14 0.12-.31 0.12-.48 0-.55-.45-1-1-1H5.21l-0.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s0.89 2 1.99 2 2-0.9 2-2-0.9-2-2-2z"/>
              </svg>
              <h3 className="text-2xl font-bold text-gray-900">Gestión de Productos</h3>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-[#00aa45] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#009340] transition flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
              Nuevo Producto
            </button>
          </div>

          <input
            type="text"
            placeholder="Buscar por nombre o SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Formulario */}
        {showForm && (
          <div ref={formRef} className="px-6 py-4 border-b border-gray-200 bg-blue-50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre del Producto *</label>
                <input
                  type="text"
                  placeholder="Ej: iPhone 15 Pro Max"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Categoría *</label>
                <select
                  value={formData.categoria_id}
                  onChange={(e) => setFormData({...formData, categoria_id: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Seleccionar Categoría</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Marca *</label>
                <select
                  value={formData.marca_id}
                  onChange={(e) => setFormData({...formData, marca_id: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Seleccionar Marca</option>
                  {brands.map(brand => (
                    <option key={brand.id} value={brand.id}>{brand.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">SKU (Auto-generado)</label>
                <input
                  type="text"
                  placeholder="Se genera automáticamente"
                  value={formData.sku}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                  title="El SKU se genera automáticamente"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Precio Venta (€) *</label>
                <input
                  type="number"
                  placeholder="Ej: 1399.99"
                  step="0.01"
                  value={formData.precio_venta}
                  onChange={(e) => setFormData({...formData, precio_venta: e.target.value ? parseFloat(e.target.value) : ''})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Precio Costo (€)</label>
                <input
                  type="number"
                  placeholder="Ej: 900.00"
                  step="0.01"
                  value={formData.costo}
                  onChange={(e) => setFormData({...formData, costo: e.target.value ? parseFloat(e.target.value) : ''})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Stock Total (unidades) *</label>
                <input
                  type="number"
                  placeholder="Ej: 50"
                  value={formData.stock_total}
                  onChange={(e) => setFormData({...formData, stock_total: e.target.value ? parseInt(e.target.value) : ''})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-semibold text-gray-700 mb-2">URL Imagen</label>
                <input
                  type="text"
                  placeholder="https://ejemplo.com/imagen.jpg"
                  value={formData.imagen_url}
                  onChange={(e) => setFormData({...formData, imagen_url: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción *</label>
              <textarea
                placeholder="Describe el producto en detalle..."
                value={formData.descripcion}
                onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 mb-4"
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="bg-[#00aa45] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#009340]"
              >
                Guardar
              </button>
              <button
                onClick={resetForm}
                className="bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-500"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Grilla de Productos */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div 
              key={product.id} 
              ref={el => {
                if (el) productRefMap.current[product.id] = el;
              }}
              className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition"
            >
              {/* Imagen */}
              <div className="h-80 bg-white flex items-center justify-center overflow-hidden border border-gray-200">
                {product.imagen_url ? (
                  <img src={product.imagen_url} alt={product.nombre} className="w-full h-full object-contain" />
                ) : (
                  <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                  </svg>
                )}
              </div>

              {/* Contenido */}
              <div className="p-4">
                <h3 className="font-bold text-gray-900 mb-1">{product.nombre}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.descripcion || 'Sin descripción'}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Precio:</span>
                    <span className="font-bold text-blue-600">{(product.precio_venta / 100).toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Stock:</span>
                    <span className={`font-bold ${product.stock_total > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {product.stock_total}
                    </span>
                  </div>
                  {product.sku && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">SKU:</span>
                      <span className="text-xs font-mono text-gray-700">{product.sku}</span>
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setFormData({
                        nombre: product.nombre,
                        descripcion: product.descripcion || '',
                        precio_venta: product.precio_venta / 100,
                        costo: (product.costo || 0) / 100,
                        stock_total: product.stock_total,
                        imagen_url: product.imagen_url || '',
                        categoria_id: product.categoria_id || '',
                        marca_id: product.marca_id || '',
                        sku: product.sku || '',
                        activo: product.activo
                      });
                      setEditingId(product.id);
                      setShowForm(true);
                      
                      // Scroll al formulario
                      setTimeout(() => {
                        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 100);
                    }}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded font-semibold hover:bg-blue-700 transition text-sm flex items-center justify-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"/>
                    </svg>
                    Editar
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(product.id)}
                    className="flex-1 bg-red-600 text-white px-3 py-2 rounded font-semibold hover:bg-red-700 transition text-sm flex items-center justify-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-9l-1 1H5v2h14V4z"/>
                    </svg>
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-gray-600 font-semibold">No hay productos</p>
        </div>
      )}

      {/* Modal de confirmación para eliminar */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
              </svg>
              <h3 className="text-lg font-bold text-gray-900">Eliminar Producto</h3>
            </div>
            <p className="text-gray-700 mb-6">
              ¿Está seguro que desea eliminar este producto? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-red-600 text-white font-semibold py-2 rounded hover:bg-red-700 transition"
              >
                Eliminar
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-gray-200 text-gray-900 font-semibold py-2 rounded hover:bg-gray-300 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductos;
