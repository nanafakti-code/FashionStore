// =====================================================
// NOTIFICATION SETTINGS — Persistencia en Supabase
// =====================================================
// Los toggles se guardan inmediatamente en la tabla
// admin_preferences vía PATCH /api/admin/preferences
// =====================================================
import { useState, useEffect } from 'react';

interface NotifOption {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  saving?: boolean;
}

interface NotifGroup {
  key: string;
  title: string;
  icon: any;
  options: NotifOption[];
}

// Mapeo DB_KEY → grupo/opción
const STRUCTURE: { key: string; title: string; iconType: string; options: Omit<NotifOption, 'enabled'>[] }[] = [
  {
    key: 'email',
    title: 'Correo electrónico',
    iconType: 'email',
    options: [
      { id: 'new_order', label: 'Nuevos pedidos', description: 'Recibir un email cuando se registre un nuevo pedido.' },
      { id: 'low_stock', label: 'Stock bajo', description: 'Aviso cuando un producto tenga pocas unidades.' },
      { id: 'new_user', label: 'Nuevos usuarios', description: 'Notificación al registrarse un nuevo cliente.' },
    ],
  },
  {
    key: 'push',
    title: 'Notificaciones push',
    iconType: 'push',
    options: [
      { id: 'urgent_order', label: 'Pedidos urgentes', description: 'Notificación para pedidos con prioridad alta.' },
      { id: 'returns', label: 'Devoluciones', description: 'Aviso inmediato cuando un cliente solicite devolución.' },
    ],
  },
  {
    key: 'reports',
    title: 'Informes y reportes',
    iconType: 'reports',
    options: [
      { id: 'daily_summary', label: 'Resumen diario', description: 'Resumen de ventas y actividad cada mañana.' },
      { id: 'weekly_report', label: 'Informe semanal', description: 'Análisis completo semanal los lunes.' },
      { id: 'monthly_report', label: 'Informe mensual', description: 'Reporte mensual del rendimiento.' },
    ],
  },
];

const ICONS: Record<string, any> = {
  email: (
    <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  ),
  push: (
    <svg className="w-4 h-4 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  ),
  reports: (
    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
};

export default function NotificationSettings() {
  const [groups, setGroups] = useState<NotifGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastToggle, setLastToggle] = useState<{ id: string; ok: boolean } | null>(null);

  // Carga inicial desde la API
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/preferences');
      if (!res.ok) throw new Error('Error cargando preferencias');
      const prefs = await res.json();

      // Mapear la respuesta a la estructura de grupos
      const mapped: NotifGroup[] = STRUCTURE.map(s => ({
        key: s.key,
        title: s.title,
        icon: ICONS[s.iconType],
        options: s.options.map(opt => ({
          ...opt,
          enabled: Boolean(prefs[opt.id]),
          saving: false,
        })),
      }));

      setGroups(mapped);
    } catch (err: any) {
      console.error('Error:', err);
      setError('No se pudieron cargar las preferencias. Asegúrate de ejecutar el SQL de admin_preferences.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle individual — persiste inmediatamente
  const handleToggle = async (groupKey: string, optionId: string) => {
    // 1. Encontrar estado actual
    const group = groups.find(g => g.key === groupKey);
    const option = group?.options.find(o => o.id === optionId);
    if (!option) return;

    const newValue = !option.enabled;

    // 2. Actualizar UI inmediatamente (optimistic)
    setGroups(prev => prev.map(g =>
      g.key === groupKey
        ? {
            ...g,
            options: g.options.map(o =>
              o.id === optionId ? { ...o, enabled: newValue, saving: true } : o
            ),
          }
        : g
    ));

    // 3. Persistir en BD
    try {
      const res = await fetch('/api/admin/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: optionId, value: newValue }),
      });

      if (!res.ok) throw new Error('Error al guardar');

      setLastToggle({ id: optionId, ok: true });
    } catch {
      // Rollback
      setGroups(prev => prev.map(g =>
        g.key === groupKey
          ? {
              ...g,
              options: g.options.map(o =>
                o.id === optionId ? { ...o, enabled: !newValue } : o
              ),
            }
          : g
      ));
      setLastToggle({ id: optionId, ok: false });
    } finally {
      // Quitar estado "saving"
      setGroups(prev => prev.map(g =>
        g.key === groupKey
          ? {
              ...g,
              options: g.options.map(o =>
                o.id === optionId ? { ...o, saving: false } : o
              ),
            }
          : g
      ));
      setTimeout(() => setLastToggle(null), 2000);
    }
  };

  // ---- Loading skeleton ----
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Notificaciones</h2>
          <p className="text-sm text-slate-400 mt-0.5">Cargando preferencias...</p>
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
            <div className="h-5 w-40 bg-slate-100 rounded mb-5" />
            {[1, 2].map(j => (
              <div key={j} className="flex items-center justify-between py-3.5 px-4">
                <div className="space-y-2 flex-1 mr-4">
                  <div className="h-4 w-32 bg-slate-100 rounded" />
                  <div className="h-3 w-56 bg-slate-50 rounded" />
                </div>
                <div className="h-6 w-11 bg-slate-100 rounded-full" />
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  // ---- Error ----
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Notificaciones</h2>
        </div>
        <div className="bg-white rounded-xl border border-red-200 p-8 text-center">
          <svg className="w-10 h-10 text-red-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          <p className="text-sm text-red-500 font-medium mb-3">{error}</p>
          <button onClick={loadPreferences} className="text-xs text-slate-500 hover:text-slate-700 font-medium underline">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Notificaciones</h2>
          <p className="text-sm text-slate-400 mt-0.5">Los cambios se guardan automáticamente al activar o desactivar.</p>
        </div>
        {/* Info badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg">
          <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
          <span className="text-[11px] text-emerald-700 font-semibold">fashionstorerbv@gmail.com</span>
        </div>
      </div>

      {/* Groups */}
      {groups.map(group => (
        <div key={group.key} className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
              {group.icon}
            </div>
            <h3 className="text-sm font-semibold text-slate-700">{group.title}</h3>
          </div>

          <div className="space-y-1">
            {group.options.map((opt, oi) => (
              <div
                key={opt.id}
                className={`flex items-center justify-between py-3.5 px-4 rounded-lg transition-colors ${
                  opt.enabled ? 'bg-slate-50/70' : ''
                } ${oi < group.options.length - 1 ? 'border-b border-slate-100' : ''}`}
              >
                <div className="flex-1 mr-4">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-700">{opt.label}</p>
                    {/* Saving indicator */}
                    {opt.saving && (
                      <svg className="w-3.5 h-3.5 text-slate-300 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    )}
                    {/* Success / Error flash */}
                    {lastToggle?.id === opt.id && !opt.saving && (
                      lastToggle.ok ? (
                        <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      )
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{opt.description}</p>
                </div>

                {/* Toggle switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={opt.enabled}
                  disabled={opt.saving}
                  onClick={() => handleToggle(group.key, opt.id)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-wait ${
                    opt.enabled ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    opt.enabled ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Info footer */}
      <div className="flex items-start gap-3 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl">
        <svg className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
        </svg>
        <div className="space-y-1">
          <p className="text-xs text-slate-500">Los informes programados (diario, semanal, mensual) se envían automáticamente si están activados. El resumen diario se envía cada mañana a las 08:00, el semanal los lunes y el mensual el día 1 de cada mes.</p>
          <p className="text-xs text-slate-400">Destino: <span className="font-semibold text-slate-500">fashionstorerbv@gmail.com</span></p>
        </div>
      </div>
    </div>
  );
}
