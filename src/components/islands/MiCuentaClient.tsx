import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface UserData {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  genero: string;
  fecha_nacimiento: string;
}

interface Pedido {
  id: string;
  numero_pedido: string;
  estado: string;
  fecha_creacion: string;
  total: number;
  metodo_pago: string;
  detalles_pedido: Array<{ cantidad: number; precio_unitario: number }>;
}

export default function MiCuentaClient() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("perfil");
  const [profileMessage, setProfileMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    loadUserData();
    
    // Check for hash in URL to set active section
    const hash = window.location.hash.slice(1);
    if (hash === "pedidos" || hash === "seguridad") {
      setActiveSection(hash);
    }
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);

      // Get current user from auth
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("No user authenticated:", userError);
        window.location.href = "/";
        return;
      }

      console.log("Current user:", user);

      // Load user info from usuarios table
      let { data, error } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", user.id)
        .single();

      console.log("User data from DB:", data, "Error:", error);

      // If user doesn't exist in usuarios table, create it
      if (error && error.code === "PGRST116") {
        console.log("User not found in usuarios table, creating...");
        const fullName =
          user.user_metadata?.full_name || user.email?.split("@")[0] || "";
        const [nombre, ...apellidos] = fullName.split(" ");

        const { data: newUser, error: insertError } = await supabase
          .from("usuarios")
          .insert({
            id: user.id,
            email: user.email,
            nombre: nombre || "",
            apellidos: apellidos.join(" ") || "",
            activo: true,
            verificado: true,
          })
          .select()
          .single();

        if (insertError) {
          console.error("Error creating user in usuarios table:", insertError);
        } else {
          data = newUser;
          console.log("User created successfully:", data);
        }
      }

      setUserData(data as UserData);

      // Load pedidos
      const { data: pedidosData, error: pedidosError } = await supabase
        .from("pedidos")
        .select("*, detalles_pedido(cantidad, precio_unitario)")
        .eq("usuario_id", user.id)
        .order("fecha_creacion", { ascending: false });

      if (pedidosError) {
        console.error("Error loading pedidos:", pedidosError);
      } else {
        setPedidos((pedidosData as Pedido[]) || []);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setProfileMessage(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const formData = new FormData(e.target as HTMLFormElement);

      const { error } = await supabase
        .from("usuarios")
        .update({
          nombre: formData.get("nombre"),
          apellidos: formData.get("apellidos"),
          telefono: formData.get("telefono"),
          genero: formData.get("genero"),
          fecha_nacimiento: formData.get("fecha_nacimiento"),
        })
        .eq("id", user?.id);

      if (error) throw error;

      setProfileMessage({
        type: "success",
        message: "Perfil actualizado correctamente",
      });
      setTimeout(() => setProfileMessage(null), 3000);

      // Reload user data
      loadUserData();
    } catch (error: any) {
      setProfileMessage({
        type: "error",
        message: error?.message || "Error al guardar los cambios",
      });
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setPasswordMessage(null);

      const formData = new FormData(e.target as HTMLFormElement);
      const newPassword = formData.get("new_password") as string;
      const confirmPassword = formData.get("confirm_password") as string;

      if (newPassword !== confirmPassword) {
        throw new Error("Las contraseñas no coinciden");
      }
      if (newPassword.length < 6) {
        throw new Error("La contraseña debe tener al menos 6 caracteres");
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setPasswordMessage({
        type: "success",
        message: "Contraseña cambiada correctamente",
      });
      (e.target as HTMLFormElement).reset();
      setTimeout(() => setPasswordMessage(null), 3000);
    } catch (error: any) {
      setPasswordMessage({
        type: "error",
        message: error?.message || "Error al cambiar la contraseña",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const getStatusColor = (estado: string) => {
    const colors: Record<string, string> = {
      Pendiente: "bg-yellow-100 text-yellow-700",
      Confirmado: "bg-blue-100 text-blue-700",
      Pagado: "bg-purple-100 text-purple-700",
      Enviado: "bg-cyan-100 text-cyan-700",
      Entregado: "bg-green-100 text-green-700",
      Cancelado: "bg-red-100 text-red-700",
      Devuelto: "bg-gray-100 text-gray-700",
    };
    return colors[estado] || "bg-gray-100 text-gray-700";
  };

  if (loading) {
    return (
      <div class="text-center py-8">
        <p class="text-gray-600">Cargando...</p>
      </div>
    );
  }

  return (
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Sidebar Menu */}
      <div class="lg:col-span-1">
        <div class="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sticky top-24">
          {/* User Card */}
          <div class="text-center mb-8 pb-8 border-b-2 border-gray-100">
            <div class="w-20 h-20 mx-auto bg-gradient-to-br from-[#00aa45] to-[#008a35] rounded-full flex items-center justify-center mb-4">
              <svg
                class="w-10 h-10 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clip-rule="evenodd"
                ></path>
              </svg>
            </div>
            <h3 class="text-lg font-bold text-gray-900">
              {userData?.nombre || "Usuario"}
            </h3>
            <p class="text-sm text-gray-600 mt-1">{userData?.email || ""}</p>
          </div>

          {/* Menu Items */}
          <nav class="space-y-2">
            <button
              onClick={() => setActiveSection("perfil")}
              class={`w-full text-left px-4 py-3 rounded-lg font-semibold transition ${
                activeSection === "perfil"
                  ? "bg-[#f0fff6] text-[#00aa45] border-l-4 border-[#00aa45]"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <svg
                class="w-5 h-5 inline mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clip-rule="evenodd"
                ></path>
              </svg>
              Información Personal
            </button>

            <button
              onClick={() => setActiveSection("pedidos")}
              class={`w-full text-left px-4 py-3 rounded-lg font-semibold transition ${
                activeSection === "pedidos"
                  ? "bg-[#f0fff6] text-[#00aa45] border-l-4 border-[#00aa45]"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <svg
                class="w-5 h-5 inline mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 6H6.28l-.31-1.243A1 1 0 005 4H3z"></path>
                <path d="M16 16a2 2 0 11-4 0 2 2 0 014 0zM4 16a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
              Mis Pedidos
            </button>

            <button
              onClick={() => setActiveSection("seguridad")}
              class={`w-full text-left px-4 py-3 rounded-lg font-semibold transition ${
                activeSection === "seguridad"
                  ? "bg-[#f0fff6] text-[#00aa45] border-l-4 border-[#00aa45]"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <svg
                class="w-5 h-5 inline mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clip-rule="evenodd"
                ></path>
              </svg>
              Cambiar Contraseña
            </button>

            <button
              onClick={handleLogout}
              class="w-full text-left px-4 py-3 rounded-lg font-semibold text-red-600 hover:bg-red-50 transition mt-4 pt-4 border-t-2 border-gray-100"
            >
              <svg
                class="w-5 h-5 inline mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clip-rule="evenodd"
                ></path>
              </svg>
              Cerrar Sesión
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div class="lg:col-span-3 space-y-8">
        {/* Información Personal */}
        {activeSection === "perfil" && (
          <div class="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition">
            <h2 class="text-3xl font-black text-gray-900 mb-8 flex items-center gap-3 pb-4 border-b-2 border-gray-100">
              <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00aa45] to-[#008a35] flex items-center justify-center">
                <svg
                  class="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clip-rule="evenodd"
                  ></path>
                </svg>
              </div>
              Información Personal
            </h2>

            <form onSubmit={handleProfileSubmit} class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    placeholder="Tu nombre"
                    defaultValue={userData?.nombre || ""}
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aa45] focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">
                    Apellidos
                  </label>
                  <input
                    type="text"
                    name="apellidos"
                    placeholder="Tus apellidos"
                    defaultValue={userData?.apellidos || ""}
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aa45] focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="tu@correo.com"
                    defaultValue={userData?.email || ""}
                    disabled
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 text-sm cursor-not-allowed"
                  />
                  <p class="text-xs text-gray-500 mt-1">El email no puede ser cambiado</p>
                </div>

                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    name="telefono"
                    placeholder="Ej: +34 600 123 456"
                    defaultValue={userData?.telefono || ""}
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aa45] focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">
                    Género
                  </label>
                  <select
                    name="genero"
                    defaultValue={userData?.genero || ""}
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aa45] focus:border-transparent text-sm"
                  >
                    <option value="">Selecciona tu género</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">
                    Fecha de nacimiento
                  </label>
                  <input
                    type="date"
                    name="fecha_nacimiento"
                    defaultValue={userData?.fecha_nacimiento || ""}
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aa45] focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {profileMessage && (
                <div
                  class={`text-sm p-4 rounded-xl border-l-4 flex items-start gap-3 ${
                    profileMessage.type === "success"
                      ? "bg-green-50 text-green-600 border-green-500"
                      : "bg-red-50 text-red-600 border-red-500"
                  }`}
                >
                  {profileMessage.type === "success" && (
                    <svg
                      class="w-5 h-5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd"
                      ></path>
                    </svg>
                  )}
                  <span>{profileMessage.message}</span>
                </div>
              )}

              <div class="flex gap-4 pt-6">
                <button
                  type="submit"
                  class="flex-1 bg-gradient-to-r from-[#00aa45] to-[#009340] text-white py-3 rounded-xl font-bold hover:shadow-lg hover:from-[#009340] hover:to-[#007a2d] transition duration-200"
                >
                  Guardar Cambios
                </button>
                <button
                  type="reset"
                  class="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition duration-200"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Cambiar Contraseña */}
        {activeSection === "seguridad" && (
          <div class="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition">
            <h2 class="text-3xl font-black text-gray-900 mb-8 flex items-center gap-3 pb-4 border-b-2 border-gray-100">
              <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00aa45] to-[#008a35] flex items-center justify-center">
                <svg
                  class="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
              </div>
              Cambiar Contraseña
            </h2>

            <form onSubmit={handlePasswordSubmit} class="space-y-6">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                  Contraseña Actual *
                </label>
                <input
                  type="password"
                  name="old_password"
                  placeholder="Ingresa tu contraseña actual"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aa45] focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                  Nueva Contraseña *
                </label>
                <input
                  type="password"
                  name="new_password"
                  placeholder="Crea una nueva contraseña (mín. 6 caracteres)"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aa45] focus:border-transparent text-sm"
                />
                <p class="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                  Confirmar Contraseña *
                </label>
                <input
                  type="password"
                  name="confirm_password"
                  placeholder="Repite tu nueva contraseña"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aa45] focus:border-transparent text-sm"
                />
              </div>

              {passwordMessage && (
                <div
                  class={`text-sm p-4 rounded-xl border-l-4 flex items-start gap-3 ${
                    passwordMessage.type === "success"
                      ? "bg-green-50 text-green-600 border-green-500"
                      : "bg-red-50 text-red-600 border-red-500"
                  }`}
                >
                  {passwordMessage.type === "success" && (
                    <svg
                      class="w-5 h-5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd"
                      ></path>
                    </svg>
                  )}
                  <span>{passwordMessage.message}</span>
                </div>
              )}

              <button
                type="submit"
                class="w-full bg-gradient-to-r from-[#00aa45] to-[#009340] text-white py-3 rounded-xl font-bold hover:shadow-lg hover:from-[#009340] hover:to-[#007a2d] transition duration-200"
              >
                Cambiar Contraseña
              </button>
            </form>
          </div>
        )}

        {/* Mis Pedidos */}
        {activeSection === "pedidos" && (
          <div class="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition">
            <h2 class="text-3xl font-black text-gray-900 mb-8 flex items-center gap-3 pb-4 border-b-2 border-gray-100">
              <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00aa45] to-[#008a35] flex items-center justify-center">
                <svg
                  class="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 6H6.28l-.31-1.243A1 1 0 005 4H3z"></path>
                  <path d="M16 16a2 2 0 11-4 0 2 2 0 014 0zM4 16a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
              Mis Pedidos
            </h2>
            <div class="space-y-4">
              {pedidos.length === 0 ? (
                <p class="text-gray-600 text-center py-8">No tienes pedidos aún</p>
              ) : (
                pedidos.map((pedido) => {
                  const articulos =
                    pedido.detalles_pedido?.reduce((acc, d) => acc + d.cantidad, 0) || 0;
                  const total = (pedido.total / 100).toFixed(2);
                  const statusColor = getStatusColor(pedido.estado);
                  const metodo = pedido.metodo_pago || "N/A";

                  return (
                    <div
                      key={pedido.id}
                      class="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-[#00aa45] transition"
                    >
                      <div class="flex justify-between items-start mb-3">
                        <div>
                          <h3 class="font-bold text-gray-900">
                            #{pedido.numero_pedido}
                          </h3>
                          <p class="text-sm text-gray-600">
                            {new Date(
                              pedido.fecha_creacion
                            ).toLocaleDateString("es-ES")}
                          </p>
                        </div>
                        <span
                          class={`px-3 py-1 rounded-full text-xs font-bold ${statusColor}`}
                        >
                          {pedido.estado}
                        </span>
                      </div>
                      <div class="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p class="text-gray-600">Artículos</p>
                          <p class="font-bold">{articulos}</p>
                        </div>
                        <div>
                          <p class="text-gray-600">Total</p>
                          <p class="font-bold text-[#00aa45]">${total}</p>
                        </div>
                        <div>
                          <p class="text-gray-600">Método</p>
                          <p class="font-bold">{metodo}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
