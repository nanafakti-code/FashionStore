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
    if (!confirm('¿Estás seguro de eliminar este pedido? Esta acción no se puede deshacer.')) {
      return;
    }
    
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
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-0.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l0.03-.12 0.9-1.63h7.45c0.75 0 1.41-.41 1.75-1.03l3.58-6.49c0.08-.14 0.12-.31 0.12-.48 0-.55-.45-1-1-1H5.21l-0.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s0.89 2 1.99 2 2-0.9 2-2-0.9-2-2-2z"/>
            </svg>
            <h3 className="text-2xl font-bold text-gray-900">Gestión de Pedidos</h3>
            <span className="ml-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
              {orders.length} pedidos
            </span>
          </div>

          <div className="flex gap-2 flex-wrap">
            {['todos', 'Pendiente', 'Pagado', 'En Proceso', 'Enviado', 'Completado', 'Cancelado'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filter === status
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {status === 'todos' ? 'Todos' : status}
              </button>
            ))}
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Nº Pedido</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Cliente</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Total</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Estado</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Fecha</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="font-mono text-sm font-bold text-gray-900">{order.numero_orden}</div>
                      {order.is_guest && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">Invitado</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{order.nombre_cliente || 'Sin nombre'}</div>
                      <div className="text-xs text-gray-500">{order.email_cliente}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-green-600">{(order.total / 100).toFixed(2)}€</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.estado)}`}>
                        {order.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-xs">
                      {new Date(order.fecha_creacion).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 space-x-2">
                      <button
                        onClick={() => viewOrderDetails(order)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs font-semibold"
                      >
                        Ver
                      </button>
                      <select
                        value={order.estado}
                        onChange={(e: any) => updateStatus(order.id, e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:border-green-500"
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="Pagado">Pagado</option>
                        <option value="En Proceso">En Proceso</option>
                        <option value="Enviado">Enviado</option>
                        <option value="Completado">Completado</option>
                        <option value="Cancelado">Cancelado</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de detalles del pedido */}
      {showModal && selectedOrder && (
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Cliente</h4>
                  <p className="text-gray-900">{selectedOrder.nombre_cliente}</p>
                  <p className="text-gray-600 text-sm">{selectedOrder.email_cliente}</p>
                  <p className="text-gray-600 text-sm">{selectedOrder.telefono_cliente}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Dirección de envío</h4>
                  {selectedOrder.direccion_envio ? (
                    <div className="text-gray-600 text-sm">
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
      )}
    </div>
  );
};

export default AdminOrders;
