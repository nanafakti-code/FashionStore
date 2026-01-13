/**
 * FASHIONMARKET - CART STATE MANAGEMENT
 * =====================================
 * Gestión del estado del carrito de compra usando Nano Stores
 * Persistencia en localStorage para mantener el carrito entre sesiones
 */

import { atom, computed } from 'nanostores';

// =====================================================
// TIPOS
// =====================================================

export interface CartItem {
  id: string;           // UUID del producto
  name: string;         // Nombre del producto
  slug: string;         // Slug para generar URL
  price: number;        // Precio en céntimos
  quantity: number;     // Cantidad seleccionada
  size?: string;        // Talla seleccionada (opcional)
  image?: string;       // URL de la imagen principal
  maxStock: number;     // Stock máximo disponible
}

export interface Cart {
  items: CartItem[];
  lastUpdated: number;  // Timestamp de última actualización
}

// =====================================================
// CONSTANTES
// =====================================================

const CART_STORAGE_KEY = 'fashionmarket_cart';
const CART_EXPIRY_DAYS = 7; // El carrito expira después de 7 días

// =====================================================
// HELPERS
// =====================================================

/**
 * Carga el carrito desde localStorage
 */
function loadCartFromStorage(): Cart {
  if (typeof window === 'undefined') {
    return { items: [], lastUpdated: Date.now() };
  }

  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (!stored) {
      return { items: [], lastUpdated: Date.now() };
    }

    const cart: Cart = JSON.parse(stored);
    
    // Verificar si el carrito ha expirado
    const daysSinceUpdate = (Date.now() - cart.lastUpdated) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate > CART_EXPIRY_DAYS) {
      localStorage.removeItem(CART_STORAGE_KEY);
      return { items: [], lastUpdated: Date.now() };
    }

    return cart;
  } catch (error) {
    console.error('Error loading cart from storage:', error);
    return { items: [], lastUpdated: Date.now() };
  }
}

/**
 * Guarda el carrito en localStorage
 */
function saveCartToStorage(cart: Cart): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error('Error saving cart to storage:', error);
  }
}

// =====================================================
// STORES
// =====================================================

/**
 * Store principal del carrito
 */
export const cartStore = atom<Cart>(loadCartFromStorage());

/**
 * Computed: Número total de items en el carrito
 */
export const cartItemCount = computed(cartStore, (cart) => {
  return cart.items.reduce((total, item) => total + item.quantity, 0);
});

/**
 * Computed: Total del carrito en céntimos
 */
export const cartTotal = computed(cartStore, (cart) => {
  return cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
});

/**
 * Computed: Total del carrito formateado en euros
 */
export const cartTotalFormatted = computed(cartTotal, (total) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(total / 100);
});

/**
 * Computed: ¿Está el carrito vacío?
 */
export const isCartEmpty = computed(cartStore, (cart) => {
  return cart.items.length === 0;
});

// =====================================================
// ACCIONES
// =====================================================

/**
 * Añade un producto al carrito
 */
export function addToCart(item: Omit<CartItem, 'quantity'>, quantity: number = 1): void {
  const cart = cartStore.get();
  
  // Buscar si el item ya existe (mismo id y talla)
  const existingItemIndex = cart.items.findIndex(
    (i) => i.id === item.id && i.size === item.size
  );

  let updatedItems: CartItem[];

  if (existingItemIndex >= 0) {
    // Item ya existe, actualizar cantidad
    updatedItems = cart.items.map((i, index) => {
      if (index === existingItemIndex) {
        const newQuantity = Math.min(i.quantity + quantity, i.maxStock);
        return { ...i, quantity: newQuantity };
      }
      return i;
    });
  } else {
    // Item nuevo, añadir al carrito
    const newItem: CartItem = {
      ...item,
      quantity: Math.min(quantity, item.maxStock)
    };
    updatedItems = [...cart.items, newItem];
  }

  const updatedCart: Cart = {
    items: updatedItems,
    lastUpdated: Date.now()
  };

  cartStore.set(updatedCart);
  saveCartToStorage(updatedCart);
}

/**
 * Elimina un producto del carrito
 */
export function removeFromCart(itemId: string, size?: string): void {
  const cart = cartStore.get();
  
  const updatedItems = cart.items.filter(
    (item) => !(item.id === itemId && item.size === size)
  );

  const updatedCart: Cart = {
    items: updatedItems,
    lastUpdated: Date.now()
  };

  cartStore.set(updatedCart);
  saveCartToStorage(updatedCart);
}

/**
 * Actualiza la cantidad de un producto en el carrito
 */
export function updateQuantity(itemId: string, quantity: number, size?: string): void {
  if (quantity <= 0) {
    removeFromCart(itemId, size);
    return;
  }

  const cart = cartStore.get();
  
  const updatedItems = cart.items.map((item) => {
    if (item.id === itemId && item.size === size) {
      return {
        ...item,
        quantity: Math.min(quantity, item.maxStock)
      };
    }
    return item;
  });

  const updatedCart: Cart = {
    items: updatedItems,
    lastUpdated: Date.now()
  };

  cartStore.set(updatedCart);
  saveCartToStorage(updatedCart);
}

/**
 * Vacía completamente el carrito
 */
export function clearCart(): void {
  const emptyCart: Cart = {
    items: [],
    lastUpdated: Date.now()
  };

  cartStore.set(emptyCart);
  saveCartToStorage(emptyCart);
}

/**
 * Obtiene un item específico del carrito
 */
export function getCartItem(itemId: string, size?: string): CartItem | undefined {
  const cart = cartStore.get();
  return cart.items.find((item) => item.id === itemId && item.size === size);
}

/**
 * Verifica si un producto está en el carrito
 */
export function isInCart(itemId: string, size?: string): boolean {
  return getCartItem(itemId, size) !== undefined;
}

// =====================================================
// SUSCRIPCIÓN A CAMBIOS (para debugging)
// =====================================================

if (import.meta.env.DEV) {
  cartStore.subscribe((cart) => {
    console.log('🛒 Cart updated:', {
      itemCount: cart.items.length,
      totalItems: cart.items.reduce((sum, item) => sum + item.quantity, 0),
      total: new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR'
      }).format(
        cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) / 100
      )
    });
  });
}
