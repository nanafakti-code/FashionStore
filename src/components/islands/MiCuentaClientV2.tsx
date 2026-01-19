/**
 * FASHIONSTORE - MI CUENTA (CLIENTE)
 * ===================================
 * Dashboard de usuario con:
 * - Información personal
 * - Historial de pedidos (tabla ordenes)
 * - Solicitar devolución
 * - Cambiar contraseña
 */

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// ============================================================
// TIPOS
// ============================================================

interface UserData {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  genero: string;
  fecha_nacimiento: string;
}

interface OrderItem {
  id: string;
  producto_nombre: string;
  producto_imagen: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  talla: string;
  color: string;
}

interface Order {
  id: string;
  numero_orden: string;
  estado: string;
  fecha_creacion: string;
  fecha_pago: string;
  fecha_envio: string;
  fecha_entrega: string;
  total: number;
  subtotal: number;
  descuento: number;
  direccion_envio: any;
  nombre_cliente: string;
  email_cliente: string;
  items?: OrderItem[];
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function MiCuentaClientV2() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("perfil");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [returnSubmitting, setReturnSubmitting] = useState(false);

  const [profileMessage, setProfileMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // ============================================================
  // CARGAR DATOS
  // ============================================================

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
        window.location.href = "/login";
        return;
      }

      // Load user info from usuarios table
      let { data, error } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", user.id)
        .single();

      // If user doesn't exist in usuarios table, create it
      if (error && error.code === "PGRST116") {
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

        if (!insertError) {
          data = newUser;
        }
      }

      setUserData(data as UserData);

      // Load orders from ordenes table (NOT pedidos)
      const { data: ordersData, error: ordersError } = await supabase
        .from("ordenes")
        .select("*")
        .eq("usuario_id", user.id)
        .order("fecha_creacion", { ascending: false });

      if (ordersError) {
        console.error("Error loading orders:", ordersError);
      } else {
        setOrders((ordersData as Order[]) || []);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // VER DETALLE DE PEDIDO
  // ============================================================

  const loadOrderDetails = async (order: Order) => {
    try {
      // Cargar items del pedido
      const { data: items, error } = await supabase
        .from("items_orden")
        .select("*")
        .eq("orden_id", order.id);

      if (!error && items) {
        setSelectedOrder({ ...order, items: items as OrderItem[] });
      } else {
        setSelectedOrder(order);
      }
    } catch (error) {
      console.error("Error loading order details:", error);
      setSelectedOrder(order);
    }
  };

  // ============================================================
  // SOLICITAR DEVOLUCIÓN
  // ============================================================

  const handleReturnRequest = async () => {
    if (!selectedOrder || !returnReason.trim()) return;

    // Validar que el pedido permite devolución
    const validStates = ["Pagado", "Enviado", "Entregado"];
    if (!validStates.includes(selectedOrder.estado)) {
      alert("Este pedido no puede ser devuelto en su estado actual.");
      return;
    }

    // Validar plazo de 30 días
    const orderDate = new Date(
      selectedOrder.fecha_entrega || selectedOrder.fecha_pago
    );
    const daysSinceOrder = Math.floor(
      (Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceOrder > 30) {
      alert(
        "El plazo de devolución de 30 días ha expirado para este pedido."
      );
      return;
    }

    setReturnSubmitting(true);

    try {
      // Llamar al endpoint de devolución
      const response = await fetch("/api/returns/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          reason: returnReason,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Actualizar estado local
        setOrders(
          orders.map((o) =>
            o.id === selectedOrder.id
              ? { ...o, estado: "Devolucion_Solicitada" }
              : o
          )
        );
        setShowReturnModal(false);
        setReturnReason("");
        setSelectedOrder(null);
        alert(
          "Solicitud de devolución enviada. Recibirás un email con las instrucciones."
        );
      } else {
        alert(result.error || "Error al procesar la solicitud");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al procesar la solicitud de devolución");
    } finally {
      setReturnSubmitting(false);
    }
  };

  // ============================================================
  // HANDLERS DE FORMULARIOS
  // ============================================================

  const handleProfileSubmit = async (e: any) => {
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
      loadUserData();
    } catch (error: any) {
      setProfileMessage({
        type: "error",
        message: error?.message || "Error al guardar los cambios",
      });
    }
  };

  const handlePasswordSubmit = async (e: any) => {
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

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
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

  // ============================================================
  // HELPERS
  // ============================================================

  const getStatusColor = (estado: string) => {
    const colors: Record<string, string> = {
      Pendiente: "bg-yellow-100 text-yellow-700",
      Confirmado: "bg-blue-100 text-blue-700",
      Pagado: "bg-purple-100 text-purple-700",
      Enviado: "bg-cyan-100 text-cyan-700",
      Entregado: "bg-green-100 text-green-700",
      Cancelado: "bg-red-100 text-red-700",
      Devuelto: "bg-gray-100 text-gray-700",
      Devolucion_Solicitada: "bg-orange-100 text-orange-700",
    };
    return colors[estado] || "bg-gray-100 text-gray-700";
  };

  const getStatusLabel = (estado: string) => {
    const labels: Record<string, string> = {
      Pendiente: "Pendiente de pago",
      Confirmado: "Confirmado",
      Pagado: "Pagado",
      Enviado: "Enviado",
      Entregado: "Entregado",
      Cancelado: "Cancelado",
      Devuelto: "Devuelto",
      Devolucion_Solicitada: "Devolucion solicitada",
    };
    return labels[estado] || estado;
  };

  const canRequestReturn = (order: Order) => {
    const validStates = ["Pagado", "Enviado", "Entregado"];
    if (!validStates.includes(order.estado)) return false;

    const orderDate = new Date(order.fecha_entrega || order.fecha_pago);
    const daysSince = Math.floor(
      (Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSince <= 30;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(2) + " EUR";
  };

  // ============================================================
  // LOADING STATE
  // ============================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#00aa45] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tu cuenta...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* ============================================================ */}
      {/* SIDEBAR */}
      {/* ============================================================ */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sticky top-24">
          {/* User Card */}
          <div className="text-center mb-8 pb-8 border-b-2 border-gray-100">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#00aa45] to-[#008a35] rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-10 h-10 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              {userData?.nombre || "Usuario"}
            </h3>
            <p className="text-sm text-gray-600 mt-1">{userData?.email || ""}</p>
          </div>

          {/* Menu Items */}
          <nav className="space-y-2">
            <button
              onClick={() => {
                setActiveSection("perfil");
                setSelectedOrder(null);
              }}
              className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition flex items-center gap-2 ${
                activeSection === "perfil"
                  ? "bg-[#f0fff6] text-[#00aa45] border-l-4 border-[#00aa45]"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                ></path>
              </svg>
              Informacion Personal
            </button>

            <button
              onClick={() => {
                setActiveSection("pedidos");
                setSelectedOrder(null);
              }}
              className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition flex items-center gap-2 ${
                activeSection === "pedidos"
                  ? "bg-[#f0fff6] text-[#00aa45] border-l-4 border-[#00aa45]"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 6H6.28l-.31-1.243A1 1 0 005 4H3z"></path>
                <path d="M16 16a2 2 0 11-4 0 2 2 0 014 0zM4 16a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
              Mis Pedidos
              {orders.length > 0 && (
                <span className="ml-auto bg-[#00aa45] text-white text-xs px-2 py-0.5 rounded-full">
                  {orders.length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveSection("seguridad");
                setSelectedOrder(null);
              }}
              className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition flex items-center gap-2 ${
                activeSection === "seguridad"
                  ? "bg-[#f0fff6] text-[#00aa45] border-l-4 border-[#00aa45]"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                ></path>
              </svg>
              Cambiar Contrasena
            </button>

            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-3 rounded-lg font-semibold text-red-600 hover:bg-red-50 transition mt-4 pt-4 border-t-2 border-gray-100 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
                  clipRule="evenodd"
                ></path>
              </svg>
              Cerrar Sesion
            </button>
          </nav>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MAIN CONTENT */}
      {/* ============================================================ */}
      <div className="lg:col-span-3 space-y-8">
        {/* ============================================================ */}
        {/* INFORMACIÓN PERSONAL */}
        {/* ============================================================ */}
        {activeSection === "perfil" && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <h2 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-3 pb-4 border-b-2 border-gray-100">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00aa45] to-[#008a35] flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                </svg>
              </div>
              Informacion Personal
            </h2>

            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    placeholder="Tu nombre"
                    defaultValue={userData?.nombre || ""}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aa45] focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Apellidos
                  </label>
                  <input
                    type="text"
                    name="apellidos"
                    placeholder="Tus apellidos"
                    defaultValue={userData?.apellidos || ""}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aa45] focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    defaultValue={userData?.email || ""}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 text-sm cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    El email no puede ser cambiado
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Telefono
                  </label>
                  <input
                    type="tel"
                    name="telefono"
                    placeholder="Ej: +34 600 123 456"
                    defaultValue={userData?.telefono || ""}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aa45] focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Genero
                  </label>
                  <select
                    name="genero"
                    defaultValue={userData?.genero || ""}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aa45] focus:border-transparent text-sm"
                  >
                    <option value="">Selecciona tu genero</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fecha de nacimiento
                  </label>
                  <input
                    type="date"
                    name="fecha_nacimiento"
                    defaultValue={userData?.fecha_nacimiento || ""}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aa45] focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {profileMessage && (
                <div
                  className={`text-sm p-4 rounded-xl border-l-4 flex items-center gap-3 ${
                    profileMessage.type === "success"
                      ? "bg-green-50 text-green-600 border-green-500"
                      : "bg-red-50 text-red-600 border-red-500"
                  }`}
                >
                  {profileMessage.type === "success" && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                  )}
                  <span>{profileMessage.message}</span>
                </div>
              )}

              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-[#00aa45] to-[#009340] text-white py-3 rounded-xl font-bold hover:shadow-lg transition duration-200"
                >
                  Guardar Cambios
                </button>
                <button
                  type="reset"
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition duration-200"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ============================================================ */}
        {/* MIS PEDIDOS */}
        {/* ============================================================ */}
        {activeSection === "pedidos" && !selectedOrder && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <h2 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-3 pb-4 border-b-2 border-gray-100">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00aa45] to-[#008a35] flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 6H6.28l-.31-1.243A1 1 0 005 4H3z"></path>
                  <path d="M16 16a2 2 0 11-4 0 2 2 0 014 0zM4 16a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
              Mis Pedidos
            </h2>

            {orders.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                </svg>
                <p className="text-gray-600 mb-4">Aun no tienes pedidos</p>
                <a
                  href="/productos"
                  className="inline-block bg-[#00aa45] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#009340] transition"
                >
                  Explorar productos
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-gray-50 rounded-xl p-5 border border-gray-200 hover:border-[#00aa45] transition cursor-pointer"
                    onClick={() => loadOrderDetails(order)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">
                          {order.numero_orden}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {formatDate(order.fecha_creacion)}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1.5 rounded-full text-xs font-bold ${getStatusColor(
                          order.estado
                        )}`}
                      >
                        {getStatusLabel(order.estado)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-black text-[#00aa45]">
                        {formatPrice(order.total)}
                      </span>
                      <span className="text-[#00aa45] font-medium flex items-center gap-1">
                        Ver detalle
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* DETALLE DE PEDIDO */}
        {/* ============================================================ */}
        {activeSection === "pedidos" && selectedOrder && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gray-50 p-6 border-b border-gray-200">
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-[#00aa45] font-medium flex items-center gap-2 mb-4 hover:underline"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                Volver a mis pedidos
              </button>
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">
                    {selectedOrder.numero_orden}
                  </h2>
                  <p className="text-gray-600">
                    Realizado el {formatDate(selectedOrder.fecha_creacion)}
                  </p>
                </div>
                <span
                  className={`px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(
                    selectedOrder.estado
                  )}`}
                >
                  {getStatusLabel(selectedOrder.estado)}
                </span>
              </div>
            </div>

            {/* Contenido */}
            <div className="p-6">
              {/* Timeline de estados */}
              <div className="mb-8">
                <h3 className="font-bold text-gray-900 mb-4">Estado del pedido</h3>
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {["Pagado", "Enviado", "Entregado"].map((estado, idx) => {
                    const isActive =
                      ["Pagado", "Enviado", "Entregado"].indexOf(
                        selectedOrder.estado
                      ) >= idx;
                    return (
                      <div key={estado} className="flex items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isActive
                              ? "bg-[#00aa45] text-white"
                              : "bg-gray-200 text-gray-500"
                          }`}
                        >
                          {isActive ? (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                            </svg>
                          ) : (
                            <span className="text-xs font-bold">{idx + 1}</span>
                          )}
                        </div>
                        <span
                          className={`ml-2 text-sm font-medium ${
                            isActive ? "text-gray-900" : "text-gray-500"
                          }`}
                        >
                          {estado}
                        </span>
                        {idx < 2 && (
                          <div
                            className={`w-12 h-0.5 mx-2 ${
                              isActive ? "bg-[#00aa45]" : "bg-gray-200"
                            }`}
                          ></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Productos */}
              <div className="mb-8">
                <h3 className="font-bold text-gray-900 mb-4">Productos</h3>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 bg-gray-50 rounded-lg p-4"
                    >
                      <img
                        src={item.producto_imagen || "/productos/placeholder.jpg"}
                        alt={item.producto_nombre}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {item.producto_nombre}
                        </p>
                        <p className="text-sm text-gray-600">
                          Cantidad: {item.cantidad}
                          {item.talla && ` | Talla: ${item.talla}`}
                          {item.color && ` | Color: ${item.color}`}
                        </p>
                      </div>
                      <p className="font-bold text-gray-900">
                        {formatPrice(item.subtotal)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resumen */}
              <div className="bg-gray-50 rounded-xl p-5 mb-8">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatPrice(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.descuento > 0 && (
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Descuento</span>
                    <span className="text-green-600">
                      -{formatPrice(selectedOrder.descuento)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Envio</span>
                  <span>Gratis</span>
                </div>
                <div className="flex justify-between pt-4 border-t border-gray-200">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="text-xl font-black text-[#00aa45]">
                    {formatPrice(selectedOrder.total)}
                  </span>
                </div>
              </div>

              {/* Botón de devolución */}
              {canRequestReturn(selectedOrder) && (
                <button
                  onClick={() => setShowReturnModal(true)}
                  className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z"></path>
                  </svg>
                  Solicitar devolucion
                </button>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* CAMBIAR CONTRASEÑA */}
        {/* ============================================================ */}
        {activeSection === "seguridad" && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <h2 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-3 pb-4 border-b-2 border-gray-100">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00aa45] to-[#008a35] flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
              </div>
              Cambiar Contrasena
            </h2>

            <form onSubmit={handlePasswordSubmit} className="space-y-6 max-w-md">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nueva Contrasena
                </label>
                <input
                  type="password"
                  name="new_password"
                  placeholder="Minimo 6 caracteres"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aa45] focus:border-transparent text-sm"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirmar Contrasena
                </label>
                <input
                  type="password"
                  name="confirm_password"
                  placeholder="Repite tu nueva contrasena"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aa45] focus:border-transparent text-sm"
                  required
                  minLength={6}
                />
              </div>

              {passwordMessage && (
                <div
                  className={`text-sm p-4 rounded-xl border-l-4 flex items-center gap-3 ${
                    passwordMessage.type === "success"
                      ? "bg-green-50 text-green-600 border-green-500"
                      : "bg-red-50 text-red-600 border-red-500"
                  }`}
                >
                  <span>{passwordMessage.message}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#00aa45] to-[#009340] text-white py-3 rounded-xl font-bold hover:shadow-lg transition duration-200"
              >
                Cambiar Contrasena
              </button>
            </form>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* MODAL DE DEVOLUCIÓN */}
      {/* ============================================================ */}
      {showReturnModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Solicitar devolucion
              </h3>
              <button
                onClick={() => {
                  setShowReturnModal(false);
                  setReturnReason("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Pedido: <strong>{selectedOrder.numero_orden}</strong>
              </p>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Motivo de la devolucion
              </label>
              <textarea
                value={returnReason}
                onInput={(e) => setReturnReason((e.target as HTMLTextAreaElement).value)}
                placeholder="Describe el motivo de tu devolucion..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aa45] focus:border-transparent text-sm resize-none"
                required
              ></textarea>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-amber-800">
                <strong>Importante:</strong> Una vez enviada la solicitud, recibiras un email con las instrucciones para devolver el producto. El reembolso se procesara en 5-10 dias habiles tras recibir el producto.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowReturnModal(false);
                  setReturnReason("");
                }}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition"
                disabled={returnSubmitting}
              >
                Cancelar
              </button>
              <button
                onClick={handleReturnRequest}
                disabled={!returnReason.trim() || returnSubmitting}
                className="flex-1 bg-[#00aa45] text-white py-3 rounded-xl font-bold hover:bg-[#009340] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {returnSubmitting ? "Enviando..." : "Enviar solicitud"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
