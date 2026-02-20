import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase'; // Usar cliente compartido
// import { createClient } from '@supabase/supabase-js'; // REMOVED

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
  valoracion_promedio?: number;
  total_resenas?: number;
}

// const supabase = createClient( // REMOVED
//   import.meta.env.PUBLIC_SUPABASE_URL,
//   import.meta.env.PUBLIC_SUPABASE_ANON_KEY
// );

interface Category {
  id: string;
  nombre: string;
}

interface Brand {
  id: string;
  nombre: string;
}

interface Variant {
  id: string;
  producto_id: string;
  talla: string;
  color?: string;
  stock: number;
  sku_variante?: string;
  precio_adicional: number;
  imagen_url?: string;
  capacidad?: string;
}

interface VariantConfig {
  hasCapacity: boolean;
  hasColor: boolean;
  activeCapacities: string[];
  activeColors: string[];
}

const AdminProductos = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [variants, setVariants] = useState<Map<string, Variant[]>>(new Map());
  const [editingVariants, setEditingVariants] = useState<Variant[]>([]);
  const [pendingDeletions, setPendingDeletions] = useState<string[]>([]);  // 🛡️ Track variants to delete explicitly
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

  // const supabase = createClient( // REMOVED
  //   import.meta.env.PUBLIC_SUPABASE_URL,
  //   import.meta.env.PUBLIC_SUPABASE_ANON_KEY
  // );

  const [newVariant, setNewVariant] = useState({ talla: '', capacidad: '', color: '', stock: 0, imagen_url: '', precio: '' });
  const [variantConfig, setVariantConfig] = useState<VariantConfig>({ hasCapacity: false, hasColor: false, activeCapacities: [], activeColors: [] });

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

      const [productsRes, categoriesRes, brandsRes, imagesRes, variantsRes] = await Promise.all([
        fetch('/api/admin/productos', { credentials: 'include' }).then(r => r.json()),
        supabase.from('categorias').select('id, nombre').order('nombre'),
        supabase.from('marcas').select('id, nombre').order('nombre'),
        supabase.from('imagenes_producto').select('*'),
        supabase.from('variantes_producto').select('*').order('talla')
      ]);

      console.log('Datos de productos cargados:', productsRes);
      console.log('Variantes cargadas:', variantsRes.data);

      // Mapear imágenes a productos
      let productsWithImages = Array.isArray(productsRes) ? productsRes : productsRes.data || [];
      if (imagesRes.data && imagesRes.data.length > 0) {
        const imageMap: { [key: string]: string } = {};
        imagesRes.data.forEach((img: any) => {
          if (!imageMap[img.producto_id]) {
            imageMap[img.producto_id] = img.url || img.imagen_url || img.ruta;
          }
        });

        productsWithImages = productsWithImages.map((p: any) => ({
          ...p,
          imagen_url: imageMap[p.id] || p.imagen_url
        }));
      }

      // Mapear variantes a productos
      const variantsMap = new Map<string, Variant[]>();
      if (variantsRes.data && variantsRes.data.length > 0) {
        variantsRes.data.forEach((v: Variant) => {
          if (!variantsMap.has(v.producto_id)) {
            variantsMap.set(v.producto_id, []);
          }
          variantsMap.get(v.producto_id)!.push(v);
        });
      }
      setVariants(variantsMap);

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
        precio_venta: Math.round((parseFloat(formData.precio_venta as string) || 0) * 100),
        costo: Math.round((parseFloat(formData.costo as string) || 0) * 100),
        // stock_total: formData.stock_total || 0, // REMOVED: Managed by DB trigger only
        categoria_id: formData.categoria_id || null,
        marca_id: formData.marca_id || null,
        activo: formData.activo
      };

      // Enviar variantes tanto para CREATE como para UPDATE
      // Si hay variantes en edición/creación, enviarlas
      // Enviar variantes tanto para CREATE como para UPDATE
      // 🛡️ PRESERVATION: Only send variants that exist, never trigger auto-delete
      // Note: precio_adicional is already stored in cents in state
      dataToSave.variants = editingVariants.map(v => ({
        id: v.id.startsWith('temp-') ? undefined : v.id, // No enviar ID temporal
        talla: v.talla,
        capacidad: v.capacidad,
        color: v.color,
        stock: v.stock,
        imagen_url: v.imagen_url,
        precio: v.precio_adicional || 0 // ✅ Already in cents, send directly
      }));

      // 🛡️ EXPLICIT DELETIONS: Only delete variants the user explicitly removed
      if (pendingDeletions.length > 0) {
        dataToSave.variantsToDelete = pendingDeletions.filter(id => !id.startsWith('temp-'));
      }

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
        credentials: 'include',
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
          credentials: 'include',
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
        credentials: 'include',
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
      precio_venta: '' as any,
      costo: '' as any,
      stock_total: '',
      imagen_url: '',
      categoria_id: '',
      marca_id: '',
      sku: '',
      activo: true
    });
    setEditingId(null);
    setShowForm(false);
    setEditingVariants([]);
    setPendingDeletions([]);  // 🛡️ Clear pending deletions on reset
    setVariantConfig({ hasCapacity: false, hasColor: false, activeCapacities: [], activeColors: [] });
  };

  const updateVariantStockLocal = (variantId: string, newStock: number) => {
    // Solo actualizar estado local, no guardar en BD
    setEditingVariants(prevVariants =>
      prevVariants.map(v =>
        v.id === variantId ? { ...v, stock: newStock } : v
      )
    );
  };

  const handleAddVariant = () => {
    // Validación según la estrategia seleccionada
    if (variantConfig.hasCapacity && !newVariant.capacidad) {
      showNotification('error', 'La capacidad es obligatoria');
      return;
    }
    if (variantConfig.hasColor && !newVariant.color) {
      showNotification('error', 'El color es obligatorio');
      return;
    }
    if (!variantConfig.hasCapacity && !variantConfig.hasColor && !newVariant.talla) {
      showNotification('error', 'Debes indicar al menos una propiedad (Talla, Capacidad o Color)');
      return;
    }

    const tempId = `temp-${Date.now()}`;

    // Normalizar datos
    const targetCapacity = variantConfig.hasCapacity ? newVariant.capacidad : '';
    const targetColor = variantConfig.hasColor ? newVariant.color : '';
    const targetTalla = (!variantConfig.hasCapacity && !variantConfig.hasColor) ? newVariant.talla : '';

    // 🎨 COLOR-BASED IMAGE SYNC: Find existing image for this color
    let imageToUse = newVariant.imagen_url;
    if (targetColor && !imageToUse) {
      const existingColorVariant = editingVariants.find(v => (v.color || '') === targetColor && v.imagen_url);
      if (existingColorVariant) {
        imageToUse = existingColorVariant.imagen_url || '';  // ✅ Provide fallback for undefined
      }
    }

    // Buscar si ya existe una variante con esta combinación (Logica de Preservación)
    const existingIndex = editingVariants.findIndex(v => {
      const sameCap = (v.capacidad || '') === targetCapacity;
      const sameCol = (v.color || '') === targetColor;
      const sameTalla = (v.talla || '') === targetTalla;
      return sameCap && sameCol && sameTalla;
    });

    if (existingIndex >= 0) {
      // ACTUALIZAR existente (Preservar ID)
      const updatedVariants = [...editingVariants];
      const existing = updatedVariants[existingIndex];

      if (existing) {
        const newImageUrl = newVariant.imagen_url || existing.imagen_url;

        updatedVariants[existingIndex] = {
          ...existing,
          stock: newVariant.stock > 0 ? newVariant.stock : existing.stock,
          precio_adicional: newVariant.precio ? Math.round(parseFloat(newVariant.precio) * 100) : existing.precio_adicional,  // ✅ Convert euros to cents
          imagen_url: newImageUrl
        } as Variant;

        // 🎨 COLOR-BASED IMAGE SYNC: If image changed and color exists, sync across all same-color variants
        if (newVariant.imagen_url && targetColor) {
          updatedVariants.forEach((v, idx) => {
            if ((v.color || '') === targetColor && idx !== existingIndex) {
              updatedVariants[idx] = { ...v, imagen_url: newImageUrl };
            }
          });
        }

        setEditingVariants(updatedVariants);
        showNotification('success', 'Variante existente actualizada');
      }
    } else {
      // CREAR nueva
      const variantToAdd: Variant = {
        id: tempId,
        producto_id: editingId || 'temp',
        talla: targetTalla,
        capacidad: targetCapacity,
        color: targetColor,
        stock: newVariant.stock,
        imagen_url: imageToUse || '',
        precio_adicional: Math.round((parseFloat(newVariant.precio) || 0) * 100)  // ✅ Convert euros to cents
      };

      // 🎨 COLOR-BASED IMAGE SYNC for new variants: if we have a new image, sync all same-color variants
      let updatedVariants = [...editingVariants, variantToAdd];
      if (newVariant.imagen_url && targetColor) {
        updatedVariants = updatedVariants.map(v => {
          if ((v.color || '') === targetColor) {
            return { ...v, imagen_url: newVariant.imagen_url };
          }
          return v;
        });
      }

      setEditingVariants(updatedVariants);
      showNotification('success', 'Variante añadida');
    }

    // Resetear form (mantener estrategia)
    setNewVariant({ talla: '', capacidad: '', color: '', stock: 0, imagen_url: '', precio: '' });

    // Actualizar listas de activos en config
    if (targetCapacity && !variantConfig.activeCapacities.includes(targetCapacity)) {
      setVariantConfig(prev => ({ ...prev, activeCapacities: [...prev.activeCapacities, targetCapacity] }));
    }
    if (targetColor && !variantConfig.activeColors.includes(targetColor)) {
      setVariantConfig(prev => ({ ...prev, activeColors: [...prev.activeColors, targetColor] }));
    }
  };

  const handleRemoveVariant = (id: string) => {
    // 🛡️ EXPLICIT DELETE: Track this deletion for API call
    if (!id.startsWith('temp-')) {
      setPendingDeletions(prev => [...prev, id]);
    }
    setEditingVariants(editingVariants.filter(v => v.id !== id));
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
        <div className={`fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg text-white font-semibold max-w-sm animate-in fade-in z-50 ${notification.type === 'success' ? 'bg-[#00aa45]' :
          notification.type === 'error' ? 'bg-red-600' :
            'bg-blue-600'
          }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' && (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
              </svg>
            )}
            {notification.type === 'error' && (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
              </svg>
            )}
            {notification.type === 'info' && (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
              </svg>
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Búsqueda y Botón Crear */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm-8 9H8v-1h4v1zm2-4H8V8h6v1zm0-2H8V6h6v1z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Gestión de Productos</h3>
                <p className="text-sm text-gray-500">{filteredProducts.length} productos</p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg shadow-blue-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
              <span className="hidden sm:inline">Nuevo Producto</span>
              <span className="sm:hidden">Nuevo</span>
            </button>
          </div>

          <input
            type="text"
            placeholder="Buscar por nombre o SKU..."
            value={searchTerm}
            onChange={(e: any) => setSearchTerm(e.target.value)}
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
                  onChange={(e: any) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Categoría *</label>
                <select
                  value={formData.categoria_id}
                  onChange={(e: any) => setFormData({ ...formData, categoria_id: e.target.value })}
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
                  onChange={(e: any) => setFormData({ ...formData, marca_id: e.target.value })}
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
                  onChange={(e: any) => setFormData({ ...formData, precio_venta: e.target.value ? (parseFloat(e.target.value) as any) : '' })}
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
                  onChange={(e: any) => setFormData({ ...formData, costo: e.target.value ? (parseFloat(e.target.value) as any) : '' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Stock Total (unidades) <span className="text-blue-600 text-xs font-normal">(Suma de variantes)</span>
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={editingVariants.reduce((sum, v) => sum + (v.stock || 0), 0)}
                  readOnly={true}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed font-bold"
                  title="El stock se calcula automáticamente sumando las variantes"
                />
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-semibold text-gray-700 mb-2">URL Imagen</label>
                <input
                  type="text"
                  placeholder="https://ejemplo.com/imagen.jpg"
                  value={formData.imagen_url}
                  onChange={(e: any) => setFormData({ ...formData, imagen_url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción *</label>
              <textarea
                placeholder="Describe el producto en detalle..."
                value={formData.descripcion}
                onChange={(e: any) => setFormData({ ...formData, descripcion: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 mb-4"
                rows={4}
              />
            </div>

            {/* Sección de Variantes (Siempre visible si hay variantes o para añadir) */}
            <div className="mt-6 p-4 bg-white rounded-lg border-2 border-blue-200">
              <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
                Gestión de Variantes ({editingVariants.length})
              </h4>

              {/* Configuración de Estrategia de Variantes */}
              {/* 🛡️ PRESERVATION GUARANTEE: Toggling these checkboxes does NOT delete existing variant data.
                  Variants are only removed via explicit user action (clicking the X button). */}
              <div className="mb-6 bg-blue-50 p-4 rounded-lg flex flex-wrap gap-6 items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    checked={variantConfig.hasCapacity}
                    onChange={(e: any) => {
                      // ✅ Config change preserves all existing variant data
                      setVariantConfig(prev => ({ ...prev, hasCapacity: e.target.checked }));
                    }}
                  />
                  <span className="font-semibold text-gray-700">Tiene Capacidades (Ej: 64GB, 128GB)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    checked={variantConfig.hasColor}
                    onChange={(e: any) => {
                      // ✅ Config change preserves all existing variant data
                      setVariantConfig(prev => ({ ...prev, hasColor: e.target.checked }));
                    }}
                  />
                  <span className="font-semibold text-gray-700">Tiene Colores</span>
                </label>
              </div>

              {/* Generador de Variantes Estructuradas */}
              {(variantConfig.hasCapacity || variantConfig.hasColor) && (
                <div className="mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg">
                  <h5 className="font-semibold text-gray-700 mb-3">Generador de Variantes</h5>
                  <div className="flex flex-wrap gap-3 items-end">

                    {variantConfig.hasCapacity && (
                      <div className="flex-1 min-w-[150px]">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Capacidad</label>
                        <input
                          type="text"
                          placeholder="Ej: 256GB"
                          value={newVariant.capacidad}
                          onChange={(e: any) => setNewVariant({ ...newVariant, capacidad: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:border-blue-500"
                        />
                      </div>
                    )}

                    {variantConfig.hasCapacity && (
                      <div className="w-32">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Sobreprecio (+€)</label>
                        <input
                          type="number"
                          placeholder="+200"
                          step="0.01"
                          value={newVariant.precio}
                          onChange={(e: any) => setNewVariant({ ...newVariant, precio: e.target.value })}
                          className="w-full px-3 py-2 border border-blue-300 rounded focus:border-blue-500"
                          title="Diferencia de precio respecto al precio base (ej: +200 para una capacidad superior)"
                        />
                      </div>
                    )}

                    {variantConfig.hasColor && (
                      <div className="flex-1 min-w-[150px]">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Color</label>
                        <input
                          type="text"
                          placeholder="Ej: Negro Espacial"
                          value={newVariant.color}
                          onChange={(e: any) => setNewVariant({ ...newVariant, color: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:border-blue-500"
                        />
                      </div>
                    )}

                    {variantConfig.hasColor && (
                      <div className="flex-[2] min-w-[200px]">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Imagen URL (Color)</label>
                        <input
                          type="text"
                          placeholder="https://... (se sincroniza por color)"
                          value={newVariant.imagen_url}
                          onChange={(e: any) => setNewVariant({ ...newVariant, imagen_url: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:border-blue-500"
                          title="Esta imagen se aplicará a todas las variantes con el mismo color"
                        />
                      </div>
                    )}

                    <div className="w-24">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Stock</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={newVariant.stock}
                        onChange={(e: any) => setNewVariant({ ...newVariant, stock: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded"
                      />
                    </div>

                    <button
                      onClick={handleAddVariant}
                      className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 transition mb-[1px]"
                    >
                      Añadir
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    * Si añades una capacidad y color, el sistema buscará si ya existe esa combinación para no duplicarla.
                  </p>
                </div>
              )}

              {/* Lista de Variantes Agrupada */}
              {editingVariants.length > 0 ? (
                <div className="space-y-6">
                  {/* Agrupar por Capacidad (o mostrar todas si no hay capacidad) */}
                  {Array.from(new Set(editingVariants.map(v => v.capacidad || 'Sin Capacidad'))).sort().map(capGroup => {
                    const groupVariants = editingVariants.filter(v => (v.capacidad || 'Sin Capacidad') === capGroup);

                    return (
                      <div key={capGroup} className="bg-white border rounded-lg overflow-hidden">
                        <div className="bg-gray-100 px-4 py-2 border-b flex justify-between items-center">
                          <h5 className="font-bold text-gray-800">{capGroup === 'Sin Capacidad' ? 'Variantes Generales' : `${capGroup}`}</h5>
                          <span className="text-xs bg-gray-200 px-2 py-1 rounded-full text-gray-600">{groupVariants.length} variantes</span>
                        </div>

                        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {groupVariants.map(variant => (
                            <div key={variant.id} className={`p-3 rounded-lg border-2 relative group ${variant.stock > 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                              <button
                                onClick={() => handleRemoveVariant(variant.id)}
                                className="absolute top-1 right-1 text-red-500 hover:text-red-700 p-1 bg-white/50 rounded-full hover:bg-white transition-all shadow-sm opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                                title="Eliminar variante"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L10 10 5.707 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>

                              <div className="pr-6">
                                <div className="flex items-center gap-2 mb-1">
                                  {variant.color ? (
                                    <span className="font-bold text-gray-900">{variant.color}</span>
                                  ) : (
                                    <span className="font-bold text-gray-500 italic">Estándar</span>
                                  )}
                                  {variant.talla && <span className="text-xs bg-white border px-1 rounded">{variant.talla}</span>}
                                </div>

                                <div className="text-xs text-gray-600 flex flex-col gap-1">
                                  {variant.precio_adicional > 0 && (
                                    <span className="text-green-600 font-bold">€{(variant.precio_adicional / 100).toFixed(2)}</span>
                                  )}
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="font-semibold">Stock:</span>
                                    <input
                                      type="number"
                                      min="0"
                                      className="w-16 px-1 py-0.5 border rounded text-right bg-white"
                                      value={variant.stock.toString()}
                                      onChange={(e: any) => updateVariantStockLocal(variant.id, parseInt(e.target.value) || 0)}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <p>No hay variantes añadidas.</p>
                  <p className="text-sm">Configura la estrategia arriba y añade variantes.</p>
                </div>
              )}

              <p className="text-xs text-gray-500 mt-3 italic">
                💡 Los cambios se guardarán al hacer clic en "Guardar"
              </p>
            </div>

            <div className="flex gap-4 mt-6">
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const productVariants = variants.get(product.id) || [];
            const totalVariantStock = productVariants.reduce((sum, v) => sum + v.stock, 0);
            const displayStock = productVariants.length > 0 ? totalVariantStock : product.stock_total;

            return (
              <div
                key={product.id}
                ref={el => {
                  if (el) productRefMap.current[product.id] = el;
                }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group"
              >
                {/* Imagen con overlay de estado */}
                <div className="relative h-64 bg-white flex items-center justify-center overflow-hidden border-b border-gray-100">
                  {product.imagen_url ? (
                    <img src={product.imagen_url} alt={product.nombre} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <svg className="w-16 h-16 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                    </svg>
                  )}
                  {/* Estado badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${product.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {product.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  {/* Stock badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${displayStock > 10 ? 'bg-blue-100 text-blue-700' : displayStock > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                      Stock: {displayStock}
                    </span>
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1">{product.nombre}</h3>
                      {product.sku && (
                        <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">SKU: {product.sku}</span>
                      )}
                    </div>
                    <span className="text-xl font-black text-blue-600 whitespace-nowrap">{(product.precio_venta / 100).toFixed(2)}€</span>
                  </div>

                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{product.descripcion || 'Sin descripción'}</p>

                  {/* Valoración */}
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-1.5">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map(star => (
                          <svg key={star} className={`w-4 h-4 ${star <= Math.round(product.valoracion_promedio || 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm font-semibold text-gray-700">{Number(product.valoracion_promedio || 0).toFixed(1)}</span>
                    </div>
                    <span className="text-xs text-gray-400">{product.total_resenas || 0} reseñas</span>
                  </div>

                  {/* Variantes */}
                  {productVariants.length > 0 && (
                    <div className="mb-4">
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">Variantes ({productVariants.length})</p>
                      <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                        {productVariants.slice(0, 8).map(v => (
                          <span key={v.id} className={`px-2 py-1 rounded-lg text-[10px] font-medium border ${v.stock > 0 ? 'bg-white border-gray-200 text-gray-700' : 'bg-red-50 border-red-200 text-red-600 line-through'}`}>
                            {v.talla}{v.color ? ` / ${v.color}` : ''} <span className="font-bold">({v.stock})</span>
                          </span>
                        ))}
                        {productVariants.length > 8 && (
                          <span className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-gray-100 text-gray-500">+{productVariants.length - 8} más</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Acciones */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setFormData({
                          nombre: product.nombre,
                          descripcion: product.descripcion || '',
                          precio_venta: (product.precio_venta / 100) as any,
                          costo: ((product.costo || 0) / 100) as any,
                          stock_total: (product.stock_total as any) || '',
                          imagen_url: product.imagen_url || '',
                          categoria_id: product.categoria_id || '',
                          marca_id: product.marca_id || '',
                          sku: product.sku || '',
                          activo: product.activo
                        });
                        setEditingId(product.id);
                        setEditingVariants(productVariants);
                        setShowForm(true);

                        // Scroll al formulario
                        setTimeout(() => {
                          formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 100);
                      }}
                      className="flex-1 bg-blue-600 text-white px-3 py-2 rounded font-semibold hover:bg-blue-700 transition text-sm flex items-center justify-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
                      </svg>
                      Editar
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(product.id)}
                      className="flex-1 bg-red-600 text-white px-3 py-2 rounded font-semibold hover:bg-red-700 transition text-sm flex items-center justify-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-9l-1 1H5v2h14V4z" />
                      </svg>
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
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
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
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
