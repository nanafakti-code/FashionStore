import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

interface Order {
  id: string;
  numero_orden: string;
  usuario_id: string | null;
  estado: string;
  subtotal: number;
  impuestos: number;
  coste_envio: number;
  descuento: number;
  total: number;
  nombre_cliente: string;
  email_cliente: string;
  telefono_cliente: string;
  direccion_envio: any;
  fecha_creacion: string;
  fecha_pago: string | null;
  is_guest: boolean;
}

interface OrderItem {
  id: string;
  orden_id: string;
  producto_nombre: string;
  producto_imagen: string;
  cantidad: number;
  talla: string | null;
  color: string | null;
  precio_unitario: number;
  subtotal: number;
}

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('todos');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    loadOrders();
  }, [filter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('ordenes')
        .select('*')
        .order('fecha_creacion', { ascending: false });

      if (filter !== 'todos') {
        query = query.eq('estado', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrderItems = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from('items_orden')
        .select('*')
        .eq('orden_id', orderId);

      if (error) throw error;
      setOrderItems(data || []);
    } catch (error) {
      console.error('Error loading order items:', error);
      setOrderItems([]);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const updateData: any = {
        estado: newStatus,
        actualizado_en: new Date().toISOString()
      };

      // Si se marca como pagado, agregar fecha de pago
      if (newStatus === 'Pagado') {
        updateData.fecha_pago = new Date().toISOString();
      }

      await supabase
        .from('ordenes')
        .update(updateData)
        .eq('id', id);
      loadOrders();
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const deleteOrder = async (id: string) => {
    // if (!confirm('¿Estás seguro de eliminar este pedido? Esta acción no se puede deshacer.')) {
    //   return;
    // }

    try {
      await supabase
        .from('ordenes')
        .delete()
        .eq('id', id);
      loadOrders();
      setShowModal(false);
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  };

  const viewOrderDetails = async (order: Order) => {
    setSelectedOrder(order);
    await loadOrderItems(order.id);
    setShowModal(true);
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'Pagado':
      case 'Completado':
        return 'bg-green-100 text-green-800';
      case 'Enviado':
      case 'En Proceso':
        return 'bg-blue-100 text-blue-800';
      case 'Cancelado':
        return 'bg-red-100 text-red-800';
      case 'Pendiente':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin text-4xl">⏳</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-0.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l0.03-.12 0.9-1.63h7.45c0.75 0 1.41-.41 1.75-1.03l3.58-6.49c0.08-.14 0.12-.31 0.12-.48 0-.55-.45-1-1-1H5.21l-0.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s0.89 2 1.99 2 2-0.9 2-2-0.9-2-2-2z" />
              </svg>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Gestión de Pedidos</h3>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold ml-2">
                {orders.length}
              </span>
            </div>

          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2 sm:mx-0 sm:px-0 sm:flex-wrap">
            {['todos', 'Pendiente', 'Pagado', 'En Proceso', 'Enviado', 'Completado', 'Cancelado'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-xl font-bold text-sm transition-all duration-200 whitespace-nowrap shadow-sm ${filter === status
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-green-200 ring-2 ring-green-400 ring-offset-1'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
                  }`}
              >
                {status === 'todos' ? 'Todos' : status}
              </button>
            ))}
          </div>

          <div className="mt-4 relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Buscar por nº pedido o email..."
              value={searchTerm}
              onChange={(e: any) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all text-sm"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>


        {orders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-lg font-semibold">No hay pedidos</p>
            <p className="text-sm">Los pedidos aparecerán aquí cuando los clientes realicen compras</p>
          </div>
        ) : (
          <div>
            {/* Desktop Header - only visible on lg screens */}
            <div className="hidden lg:flex lg:items-center lg:gap-4 px-5 py-3 bg-gray-50 border-b border-gray-200 text-[11px] uppercase tracking-wider font-semibold text-gray-500">
              <div className="min-w-[140px]">Nº Pedido</div>
              <div className="min-w-[180px]">Cliente</div>
              <div className="min-w-[100px]">Total</div>
              <div className="min-w-[100px]">Estado</div>
              <div className="min-w-[120px]">Fecha</div>
              <div className="flex-1 text-right">Acciones</div>
            </div>

            <div className="divide-y divide-gray-100">
              {orders.filter(order =>
                order.numero_orden.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (order.email_cliente && order.email_cliente.toLowerCase().includes(searchTerm.toLowerCase()))
              ).map((order) => (
                <div key={order.id} className="p-5 sm:p-6 hover:bg-gray-50/50 transition-colors duration-200">
                  {/* Desktop: Horizontal row layout */}
                  <div className="hidden lg:flex lg:items-center lg:gap-4">
                    <div className="min-w-[140px]">
                      <span className="font-mono text-sm font-bold text-gray-900">{order.numero_orden}</span>
                      {order.is_guest && (
                        <span className="ml-2 text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">Invitado</span>
                      )}
                    </div>
                    <div className="min-w-[180px]">
                      <p className="font-semibold text-gray-900 text-sm">{order.nombre_cliente || 'Sin nombre'}</p>
                      <p className="text-xs text-gray-500 truncate">{order.email_cliente}</p>
                    </div>
                    <div className="min-w-[100px]">
                      <span className="font-bold text-green-600">{(order.total / 100).toFixed(2)}€</span>
                    </div>
                    <div className="min-w-[100px]">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${getStatusColor(order.estado)}`}>
                        {order.estado}
                      </span>
                    </div>
                    <div className="min-w-[120px] text-xs text-gray-500">
                      {new Date(order.fecha_creacion).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <div className="flex-1 flex justify-end items-center gap-2">
                      <button
                        onClick={() => viewOrderDetails(order)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
                      >
                        Ver
                      </button>
                      <select
                        value={order.estado}
                        onChange={(e: any) => updateStatus(order.id, e.target.value)}
                        className="px-2 py-1.5 rounded-lg text-xs font-medium bg-white text-gray-700 border border-gray-200 hover:border-gray-300 focus:outline-none focus:ring-1 focus:ring-green-500 cursor-pointer"
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="Pagado">Pagado</option>
                        <option value="En Proceso">En Proceso</option>
                        <option value="Enviado">Enviado</option>
                        <option value="Completado">Completado</option>
                        <option value="Cancelado">Cancelado</option>
                      </select>
                    </div>
                  </div>

                  {/* Mobile/Tablet: Card layout */}
                  <div className="lg:hidden flex flex-col space-y-4">
                    {/* Header: Order Number & Status */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex flex-col">
                        <span className="font-mono text-sm font-black text-gray-900">{order.numero_orden}</span>
                        {order.is_guest && (
                          <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded w-fit mt-0.5">Invitado</span>
                        )}
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${getStatusColor(order.estado)}`}>
                        {order.estado}
                      </span>
                    </div>

                    {/* Body: Client Info & Total */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium mb-0.5">Cliente</p>
                        <p className="font-bold text-gray-900 text-sm leading-tight">{order.nombre_cliente || 'Sin nombre'}</p>
                        <p className="text-xs text-gray-500 truncate">{order.email_cliente}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium mb-0.5">Total</p>
                        <p className="font-black text-lg text-green-600">{(order.total / 100).toFixed(2)}€</p>
                      </div>
                    </div>

                    {/* Footer: Date */}
                    <div className="flex items-center text-[10px] font-medium text-gray-400 uppercase tracking-widest border-t border-gray-100 pt-2">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      {new Date(order.fecha_creacion).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => viewOrderDetails(order)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        Ver Detalles
                      </button>
                      <select
                        value={order.estado}
                        onChange={(e: any) => updateStatus(order.id, e.target.value)}
                        className="px-3 py-2 rounded-lg text-xs font-bold bg-white text-gray-700 border border-gray-200 hover:border-gray-300 focus:outline-none focus:ring-1 focus:ring-green-500 cursor-pointer text-center"
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="Pagado">Pagado</option>
                        <option value="En Proceso">En Proceso</option>
                        <option value="Enviado">Enviado</option>
                        <option value="Completado">Completado</option>
                        <option value="Cancelado">Cancelado</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal de detalles del pedido */}
      {
        showModal && selectedOrder && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">
                  Pedido {selectedOrder.numero_orden}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Info del cliente */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-700 mb-3">Cliente</h4>
                    <p className="text-gray-900 font-medium">{selectedOrder.nombre_cliente}</p>
                    <p className="text-gray-600 text-sm mt-1">{selectedOrder.email_cliente}</p>
                    <p className="text-gray-600 text-sm">{selectedOrder.telefono_cliente}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-700 mb-3">Dirección de envío</h4>
                    {selectedOrder.direccion_envio ? (
                      <div className="text-gray-600 text-sm space-y-0.5">
                        <p>{selectedOrder.direccion_envio.calle}</p>
                        <p>{selectedOrder.direccion_envio.ciudad}, {selectedOrder.direccion_envio.codigo_postal}</p>
                        <p>{selectedOrder.direccion_envio.pais}</p>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No especificada</p>
                    )}
                  </div>
                </div>

                {/* Productos */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Productos</h4>
                  <div className="space-y-2">
                    {orderItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center gap-3">
                          {item.producto_imagen && (
                            <img src={item.producto_imagen} alt={item.producto_nombre} className="w-12 h-12 object-cover rounded" />
                          )}
                          <div>
                            <p className="font-semibold text-gray-900">{item.producto_nombre}</p>
                            <p className="text-xs text-gray-500">
                              {item.talla && `Talla: ${item.talla}`}
                              {item.talla && item.color && ' | '}
                              {item.color && `Color: ${item.color}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{(item.precio_unitario / 100).toFixed(2)}€ x {item.cantidad}</p>
                          <p className="text-green-600 font-bold">{(item.subtotal / 100).toFixed(2)}€</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totales */}
                <div className="border-t pt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Subtotal:</span>
                    <span>{(selectedOrder.subtotal / 100).toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Impuestos (IVA):</span>
                    <span>{(selectedOrder.impuestos / 100).toFixed(2)}€</span>
                  </div>
                  {selectedOrder.descuento > 0 && (
                    <div className="flex justify-between text-sm text-green-600 mb-1">
                      <span>Descuento:</span>
                      <span>-{(selectedOrder.descuento / 100).toFixed(2)}€</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold text-gray-900 mt-2 pt-2 border-t">
                    <span>Total:</span>
                    <span className="text-green-600">{(selectedOrder.total / 100).toFixed(2)}€</span>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => deleteOrder(selectedOrder.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
                  >
                    Eliminar Pedido
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default AdminOrders;
