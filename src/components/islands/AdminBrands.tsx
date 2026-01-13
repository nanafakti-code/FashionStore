import React, { useState, useEffect } from 'react';
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

const AdminBrands: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ nombre: '', slug: '', descripcion: '', logo_url: '' });

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

  const handleSave = async () => {
    if (!formData.nombre || !formData.slug) return;

    try {
      if (editingId) {
        await supabase
          .from('marcas')
          .update(formData)
          .eq('id', editingId);
      } else {
        await supabase
          .from('marcas')
          .insert([formData]);
      }
      loadBrands();
      resetForm();
    } catch (error) {
      console.error('Error saving brand:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta marca?')) return;
    try {
      await supabase.from('marcas').delete().eq('id', id);
      loadBrands();
    } catch (error) {
      console.error('Error deleting brand:', error);
    }
  };

  const resetForm = () => {
    setFormData({ nombre: '', slug: '', descripcion: '', logo_url: '' });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin text-4xl">⏳</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 text-amber-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.5 1.5h-6l-3 3.5v14.5h12v-14.5l-3-3.5zm-.5 17h-8v-13h4l2-2h4l2 2h4v13h-8z"/>
            </svg>
            <h3 className="text-2xl font-bold text-gray-900">Gestión de Marcas</h3>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-[#00aa45] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#009340] transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            Nueva Marca
          </button>
        </div>

        {showForm && (
          <div className="px-6 py-4 border-b border-gray-200 bg-amber-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre de la Marca *</label>
                <input
                  type="text"
                  placeholder="Ej: Apple"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Slug (URL) *</label>
                <input
                  type="text"
                  placeholder="Ej: apple"
                  value={formData.slug}
                  onChange={(e) => setFormData({...formData, slug: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
                <textarea
                  placeholder="Información sobre la marca..."
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  rows={2}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">URL Logo</label>
                <input
                  type="text"
                  placeholder="https://ejemplo.com/logo.png"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({...formData, logo_url: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
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

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Nombre</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Slug</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Descripción</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {brands.map((brand) => (
                <tr key={brand.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-semibold text-gray-900">{brand.nombre}</td>
                  <td className="px-6 py-4 text-gray-600">{brand.slug}</td>
                  <td className="px-6 py-4 text-gray-600 text-xs max-w-xs truncate">{brand.descripcion || '-'}</td>
                  <td className="px-6 py-4 space-x-2">
                    <button
                      onClick={() => {
                        setFormData({
                          nombre: brand.nombre,
                          slug: brand.slug,
                          descripcion: brand.descripcion || '',
                          logo_url: brand.logo_url || ''
                        });
                        setEditingId(brand.id);
                        setShowForm(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"/>
                      </svg>
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(brand.id)}
                      className="text-red-600 hover:text-red-800 font-semibold inline-flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-9l-1 1H5v2h14V4z"/>
                      </svg>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminBrands;
