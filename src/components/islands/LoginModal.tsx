import { useState, useEffect } from "react";

import { supabase } from "@/lib/supabase";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [telefono, setTelefono] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = ""; // 'unset' or '' works to restore default
    }

    // Cleanup function ensures scroll is restored if component unmounts
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Validación de email robusta
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return emailRegex.test(email.trim());
  };

  // Validación de contraseña
  const isValidPassword = (pwd: string): boolean => {
    return pwd.length >= 6;
  };

  // Sanitizar entradas de texto para prevenir XSS
  const sanitizeInput = (input: string): string => {
    return input.replace(/[<>"'&]/g, '').trim();
  };

  const handleEmailAuth = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validaciones client-side antes de enviar
    if (!isValidEmail(email)) {
      setError('Por favor, introduce un email válido (ej: usuario@dominio.com)');
      setLoading(false);
      return;
    }
    if (!isValidPassword(password)) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }
    if (isSignUp && !sanitizeInput(nombre).trim()) {
      setError('El nombre es obligatorio');
      setLoading(false);
      return;
    }
    if (isSignUp && !sanitizeInput(apellidos).trim()) {
      setError('Los apellidos son obligatorios');
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        // Crear cuenta en Auth
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (signUpError) throw signUpError;

        // Guardar datos en tabla usuarios
        if (authData.user) {
          const safeNombre = sanitizeInput(nombre);
          const safeApellidos = sanitizeInput(apellidos);
          const safeTelefono = sanitizeInput(telefono);
          const { error: insertError } = await supabase
            .from("usuarios")
            .insert([
              {
                id: authData.user.id,
                email: email.trim().toLowerCase(),
                nombre: safeNombre,
                apellidos: safeApellidos,
                telefono: safeTelefono,
                genero: null,
                fecha_nacimiento: null,
                foto_perfil: null,
                activo: true,
                verificado: false,
              },
            ]);
          if (insertError) throw insertError;

          // Enviar email de bienvenida (no bloquear registro si falla)
          try {
            const response = await fetch('/api/welcome-email', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: email.trim().toLowerCase(),
                nombre: safeNombre,
              }),
            });

            if (response.ok) {
              // Email de bienvenida enviado
            } else {
              // No bloquear - el registro fue exitoso
            }
          } catch (emailError) {
            // No lanzar error, el registro ya fue exitoso
          }
        }

        setSuccessMessage("¡Cuenta creada! Revisa tu correo para confirmar.");
        setEmail("");
        setPassword("");
        setNombre("");
        setApellidos("");
        setTelefono("");
        setIsSignUp(false);

        // Limpiar el mensaje de éxito después de 2 segundos y redirigir
        setTimeout(() => {
          setSuccessMessage("");
          onClose();
          window.location.href = "/";
        }, 2000);
      } else {
        // Iniciar sesión
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        window.location.href = "/";
      }
    } catch (err: any) {
      // Traducir errores al español
      let errorMessage = err.message || "Error en la autenticación";

      if (errorMessage.includes("row-level security policy")) {
        errorMessage = "Error de permisos. Por favor, intenta más tarde.";
      } else if (errorMessage.includes("Email not confirmed")) {
        errorMessage = "Por favor, confirma tu email antes de iniciar sesión.";
      } else if (errorMessage.includes("Invalid login credentials")) {
        errorMessage = "Email o contraseña incorrectos";
      } else if (errorMessage.includes("User already registered")) {
        errorMessage = "Este email ya está registrado";
      } else if (errorMessage.includes("Password should be at least 6 characters")) {
        errorMessage = "La contraseña debe tener al menos 6 caracteres";
      } else if (errorMessage.includes("Invalid email")) {
        errorMessage = "Por favor, ingresa un email válido";
      } else if (errorMessage.includes("unable to validate email address")) {
        errorMessage = "No pudimos validar tu email. Por favor, verifica que sea correcto.";
      } else if (errorMessage.includes("Signup disabled")) {
        errorMessage = "El registro está deshabilitado. Por favor, intenta más tarde.";
      } else if (errorMessage.includes("User already exists")) {
        errorMessage = "Este usuario ya existe";
      } else if (errorMessage.toLowerCase().includes("not authorized")) {
        errorMessage = "No tienes permiso para realizar esta acción";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Container - Scrollable overlay */}
      <div
        className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm p-4 scrollbar-hide transition-opacity"
        onClick={onClose}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          /* Fix for iOS date input appearance */
          input[type="date"] {
            -webkit-appearance: none;
            appearance: none;
            background-color: white;
            min-height: 46px; /* Match standard input height */
          }
          /* Ensures the date value is vertically centered on iOS */
          input[type="date"]::-webkit-date-and-time-value {
            min-height: 1.5em;
            text-align: left;
           }
        `}</style>
        <div className="flex items-center justify-center min-h-full py-4">
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm px-5 py-6 sm:px-8 sm:py-10 relative pointer-events-auto mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg p-2 transition font-bold text-xl w-8 h-8 flex items-center justify-center z-10"
              aria-label="Cerrar"
            >
              ✕
            </button>

            <div className="flex justify-center mb-8">
              <div className="text-2xl font-black tracking-tight">
                Fashion<span className="text-[#00aa45]">Store</span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-black text-center mb-2 text-gray-900">
              {isSignUp ? "Crea tu cuenta" : "Bienvenido"}
            </h1>

            <p className="text-center text-gray-600 mb-8 text-sm">
              {isSignUp ? "Únete a nuestra comunidad" : "Accede con tu cuenta"}
            </p>

            {/* Email & Password Form */}
            <form onSubmit={handleEmailAuth} className={`space-y-4 pointer-events-auto ${successMessage ? "opacity-50 pointer-events-none" : ""}`}>
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200">
                  {error}
                </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div className="bg-green-50 text-green-600 text-sm p-4 rounded-lg border border-green-200 flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Email Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Correo Electrónico *</label>
                <input
                  type="email"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e: any) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aa45] focus:border-transparent text-sm"
                  required
                />
              </div>

              {/* Signup Fields */}
              {isSignUp && (
                <>
                  {/* Nombre */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre *</label>
                    <input
                      type="text"
                      placeholder="Tu nombre"
                      value={nombre}
                      onChange={(e: any) => setNombre(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aa45] focus:border-transparent text-sm"
                      required
                    />
                  </div>

                  {/* Apellidos */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Apellidos *</label>
                    <input
                      type="text"
                      placeholder="Tus apellidos"
                      value={apellidos}
                      onChange={(e: any) => setApellidos(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aa45] focus:border-transparent text-sm"
                      required
                    />
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Teléfono</label>
                    <input
                      type="tel"
                      placeholder="Ej: +34 600 123 456"
                      value={telefono}
                      onChange={(e: any) => setTelefono(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aa45] focus:border-transparent text-sm"
                    />
                  </div>
                </>
              )}

              {/* Password Input */}
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Contraseña *</label>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder={isSignUp ? "Crea una contraseña" : "Tu contraseña"}
                  value={password}
                  onChange={(e: any) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aa45] focus:border-transparent text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-10 text-gray-500 hover:text-gray-700 transition-colors p-1"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  )}
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#00aa45] text-white py-3 rounded-lg font-semibold text-sm hover:bg-[#009340] transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Cargando..." : isSignUp ? "Crear cuenta" : "Iniciar sesión"}
              </button>
            </form>

            {/* Toggle Sign Up / Sign In */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-center text-sm text-gray-700 font-medium">
                {isSignUp ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?"}
              </p>
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError("");
                  setEmail("");
                  setPassword("");
                  setNombre("");
                  setApellidos("");
                  setTelefono("");
                  setTelefono("");
                  setShowPassword(false);
                }}
                className="w-full mt-3 px-4 py-2 bg-white border-2 border-[#00aa45] text-[#00aa45] font-semibold rounded-lg hover:bg-[#00aa45] hover:text-white transition duration-200"
              >
                {isSignUp ? "Inicia sesión aquí" : "Regístrate aquí"}
              </button>
            </div>

            {/* Footer */}
            <p className="text-center text-xs text-gray-500 mt-6">
              Al continuar, aceptas nuestros{" "}
              <a href="/terminos" className="text-[#00aa45] hover:underline">
                términos
              </a>
              {" "}y{" "}
              <a href="/privacidad" className="text-[#00aa45] hover:underline">
                privacidad
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
