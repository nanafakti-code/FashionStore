import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

interface Brand {
  id: string;
  nombre: string;
  slug: string;
  descripcion?: string;
  logo_url?: string;
  activo: boolean;
  creada_en: string;
}

const AdminBrands = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ nombre: '', slug: '', descripcion: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Supabase client for READ operations only (RLS allows read)
  const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('marcas')
        .select('*')
        .order('nombre');

      if (error) throw error;
      setBrands(data || []);
    } catch (error) {
      console.error('Error loading brands:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (nombre: string) => {
    return nombre
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const handleSave = async () => {
    if (!formData.nombre) return;

    const dataToSave = {
      ...formData,
      slug: formData.slug || generateSlug(formData.nombre)
    };

    setSaving(true);
    try {
      const response = await fetch('/api/admin/marcas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: editingId ? 'update' : 'create',
          id: editingId,
          ...dataToSave
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error guardando marca');
      }

      loadBrands();
      resetForm();
    } catch (error) {
      console.error('Error saving brand:', error);
      alert('Error al guardar: ' + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteConfirm(null);
    try {
      const response = await fetch('/api/admin/marcas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error eliminando marca');
      }

      loadBrands();
    } catch (error) {
      console.error('Error deleting brand:', error);
      alert('Error al eliminar: ' + (error as Error).message);
    }
  };

  const resetForm = () => {
    setFormData({ nombre: '', slug: '', descripcion: '' });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin">
          <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
              </svg>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Marcas</h3>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                  {brands.length} marcas registradas
                </span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Buscar marcas..."
                  value={searchTerm}
                  onChange={(e: any) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all text-sm"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button
                onClick={() => setShowForm(!showForm)}
                className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 shadow-sm shadow-green-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                </svg>
                Nueva Marca
              </button>
            </div>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50/50">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre de la Marca *</label>
                  <input
                    type="text"
                    placeholder="Ej: Apple"
                    value={formData.nombre}
                    onChange={(e: any) => setFormData({
                      ...formData,
                      nombre: e.target.value,
                      slug: generateSlug(e.target.value)
                    })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Slug (URL)</label>
                  <input
                    type="text"
                    placeholder="apple"
                    value={formData.slug}
                    onChange={(e: any) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Descripción</label>
                  <textarea
                    placeholder="Información sobre la marca..."
                    value={formData.descripcion}
                    onChange={(e: any) => setFormData({ ...formData, descripcion: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all resize-none bg-white/50 backdrop-blur-sm"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`flex-1 sm:flex-none bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 shadow-sm shadow-green-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Guardando...
                    </>
                  ) : (
                    editingId ? 'Actualizar' : 'Guardar'
                  )}
                </button>
                <button
                  onClick={resetForm}
                  disabled={saving}
                  className="flex-1 sm:flex-none bg-gray-200 text-gray-700 px-6 py-2.5 rounded-xl font-semibold hover:bg-gray-300 transition-all disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Brands Grid - Card Layout */}
      {brands.filter(brand =>
        brand.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        brand.slug.toLowerCase().includes(searchTerm.toLowerCase())
      ).length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {brands.filter(brand =>
            brand.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            brand.slug.toLowerCase().includes(searchTerm.toLowerCase())
          ).map((brand) => (
            <div
              key={brand.id}
              className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-green-900/5 transition-all duration-500 group relative flex flex-col hover:-translate-y-2 p-6"
            >
              {/* Status & Slug */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded-full border border-emerald-100">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-tighter">Activo</span>
                </div>
                <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  /{brand.slug}
                </span>
              </div>

              {/* Content */}
              <div>
                <h4 className="font-bold text-gray-900 text-xl tracking-tight mb-2">{brand.nombre}</h4>

                <p className="text-sm text-gray-500 line-clamp-2 mb-4 min-h-[2.5rem]">
                  {brand.descripcion || 'Sin descripción'}
                </p>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setFormData({
                        nombre: brand.nombre,
                        slug: brand.slug,
                        descripcion: brand.descripcion || ''
                      });
                      setEditingId(brand.id);
                      setShowForm(true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex-1 bg-green-50 text-green-700 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-green-100 transition-all flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
                    </svg>
                    Editar
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(brand.id)}
                    className="flex-1 bg-red-50 text-red-600 px-3 py-2 rounded-xl font-semibold hover:bg-red-100 transition-all text-sm flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-9l-1 1H5v2h14V4z" />
                    </svg>
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-16 text-center max-w-lg mx-auto overflow-hidden relative">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full blur-3xl -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -ml-16 -mb-16" />

          <div className="relative z-10">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center mx-auto mb-6 shadow-sm border border-green-100/50">
              <svg className="w-12 h-12 text-green-600 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h4 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">Sin Marcas</h4>
            <p className="text-gray-500 font-medium mb-8 leading-relaxed">
              Comienza registrando las marcas de tus productos para darles una identidad única en la tienda.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-green-600 text-white px-8 py-3 rounded-2xl font-bold shadow-xl shadow-green-200 hover:bg-green-700 transition-all active:scale-95"
            >
              Registrar Primera Marca
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Eliminar Marca</h3>
            </div>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar esta marca? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-semibold hover:bg-red-700 transition-all"
              >
                Eliminar
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-xl font-semibold hover:bg-gray-300 transition-all"
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

export default AdminBrands;
