import { useState, useEffect, useRef } from 'react';
import { MailIcon, UserIcon, MenuIcon, PackageIcon, EditIcon, TrashIcon, CheckIcon, XIcon, AlertIcon, EyeIcon, PlusIcon, ChevronRightIcon } from '@/components/ui/Icons';

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

const BRAND = '#00aa45';

function formatDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function getEstadoColor(estado: string): string {
  const map: Record<string, string> = {
    'Borrador': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Programada': 'bg-blue-100 text-blue-800 border-blue-200',
    'Enviada': 'bg-green-100 text-green-800 border-green-200',
    'Cancelada': 'bg-red-100 text-red-800 border-red-200',
  };
  return map[estado] || 'bg-gray-100 text-gray-800 border-gray-200';
}

const TEMPLATES: Record<string, { nombre: string; asunto: string; html: string }> = {
  promocion: {
    nombre: 'Promoción / Descuento',
    asunto: 'Ofertas exclusivas solo para ti',
    html: `<h2 style="color:#111827;font-size:24px;margin:0 0 16px;">Ofertas exclusivas</h2>
<p style="color:#4b5563;font-size:16px;line-height:1.6;">
  Hola, tenemos ofertas increíbles preparadas especialmente para ti. 
  No dejes pasar estas oportunidades únicas.
</p>
<div style="text-align:center;margin:30px 0;">
  <a href="https://fashionstorerbv3.victoriafp.online/productos" 
     style="display:inline-block;background:#00aa45;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">
    Ver ofertas →
  </a>
</div>`,
  },
  novedades: {
    nombre: 'Nuevos productos',
    asunto: 'Descubre las novedades de esta semana',
    html: `<h2 style="color:#111827;font-size:24px;margin:0 0 16px;">Novedades en FashionStore</h2>
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
    asunto: 'Noticias de FashionStore',
    html: `<h2 style="color:#111827;font-size:24px;margin:0 0 16px;">Noticias de FashionStore</h2>
<p style="color:#4b5563;font-size:16px;line-height:1.6;">
  Queremos compartir contigo las últimas noticias y novedades de nuestra tienda.
</p>
<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
<p style="color:#4b5563;font-size:16px;line-height:1.6;">
  Escribe aquí el contenido de tu newsletter...
</p>`,
  },
  vacio: {
    nombre: 'En blanco',
    asunto: '',
    html: '',
  },
};

export default function AdminCampaigns() {
  const [view, setView] = useState<View>('list');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [stats, setStats] = useState<Stats>({ total_suscriptores: 0, total_campanas: 0, campanas_enviadas: 0 });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [formData, setFormData] = useState({
    nombre: '', asunto: '', contenido_html: '', descripcion: '', tipo_segmento: 'Todos',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [campaignLogs, setCampaignLogs] = useState<CampaignLog[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmSend, setConfirmSend] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const previewRef = useRef<HTMLIFrameElement>(null);

  const notify = (type: 'success' | 'error', msg: string) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 4000);
  };

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

  const updatePreview = () => {
    if (previewRef.current) {
      previewRef.current.srcdoc = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;padding:20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;}</style></head><body>${formData.contenido_html}</body></html>`;
    }
  };

  useEffect(() => {
    if (showPreview) updatePreview();
  }, [showPreview, formData.contenido_html]);

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
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-medium transition-all ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {notification.msg}
        </div>
      )}

      {sending && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-8 text-center shadow-2xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: BRAND }} />
            <p className="text-lg font-semibold text-gray-900">Enviando campaña...</p>
            <p className="text-sm text-gray-500 mt-2">Esto puede tardar unos momentos</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-3 rounded-xl bg-green-100">
            <MailIcon size={24} color="#00aa45" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestión de Campañas</h1>
            <p className="text-gray-500 text-sm mt-0.5">Crea y envía newsletters a tus suscriptores</p>
          </div>
        </div>
        <button onClick={() => { resetForm(); setView('create'); }} className="px-6 py-2.5 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-all" style={{ background: BRAND }}>
          + Nueva campaña
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-1">Suscriptores activos</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total_suscriptores}</p>
            </div>
            <UserIcon size={32} color="#00aa45" className="opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-1">Total campañas</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total_campanas}</p>
            </div>
            <MenuIcon size={32} color="#00aa45" className="opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-1">Enviadas</p>
              <p className="text-3xl font-bold text-green-600">{stats.campanas_enviadas}</p>
            </div>
            <CheckIcon size={32} color="#00aa45" className="opacity-20" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:gap-3">
        <button onClick={() => setView('list')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${view === 'list' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-green-200 ring-2 ring-green-400 ring-offset-1' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'}`}>
          Campañas
        </button>
        <button onClick={() => setView('subscribers')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${view === 'subscribers' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-green-200 ring-2 ring-green-400 ring-offset-1' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'}`}>
          Suscriptores
        </button>
      </div>

      {/* Views */}
      {view === 'list' && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-5 border-b bg-gray-50">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <MenuIcon size={20} color="#00aa45" />
              Campañas creadas
            </h2>
          </div>
          {campaigns.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <MenuIcon size={32} color="#9ca3af" />
              </div>
              <p className="text-gray-600 font-semibold mb-4">No hay campañas todavía</p>
              <button onClick={() => { resetForm(); setView('create'); }} className="px-5 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700">
                Crear primera campaña
              </button>
            </div>
          ) : (
            <div className="space-y-3 lg:space-y-0 px-2 sm:px-0 -mx-2 sm:mx-0">
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider font-semibold">
                      <th className="px-5 py-3">Nombre</th>
                      <th className="px-5 py-3">Asunto</th>
                      <th className="px-5 py-3">Estado</th>
                      <th className="px-5 py-3">Enviados</th>
                      <th className="px-5 py-3">Fecha</th>
                      <th className="px-5 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {campaigns.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50/50 transition-colors duration-200">
                        <td className="px-5 py-4">
                          <button onClick={() => loadCampaignDetail(c.id)} className="font-bold text-gray-900 hover:text-green-600 text-sm">
                            {c.nombre}
                          </button>
                        </td>
                        <td className="px-5 py-4 text-gray-600 text-sm max-w-[200px] truncate">{c.asunto}</td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${getEstadoColor(c.estado)}`}>
                            {c.estado}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-gray-600 text-sm">
                          {c.estado === 'Enviada' ? `${c.total_enviados}/${c.total_destinatarios}` : '—'}
                        </td>
                        <td className="px-5 py-4 text-gray-500 text-xs">
                          {c.fecha_envio ? formatDate(c.fecha_envio) : formatDate(c.creada_en)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex gap-2 justify-end">
                            {c.estado === 'Borrador' && (
                              <>
                                <button onClick={() => setConfirmSend(c.id)} title="Enviar" className="p-2 rounded-lg hover:bg-green-50 text-green-600 transition-colors">
                                  <ChevronRightIcon size={18} />
                                </button>
                                <button onClick={() => startEdit(c)} title="Editar" className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors">
                                  <EditIcon size={18} />
                                </button>
                              </>
                            )}
                            <button onClick={() => handleDuplicate(c.id)} title="Duplicar" className="p-2 rounded-lg hover:bg-purple-50 text-purple-600 transition-colors">
                              <PlusIcon size={18} />
                            </button>
                            <button onClick={() => setConfirmDelete(c.id)} title="Eliminar" className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors">
                              <TrashIcon size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-3">
                {campaigns.map((c) => (
                  <div key={c.id} className="bg-white border rounded-xl p-4 sm:p-5 hover:bg-gray-50/50 transition-colors duration-200 shadow-sm">
                    {/* Header: Nombre y Estado */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <button onClick={() => loadCampaignDetail(c.id)} className="flex-1 text-left">
                        <p className="font-bold text-gray-900 hover:text-green-600 text-sm truncate">{c.nombre}</p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium mt-0.5">Campaña</p>
                      </button>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap ${getEstadoColor(c.estado)}`}>
                        {c.estado}
                      </span>
                    </div>

                    {/* Asunto */}
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 mb-3">
                      <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium mb-1">Asunto</p>
                      <p className="text-sm text-gray-800 font-medium line-clamp-2">{c.asunto}</p>
                    </div>

                    {/* Grid: Enviados | Fecha */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium mb-1">Estado envío</p>
                        <p className="font-bold text-lg text-gray-900">
                          {c.estado === 'Enviada' ? `${c.total_enviados}/${c.total_destinatarios}` : '—'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium mb-1">Fecha</p>
                        <p className="text-xs font-medium text-gray-500">
                          {(c.fecha_envio ? formatDate(c.fecha_envio) : formatDate(c.creada_en)).split(',')[0]}
                        </p>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                      {c.estado === 'Borrador' && (
                        <>
                          <button onClick={() => setConfirmSend(c.id)} title="Enviar" className="flex-1 px-3 py-2 rounded-lg hover:bg-green-50 text-green-600 text-xs font-bold transition-colors flex items-center justify-center gap-1">
                            <ChevronRightIcon size={14} />
                            Enviar
                          </button>
                          <button onClick={() => startEdit(c)} title="Editar" className="flex-1 px-3 py-2 rounded-lg hover:bg-blue-50 text-blue-600 text-xs font-bold transition-colors flex items-center justify-center gap-1">
                            <EditIcon size={14} />
                            Editar
                          </button>
                        </>
                      )}
                      <button onClick={() => handleDuplicate(c.id)} title="Duplicar" className={`flex-1 px-3 py-2 rounded-lg hover:bg-purple-50 text-purple-600 text-xs font-bold transition-colors flex items-center justify-center gap-1`}>
                        <PlusIcon size={14} />
                        Copia
                      </button>
                      <button onClick={() => setConfirmDelete(c.id)} title="Eliminar" className="flex-1 px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 text-xs font-bold transition-colors flex items-center justify-center gap-1">
                        <TrashIcon size={14} />
                        Borrar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {view === 'subscribers' && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-5 border-b bg-gray-50">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <UserIcon size={20} color="#00aa45" />
              Suscriptores de Newsletter
              <span className="ml-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                {subscribers.length}
              </span>
            </h2>
          </div>
          {subscribers.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <UserIcon size={32} color="#9ca3af" />
              </div>
              <p className="text-gray-600 font-semibold">No hay suscriptores todavía</p>
            </div>
          ) : (
            <div className="space-y-3 lg:space-y-0 px-2 sm:px-0 -mx-2 sm:mx-0">
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider font-semibold">
                      <th className="px-5 py-3">#</th>
                      <th className="px-5 py-3">Email</th>
                      <th className="px-5 py-3">Nombre</th>
                      <th className="px-5 py-3">Fecha suscripción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {subscribers.map((sub, i) => (
                      <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors duration-200">
                        <td className="px-5 py-4 text-gray-400 text-sm">{i + 1}</td>
                        <td className="px-5 py-4 font-medium text-gray-900 text-sm">{sub.email}</td>
                        <td className="px-5 py-4 text-gray-600 text-sm">{sub.nombre || '—'}</td>
                        <td className="px-5 py-4 text-gray-500 text-xs">{formatDate(sub.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-3">
                {subscribers.map((sub, i) => (
                  <div key={sub.id} className="bg-white border rounded-xl p-4 sm:p-5 shadow-sm">
                    {/* Header: # y Email */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="font-bold text-green-700 text-xs">#{i + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium mb-0.5">Email</p>
                        <p className="font-bold text-gray-900 text-sm truncate">{sub.email}</p>
                      </div>
                    </div>

                    {/* Nombre */}
                    {sub.nombre && (
                      <div className="mb-3 bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium mb-1">Nombre</p>
                        <p className="text-sm text-gray-800 font-medium">{sub.nombre}</p>
                      </div>
                    )}

                    {/* Fecha */}
                    <div className="flex items-center text-[10px] font-medium text-gray-400 uppercase tracking-widest border-t border-gray-100 pt-3">
                      <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      {formatDate(sub.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {view === 'create' && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-5 border-b bg-gray-50 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">
              {editingId ? 'Editar campaña' : 'Nueva campaña'}
            </h2>
            <button onClick={() => { resetForm(); setView('list'); }} className="text-gray-400 hover:text-gray-600 p-1">
              <XIcon size={24} />
            </button>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-6">
            {!editingId && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">Plantillas</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(TEMPLATES).map(([key, t]) => (
                    <button type="button" key={key} onClick={() => applyTemplate(key)}
                      className="px-3 py-2 rounded-lg text-xs font-bold border border-gray-200 hover:border-green-400 hover:bg-green-50 transition-all text-gray-600 hover:text-green-600">
                      {t.nombre}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Nombre *</label>
                <input type="text" value={formData.nombre} onChange={(e: any) => setFormData((prev: any) => ({ ...prev, nombre: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm"
                  placeholder="Ej: Ofertas de Verano" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Segmento</label>
                <select value={formData.tipo_segmento} onChange={(e: any) => setFormData((prev: any) => ({ ...prev, tipo_segmento: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm">
                  <option value="Todos">Todos los suscriptores</option>
                  <option value="Premium">Premium</option>
                  <option value="Ofertas">Interesados en ofertas</option>
                  <option value="Abandono">Carritos abandonados</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Asunto del email *</label>
              <input type="text" value={formData.asunto} onChange={(e: any) => setFormData((prev: any) => ({ ...prev, asunto: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm"
                placeholder="Ej: Ofertas exclusivas para ti" required />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Descripción interna</label>
              <input type="text" value={formData.descripcion} onChange={(e: any) => setFormData((prev: any) => ({ ...prev, descripcion: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm"
                placeholder="Para organizar (no se envía)" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-bold text-gray-700">Contenido HTML *</label>
                <button type="button" onClick={() => setShowPreview(!showPreview)}
                  className="text-xs font-bold px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all flex items-center gap-1">
                  <EyeIcon size={14} />
                  {showPreview ? 'Editor' : 'Previsualizar'}
                </button>
              </div>

              {showPreview ? (
                <div className="border rounded-lg overflow-hidden bg-gray-50">
                  <iframe ref={previewRef} title="Preview" className="w-full border-0" style={{ height: 400 }} sandbox="allow-same-origin" />
                </div>
              ) : (
                <textarea value={formData.contenido_html} onChange={(e: any) => setFormData((prev: any) => ({ ...prev, contenido_html: e.target.value }))}
                  rows={12}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all font-mono text-xs"
                  placeholder="<h2>Título</h2>\n<p>Contenido...</p>" required />
              )}
              <p className="text-xs text-gray-500 mt-2">El email se envuelve automáticamente con logo, footer y enlace de desuscripción.</p>
            </div>

            <div className="flex gap-3 pt-4">
              <button type="submit" className="px-6 py-2.5 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition-all">
                {editingId ? 'Guardar cambios' : 'Crear campaña'}
              </button>
              <button type="button" onClick={() => { resetForm(); setView('list'); }}
                className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-all">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {view === 'detail' && selectedCampaign && (
        <div className="space-y-4">
          <button onClick={() => setView('list')} className="text-sm text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1">
            ← Volver a campañas
          </button>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedCampaign.nombre}</h2>
                <p className="text-gray-500 text-sm mt-1">{selectedCampaign.descripcion || 'Sin descripción'}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getEstadoColor(selectedCampaign.estado)}`}>
                  {selectedCampaign.estado}
                </span>
                {selectedCampaign.estado === 'Borrador' && (
                  <button onClick={() => setConfirmSend(selectedCampaign.id)} className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-bold hover:bg-green-700">
                    Enviar ahora
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Asunto</p>
                <p className="text-sm font-bold text-gray-900 mt-1">{selectedCampaign.asunto}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Destinatarios</p>
                <p className="text-sm font-bold text-gray-900 mt-1">{selectedCampaign.total_destinatarios}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Enviados</p>
                <p className="text-sm font-bold text-green-600 mt-1">{selectedCampaign.total_enviados}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Fecha envío</p>
                <p className="text-sm font-bold text-gray-900 mt-1">{formatDate(selectedCampaign.fecha_envio)}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-3">Contenido</h3>
              <div className="border rounded-lg p-5 bg-gray-50">
                <div dangerouslySetInnerHTML={{ __html: selectedCampaign.contenido_html }} style={{ color: '#111827', lineHeight: 1.6 }} />
              </div>
            </div>
          </div>

          {campaignLogs.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-5 border-b bg-gray-50 flex items-center gap-2">
                <PackageIcon size={20} color="#00aa45" />
                <h3 className="text-sm font-bold text-gray-900">Registro de envíos ({campaignLogs.length})</h3>
              </div>

              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider font-semibold sticky top-0">
                      <th className="px-5 py-3">Email</th>
                      <th className="px-5 py-3">Estado</th>
                      <th className="px-5 py-3">Error</th>
                      <th className="px-5 py-3">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {campaignLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3 text-gray-900 text-sm">{log.email}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${log.estado === 'Enviado' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {log.estado === 'Enviado' ? <CheckIcon size={12} /> : <XIcon size={12} />}
                            {log.estado}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-500 text-xs">{log.error_mensaje || '—'}</td>
                        <td className="px-5 py-3 text-gray-400 text-xs">{formatDate(log.fecha_evento)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden p-4 sm:p-5 space-y-3 max-h-96 overflow-y-auto">
                {campaignLogs.map((log) => (
                  <div key={log.id} className="border rounded-lg p-3.5 bg-gray-50">
                    {/* Email & Status */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <p className="text-xs font-bold text-gray-900 truncate flex-1">{log.email}</p>
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 whitespace-nowrap ${log.estado === 'Enviado' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {log.estado === 'Enviado' ? <CheckIcon size={10} /> : <XIcon size={10} />}
                        {log.estado}
                      </span>
                    </div>

                    {/* Error Message */}
                    {log.error_mensaje && (
                      <div className="mb-2.5 text-xs text-red-600 bg-red-50 rounded p-2 border border-red-100">
                        {log.error_mensaje}
                      </div>
                    )}

                    {/* Date */}
                    <div className="flex items-center text-[10px] font-medium text-gray-400 uppercase tracking-widest">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      {formatDate(log.fecha_evento)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {confirmSend && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 rounded-full bg-amber-100">
                <AlertIcon size={24} color="#d97706" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Confirmar envío</h3>
                <p className="text-gray-600 text-sm">¿Estás seguro de enviar esta campaña a <strong>{stats.total_suscriptores} suscriptores</strong>?</p>
              </div>
            </div>
            <p className="text-xs text-amber-800 bg-amber-50 rounded-lg p-3 mb-4 flex items-start gap-2">
              <AlertIcon size={14} className="flex-shrink-0 mt-0.5" />
              Esta acción no se puede deshacer. Los emails se enviarán inmediatamente.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmSend(null)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-bold">
                Cancelar
              </button>
              <button onClick={() => handleSend(confirmSend)} className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-bold hover:bg-green-700">
                Enviar campaña
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 rounded-full bg-red-100">
                <TrashIcon size={24} color="#dc2626" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Eliminar campaña</h3>
                <p className="text-gray-600 text-sm">¿Estás seguro? Se eliminarán todos los registros de envío también.</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-bold">
                Cancelar
              </button>
              <button onClick={() => handleDelete(confirmDelete)} className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
