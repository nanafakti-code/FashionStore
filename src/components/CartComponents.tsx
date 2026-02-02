/**
 * COMPONENTES LISTOS PARA USAR
 * ============================
 * Copia estas funciones en tus componentes Astro/React
 */

// =====================================================
// 1. COMPONENTE: Badge del Carrito (Header)
// =====================================================

import React from 'react';
import { useCart } from '@/hooks/useCart';

export function CartBadge() {
  const { summary, isLoading } = useCart();

  if (isLoading) {
    return <div className="cart-badge loading">...</div>;
  }

  const count = summary?.itemCount || 0;

  return (
    <div className="cart-badge-container">
      <svg
        className="cart-icon"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>

      {count > 0 && (
        <span className="cart-badge" aria-label={`${count} items en carrito`}>
          {count}
        </span>
      )}
    </div>
  );
}

// CSS Styles (using Tailwind classes defined in component classNames)
// Commented out as styles are now implemented via Tailwind classes
/* const styles = `
.cart-badge-container {
  position: relative;
  cursor: pointer;
  transition: transform 0.2s;
}

.cart-badge-container:hover {
  transform: scale(1.1);
}

.cart-icon {
  color: #1f2937;
}

.cart-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #ef4444;
  color: white;
  font-size: 12px;
  font-weight: bold;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: pulse 2s infinite;
}

.cart-badge.loading {
  background: #d1d5db;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
  }
}
*/

// =====================================================
// 2. BOTÓN: Añadir al Carrito (Producto)
// =====================================================

interface AddToCartProps {
  productId: string;
  productName: string;
  price: number;
  image: string;
  talla?: string;
  color?: string;
}

export function AddToCartButton({
  productId,
  productName,
  price,
  image,
  talla,
  color,
}: AddToCartProps) {
  const { addItem, isProcessing, error } = useCart();
  const [success, setSuccess] = React.useState(false);

  const handleClick = async () => {
    setSuccess(false);
    const result = await addItem(
      productId,
      productName,
      price,
      image,
      1,
      talla,
      color
    );

    if (result) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    }
  };

  return (
    <div className="add-to-cart-container">
      <button
        onClick={handleClick}
        disabled={isProcessing}
        className={`btn-add-to-cart ${success ? 'success' : ''}`}
      >
        {isProcessing && <span className="spinner">⏳</span>}
        {success && <span className="checkmark">✓</span>}
        {!isProcessing && !success && 'Añadir al carrito'}
        {isProcessing && 'Añadiendo...'}
        {success && '¡Añadido!'}
      </button>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
}
// CSS (using Tailwind - commented out)
/* const addToCartStyles = `
.add-to-cart-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn-add-to-cart {
  padding: 12px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
}

.btn-add-to-cart:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.btn-add-to-cart:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-add-to-cart.success {
  background: #10b981;
}

.error-message {
  color: #dc2626;
  font-size: 14px;
  margin: 0;
}

.spinner {
  display: inline-block;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.checkmark {
  font-size: 20px;
}
*/

// =====================================================
// 3. LISTA DEL CARRITO (Página carrito)
// =====================================================

export function CartItemsList() {
  const { items, summary, isProcessing, removeItem, updateQuantity } = useCart();

  if (!summary) {
    return <div className="empty-cart">Carrito vacío</div>;
  }

  if (summary.itemCount === 0) {
    return (
      <div className="empty-cart">
        <p>Tu carrito está vacío</p>
        <a href="/tienda" className="btn-continue-shopping">
          Continuar comprando
        </a>
      </div>
    );
  }

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity > 0) {
      await updateQuantity(itemId, newQuantity);
    }
  };

  const handleRemove = async (itemId: string) => {
    // if (confirm('¿Eliminar este producto del carrito?')) {
    await removeItem(itemId);
    // }
  };

  return (
    <div className="cart-items-list">
      <table className="cart-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Cantidad</th>
            <th>Precio Unit.</th>
            <th>Subtotal</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="cart-item-row">
              <td className="product-info">
                {item.product_image && (
                  <img
                    src={item.product_image}
                    alt={item.product_name}
                    className="product-image"
                  />
                )}
                <div className="product-details">
                  <p className="product-name">{item.product_name}</p>
                  {(item.talla || item.color) && (
                    <p className="product-variants">
                      {item.talla && <span>Talla: {item.talla}</span>}
                      {item.color && <span>Color: {item.color}</span>}
                    </p>
                  )}
                </div>
              </td>
              <td>
                <div className="quantity-control">
                  <button
                    onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                    disabled={isProcessing}
                    className="qty-btn"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e: any) =>
                      handleQuantityChange(item.id, parseInt(e.target?.value || 1) || 1)
                    }
                    disabled={isProcessing}
                    className="qty-input"
                  />
                  <button
                    onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                    disabled={isProcessing || item.quantity >= (item.product_stock || 999)}
                    className="qty-btn"
                  >
                    +
                  </button>
                </div>
              </td>
              <td className="price">${item.precio_unitario}</td>
              <td className="price">
                ${item.precio_unitario * item.quantity}
              </td>
              <td>
                <button
                  onClick={() => handleRemove(item.id)}
                  disabled={isProcessing}
                  className="btn-remove"
                  title="Eliminar"
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// CSS (using Tailwind - commented out)
/* const cartListStyles = `
.empty-cart {
  text-align: center;
  padding: 40px 20px;
  background: #f3f4f6;
  border-radius: 8px;
}

.empty-cart p {
  font-size: 18px;
  color: #6b7280;
  margin-bottom: 20px;
}

.btn-continue-shopping {
  display: inline-block;
  padding: 10px 20px;
  background: #3b82f6;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  transition: background 0.3s;
}

.btn-continue-shopping:hover {
  background: #2563eb;
}

.cart-items-list {
  overflow-x: auto;
}

.cart-table {
  width: 100%;
  border-collapse: collapse;
}

.cart-table thead {
  background: #f9fafb;
  border-bottom: 2px solid #e5e7eb;
}

.cart-table th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #374151;
}

.cart-table td {
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.product-info {
  display: flex;
  gap: 12px;
}

.product-image {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 6px;
}

.product-details {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.product-name {
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.product-variants {
  font-size: 12px;
  color: #6b7280;
  margin: 4px 0 0 0;
}

.product-variants span {
  display: block;
}

.quantity-control {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 4px;
}

.qty-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  font-size: 16px;
  color: #6b7280;
  transition: color 0.2s;
}

.qty-btn:hover:not(:disabled) {
  color: #1f2937;
}

.qty-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.qty-input {
  width: 40px;
  text-align: center;
  border: none;
  background: none;
  font-weight: 600;
}

.qty-input:disabled {
  opacity: 0.5;
}

.price {
  font-weight: 600;
  color: #1f2937;
}

.btn-remove {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  transition: transform 0.2s;
}

.btn-remove:hover {
  transform: scale(1.2);
}

.btn-remove:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cart-item-row:hover {
  background: #f9fafb;
}
`;

// =====================================================
// 4. RESUMEN DEL CARRITO (Sidebar/Total)
// =====================================================

export function CartSummary() {
  const { summary, isLoading } = useCart();

  if (isLoading || !summary) {
    return <div className="cart-summary loading">Cargando...</div>;
  }

  const hasItems = summary.itemCount > 0;

  return (
    <div className="cart-summary-container">
      <h3>Resumen del pedido</h3>
      
      <div className="summary-row">
        <span>Subtotal ({summary.itemCount} items)</span>
        <span className="amount">${summary.subtotal}</span>
      </div>

      <div className="summary-row">
        <span>IVA (21%)</span>
        <span className="amount">${summary.tax}</span>
      </div>

      <div className="summary-row-divider"></div>

      <div className="summary-row total">
        <span>Total</span>
        <span className="amount">${summary.total}</span>
      </div>

      <button 
        className="btn-checkout" 
        disabled={!hasItems}
      >
        Proceder al pago
      </button>

      <a href="/tienda" className="btn-continue">
        Continuar comprando
      </a>
    </div>
  );
}

// CSS (using Tailwind - commented out)
/* const summaryStyles = `
.cart-summary-container {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  position: sticky;
  top: 20px;
}

.cart-summary-container h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #1f2937;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  font-size: 14px;
  color: #6b7280;
}

.summary-row.total {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
}

.summary-row .amount {
  font-weight: 600;
  color: #1f2937;
}

.summary-row.total .amount {
  font-size: 20px;
  color: #3b82f6;
}

.summary-row-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 16px 0;
}

.btn-checkout {
  width: 100%;
  padding: 12px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
  margin-bottom: 8px;
}

.btn-checkout:hover:not(:disabled) {
  background: #2563eb;
}

.btn-checkout:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #d1d5db;
}

.btn-continue {
  display: block;
  width: 100%;
  padding: 12px;
  text-align: center;
  color: #3b82f6;
  border: 1px solid #3b82f6;
  border-radius: 6px;
  text-decoration: none;
  transition: all 0.3s;
  font-weight: 600;
}

.btn-continue:hover {
  background: #eff6ff;
}

.cart-summary.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: #6b7280;
}
*/

// =====================================================
// 5. PÁGINA COMPLETA DEL CARRITO
// =====================================================

export const CartPage = () => {
  const { clear, error } = useCart();

  // Inline CartSummary component to avoid hoisting issues
  const CartSummaryComponent = () => {
    const { summary, isLoading } = useCart();

    if (isLoading || !summary) {
      return <div className="cart-summary loading">Cargando...</div>;
    }

    const hasItems = summary.itemCount > 0;

    return (
      <div className="cart-summary-container">
        <h3>Resumen del pedido</h3>

        <div className="summary-row">
          <span>Subtotal ({summary.itemCount} items)</span>
          <span className="amount">${summary.subtotal}</span>
        </div>

        <div className="summary-row">
          <span>IVA (21%)</span>
          <span className="amount">${summary.tax}</span>
        </div>

        <div className="summary-row-divider"></div>

        <div className="summary-row total">
          <span>Total</span>
          <span className="amount">${summary.total}</span>
        </div>

        <button
          className="btn-checkout"
          disabled={!hasItems}
        >
          Proceder al pago
        </button>

        <a href="/tienda" className="btn-continue">
          Continuar comprando
        </a>
      </div>
    );
  };

  return (
    <div className="cart-page-container">
      <h1>Carrito de Compra</h1>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="cart-layout">
        <div className="cart-main">
          <CartItemsList />

          <div className="cart-actions">
            <button
              onClick={() => clear()}
              className="btn-clear-cart"
            >
              Vaciar carrito
            </button>
          </div>
        </div>

        <aside className="cart-sidebar">
          <CartSummaryComponent />
        </aside>
      </div>
    </div>
  );
};

export default CartPage;

// CSS (using Tailwind - commented out)
/* const pageStyles = `
.cart-page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.cart-page-container h1 {
  margin-bottom: 30px;
  color: #1f2937;
}

.cart-layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 30px;
}

.cart-main {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.cart-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.btn-clear-cart {
  padding: 10px 20px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-clear-cart:hover {
  background: #dc2626;
}

.alert {
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 20px;
}

.alert-error {
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

@media (max-width: 768px) {
  .cart-layout {
    grid-template-columns: 1fr;
  }

  .cart-sidebar {
    position: static;
  }

  .summary-row {
    font-size: 13px;
  }
}
*/
