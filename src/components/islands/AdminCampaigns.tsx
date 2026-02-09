import { useState, useEffect, useRef } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface Campaign {
  id: string;
  nombre: string;
  descripcion: string | null;
  asunto: string;
  contenido_html: string;
  estado: 'Borrador' | 'Programada' | 'Enviada' | 'Cancelada';
  tipo_segmento: string;
  fecha_programada: string | null;
  fecha_envio: string | null;
  total_destinatarios: number;
  total_enviados: number;
  total_abiertos: number;
  total_clicks: number;
  creada_en: string;
  actualizada_en: string;
}

interface Subscriber {
  id: string;
  email: string;
  nombre: string | null;
  activo: boolean;
  created_at: string;
}

interface Stats {
  total_suscriptores: number;
  total_campanas: number;
  campanas_enviadas: number;
}

interface CampaignLog {
  id: string;
  campana_id: string;
  email: string;
  estado: string;
  error_mensaje: string | null;
  fecha_evento: string;
}

type View = 'list' | 'subscribers' | 'create' | 'edit' | 'detail';

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

const BRAND = '#00aa45';

function formatDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function estadoBadge(estado: string) {
  const map: Record<string, { bg: string; text: string }> = {
    'Borrador': { bg: '#fef3c7', text: '#92400e' },
    'Programada': { bg: '#dbeafe', text: '#1e40af' },
    'Enviada': { bg: '#d1fae5', text: '#065f46' },
    'Cancelada': { bg: '#fee2e2', text: '#991b1b' },
  };
  const s = map[estado] || { bg: '#f3f4f6', text: '#374151' };
  return (
    <span style={{ background: s.bg, color: s.text, padding: '2px 10px', borderRadius: 9999, fontSize: 12, fontWeight: 600 }}>
      {estado}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PLANTILLAS HTML PREDEFINIDAS
// ═══════════════════════════════════════════════════════════════════════════════

const TEMPLATES: Record<string, { nombre: string; asunto: string; html: string }> = {
  promocion: {
    nombre: 'Promoción / Descuento',
    asunto: '🔥 ¡Ofertas exclusivas solo para ti!',
    html: `<h2 style="color:#111827;font-size:24px;margin:0 0 16px;">¡Ofertas exclusivas! 🔥</h2>
<p style="color:#4b5563;font-size:16px;line-height:1.6;">
  Hola, tenemos ofertas increíbles preparadas especialmente para ti. 
  No dejes pasar estas oportunidades únicas.
</p>
<div style="text-align:center;margin:30px 0;">
  <a href="https://fashionstorerbv3.victoriafp.online/productos" 
     style="display:inline-block;background:#00aa45;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">
    Ver ofertas →
  </a>
</div>
<p style="color:#9ca3af;font-size:14px;text-align:center;">
  Ofertas válidas por tiempo limitado.
</p>`,
  },
  novedades: {
    nombre: 'Nuevos productos',
    asunto: '✨ ¡Descubre las novedades de esta semana!',
    html: `<h2 style="color:#111827;font-size:24px;margin:0 0 16px;">Novedades en FashionStore ✨</h2>
<p style="color:#4b5563;font-size:16px;line-height:1.6;">
  Hemos añadido nuevos productos a nuestra colección. 
  Sé de los primeros en descubrirlos.
</p>
<div style="text-align:center;margin:30px 0;">
  <a href="https://fashionstorerbv3.victoriafp.online/productos" 
     style="display:inline-block;background:#00aa45;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">
    Explorar novedades →
  </a>
</div>`,
  },
  informativa: {
    nombre: 'Newsletter informativa',
    asunto: '📬 Noticias de FashionStore',
    html: `<h2 style="color:#111827;font-size:24px;margin:0 0 16px;">Noticias de FashionStore 📬</h2>
<p style="color:#4b5563;font-size:16px;line-height:1.6;">
  Queremos compartir contigo las últimas noticias y novedades de nuestra tienda.
</p>
<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
<p style="color:#4b5563;font-size:16px;line-height:1.6;">
  Escribe aquí el contenido de tu newsletter...
</p>
<div style="text-align:center;margin:30px 0;">
  <a href="https://fashionstorerbv3.victoriafp.online" 
     style="display:inline-block;background:#00aa45;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">
    Visitar FashionStore →
  </a>
</div>`,
  },
  vacio: {
    nombre: 'En blanco',
    asunto: '',
    html: '',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function AdminCampaigns() {
  // ─── State ───
  const [view, setView] = useState<View>('list');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [stats, setStats] = useState<Stats>({ total_suscriptores: 0, total_campanas: 0, campanas_enviadas: 0 });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Form
  const [formData, setFormData] = useState({
    nombre: '', asunto: '', contenido_html: '', descripcion: '', tipo_segmento: 'Todos',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [campaignLogs, setCampaignLogs] = useState<CampaignLog[]>([]);

  // Confirmaciones
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmSend, setConfirmSend] = useState<string | null>(null);

  // Preview
  const [showPreview, setShowPreview] = useState(false);
  const previewRef = useRef<HTMLIFrameElement>(null);

  // ─── Notifications ───
  const notify = (type: 'success' | 'error', msg: string) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 4000);
  };

  // ─── Data Loading ───
  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadCampaigns(), loadSubscribers(), loadStats()]);
    setLoading(false);
  };

  const loadCampaigns = async () => {
    try {
      const res = await fetch('/api/admin/campaigns?type=campaigns');
      const data = await res.json();
      if (data.success) setCampaigns(data.campaigns);
    } catch (err) { console.error('Error loading campaigns:', err); }
  };

  const loadSubscribers = async () => {
    try {
      const res = await fetch('/api/admin/campaigns?type=subscribers');
      const data = await res.json();
      if (data.success) setSubscribers(data.subscribers);
    } catch (err) { console.error('Error loading subscribers:', err); }
  };

  const loadStats = async () => {
    try {
      const res = await fetch('/api/admin/campaigns?type=stats');
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch (err) { console.error('Error loading stats:', err); }
  };

  // ─── Campaign Detail ───
  const loadCampaignDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/campaigns?type=campaign-detail&id=${id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedCampaign(data.campaign);
        setCampaignLogs(data.logs);
        setView('detail');
      }
    } catch (err) { console.error('Error loading campaign detail:', err); }
  };

  // ─── Form Actions ───
  const resetForm = () => {
    setFormData({ nombre: '', asunto: '', contenido_html: '', descripcion: '', tipo_segmento: 'Todos' });
    setEditingId(null);
    setShowPreview(false);
  };

  const applyTemplate = (key: string) => {
    const t = TEMPLATES[key];
    if (t) {
      setFormData(prev => ({ ...prev, asunto: t.asunto, contenido_html: t.html }));
    }
  };

  const handleSave = async (e: any) => {
    e.preventDefault();
    if (!formData.nombre || !formData.asunto || !formData.contenido_html) {
      notify('error', 'Completa nombre, asunto y contenido');
      return;
    }

    try {
      const payload = {
        action: editingId ? 'update' : 'create',
        id: editingId,
        ...formData,
      };

      const res = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        notify('success', editingId ? 'Campaña actualizada' : 'Campaña creada');
        resetForm();
        await loadCampaigns();
        await loadStats();
        setView('list');
      } else {
        notify('error', data.error || 'Error al guardar');
      }
    } catch (err) {
      notify('error', 'Error de conexión');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      const data = await res.json();
      if (data.success) {
        notify('success', 'Campaña eliminada');
        await loadCampaigns();
        await loadStats();
      } else {
        notify('error', data.error || 'Error al eliminar');
      }
    } catch (err) {
      notify('error', 'Error de conexión');
    }
    setConfirmDelete(null);
  };

  const handleSend = async (id: string) => {
    setSending(true);
    setConfirmSend(null);
    try {
      const res = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', id }),
      });
      const data = await res.json();
      if (data.success) {
        notify('success', `Campaña enviada: ${data.total_enviados}/${data.total_destinatarios} emails`);
        await loadCampaigns();
        await loadStats();
      } else {
        notify('error', data.error || 'Error al enviar');
      }
    } catch (err) {
      notify('error', 'Error de conexión');
    }
    setSending(false);
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'duplicate', id }),
      });
      const data = await res.json();
      if (data.success) {
        notify('success', 'Campaña duplicada');
        await loadCampaigns();
        await loadStats();
      } else {
        notify('error', data.error || 'Error al duplicar');
      }
    } catch (err) {
      notify('error', 'Error de conexión');
    }
  };

  const startEdit = (c: Campaign) => {
    setFormData({
      nombre: c.nombre,
      asunto: c.asunto,
      contenido_html: c.contenido_html,
      descripcion: c.descripcion || '',
      tipo_segmento: c.tipo_segmento || 'Todos',
    });
    setEditingId(c.id);
    setView('create');
  };

  // ─── Preview ───
  const updatePreview = () => {
    if (previewRef.current) {
      const doc = previewRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;padding:20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;}</style></head><body>${formData.contenido_html}</body></html>`);
        doc.close();
      }
    }
  };

  useEffect(() => {
    if (showPreview) updatePreview();
  }, [showPreview, formData.contenido_html]);

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: BRAND }} />
          <p className="text-gray-500">Cargando campañas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── Notification Toast ─── */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-lg text-white font-medium transition-all ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {notification.type === 'success' ? '✅' : '❌'} {notification.msg}
        </div>
      )}

      {/* ─── Sending Overlay ─── */}
      {sending && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-8 text-center shadow-2xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: BRAND }} />
            <p className="text-lg font-semibold text-gray-900">Enviando campaña...</p>
            <p className="text-sm text-gray-500 mt-2">Esto puede tardar unos momentos</p>
          </div>
        </div>
      )}

      {/* ─── Header + Stats ─── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📧 Campañas de Newsletter</h1>
          <p className="text-gray-500 text-sm mt-1">Gestiona tus campañas de email marketing</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => { setView('subscribers'); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'subscribers' ? 'text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`} style={view === 'subscribers' ? { background: BRAND } : {}}>
            👥 Suscriptores ({stats.total_suscriptores})
          </button>
          <button onClick={() => { setView('list'); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'list' ? 'text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`} style={view === 'list' ? { background: BRAND } : {}}>
            📋 Campañas ({stats.total_campanas})
          </button>
          <button onClick={() => { resetForm(); setView('create'); }} className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90" style={{ background: BRAND }}>
            + Nueva campaña
          </button>
        </div>
      </div>

      {/* ─── Stats Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <p className="text-sm text-gray-500">Suscriptores activos</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total_suscriptores}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <p className="text-sm text-gray-500">Total campañas</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total_campanas}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <p className="text-sm text-gray-500">Campañas enviadas</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{stats.campanas_enviadas}</p>
        </div>
      </div>

      {/* ═══════════════ SUBSCRIBERS VIEW ═══════════════ */}
      {view === 'subscribers' && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-5 border-b">
            <h2 className="text-lg font-bold text-gray-900">👥 Suscriptores de Newsletter</h2>
            <p className="text-sm text-gray-500 mt-1">{subscribers.length} suscriptores activos</p>
          </div>
          {subscribers.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              <p className="text-4xl mb-3">📭</p>
              <p>No hay suscriptores todavía</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
                    <th className="px-5 py-3">#</th>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Nombre</th>
                    <th className="px-5 py-3">Fecha suscripción</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((sub, i) => (
                    <tr key={sub.id} className="border-t hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 text-gray-400">{i + 1}</td>
                      <td className="px-5 py-3 font-medium text-gray-900">{sub.email}</td>
                      <td className="px-5 py-3 text-gray-600">{sub.nombre || '—'}</td>
                      <td className="px-5 py-3 text-gray-500">{formatDate(sub.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ CAMPAIGN LIST VIEW ═══════════════ */}
      {view === 'list' && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-5 border-b">
            <h2 className="text-lg font-bold text-gray-900">📋 Campañas creadas</h2>
          </div>
          {campaigns.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              <p className="text-4xl mb-3">📭</p>
              <p>No hay campañas todavía</p>
              <button onClick={() => { resetForm(); setView('create'); }} className="mt-4 px-5 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90" style={{ background: BRAND }}>
                Crear primera campaña
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
                    <th className="px-5 py-3">Nombre</th>
                    <th className="px-5 py-3">Asunto</th>
                    <th className="px-5 py-3">Estado</th>
                    <th className="px-5 py-3">Enviados</th>
                    <th className="px-5 py-3">Fecha</th>
                    <th className="px-5 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr key={c.id} className="border-t hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <button onClick={() => loadCampaignDetail(c.id)} className="font-medium text-gray-900 hover:underline text-left">
                          {c.nombre}
                        </button>
                      </td>
                      <td className="px-5 py-3 text-gray-600 max-w-[200px] truncate">{c.asunto}</td>
                      <td className="px-5 py-3">{estadoBadge(c.estado)}</td>
                      <td className="px-5 py-3 text-gray-600">
                        {c.estado === 'Enviada' ? `${c.total_enviados}/${c.total_destinatarios}` : '—'}
                      </td>
                      <td className="px-5 py-3 text-gray-500 text-xs">
                        {c.fecha_envio ? formatDate(c.fecha_envio) : formatDate(c.creada_en)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex gap-1 justify-end">
                          {c.estado === 'Borrador' && (
                            <>
                              <button onClick={() => setConfirmSend(c.id)} title="Enviar" className="p-2 rounded-lg hover:bg-green-50 text-green-600 transition-colors">
                                🚀
                              </button>
                              <button onClick={() => startEdit(c)} title="Editar" className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors">
                                ✏️
                              </button>
                            </>
                          )}
                          <button onClick={() => handleDuplicate(c.id)} title="Duplicar" className="p-2 rounded-lg hover:bg-purple-50 text-purple-600 transition-colors">
                            📋
                          </button>
                          <button onClick={() => setConfirmDelete(c.id)} title="Eliminar" className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors">
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ CREATE/EDIT VIEW ═══════════════ */}
      {view === 'create' && (
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-5 border-b flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {editingId ? '✏️ Editar campaña' : '📝 Nueva campaña'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {editingId ? 'Modifica los datos de la campaña' : 'Crea una nueva campaña de email marketing'}
              </p>
            </div>
            <button onClick={() => { resetForm(); setView('list'); }} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
          </div>

          <form onSubmit={handleSave} className="p-5 space-y-5">
            {/* Plantillas */}
            {!editingId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Plantilla base</label>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(TEMPLATES).map(([key, t]) => (
                    <button type="button" key={key} onClick={() => applyTemplate(key)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 hover:border-green-400 hover:bg-green-50 transition-all">
                      {t.nombre}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Nombre y Segmento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la campaña *</label>
                <input type="text" value={formData.nombre} onChange={(e: any) => setFormData((prev: any) => ({ ...prev, nombre: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                  placeholder="Ej: Ofertas de Verano 2026" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Segmento</label>
                <select value={formData.tipo_segmento} onChange={(e: any) => setFormData((prev: any) => ({ ...prev, tipo_segmento: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all">
                  <option value="Todos">Todos los suscriptores</option>
                  <option value="Premium">Premium</option>
                  <option value="Ofertas">Interesados en ofertas</option>
                  <option value="Abandono">Carritos abandonados</option>
                </select>
              </div>
            </div>

            {/* Asunto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asunto del email *</label>
              <input type="text" value={formData.asunto} onChange={(e: any) => setFormData((prev: any) => ({ ...prev, asunto: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                placeholder="Ej: 🔥 ¡Ofertas exclusivas solo para ti!" required />
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción interna</label>
              <input type="text" value={formData.descripcion} onChange={(e: any) => setFormData((prev: any) => ({ ...prev, descripcion: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                placeholder="Descripción interna para organizar (no se envía)" />
            </div>

            {/* Contenido HTML */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Contenido HTML *</label>
                <button type="button" onClick={() => setShowPreview(!showPreview)}
                  className="text-xs font-medium px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all">
                  {showPreview ? '📝 Editor' : '👁️ Vista previa'}
                </button>
              </div>

              {showPreview ? (
                <div className="border rounded-lg overflow-hidden bg-gray-50">
                  <iframe ref={previewRef} title="Preview" className="w-full border-0" style={{ height: 400 }} sandbox="allow-same-origin" />
                </div>
              ) : (
                <textarea value={formData.contenido_html} onChange={(e: any) => setFormData((prev: any) => ({ ...prev, contenido_html: e.target.value }))}
                  rows={14}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all font-mono text-sm"
                  placeholder="<h2>Título</h2>\n<p>Contenido de tu newsletter...</p>" required />
              )}
              <p className="text-xs text-gray-400 mt-1">
                💡 Usa HTML para dar formato. El email se envuelve automáticamente con la plantilla de FashionStore (logo, footer, enlace de cancelar suscripción).
              </p>
            </div>

            {/* Acciones */}
            <div className="flex gap-3 pt-2">
              <button type="submit" className="px-6 py-2.5 rounded-lg text-white font-semibold hover:opacity-90 transition-all" style={{ background: BRAND }}>
                {editingId ? 'Guardar cambios' : 'Crear campaña'}
              </button>
              <button type="button" onClick={() => { resetForm(); setView('list'); }}
                className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ═══════════════ DETAIL VIEW ═══════════════ */}
      {view === 'detail' && selectedCampaign && (
        <div className="space-y-4">
          <button onClick={() => setView('list')} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
            ← Volver a campañas
          </button>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedCampaign.nombre}</h2>
                <p className="text-gray-500 text-sm mt-1">{selectedCampaign.descripcion || 'Sin descripción'}</p>
              </div>
              <div className="flex items-center gap-3">
                {estadoBadge(selectedCampaign.estado)}
                {selectedCampaign.estado === 'Borrador' && (
                  <button onClick={() => setConfirmSend(selectedCampaign.id)} className="px-4 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90" style={{ background: BRAND }}>
                    🚀 Enviar ahora
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Asunto</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{selectedCampaign.asunto}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Destinatarios</p>
                <p className="text-sm font-bold text-gray-900 mt-1">{selectedCampaign.total_destinatarios}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Enviados</p>
                <p className="text-sm font-bold text-green-600 mt-1">{selectedCampaign.total_enviados}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Fecha envío</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{formatDate(selectedCampaign.fecha_envio)}</p>
              </div>
            </div>

            {/* Preview del contenido */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Vista previa del contenido</h3>
              <div className="border rounded-lg overflow-hidden bg-gray-50 p-4">
                <div dangerouslySetInnerHTML={{ __html: selectedCampaign.contenido_html }} />
              </div>
            </div>
          </div>

          {/* Logs de envío */}
          {campaignLogs.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-5 border-b">
                <h3 className="text-sm font-bold text-gray-900">📊 Registro de envíos ({campaignLogs.length})</h3>
              </div>
              <div className="overflow-x-auto" style={{ maxHeight: 300, overflowY: 'auto' }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider sticky top-0">
                      <th className="px-5 py-2">Email</th>
                      <th className="px-5 py-2">Estado</th>
                      <th className="px-5 py-2">Error</th>
                      <th className="px-5 py-2">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaignLogs.map((log) => (
                      <tr key={log.id} className="border-t">
                        <td className="px-5 py-2 text-gray-900">{log.email}</td>
                        <td className="px-5 py-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${log.estado === 'Enviado' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {log.estado}
                          </span>
                        </td>
                        <td className="px-5 py-2 text-gray-400 text-xs">{log.error_mensaje || '—'}</td>
                        <td className="px-5 py-2 text-gray-400 text-xs">{formatDate(log.fecha_evento)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ MODAL: Confirmar Envío ═══════════════ */}
      {confirmSend && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">🚀 Confirmar envío</h3>
            <p className="text-gray-600 text-sm mb-1">
              ¿Estás seguro de enviar esta campaña a <strong>{stats.total_suscriptores} suscriptores</strong>?
            </p>
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-2 mb-4">
              ⚠️ Esta acción no se puede deshacer. Los emails se enviarán inmediatamente.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmSend(null)} className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-50 text-sm">
                Cancelar
              </button>
              <button onClick={() => handleSend(confirmSend)} className="px-4 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90" style={{ background: BRAND }}>
                Enviar campaña
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ MODAL: Confirmar Eliminación ═══════════════ */}
      {confirmDelete && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">🗑️ Eliminar campaña</h3>
            <p className="text-gray-600 text-sm mb-4">
              ¿Estás seguro de eliminar esta campaña? Se eliminarán también todos sus registros de envío.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-50 text-sm">
                Cancelar
              </button>
              <button onClick={() => handleDelete(confirmDelete)} className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
