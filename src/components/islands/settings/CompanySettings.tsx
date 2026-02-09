// =====================================================
// COMPANY SETTINGS — Configuración de Empresa
// Conectado a GET/PUT /api/admin/company
// =====================================================
import { useState, useEffect } from 'react';

interface CompanyData {
  nombre: string;
  nif: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  codigo_postal: string;
  pais: string;
}

const DEFAULTS: CompanyData = {
  nombre: 'FashionStore',
  nif: 'B-12345678',
  email: 'fashionstorerbv@gmail.com',
  telefono: '+34 910 000 000',
  direccion: 'Calle Gran Vía 28, 3ª Planta',
  ciudad: 'Madrid',
  codigo_postal: '28013',
  pais: 'España',
};

export default function CompanySettings() {
  const [company, setCompany] = useState<CompanyData>(DEFAULTS);
  const [original, setOriginal] = useState<CompanyData>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // ---- Cargar datos de empresa al montar ----
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/admin/company');
        if (res.ok) {
          const data = await res.json();
          const mapped: CompanyData = {
            nombre: data.nombre ?? DEFAULTS.nombre,
            nif: data.nif ?? DEFAULTS.nif,
            email: data.email ?? DEFAULTS.email,
            telefono: data.telefono ?? DEFAULTS.telefono,
            direccion: data.direccion ?? DEFAULTS.direccion,
            ciudad: data.ciudad ?? DEFAULTS.ciudad,
            codigo_postal: data.codigo_postal ?? DEFAULTS.codigo_postal,
            pais: data.pais ?? DEFAULTS.pais,
          };
          setCompany(mapped);
          setOriginal(mapped);
        }
      } catch {
        // usar defaults
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const hasChanges = JSON.stringify(company) !== JSON.stringify(original);

  // ---- Guardar via API ----
  const handleSave = async () => {
    setMsg({ type: '', text: '' });

    if (!company.nombre.trim()) {
      setMsg({ type: 'error', text: 'El nombre comercial es obligatorio.' });
      return;
    }
    if (company.email && !company.email.includes('@')) {
      setMsg({ type: 'error', text: 'El email no tiene un formato válido.' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(company),
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg({ type: 'error', text: data.error || 'Error al guardar.' });
      } else {
        setOriginal({ ...company });
        setMsg({ type: 'success', text: data.message || 'Datos guardados correctamente.' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Error de conexión.' });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg({ type: '', text: '' }), 3500);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400">
        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900">Empresa</h2>
        <p className="text-sm text-slate-400 mt-0.5">Datos fiscales, dirección y contacto de la empresa.</p>
      </div>

      {/* Datos de la empresa */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-5">Datos de la empresa</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Nombre comercial</label>
            <input
              type="text"
              value={company.nombre}
              onChange={(e: any) => setCompany(c => ({ ...c, nombre: e.target.value }))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">NIF / CIF</label>
            <input
              type="text"
              value={company.nif}
              onChange={(e: any) => setCompany(c => ({ ...c, nif: e.target.value }))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Email de contacto</label>
            <input
              type="email"
              value={company.email}
              onChange={(e: any) => setCompany(c => ({ ...c, email: e.target.value }))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Teléfono</label>
            <input
              type="tel"
              value={company.telefono}
              onChange={(e: any) => setCompany(c => ({ ...c, telefono: e.target.value }))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Dirección fiscal */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-5">Dirección fiscal</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Dirección</label>
            <input
              type="text"
              value={company.direccion}
              onChange={(e: any) => setCompany(c => ({ ...c, direccion: e.target.value }))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Ciudad</label>
            <input
              type="text"
              value={company.ciudad}
              onChange={(e: any) => setCompany(c => ({ ...c, ciudad: e.target.value }))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Código Postal</label>
            <input
              type="text"
              value={company.codigo_postal}
              onChange={(e: any) => setCompany(c => ({ ...c, codigo_postal: e.target.value }))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">País</label>
            <input
              type="text"
              value={company.pais}
              onChange={(e: any) => setCompany(c => ({ ...c, pais: e.target.value }))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Feedback + Save */}
      {msg.text && (
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border ${
          msg.type === 'error'
            ? 'bg-red-50 border-red-200'
            : 'bg-emerald-50 border-emerald-200'
        }`}>
          {msg.type === 'error' ? (
            <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
          ) : (
            <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5"/></svg>
          )}
          <span className={`text-xs font-medium ${msg.type === 'error' ? 'text-red-600' : 'text-emerald-700'}`}>{msg.text}</span>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
            !hasChanges
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm'
          } disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          {saving ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
              Guardando...
            </>
          ) : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}
