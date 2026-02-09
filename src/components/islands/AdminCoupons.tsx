import { useState, useEffect } from 'react';

/* ───────────────────────────────────────────────────────
   Interfaces – new schema: tables "coupons" + "coupon_usages"
   ─────────────────────────────────────────────────────── */
interface Coupon {
  id: number;
  code: string;
  description: string | null;
  discount_type: 'PERCENTAGE' | 'FIXED';
  value: number;
  min_order_value: number | null;
  max_uses_global: number | null;
  max_uses_per_user: number;
  expiration_date: string;
  is_active: boolean;
  created_at: string;
  // from coupon_stats view (joined by API)
  times_used: number;
  unique_users: number;
  remaining_uses: number | null;
  assigned_user_id: string | null;
  assigned_user_email: string | null;
}

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'PERCENTAGE' as string,
    value: '',
    min_order_value: '',
    max_uses_global: '',
    max_uses_per_user: '1',
    expiration_date: '',
    assigned_user_id: '',
  });

  // Deactivate modal
  const [deactivateModal, setDeactivateModal] = useState<{ isOpen: boolean; id: number; code: string } | null>(null);
  const [users, setUsers] = useState<{id: string; email: string; nombre: string}[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [assignToSpecificUser, setAssignToSpecificUser] = useState(false);

  useEffect(() => { loadCoupons(); loadUsers(); }, []);

  /* ── API helpers ── */
  const loadCoupons = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/coupons');
      const data = await res.json();
      if (data.success) setCoupons(data.coupons);
    } catch (err) {
      console.error('Error loading coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/admin/users-list');
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError('');

    try {
      const payload = {
        action: editingId ? 'update' : 'create',
        id: editingId,
        ...formData,
        value: parseFloat(formData.value),
        min_order_value: formData.min_order_value ? parseFloat(formData.min_order_value) : null,
        max_uses_global: formData.max_uses_global ? parseInt(formData.max_uses_global) : null,
        max_uses_per_user: parseInt(formData.max_uses_per_user),
        assigned_user_id: assignToSpecificUser ? formData.assigned_user_id || null : null,
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
      } else {
        setError(data.error || 'Error al guardar');
      }
    } catch (err) {
      console.error('Error saving coupon:', err);
      setError('Error de conexión');
    }
  };

  const handleDeactivateClick = (id: number, code: string) => {
    setDeactivateModal({ isOpen: true, id, code });
  };

  const confirmDeactivate = async () => {
    if (!deactivateModal) return;
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deactivate', id: deactivateModal.id }),
      });
      const data = await res.json();
      if (data.success) loadCoupons();
    } catch (err) {
      console.error('Error deactivating coupon:', err);
    } finally {
      setDeactivateModal(null);
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
      assigned_user_id: '',
    });
    setAssignToSpecificUser(false);
    setUserSearch('');
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  const handleEditClick = (c: Coupon) => {
    setFormData({
      code: c.code,
      description: c.description || '',
      discount_type: c.discount_type,
      value: String(c.value),
      min_order_value: c.min_order_value ? String(c.min_order_value) : '',
      max_uses_global: c.max_uses_global ? String(c.max_uses_global) : '',
      max_uses_per_user: String(c.max_uses_per_user),
      expiration_date: c.expiration_date ? c.expiration_date.slice(0, 16) : '',
      assigned_user_id: c.assigned_user_id || '',
    });
    setAssignToSpecificUser(!!c.assigned_user_id);
    setEditingId(c.id);
    setShowForm(true);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const isExpired = (dateStr: string) => new Date(dateStr) < new Date();

  /* ── Render ── */
  if (loading && coupons.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin text-4xl">⏳</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Gestión de Cupones</h3>
            <span className="ml-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
              {coupons.length}
            </span>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(!showForm); }}
            className="w-full sm:w-auto bg-[#00aa45] text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-[#009340] transition flex items-center justify-center gap-2 shadow-sm shadow-green-200"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
            {showForm ? 'Cancelar' : 'Nuevo Cupón'}
          </button>
        </div>

        {/* ── FORM ── */}
        {showForm && (
          <div className="px-6 py-6 border-b border-gray-200 bg-green-50/50">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Code */}
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-2">Código del Cupón *</label>
                  <input
                    type="text"
                    placeholder="Ej: SUMMER2025"
                    value={formData.code}
                    disabled={!!editingId}
                    onChange={(e: any) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 font-bold uppercase transition-all"
                    required
                  />
                </div>

                {/* Type + Value */}
                <div className="flex gap-4">
                  <div className="w-1/2">
                    <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-2">Tipo</label>
                    <select
                      value={formData.discount_type}
                      onChange={(e: any) => setFormData({ ...formData, discount_type: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-green-500 bg-white text-sm"
                    >
                      <option value="PERCENTAGE">Porcentaje (%)</option>
                      <option value="FIXED">Monto Fijo (€)</option>
                    </select>
                  </div>
                  <div className="w-1/2">
                    <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-2">Valor *</label>
                    <input
                      type="number"
                      placeholder={formData.discount_type === 'PERCENTAGE' ? 'Ej: 10' : 'Ej: 5'}
                      value={formData.value}
                      onChange={(e: any) => setFormData({ ...formData, value: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-green-500"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                {/* Min order + max global uses + max user uses + expiration */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-1">Min. Compra (€)</label>
                    <input
                      type="number"
                      placeholder="Opcional"
                      value={formData.min_order_value}
                      onChange={(e: any) => setFormData({ ...formData, min_order_value: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-green-500"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-0">Límite Usos Totales</label>
                    <span className="block text-[10px] text-gray-400 mb-1 leading-tight">Vacío = ilimitado</span>
                    <input
                      type="number"
                      placeholder="∞ ilimitado"
                      value={formData.max_uses_global}
                      onChange={(e: any) => setFormData({ ...formData, max_uses_global: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-green-500"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-0">Usos / Usuario *</label>
                    <span className="block text-[10px] text-gray-400 mb-1 leading-tight">Por cada usuario</span>
                    <input
                      type="number"
                      value={formData.max_uses_per_user}
                      onChange={(e: any) => setFormData({ ...formData, max_uses_per_user: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-green-500"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-1">Expiración *</label>
                    <input
                      type="datetime-local"
                      value={formData.expiration_date}
                      onChange={(e: any) => setFormData({ ...formData, expiration_date: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-green-500 text-sm"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mt-4">
                <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-2">Descripción</label>
                <textarea
                  placeholder="Descripción opcional del cupón"
                  value={formData.description}
                  onChange={(e: any) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-green-500"
                  rows={2}
                />
              </div>

              {/* User Assignment */}
              <div className="mt-4">
                <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-2">Asignar a</label>
                <div className="flex gap-4 mb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="user_assignment"
                      checked={!assignToSpecificUser}
                      onChange={() => { setAssignToSpecificUser(false); setFormData({ ...formData, assigned_user_id: '' }); setUserSearch(''); }}
                      className="accent-green-600"
                    />
                    <span className="text-sm font-medium text-gray-700">Todos los usuarios</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="user_assignment"
                      checked={assignToSpecificUser}
                      onChange={() => setAssignToSpecificUser(true)}
                      className="accent-green-600"
                    />
                    <span className="text-sm font-medium text-gray-700">Usuario específico</span>
                  </label>
                </div>
                {assignToSpecificUser && (
                  <div>
                    <input
                      type="text"
                      placeholder="Buscar por email o nombre..."
                      value={userSearch}
                      onChange={(e: any) => setUserSearch(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm mb-2"
                    />
                    <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-xl bg-white">
                      {users
                        .filter(u =>
                          u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                          (u.nombre || '').toLowerCase().includes(userSearch.toLowerCase())
                        )
                        .slice(0, 20)
                        .map(u => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => { setFormData({ ...formData, assigned_user_id: u.id }); setUserSearch(''); }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-green-50 transition border-b border-gray-50 last:border-0 ${
                              formData.assigned_user_id === u.id ? 'bg-green-100 font-bold text-green-800' : 'text-gray-700'
                            }`}
                          >
                            <span className="font-medium">{u.email}</span>
                            {u.nombre && <span className="text-gray-400 ml-2">({u.nombre})</span>}
                          </button>
                        ))}
                      {users.filter(u =>
                        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                        (u.nombre || '').toLowerCase().includes(userSearch.toLowerCase())
                      ).length === 0 && (
                        <p className="px-4 py-3 text-sm text-gray-400 text-center">No se encontraron usuarios</p>
                      )}
                    </div>
                    {formData.assigned_user_id && (
                      <div className="mt-2 flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                        <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        <span className="text-sm text-green-800 font-medium truncate">
                          {users.find(u => u.id === formData.assigned_user_id)?.email || formData.assigned_user_id}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {error && (
                <div className="mt-3 text-red-600 text-sm font-semibold bg-red-50 px-3 py-2 rounded-lg">{error}</div>
              )}

              <div className="flex gap-2 mt-6 justify-end">
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-100 text-gray-700 px-6 py-2 rounded-xl font-bold hover:bg-gray-200 transition text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#00aa45] text-white px-6 py-2 rounded-xl font-bold hover:bg-[#009340] shadow-lg shadow-green-500/30 transition text-sm"
                >
                  {editingId ? 'Guardar Cambios' : 'Crear Cupón'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── COUPONS LIST ── */}
        {coupons.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="bg-gray-100/50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <p className="text-gray-600 font-semibold text-lg">No hay cupones creados</p>
            <p className="text-sm text-gray-500 mt-1">Crea uno nuevo para empezar a ofrecer descuentos.</p>
          </div>
        ) : (
          <div>
            {/* Desktop Header */}
            <div className="hidden lg:flex lg:items-center lg:gap-4 px-5 py-3 bg-gray-50 border-b border-gray-200 text-[11px] uppercase tracking-wider font-semibold text-gray-500">
              <div className="w-[120px] flex-shrink-0">Código</div>
              <div className="w-[100px] flex-shrink-0 text-right pr-4">Descuento</div>
              <div className="w-[90px] flex-shrink-0 text-center">Min. Compra</div>
              <div className="w-[100px] flex-shrink-0 text-center">Usos</div>
              <div className="w-[80px] flex-shrink-0 text-center">Usuarios</div>
              <div className="w-[110px] flex-shrink-0">Asignado a</div>
              <div className="w-[110px] flex-shrink-0">Vencimiento</div>
              <div className="w-[80px] flex-shrink-0 text-center">Estado</div>
              <div className="w-[100px] flex-shrink-0 text-right">Acciones</div>
            </div>

            <div className="space-y-4 lg:space-y-0 lg:divide-y lg:divide-gray-100 p-4 lg:p-0">
              {coupons.map((c) => {
                const isPct = c.discount_type === 'PERCENTAGE';
                const expired = isExpired(c.expiration_date);
                const isActive = c.is_active && !expired;

                return (
                  <div key={c.id} className="bg-white lg:bg-transparent border lg:border-none rounded-xl lg:rounded-none p-4 sm:p-5 hover:bg-gray-50/50 transition-colors duration-200 shadow-sm lg:shadow-none">

                    {/* Desktop Row */}
                    <div className="hidden lg:flex lg:items-center lg:gap-4">
                      <div className="w-[120px] flex-shrink-0">
                        <span className="font-mono text-xs font-black text-gray-800 bg-gray-100 px-2 py-1 rounded tracking-wide border border-gray-200">
                          {c.code}
                        </span>
                      </div>

                      <div className="w-[100px] flex-shrink-0 text-right pr-4">
                        <span className={`font-black text-lg ${isPct ? 'text-blue-600' : 'text-green-600'}`}>
                          {c.value}{isPct ? '%' : '€'}
                        </span>
                      </div>

                      <div className="w-[90px] flex-shrink-0 text-center text-sm text-gray-600">
                        {c.min_order_value ? `${c.min_order_value}€` : '—'}
                      </div>

                      <div className="w-[100px] flex-shrink-0 text-center text-sm">
                        <span className="font-bold text-gray-900">{c.times_used}</span>
                        <span className="text-gray-400">
                          {c.max_uses_global ? ` / ${c.max_uses_global}` : ' / ∞'}
                        </span>
                      </div>

                      <div className="w-[80px] flex-shrink-0 text-center text-sm text-gray-600">
                        {c.unique_users}
                      </div>

                      <div className="w-[110px] flex-shrink-0 text-xs font-medium">
                        {c.assigned_user_email ? (
                          <span className="text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded truncate block" title={c.assigned_user_email}>
                            {c.assigned_user_email.split('@')[0]}
                          </span>
                        ) : (
                          <span className="text-gray-400">Público</span>
                        )}
                      </div>

                      <div className="w-[110px] flex-shrink-0 text-xs text-gray-500 font-medium">
                        {formatDate(c.expiration_date)}
                        {expired && <span className="block text-red-500 text-[10px] font-bold">EXPIRADO</span>}
                      </div>

                      <div className="w-[80px] flex-shrink-0 text-center">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide ${
                          isActive
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : expired
                              ? 'bg-orange-100 text-orange-800 border-orange-200'
                              : 'bg-red-100 text-red-800 border-red-200'
                        }`}>
                          {isActive ? 'Activo' : expired ? 'Expirado' : 'Inactivo'}
                        </span>
                      </div>

                      <div className="w-[100px] flex-shrink-0 flex justify-end gap-2">
                        <button
                          onClick={() => handleEditClick(c)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Editar"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                        </button>
                        {c.is_active && (
                          <button
                            onClick={() => handleDeactivateClick(c.id, c.code)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Desactivar"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Mobile Card */}
                    <div className="lg:hidden flex flex-col space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="font-mono text-lg font-black text-gray-900 tracking-tight">{c.code}</span>
                          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-0.5">Código</span>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                          isActive
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : expired
                              ? 'bg-orange-100 text-orange-800 border-orange-200'
                              : 'bg-red-100 text-red-800 border-red-200'
                        }`}>
                          {isActive ? 'Activo' : expired ? 'Expirado' : 'Inactivo'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 border-t border-b border-gray-100 py-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium mb-1">Descuento</p>
                          <p className={`text-2xl font-black ${isPct ? 'text-blue-600' : 'text-green-600'}`}>
                            {c.value}{isPct ? '%' : '€'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium mb-1">Vencimiento</p>
                          <p className="text-sm font-bold text-gray-700">{formatDate(c.expiration_date)}</p>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] uppercase font-bold text-gray-400">Usos totales</span>
                          <span className="text-xs font-bold text-gray-800">
                            {c.times_used}{c.max_uses_global ? ` / ${c.max_uses_global}` : ' / ∞'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] uppercase font-bold text-gray-400">Usuarios únicos</span>
                          <span className="text-xs font-bold text-gray-800">{c.unique_users}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] uppercase font-bold text-gray-400">Usos/usuario</span>
                          <span className="text-xs font-bold text-gray-800">{c.max_uses_per_user}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] uppercase font-bold text-gray-400">Asignado a</span>
                          <span className={`text-xs font-bold ${c.assigned_user_email ? 'text-purple-700' : 'text-gray-400'}`}>
                            {c.assigned_user_email || 'Público (todos)'}
                          </span>
                        </div>
                        {c.min_order_value && (
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] uppercase font-bold text-gray-400">Compra mínima</span>
                            <span className="text-xs font-bold text-gray-800">{c.min_order_value}€</span>
                          </div>
                        )}
                        {c.description && (
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] uppercase font-bold text-gray-400">Descripción</span>
                            <span className="text-xs text-gray-600 truncate max-w-[150px]">{c.description}</span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <button
                          onClick={() => handleEditClick(c)}
                          className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs hover:bg-blue-100 transition"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                          Editar
                        </button>
                        {c.is_active && (
                          <button
                            onClick={() => handleDeactivateClick(c.id, c.code)}
                            className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-red-50 text-red-700 font-bold text-xs hover:bg-red-100 transition"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
                            Desactivar
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Deactivate Modal */}
      {deactivateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 transform transition-all scale-100">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">¿Desactivar Cupón?</h3>
            <p className="text-gray-500 text-center text-sm mb-2">
              El cupón <strong className="font-mono">{deactivateModal.code}</strong> dejará de ser válido para los clientes.
            </p>
            <p className="text-gray-400 text-center text-xs mb-6">Esta acción se puede revertir editando el cupón.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeactivateModal(null)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeactivate}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
              >
                Sí, Desactivar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;
