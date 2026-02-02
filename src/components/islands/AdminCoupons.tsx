import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

interface Coupon {
  id: string;
  codigo: string;
  descuento_porcentaje?: number;
  monto_fijo?: number;
  minimo_compra?: number;
  uses_limit?: number;
  usos_actuales: number;
  fecha_expiracion?: string;
  activo: boolean;
  creada_en: string;
}

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    codigo: '',
    descuento_porcentaje: 0,
    monto_fijo: 0,
    minimo_compra: 0,
    uses_limit: 0,
    fecha_expiracion: '',
    activo: true
  });

  const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cupones_descuento')
        .select('*')
        .order('creada_en', { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (error) {
      console.error('Error loading coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.codigo) return;

    try {
      if (editingId) {
        await supabase
          .from('cupones_descuento')
          .update(formData)
          .eq('id', editingId);
      } else {
        await supabase
          .from('cupones_descuento')
          .insert([formData]);
      }
      loadCoupons();
      resetForm();
    } catch (error) {
      console.error('Error saving coupon:', error);
    }
  };

  const handleDelete = async (id: string) => {
    // if (!confirm('¿Eliminar este cupón?')) return;
    try {
      await supabase.from('cupones_descuento').delete().eq('id', id);
      loadCoupons();
    } catch (error) {
      console.error('Error deleting coupon:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      codigo: '',
      descuento_porcentaje: 0,
      monto_fijo: 0,
      minimo_compra: 0,
      uses_limit: 0,
      fecha_expiracion: '',
      activo: true
    });
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
            <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21.5.5H2.5C1.12 1.62.5 2.5.5 4v16c0 1.5.62 2.38 2 3.5h19c1.38-1.12 2-2 2-3.5V4c0-1.5-.62-2.38-2-3.5zm-2 17h-15v-2h15v2zm0-4h-15v-2h15v2zm0-4h-15v-2h15v2z" />
            </svg>
            <h3 className="text-2xl font-bold text-gray-900">Gestión de Cupones</h3>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-[#00aa45] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#009340] transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
            Nuevo Cupón
          </button>
        </div>

        {showForm && (
          <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Código del Cupón *</label>
                <input
                  type="text"
                  placeholder="Ej: DESCUENTO25"
                  value={formData.codigo}
                  onChange={(e: any) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-bold"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Descuento Porcentaje (%)</label>
                <input
                  type="number"
                  placeholder="Ej: 25"
                  value={formData.descuento_porcentaje}
                  onChange={(e: any) => setFormData({ ...formData, descuento_porcentaje: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Monto Fijo (€)</label>
                <input
                  type="number"
                  placeholder="Ej: 10.00"
                  value={formData.monto_fijo}
                  onChange={(e: any) => setFormData({ ...formData, monto_fijo: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mínimo de Compra (€)</label>
                <input
                  type="number"
                  placeholder="Ej: 50.00"
                  value={formData.minimo_compra}
                  onChange={(e: any) => setFormData({ ...formData, minimo_compra: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Límite de Usos</label>
                <input
                  type="number"
                  placeholder="Ej: 100"
                  value={formData.uses_limit}
                  onChange={(e: any) => setFormData({ ...formData, uses_limit: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha de Expiración</label>
                <input
                  type="date"
                  value={formData.fecha_expiracion}
                  onChange={(e: any) => setFormData({ ...formData, fecha_expiracion: e.target.value })}
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
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Código</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Descuento</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Usos</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Vencimiento</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Estado</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-mono font-bold text-gray-900">{coupon.codigo}</td>
                  <td className="px-6 py-4 font-semibold text-green-600">
                    {coupon.descuento_porcentaje ? `${coupon.descuento_porcentaje}%` : `${coupon.monto_fijo}€`}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{coupon.usos_actuales || 0} / {coupon.uses_limit || '∞'}</td>
                  <td className="px-6 py-4 text-gray-600 text-xs">
                    {coupon.fecha_expiracion ? new Date(coupon.fecha_expiracion).toLocaleDateString('es-ES') : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${coupon.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                      {coupon.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 space-x-2">
                    <button
                      onClick={() => {
                        setFormData({
                          codigo: coupon.codigo,
                          descuento_porcentaje: coupon.descuento_porcentaje || 0,
                          monto_fijo: coupon.monto_fijo || 0,
                          minimo_compra: coupon.minimo_compra || 0,
                          uses_limit: coupon.uses_limit || 0,
                          fecha_expiracion: coupon.fecha_expiracion || '',
                          activo: coupon.activo
                        });
                        setEditingId(coupon.id);
                        setShowForm(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
                      </svg>
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(coupon.id)}
                      className="text-red-600 hover:text-red-800 font-semibold inline-flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-9l-1 1H5v2h14V4z" />
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

export default AdminCoupons;
