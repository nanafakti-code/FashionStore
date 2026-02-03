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
import AddReviewButton from "@/components/islands/AddReviewButton";

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

interface Direccion {
  id: string;
  usuario_id: string;
  tipo: 'Envío' | 'Facturación' | 'Ambas';
  nombre_destinatario: string;
  calle: string;
  numero: string;
  piso?: string;
  codigo_postal: string;
  ciudad: string;
  provincia: string;
  pais: string;
  es_predeterminada: boolean;
  creada_en?: string;
  actualizada_en?: string;
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function MiCuentaClientV2() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [direcciones, setDirecciones] = useState<Direccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("perfil");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [reviewableItems, setReviewableItems] = useState<any[]>([]);

  // Estado para formulario de direcciones
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Direccion | null>(null);
  const [addressFormData, setAddressFormData] = useState<Partial<Direccion>>({
    tipo: 'Envío',
    nombre_destinatario: '',
    calle: '',
    numero: '',
    piso: '',
    codigo_postal: '',
    ciudad: '',
    provincia: '',
    pais: 'España',
    es_predeterminada: false
  });
  const [addressMessage, setAddressMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [profileMessage, setProfileMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Estado para notificaciones Toast
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // ============================================================
  // CARGAR DATOS
  // ============================================================

  useEffect(() => {
    loadUserData();

    // Check for hash in URL to set active section
    const hash = window.location.hash.slice(1);
    if (hash === "pedidos" || hash === "seguridad" || hash === "resenas") {
      setActiveSection(hash);
    }
  }, []);

  // Realtime subscription for orders
  useEffect(() => {
    if (!userData?.id) return;

    console.log("Setting up realtime subscription for orders...");
    const channel = supabase
      .channel('ordenes-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ordenes',
          filter: `usuario_id=eq.${userData.id}`
        },
        (payload: any) => {
          console.log('Realtime change detected:', payload);
          fetchOrders(userData.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userData?.id]);

  // Sync selectedOrder with real-time updates
  useEffect(() => {
    if (selectedOrder && orders.length > 0) {
      const updatedOrder = orders.find(o => o.id === selectedOrder.id);
      if (updatedOrder && updatedOrder.estado !== selectedOrder.estado) {
        // If status changed, reload full details to be safe
        loadOrderDetails(updatedOrder);
      }
    }
  }, [orders]);

  useEffect(() => {
    if (activeSection === "resenas" && userData) {
      loadReviewableItems();
    }
  }, [activeSection, userData]);

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

      // Load orders
      await fetchOrders(user.id);

      // Load addresses from direcciones table

      // Load addresses from direcciones table
      const { data: addressesData, error: addressesError } = await supabase
        .from("direcciones")
        .select("*")
        .eq("usuario_id", user.id)
        .order("es_predeterminada", { ascending: false });

      if (addressesError) {
        console.error("Error loading addresses:", addressesError);
      } else {
        setDirecciones((addressesData as Direccion[]) || []);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async (userId: string) => {
    const { data: ordersData, error: ordersError } = await supabase
      .from("ordenes")
      .select("*")
      .eq("usuario_id", userId)
      .order("fecha_creacion", { ascending: false });

    if (ordersError) {
      console.error("Error loading orders:", ordersError);
    } else {
      setOrders((ordersData as Order[]) || []);
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

  // ... (keeping other functions) ...

  const loadReviewableItems = async () => {
    if (!userData) return;
    try {
      // 1. Obtener pedidos entregados
      const { data: deliveredOrders } = await supabase
        .from('ordenes')
        .select('id, fecha_creacion')
        .eq('usuario_id', userData.id)
        .in('estado', ['Entregado', 'Completado']);

      if (!deliveredOrders?.length) {
        setReviewableItems([]);
        return;
      }

      const orderIds = deliveredOrders.map((o: any) => o.id);

      // 2. Obtener items de esos pedidos
      const { data: items } = await supabase
        .from('items_orden')
        .select('*')
        .in('orden_id', orderIds);

      if (items) {
        // 3. Obtener reseñas del usuario para estos productos
        // Note: We ideally want to filter by order_id too if the DB supports it,
        // but for now we fetch all reviews for these products and filter in JS
        const productIds = items.map((i: any) => i.producto_id);
        const { data: reviews } = await supabase
          .from('resenas')
          .select('*')
          .eq('usuario_id', userData.id)
          .in('producto_id', productIds);

        // Enriquecer con fecha y reseña
        const enrichedItems = items.map((item: any) => {
          const order = deliveredOrders.find((o: any) => o.id === item.orden_id);

          // Match review by BOTH product_id AND order_id (if review has order_id)
          // Fallback: If review has no order_id (legacy), match loosely to prevent duplicates if possible, 
          // but prioritization is: Strict Match -> Legacy Match -> No Match
          const review = reviews?.find((r: any) =>
            r.producto_id === item.producto_id &&
            (r.orden_id === item.orden_id || (!r.orden_id && reviews.filter((rev: any) => rev.producto_id === item.producto_id).length === 1))
          );

          return { ...item, fecha_compra: order?.fecha_creacion, resena: review, orderId: item.orden_id };
        });

        // Sort by date descending
        enrichedItems.sort((a, b) => new Date(b.fecha_compra).getTime() - new Date(a.fecha_compra).getTime());

        setReviewableItems(enrichedItems);
      }
    } catch (error) {
      console.error("Error loading reviewable items:", error);
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
      const currentPassword = formData.get("current_password") as string;
      const newPassword = formData.get("new_password") as string;
      const confirmPassword = formData.get("confirm_password") as string;

      if (!currentPassword) {
        throw new Error("Debes ingresar tu contraseña actual");
      }

      if (newPassword !== confirmPassword) {
        throw new Error("Las contraseñas no coinciden");
      }
      if (newPassword.length < 6) {
        throw new Error("La contraseña debe tener al menos 6 caracteres");
      }

      // 1. Verificar contraseña actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.email) throw new Error("Usuario no autenticado");

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error("La contraseña actual es incorrecta");
      }

      // 2. Actualizar contraseña
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
  // DIRECCIONES CRUD
  // ============================================================

  const resetAddressForm = () => {
    setAddressFormData({
      tipo: 'Envío',
      nombre_destinatario: '',
      calle: '',
      numero: '',
      piso: '',
      codigo_postal: '',
      ciudad: '',
      provincia: '',
      pais: 'España',
      es_predeterminada: false
    });
    setEditingAddress(null);
    setShowAddressForm(false);
  };

  const handleEditAddress = (address: Direccion) => {
    setEditingAddress(address);
    setAddressFormData({
      tipo: address.tipo,
      nombre_destinatario: address.nombre_destinatario,
      calle: address.calle,
      numero: address.numero,
      piso: address.piso || '',
      codigo_postal: address.codigo_postal,
      ciudad: address.ciudad,
      provincia: address.provincia,
      pais: address.pais,
      es_predeterminada: address.es_predeterminada
    });
    setShowAddressForm(true);
  };

  const handleSaveAddress = async () => {
    if (!userData) return;

    // Validar campos requeridos
    if (!addressFormData.nombre_destinatario || !addressFormData.calle ||
      !addressFormData.numero || !addressFormData.codigo_postal ||
      !addressFormData.ciudad || !addressFormData.provincia) {
      setAddressMessage({
        type: "error",
        message: "Por favor, completa todos los campos obligatorios."
      });
      return;
    }

    try {
      // Si es predeterminada, quitar la marca de las demás
      if (addressFormData.es_predeterminada) {
        await supabase
          .from("direcciones")
          .update({ es_predeterminada: false })
          .eq("usuario_id", userData.id);
      }

      if (editingAddress) {
        // Actualizar dirección existente
        const { error } = await supabase
          .from("direcciones")
          .update({
            tipo: addressFormData.tipo,
            nombre_destinatario: addressFormData.nombre_destinatario,
            calle: addressFormData.calle,
            numero: addressFormData.numero,
            piso: addressFormData.piso || null,
            codigo_postal: addressFormData.codigo_postal,
            ciudad: addressFormData.ciudad,
            provincia: addressFormData.provincia,
            pais: addressFormData.pais,
            es_predeterminada: addressFormData.es_predeterminada,
            actualizada_en: new Date().toISOString()
          })
          .eq("id", editingAddress.id);

        if (error) throw error;

        setAddressMessage({
          type: "success",
          message: "Dirección actualizada correctamente."
        });
      } else {
        // Crear nueva dirección
        const { error } = await supabase
          .from("direcciones")
          .insert({
            usuario_id: userData.id,
            tipo: addressFormData.tipo,
            nombre_destinatario: addressFormData.nombre_destinatario,
            calle: addressFormData.calle,
            numero: addressFormData.numero,
            piso: addressFormData.piso || null,
            codigo_postal: addressFormData.codigo_postal,
            ciudad: addressFormData.ciudad,
            provincia: addressFormData.provincia,
            pais: addressFormData.pais,
            es_predeterminada: addressFormData.es_predeterminada
          });

        if (error) throw error;

        setAddressMessage({
          type: "success",
          message: "Dirección guardada correctamente."
        });
      }

      // Recargar direcciones
      const { data: addressesData } = await supabase
        .from("direcciones")
        .select("*")
        .eq("usuario_id", userData.id)
        .order("es_predeterminada", { ascending: false });

      setDirecciones((addressesData as Direccion[]) || []);
      resetAddressForm();

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setAddressMessage(null), 3000);
    } catch (error: any) {
      console.error("Error saving address:", error);
      setAddressMessage({
        type: "error",
        message: error.message || "Error al guardar la dirección."
      });
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    // if (!confirm("¿Estás seguro de que quieres eliminar esta dirección?")) {
    //   return;
    // }

    try {
      const { error } = await supabase
        .from("direcciones")
        .delete()
        .eq("id", addressId);

      if (error) throw error;

      setDirecciones(direcciones.filter(d => d.id !== addressId));
      setAddressMessage({
        type: "success",
        message: "Dirección eliminada correctamente."
      });

      setTimeout(() => setAddressMessage(null), 3000);
    } catch (error: any) {
      console.error("Error deleting address:", error);
      setAddressMessage({
        type: "error",
        message: error.message || "Error al eliminar la dirección."
      });
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    if (!userData) return;

    try {
      // Quitar predeterminada de todas
      await supabase
        .from("direcciones")
        .update({ es_predeterminada: false })
        .eq("usuario_id", userData.id);

      // Marcar la seleccionada como predeterminada
      await supabase
        .from("direcciones")
        .update({ es_predeterminada: true })
        .eq("id", addressId);

      // Actualizar estado local
      setDirecciones(direcciones.map(d => ({
        ...d,
        es_predeterminada: d.id === addressId
      })));

      setAddressMessage({
        type: "success",
        message: "Dirección predeterminada actualizada."
      });

      setTimeout(() => setAddressMessage(null), 3000);
    } catch (error: any) {
      console.error("Error setting default address:", error);
      setAddressMessage({
        type: "error",
        message: error.message || "Error al actualizar la dirección."
      });
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
      Completado: "Entregado",
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
      {/* Notificación Toast Global */}
      {notification && (
        <div className={`fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg text-white font-semibold max-w-sm animate-in fade-in z-50 ${notification.type === 'success' ? 'bg-[#00aa45]' :
          notification.type === 'error' ? 'bg-red-600' :
            'bg-blue-600'
          }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' && (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
              </svg>
            )}
            {notification.type === 'error' && (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
              </svg>
            )}
            {notification.type === 'info' && (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
              </svg>
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}
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
              className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition flex items-center gap-2 ${activeSection === "perfil"
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
              className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition flex items-center gap-2 ${activeSection === "pedidos"
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
              className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition flex items-center gap-2 ${activeSection === "seguridad"
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
              Cambiar Contraseña
            </button>

            <button
              onClick={() => {
                setActiveSection("direcciones");
                setSelectedOrder(null);
              }}
              className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition flex items-center gap-2 ${activeSection === "direcciones"
                ? "bg-[#f0fff6] text-[#00aa45] border-l-4 border-[#00aa45]"
                : "text-gray-700 hover:bg-gray-100"
                }`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                  clipRule="evenodd"
                ></path>
              </svg>
              Mis Direcciones
              {direcciones.length > 0 && (
                <span className="ml-auto bg-[#00aa45] text-white text-xs px-2 py-0.5 rounded-full">
                  {direcciones.length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveSection("resenas");
                setSelectedOrder(null);
              }}
              className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition flex items-center gap-2 ${activeSection === "resenas"
                ? "bg-[#f0fff6] text-[#00aa45] border-l-4 border-[#00aa45]"
                : "text-gray-700 hover:bg-gray-100"
                }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
              </svg>
              Mis Reseñas
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
                  className={`text-sm p-4 rounded-xl border-l-4 flex items-center gap-3 ${profileMessage.type === "success"
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
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-4 sm:mt-0">
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
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
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
                    const statusOrder = ["Pagado", "Enviado", "Entregado"];
                    const currentStatus = selectedOrder.estado === "Completado" ? "Entregado" : selectedOrder.estado;
                    const isActive = statusOrder.indexOf(currentStatus) >= idx;
                    return (
                      <div key={estado} className="flex items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${isActive
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
                          className={`ml-2 text-sm font-medium ${isActive ? "text-gray-900" : "text-gray-500"
                            }`}
                        >
                          {estado}
                        </span>
                        {idx < 2 && (
                          <div
                            className={`w-12 h-0.5 mx-2 ${isActive ? "bg-[#00aa45]" : "bg-gray-200"
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
                  {selectedOrder.items?.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-gray-50 rounded-lg p-4"
                    >
                      <div className="flex items-center gap-4 w-full">
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
                      </div>
                      <p className="font-bold text-gray-900 mt-2 sm:mt-0 ml-20 sm:ml-0 whitespace-nowrap">
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
              Cambiar Contraseña
            </h2>

            <form onSubmit={handlePasswordSubmit} className="space-y-6 max-w-md">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Contraseña Actual
                </label>
                <input
                  type="password"
                  name="current_password"
                  placeholder="Tu contraseña actual"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aa45] focus:border-transparent text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  name="new_password"
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aa45] focus:border-transparent text-sm"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirmar Contraseña
                </label>
                <input
                  type="password"
                  name="confirm_password"
                  placeholder="Repite tu nueva contraseña"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aa45] focus:border-transparent text-sm"
                  required
                  minLength={6}
                />
              </div>

              {passwordMessage && (
                <div
                  className={`text-sm p-4 rounded-xl border-l-4 flex items-center gap-3 ${passwordMessage.type === "success"
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
                Cambiar Contraseña
              </button>
            </form>
          </div>
        )}

        {/* ============================================================ */}
        {/* MIS DIRECCIONES */}
        {/* ============================================================ */}
        {activeSection === "direcciones" && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <h2 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-3 pb-4 border-b-2 border-gray-100">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00aa45] to-[#008a35] flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </div>
              Mis Direcciones
            </h2>

            {addressMessage && (
              <div
                className={`text-sm p-4 rounded-xl border-l-4 flex items-center gap-3 mb-6 ${addressMessage.type === "success"
                  ? "bg-green-50 text-green-600 border-green-500"
                  : "bg-red-50 text-red-600 border-red-500"
                  }`}
              >
                <span>{addressMessage.message}</span>
              </div>
            )}

            {/* Botón para añadir nueva dirección */}
            {!showAddressForm && (
              <button
                onClick={() => {
                  resetAddressForm();
                  setShowAddressForm(true);
                }}
                className="mb-6 bg-gradient-to-r from-[#00aa45] to-[#009340] text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition duration-200 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                </svg>
                Añadir Nueva Dirección
              </button>
            )}

            {/* Formulario de dirección */}
            {showAddressForm && (
              <div className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  {editingAddress ? "Editar Dirección" : "Nueva Dirección"}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nombre del destinatario *
                    </label>
                    <input
                      type="text"
                      value={addressFormData.nombre_destinatario || ''}
                      onInput={(e) => setAddressFormData({
                        ...addressFormData,
                        nombre_destinatario: (e.target as HTMLInputElement).value
                      })}
                      placeholder="Nombre completo"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aa45] focus:border-transparent text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tipo de dirección
                    </label>
                    <select
                      value={addressFormData.tipo || 'Envío'}
                      onChange={(e) => setAddressFormData({
                        ...addressFormData,
                        tipo: (e.target as HTMLSelectElement).value as 'Envío' | 'Facturación' | 'Ambas'
                      })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aa45] focus:border-transparent text-sm"
                    >
                      <option value="Envío">Envío</option>
                      <option value="Facturación">Facturación</option>
                      <option value="Ambas">Ambas</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Calle *
                    </label>
                    <input
                      type="text"
                      value={addressFormData.calle || ''}
                      onInput={(e) => setAddressFormData({
                        ...addressFormData,
                        calle: (e.target as HTMLInputElement).value
                      })}
                      placeholder="Nombre de la calle"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aa45] focus:border-transparent text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Número *
                    </label>
                    <input
                      type="text"
                      value={addressFormData.numero || ''}
                      onInput={(e) => setAddressFormData({
                        ...addressFormData,
                        numero: (e.target as HTMLInputElement).value
                      })}
                      placeholder="Número"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aa45] focus:border-transparent text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Piso / Puerta (opcional)
                    </label>
                    <input
                      type="text"
                      value={addressFormData.piso || ''}
                      onInput={(e) => setAddressFormData({
                        ...addressFormData,
                        piso: (e.target as HTMLInputElement).value
                      })}
                      placeholder="Ej: 2º A"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aa45] focus:border-transparent text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Código Postal *
                    </label>
                    <input
                      type="text"
                      value={addressFormData.codigo_postal || ''}
                      onInput={(e) => setAddressFormData({
                        ...addressFormData,
                        codigo_postal: (e.target as HTMLInputElement).value
                      })}
                      placeholder="Código postal"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aa45] focus:border-transparent text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Ciudad *
                    </label>
                    <input
                      type="text"
                      value={addressFormData.ciudad || ''}
                      onInput={(e) => setAddressFormData({
                        ...addressFormData,
                        ciudad: (e.target as HTMLInputElement).value
                      })}
                      placeholder="Ciudad"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aa45] focus:border-transparent text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Provincia *
                    </label>
                    <input
                      type="text"
                      value={addressFormData.provincia || ''}
                      onInput={(e) => setAddressFormData({
                        ...addressFormData,
                        provincia: (e.target as HTMLInputElement).value
                      })}
                      placeholder="Provincia"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aa45] focus:border-transparent text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      País
                    </label>
                    <input
                      type="text"
                      value={addressFormData.pais || 'España'}
                      onInput={(e) => setAddressFormData({
                        ...addressFormData,
                        pais: (e.target as HTMLInputElement).value
                      })}
                      placeholder="País"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aa45] focus:border-transparent text-sm"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={addressFormData.es_predeterminada || false}
                        onChange={(e) => setAddressFormData({
                          ...addressFormData,
                          es_predeterminada: (e.target as HTMLInputElement).checked
                        })}
                        className="w-5 h-5 text-[#00aa45] border-gray-300 rounded focus:ring-[#00aa45]"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Usar como dirección predeterminada
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    onClick={resetAddressForm}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveAddress}
                    className="flex-1 bg-gradient-to-r from-[#00aa45] to-[#009340] text-white py-3 rounded-xl font-bold hover:shadow-lg transition duration-200"
                  >
                    {editingAddress ? "Actualizar" : "Guardar"}
                  </button>
                </div>
              </div>
            )}

            {/* Lista de direcciones */}
            {direcciones.length === 0 && !showAddressForm ? (
              <div className="text-center py-12 text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                <p className="text-lg font-medium">No tienes direcciones guardadas</p>
                <p className="text-sm mt-1">Añade una dirección para agilizar tus compras</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {direcciones.map((direccion) => (
                  <div
                    key={direccion.id}
                    className={`border rounded-xl p-5 transition ${direccion.es_predeterminada
                      ? "border-[#00aa45] bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                      }`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="flex-1 w-full">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="font-bold text-gray-900">
                            {direccion.nombre_destinatario}
                          </span>
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 whitespace-nowrap">
                            {direccion.tipo}
                          </span>
                          {direccion.es_predeterminada && (
                            <span className="text-xs px-2 py-1 rounded-full bg-[#00aa45] text-white whitespace-nowrap">
                              Predeterminada
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm">
                          {direccion.calle}, {direccion.numero}
                          {direccion.piso && `, ${direccion.piso}`}
                        </p>
                        <p className="text-gray-600 text-sm">
                          {direccion.codigo_postal} {direccion.ciudad}, {direccion.provincia}
                        </p>
                        <p className="text-gray-600 text-sm">{direccion.pais}</p>
                      </div>

                      <div className="flex gap-2 w-full sm:w-auto justify-end mt-2 sm:mt-0">
                        {!direccion.es_predeterminada && (
                          <button
                            onClick={() => handleSetDefaultAddress(direccion.id)}
                            className="text-gray-400 hover:text-[#00aa45] p-2 rounded-lg hover:bg-gray-100 transition"
                            title="Establecer como predeterminada"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => handleEditAddress(direccion)}
                          className="text-gray-400 hover:text-blue-500 p-2 rounded-lg hover:bg-gray-100 transition"
                          title="Editar"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(direccion.id)}
                          className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-gray-100 transition"
                          title="Eliminar"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}


        {/* ============================================================ */}
        {/* MIS RESEÑAS */}
        {/* ============================================================ */}
        {activeSection === "resenas" && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <h2 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-3 pb-4 border-b-2 border-gray-100">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00aa45] to-[#008a35] flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                </svg>
              </div>
              Productos para Reseñar
            </h2>

            {reviewableItems.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <p className="text-gray-500 text-lg">
                  No tienes productos entregados pendientes de reseña.
                </p>
                <a href="/productos" className="text-[#00aa45] font-bold mt-2 inline-block hover:underline">
                  ¡Haz tu primera compra!
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {reviewableItems.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row items-center gap-6 bg-gray-50 p-6 rounded-xl border border-gray-200">
                    <img
                      src={item.producto_imagen || "/productos/placeholder.jpg"}
                      alt={item.producto_nombre}
                      className="w-24 h-24 object-contain bg-white rounded-lg shadow-sm border border-gray-100 p-2"
                    />
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="font-bold text-lg text-gray-900 mb-1">{item.producto_nombre}</h3>
                      <p className="text-sm text-gray-500 mb-3">
                        Comprado el {formatDate(item.fecha_compra)}
                      </p>

                      <div className="max-w-[200px] mx-auto sm:mx-0">
                        <AddReviewButton
                          productId={item.producto_id}
                          orderId={item.orderId}
                          existingReview={item.resena}
                          onReviewAdded={loadReviewableItems}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* MODAL DE DEVOLUCIÓN */}
      {/* ============================================================ */}
      {
        showReturnModal && selectedOrder && (
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
        )
      }

    </div >
  );
}
