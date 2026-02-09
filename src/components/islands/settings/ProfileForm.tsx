// =====================================================
// PROFILE FORM — Perfil General (solo lectura)
// Muestra la información del administrador
// Paleta: Slate/Zinc — Brand: #00aa45
// =====================================================

const ADMIN_PROFILE = {
  nombre: 'Admin',
  email: 'fashionstorerbv@gmail.com',
  telefono: '+34 658 823 543',
  ciudad: 'Chipiona',
  pais: 'España',
  rol: 'Administrador',
};

export default function ProfileForm() {
  const readOnlyClass =
    'w-full px-3.5 py-2.5 bg-zinc-100 border border-slate-200 rounded-lg text-sm text-slate-700 cursor-default select-text';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900">Perfil General</h2>
        <p className="text-sm text-slate-400 mt-0.5">
          Información del administrador de la tienda.
        </p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-5">Datos personales</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Nombre */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Nombre completo
            </label>
            <div className={readOnlyClass}>{ADMIN_PROFILE.nombre}</div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Email
            </label>
            <div className={readOnlyClass}>{ADMIN_PROFILE.email}</div>
          </div>

          {/* Teléfono */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Teléfono
            </label>
            <div className={readOnlyClass}>{ADMIN_PROFILE.telefono}</div>
          </div>

          {/* Ciudad */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Ciudad
            </label>
            <div className={readOnlyClass}>{ADMIN_PROFILE.ciudad}</div>
          </div>

          {/* País */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">
              País
            </label>
            <div className={readOnlyClass}>{ADMIN_PROFILE.pais}</div>
          </div>

          {/* Rol — Badge */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Rol
            </label>
            <div className="flex items-center gap-2.5 h-[42px]">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-100">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                </svg>
                {ADMIN_PROFILE.rol}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
