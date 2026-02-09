'use client';

import { useEffect, useState } from 'react';

interface Coupon {
  id: number;
  code: string;
  discount_type: 'PERCENTAGE' | 'FIXED';
  value: number;
  min_order_value: number | null;
  max_uses_global: number | null;
  max_uses_per_user: number;
  expiration_date: string;
  is_active: boolean;
  times_used: number;
  unique_users: number;
  remaining_uses: number | null;
}

export default function CouponsManagement() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'PERCENTAGE' as string,
    value: '',
    min_order_value: '',
    max_uses_global: '',
    max_uses_per_user: '1',
    expiration_date: '',
  });

  // Load coupons on mount
  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/coupons');
      const data = await res.json();
      if (data.success) {
        setCoupons(data.coupons);
      }
    } catch (error) {
      console.error('Error loading coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    try {
      const payload = {
        action: editingId ? 'update' : 'create',
        id: editingId,
        ...formData,
        value: parseFloat(formData.value),
        min_order_value: formData.min_order_value ? parseFloat(formData.min_order_value) : null,
        max_uses_global: formData.max_uses_global ? parseInt(formData.max_uses_global) : null,
        max_uses_per_user: parseInt(formData.max_uses_per_user),
      };

      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        resetForm();
        loadCoupons();
      }
    } catch (error) {
      console.error('Error saving coupon:', error);
    }
  };

  const handleDeactivate = async (id: number) => {
    if (!confirm('¿Desactivar este cupón?')) return;

    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deactivate', id }),
      });

      const data = await res.json();
      if (data.success) {
        loadCoupons();
      }
    } catch (error) {
      console.error('Error deactivating coupon:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discount_type: 'PERCENTAGE',
      value: '',
      min_order_value: '',
      max_uses_global: '',
      max_uses_per_user: '1',
      expiration_date: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Cupones</h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="bg-[#00aa45] text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
        >
          {showForm ? 'Cancelar' : '+ Nuevo Cupón'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {editingId ? 'Editar Cupón' : 'Crear Nuevo Cupón'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Code */}
              <input
                type="text"
                placeholder="Código (ej: SUMMER2025)"
                value={formData.code}
                onChange={(e: any) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="px-3 py-2 border border-gray-300 rounded-lg"
                disabled={!!editingId}
                required
              />

              {/* Discount Type */}
              <select
                value={formData.discount_type}
                onChange={(e: any) => setFormData({ ...formData, discount_type: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="PERCENTAGE">Porcentaje (%)</option>
                <option value="FIXED">Monto Fijo (€)</option>
              </select>

              {/* Value */}
              <input
                type="number"
                placeholder={formData.discount_type === 'PERCENTAGE' ? 'Porcentaje (ej: 10)' : 'Monto (ej: 5)'}
                value={formData.value}
                onChange={(e: any) => setFormData({ ...formData, value: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg"
                step="0.01"
                required
              />

              {/* Min Order Value */}
              <input
                type="number"
                placeholder="Compra mínima (€) - Opcional"
                value={formData.min_order_value}
                onChange={(e: any) => setFormData({ ...formData, min_order_value: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg"
                step="0.01"
              />

              {/* Max Uses Global */}
              <input
                type="number"
                placeholder="Usos totales (dejar en blanco = infinito)"
                value={formData.max_uses_global}
                onChange={(e: any) => setFormData({ ...formData, max_uses_global: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />

              {/* Max Uses Per User */}
              <input
                type="number"
                placeholder="Usos por usuario"
                value={formData.max_uses_per_user}
                onChange={(e: any) => setFormData({ ...formData, max_uses_per_user: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg"
                min="1"
                required
              />

              {/* Expiration Date */}
              <input
                type="datetime-local"
                value={formData.expiration_date}
                onChange={(e: any) => setFormData({ ...formData, expiration_date: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>

            {/* Description */}
            <textarea
              placeholder="Descripción (opcional)"
              value={formData.description}
              onChange={(e: any) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={2}
            />

            <button
              type="submit"
              className="w-full bg-[#00aa45] text-white py-2 rounded-lg hover:bg-green-700 transition font-semibold"
            >
              {editingId ? 'Actualizar Cupón' : 'Crear Cupón'}
            </button>
          </form>
        </div>
      )}

      {/* Coupons List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando cupones...</div>
        ) : coupons.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No hay cupones creados</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Código</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Tipo</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Valor</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Usos</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Usuarios</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Vencimiento</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Estado</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-semibold text-gray-900">{coupon.code}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {coupon.discount_type === 'PERCENTAGE' ? '%' : '€'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {coupon.value}
                      {coupon.discount_type === 'PERCENTAGE' ? '%' : '€'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {coupon.times_used}
                      {coupon.max_uses_global && ` / ${coupon.max_uses_global}`}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{coupon.unique_users}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {formatDate(coupon.expiration_date)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          coupon.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {coupon.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 space-x-2 flex">
                      {coupon.is_active && (
                        <button
                          onClick={() => handleDeactivate(coupon.id)}
                          className="text-red-600 hover:text-red-800 font-semibold text-xs"
                        >
                          Desactivar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
