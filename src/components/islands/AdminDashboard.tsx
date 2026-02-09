import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import AdminCategories from './AdminCategories';
import AdminBrands from './AdminBrands';
import AdminOrders from './AdminOrders';
import AdminUsers from './AdminUsers';
import AdminCoupons from './AdminCoupons';

import AdminReturns from './AdminReturns';
import AdminReviews from './AdminReviews';
import AdminProductos from './AdminProductos';
import AdminSettings from './AdminSettings';
import AdminCampaigns from './AdminCampaigns';

interface DashboardStats {
  totalProductos: number;
  totalStock: number;
  valorInventario: number;
  totalPedidos: number;
  ventasHoy: number;
  ventasMes: number;
  clientesActivos: number;
  ordenesEnProceso: number;
  devolucionesActivas: number;
  reseniasPromedio: number;
}

interface Product {
  id: string;
  nombre: string;
  stock_total: number;
  precio_venta: number;
}

interface Order {
  id: string;
  total_precio: number;
  estado: string;
  creado_en: string;
}

interface User {
  id: string;
  nombre: string;
  email: string;
}

interface Category {
  id: string;
  nombre: string;
  slug: string;
}

interface AdminDashboardProps {
  initialSection?: string;
}

export default function AdminDashboard({ initialSection = 'dashboard' }: AdminDashboardProps) {
  const [activeSection, setActiveSection] = useState(initialSection);
  const [stats, setStats] = useState<DashboardStats>({
    totalProductos: 0,
    totalStock: 0,
    valorInventario: 0,
    totalPedidos: 0,
    ventasHoy: 0,
    ventasMes: 0,
    clientesActivos: 0,
    ordenesEnProceso: 0,
    devolucionesActivas: 0,
    reseniasPromedio: 0,
  });
  const [loading, setLoading] = useState(true);
  const [productos, setProductos] = useState<Product[]>([]);
  const [pedidos, setPedidos] = useState<Order[]>([]);
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [categorias, setCategorias] = useState<Category[]>([]);
  const [marcas, setMarcas] = useState<any[]>([]);
  const [cupones, setCupones] = useState<any[]>([]);
  const [_envios, setEnvios] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    // Escuchar cambios en los query parameters de la URL
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      const section = params.get('section') || 'dashboard';
      setActiveSection(section);
    };

    // Ejecutar al montar
    handleUrlChange();

    // Escuchar el evento personalizado de cambio de navegación
    window.addEventListener('admin-nav-change', handleUrlChange);

    // También escuchar popstate (navegación del navegador)
    window.addEventListener('popstate', handleUrlChange);

    return () => {
      window.removeEventListener('admin-nav-change', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  useEffect(() => {
    // Actualizar activeSection cuando cambia initialSection (fallback)
    if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection]);

  useEffect(() => {
    // Actualizar página activa en el sidebar
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.classList.remove('bg-gray-800');
      if (link.getAttribute('data-page') === activeSection) {
        link.classList.add('bg-gray-800');
      }
    });

    // Actualizar solo el título de la página (el título es siempre FashionStore)
  }, [activeSection]);

  const loadStats = async () => {
    try {
      setLoading(true);

      // Productos
      const { data: productosData } = await supabase
        .from("productos")
        .select("*")
        .eq("activo", true);

      if (productosData) {
        const totalProductos = productosData.length;
        const totalStock = productosData.reduce(
          (sum: number, p: any) => sum + (p.stock_total || 0),
          0
        );
        const valorInventario = productosData.reduce(
          (sum: number, p: any) =>
            sum + (p.precio_venta / 100) * (p.stock_total || 0),
          0
        );

        setProductos(productosData.slice(0, 10));
        setStats((prev) => ({
          ...prev,
          totalProductos,
          totalStock,
          valorInventario,
        }));
      }

      // Pedidos
      const { data: pedidosData } = await supabase
        .from("pedidos")
        .select("*")
        .order("creado_en", { ascending: false });

      if (pedidosData) {
        const totalPedidos = pedidosData.length;
        const ordenesEnProceso = pedidosData.filter(
          (p: any) => p.estado === "en_proceso"
        ).length;

        const hoy = new Date().toISOString().split("T")[0];
        const ventasHoy = pedidosData
          .filter((p: any) => p.creado_en.startsWith(hoy))
          .reduce((sum: number, p: any) => sum + (p.total_precio || 0), 0);

        const mesActual = new Date().toISOString().substring(0, 7);
        const ventasMes = pedidosData
          .filter((p: any) => p.creado_en.startsWith(mesActual))
          .reduce((sum: number, p: any) => sum + (p.total_precio || 0), 0);

        // Filtrar pedidos excluyendo "pendiente"
        const pedidosFiltrados = pedidosData.filter(
          (p: any) => p.estado !== "pendiente"
        );

        setPedidos(pedidosFiltrados.slice(0, 10));
        setStats((prev) => ({
          ...prev,
          totalPedidos,
          ventasHoy: ventasHoy / 100,
          ventasMes: ventasMes / 100,
          ordenesEnProceso,
        }));
      }

      // Usuarios
      const { data: usuariosData } = await supabase
        .from("usuarios")
        .select("*")
        .eq("activo", true);

      if (usuariosData) {
        setUsuarios(usuariosData.slice(0, 10));
        setStats((prev) => ({
          ...prev,
          clientesActivos: usuariosData.length,
        }));
      }

      // Categorías
      const { data: categoriasData } = await supabase
        .from("categorias")
        .select("*");

      if (categoriasData) {
        setCategorias(categoriasData);
      }

      // Marcas
      const { data: marcasData } = await supabase
        .from("marcas")
        .select("*");

      if (marcasData) {
        setMarcas(marcasData.slice(0, 10));
      }

      // Cupones
      const { data: cuponesData } = await supabase
        .from("cupones_descuento")
        .select("*");

      if (cuponesData) {
        setCupones(cuponesData.slice(0, 10));
      }

      // Envíos
      const { data: enviosData } = await supabase
        .from("envios")
        .select("*");

      if (enviosData) {
        setEnvios(enviosData.slice(0, 10));
      }

      // Devoluciones
      const { data: devolucionesData } = await supabase
        .from("devoluciones")
        .select("*")
        .eq("estado", "pendiente");

      if (devolucionesData) {
        setStats((prev) => ({
          ...prev,
          devolucionesActivas: devolucionesData.length,
        }));
      }

      // Reseñas
      const { data: reseniasData } = await supabase
        .from("resenas")
        .select("puntuacion");

      if (reseniasData && reseniasData.length > 0) {
        const promedio =
          reseniasData.reduce(
            (sum: number, r: any) => sum + (r.puntuacion || 0),
            0
          ) / reseniasData.length;
        setStats((prev) => ({
          ...prev,
          reseniasPromedio: Math.round(promedio * 10) / 10,
        }));
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600 font-semibold">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Dashboard Principal */}
      {activeSection === "dashboard" && (
        <>
          {/* Stats Cards - Primera Fila */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Productos */}
            <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-blue-600 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wide">Total Productos</p>
                  <p className="text-4xl font-bold text-gray-900 mt-3">{stats.totalProductos}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-0.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l0.03-.12 0.9-1.63h7.45c0.75 0 1.41-.41 1.75-1.03l3.58-6.49c0.08-.14 0.12-.31 0.12-.48 0-.55-.45-1-1-1H5.21l-0.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s0.89 2 1.99 2 2-0.9 2-2-0.9-2-2-2z" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4 font-medium">Stock: {stats.totalStock.toLocaleString()} unidades</p>
            </div>

            {/* Valor Inventario */}
            <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-green-600 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wide">Valor Inventario</p>
                  <p className="text-4xl font-bold text-gray-900 mt-3">{stats.valorInventario.toFixed(2)}€</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Ventas Hoy */}
            <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-purple-600 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wide">Ventas Hoy</p>
                  <p className="text-4xl font-bold text-gray-900 mt-3">{stats.ventasHoy.toFixed(2)}€</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 13h2v8H3zm4-8h2v16H7zm4-2h2v18h-2zm4 4h2v14h-2zm4-2h2v16h-2z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Ventas Mes */}
            <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-orange-600 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wide">Ventas Este Mes</p>
                  <p className="text-4xl font-bold text-gray-900 mt-3">{stats.ventasMes.toFixed(2)}€</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18 10 11.41l4 4 6.3-6.29L22 12v-6z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards - Segunda Fila */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pedidos Totales */}
            <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-red-600 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wide">Total Pedidos</p>
                  <p className="text-4xl font-bold text-gray-900 mt-3">{stats.totalPedidos}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-0.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l0.03-.12 0.9-1.63h7.45c0.75 0 1.41-.41 1.75-1.03l3.58-6.49c0.08-.14 0.12-.31 0.12-.48 0-.55-.45-1-1-1H5.21l-0.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s0.89 2 1.99 2 2-0.9 2-2-0.9-2-2-2z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Órdenes en Proceso */}
            <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-amber-600 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wide">En Proceso</p>
                  <p className="text-4xl font-bold text-gray-900 mt-3">{stats.ordenesEnProceso}</p>
                </div>
                <div className="bg-amber-100 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-amber-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Clientes Activos */}
            <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-indigo-600 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wide">Clientes Activos</p>
                  <p className="text-4xl font-bold text-gray-900 mt-3">{stats.clientesActivos}</p>
                </div>
                <div className="bg-indigo-100 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Devoluciones */}
            <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-rose-600 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wide">Devoluciones Activas</p>
                  <p className="text-4xl font-bold text-gray-900 mt-3">{stats.devolucionesActivas}</p>
                </div>
                <div className="bg-rose-100 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-rose-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7 10l5 5 5-5z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Tablas de Datos Recientes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Últimos Productos */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 flex items-center gap-3">
                <div className="bg-blue-100 p-2.5 rounded">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-0.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l0.03-.12 0.9-1.63h7.45c0.75 0 1.41-.41 1.75-1.03l3.58-6.49c0.08-.14 0.12-.31 0.12-.48 0-.55-.45-1-1-1H5.21l-0.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s0.89 2 1.99 2 2-0.9 2-2-0.9-2-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Últimos Productos</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">Nombre</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">Stock</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">Precio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {productos.map((producto: Product) => (
                      <tr key={producto.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-semibold text-gray-900">{producto.nombre}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold ${producto.stock_total > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}>
                            {producto.stock_total} uds
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900">{(producto.precio_venta / 100).toFixed(2)}€</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Últimos Pedidos */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 flex items-center gap-3">
                <div className="bg-red-100 p-2.5 rounded">
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-0.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l0.03-.12 0.9-1.63h7.45c0.75 0 1.41-.41 1.75-1.03l3.58-6.49c0.08-.14 0.12-.31 0.12-.48 0-.55-.45-1-1-1H5.21l-0.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s0.89 2 1.99 2 2-0.9 2-2-0.9-2-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Últimos Pedidos (Activos)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">ID Pedido</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">Total</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">Estado</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pedidos.length > 0 ? (
                      pedidos.map((pedido: Order) => (
                        <tr key={pedido.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 font-mono text-xs text-gray-700 font-semibold">{pedido.id.substring(0, 8)}...</td>
                          <td className="px-6 py-4 font-semibold text-gray-900">{(pedido.total_precio / 100).toFixed(2)}€</td>
                          <td className="px-6 py-4">
                            <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold ${
                              pedido.estado === "completado" ? "bg-green-100 text-green-800"
                              : pedido.estado === "en_proceso" ? "bg-blue-100 text-blue-800"
                              : pedido.estado === "cancelado" ? "bg-red-100 text-red-800"
                              : pedido.estado === "enviado" ? "bg-indigo-100 text-indigo-800"
                              : "bg-gray-100 text-gray-800"
                            }`}>
                              {pedido.estado === "en_proceso" ? "En Proceso" 
                              : pedido.estado === "completado" ? "Completado"
                              : pedido.estado === "cancelado" ? "Cancelado"
                              : pedido.estado === "enviado" ? "Enviado"
                              : pedido.estado?.charAt(0).toUpperCase() + pedido.estado?.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-600 text-xs">{new Date(pedido.creado_en).toLocaleDateString('es-ES')}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                          No hay pedidos activos para mostrar
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Últimos Usuarios */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 flex items-center gap-3">
                <div className="bg-indigo-100 p-2.5 rounded">
                  <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Últimos Usuarios Activos</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">Nombre</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {usuarios.map((usuario: User) => (
                      <tr key={usuario.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-semibold text-gray-900">{usuario.nombre}</td>
                        <td className="px-6 py-4 text-gray-600 text-xs font-medium">{usuario.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Categorías */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 flex items-center gap-3">
                <div className="bg-cyan-100 p-2.5 rounded">
                  <svg className="w-5 h-5 text-cyan-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9l-9-7-9 7 1.63 1.27L12 16z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Categorías</h3>
              </div>
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {categorias.map((cat: Category) => (
                  <div key={cat.id} className="px-6 py-3 hover:bg-gray-50 transition flex justify-between items-center">
                    <span className="font-semibold text-gray-900">{cat.nombre}</span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded font-medium">{cat.slug}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sección de Marcas y Cupones */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Marcas */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 flex items-center gap-3">
                <div className="bg-amber-100 p-2.5 rounded">
                  <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Marcas</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">Nombre</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">Productos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {marcas.slice(0, 8).map((marca: any) => (
                      <tr key={marca.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-semibold text-gray-900">{marca.nombre}</td>
                        <td className="px-6 py-4 text-gray-600 font-medium">-</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cupones */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 flex items-center gap-3">
                <div className="bg-emerald-100 p-2.5 rounded">
                  <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21.5.5H2.5C1.12 1.62.5 2.5.5 4v16c0 1.5.62 2.38 2 3.5h19c1.38-1.12 2-2 2-3.5V4c0-1.5-.62-2.38-2-3.5zm-2 17h-15v-2h15v2zm0-4h-15v-2h15v2zm0-4h-15v-2h15v2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Cupones Activos</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">Código</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">Descuento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {cupones.slice(0, 8).map((cupon: any) => (
                      <tr key={cupon.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-mono font-bold text-gray-900">{cupon.codigo}</td>
                        <td className="px-6 py-4 font-semibold text-emerald-600">{cupon.descuento_porcentaje || cupon.monto_fijo}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Sección de Productos */}
      {activeSection === "productos" && <AdminProductos />}

      {/* Sección de Categorías */}
      {activeSection === "categorias" && <AdminCategories />}

      {/* Sección de Marcas */}
      {activeSection === "marcas" && <AdminBrands />}

      {/* Sección de Pedidos */}
      {activeSection === "pedidos" && <AdminOrders />}

      {/* Sección de Usuarios */}
      {activeSection === "usuarios" && <AdminUsers />}

      {/* Sección de Cupones */}
      {activeSection === "cupones" && <AdminCoupons />}



      {/* Sección de Devoluciones */}
      {activeSection === "devoluciones" && <AdminReturns />}

      {/* Sección de Reseñas */}
      {activeSection === "resenas" && <AdminReviews />}

      {/* Sección de Configuración */}
      {activeSection === "configuracion" && <AdminSettings />}

      {/* Sección de Campañas de Email / Newsletter */}
      {activeSection === "campanas" && <AdminCampaigns />}

      {/* Otras Secciones - Placeholder */}
      {!["dashboard", "productos", "categorias", "marcas", "pedidos", "usuarios", "cupones", "devoluciones", "resenas", "configuracion", "campanas"].includes(activeSection) && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {activeSection === "categorias" && "Gestión de Categorías"}
            {activeSection === "marcas" && "Gestión de Marcas"}
            {activeSection === "pedidos" && "Gestión de Pedidos"}

            {activeSection === "devoluciones" && "Gestión de Devoluciones"}
            {activeSection === "usuarios" && "Gestión de Usuarios"}
            {activeSection === "resenas" && "Reseñas de Clientes"}
            {activeSection === "cupones" && "Cupones de Descuento"}
            {activeSection === "campanas" && "Campañas de Email"}
            {activeSection === "ventas" && "Reportes de Ventas"}
            {activeSection === "inventario" && "Inventario"}
            {activeSection === "configuracion" && "Configuración del Sistema"}
          </h2>
          <p className="text-gray-600 mb-6">Esta sección está en desarrollo y próximamente contará con todas sus funcionalidades.</p>
          <div className="inline-block bg-[#00aa45] text-white px-6 py-3 rounded-lg font-semibold">
            Próximamente
          </div>
        </div>
      )}
    </div>
  );
}
