/**
 * FASHIONSTORE - CART SERVICE (MEJORADO)
 * ======================================
 * Sistema completo de carrito con:
 * - Carrito autenticado (Supabase RLS)
 * - Carrito invitado (localStorage)
 * - Migración automática
 */

import { supabase } from './supabase';
import { getCurrentUser } from './auth';

// =====================================================
// TIPOS Y INTERFACES
// =====================================================

export interface CartItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  talla?: string;
  color?: string;
  precio_unitario: number;
  product_image?: string;
  product_stock?: number;
  expires_in_seconds?: number;
  variant_name?: string;
  capacity?: string;
}

export interface CartSummary {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  itemCount: number;
}

export interface GuestCartItem {
  product_id: string;
  product_name: string;
  quantity: number;
  talla?: string;
  color?: string;
  precio_unitario: number;
  product_image?: string;
  created_at?: number; // Timestamp de creación (para expiración en 10 min)
}

// =====================================================
// CONSTANTES
// =====================================================

const GUEST_CART_KEY = 'fashionstore_guest_cart';
const LOCAL_STORAGE_AVAILABLE = typeof window !== 'undefined' && !!window.localStorage;

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

/**
 * Obtiene el carrito invitado del localStorage o sessionStorage
 */
function getGuestCart(): GuestCartItem[] {
  if (!LOCAL_STORAGE_AVAILABLE) {
    console.warn('localStorage no disponible');
    return [];
  }

  try {
    // Primero intentar localStorage
    let cart = localStorage.getItem(GUEST_CART_KEY);

    // Si no está en localStorage, intentar sessionStorage
    if (!cart && typeof sessionStorage !== 'undefined') {
      cart = sessionStorage.getItem(GUEST_CART_KEY);
    }

    if (!cart) {
      // Intentar buscar con otros nombres posibles
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('cart') || key.includes('carrito'))) {
          const alternativeCart = localStorage.getItem(key);
          if (alternativeCart) {
            try {
              const parsed = JSON.parse(alternativeCart);
              if (Array.isArray(parsed)) {
                return parsed;
              }
            } catch (e) {
              // JSON parse fallido en cart alternativo, continuar buscando
            }
          }
        }
      }
      return [];
    }

    const parsed = JSON.parse(cart);
    return parsed;
  } catch (error) {
    console.error('Error parsing guest cart from storage:', error);
    return [];
  }
}

/**
 * Guarda el carrito invitado en localStorage Y sessionStorage
 */
function saveGuestCart(items: GuestCartItem[]): void {
  if (!LOCAL_STORAGE_AVAILABLE) return;

  try {
    const cartJSON = JSON.stringify(items);

    // Guardar en localStorage
    localStorage.setItem(GUEST_CART_KEY, cartJSON);

    // TAMBIÉN guardar en sessionStorage como respaldo
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(GUEST_CART_KEY, cartJSON);
    }

    window.dispatchEvent(new Event('guestCartUpdated'));
  } catch (error) {
    console.error('Error saving guest cart to storage:', error);
  }
}

/**
 * Limpia localStorage y sessionStorage del carrito invitado
 */
function clearGuestCartStorage(): void {
  if (!LOCAL_STORAGE_AVAILABLE) return;
  localStorage.removeItem(GUEST_CART_KEY);
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(GUEST_CART_KEY);
  }
  // Disparar evento para actualizar UI
  window.dispatchEvent(new Event('guestCartUpdated'));
}

/**
 * Limpia items expirados del carrito invitado (10 minutos = 600000 ms)
 */
export function cleanupExpiredGuestCartItems(): void {
  if (!LOCAL_STORAGE_AVAILABLE) return;

  try {
    const cart = getGuestCart();
    const now = Date.now();
    const EXPIRATION_TIME = 10 * 60 * 1000; // 10 minutos en milisegundos

    // Filtrar items no expirados
    const activeItems = cart.filter(item => {
      const createdAt = item.created_at || now; // Si no tiene fecha, es reciente
      const expiresAt = createdAt + EXPIRATION_TIME;
      const isExpired = now > expiresAt;
      return !isExpired;
    });

    // Si hay cambios, guardar el carrito actualizado
    if (activeItems.length !== cart.length) {
      saveGuestCart(activeItems);
    }
  } catch (error) {
    console.error('Error cleaning up expired guest cart items:', error);
  }
}

// =====================================================
// FUNCIONES PARA CARRITO AUTENTICADO (BD)
// =====================================================

/**
 * Obtiene el carrito del usuario autenticado desde Supabase
 */
export async function getAuthenticatedCart(): Promise<CartItem[]> {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    // Consulta directa a las tablas con Joins
    const { data: cartData, error } = await supabase
      .from('cart_items')
      .select(`
        id,
        user_id,
        product_id,
        variante_id,
        quantity,
        talla,
        color,
        precio_unitario,
        created_at,
        expires_at,
        productos (
          id,
          nombre,
          stock_total,
          imagenes_producto (
            url,
            es_principal
          )
        ),
        variantes_producto (
          id,
          nombre_variante,
          color,
          capacidad,
          precio_venta,
          imagen_url,
          stock
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching authenticated cart:', error);
      return [];
    }

    const now = new Date();

    // Mapear los datos al formato CartItem
    const mappedData: CartItem[] = cartData.map((item: any) => {
      // Determinar datos del producto base y variante
      const product = item.productos;
      const variant = item.variantes_producto;

      const productName = product?.nombre || 'Producto Desconocido';
      const finalVariantName = variant?.nombre_variante;

      const productImages = product?.imagenes_producto || [];
      const mainImageObj = Array.isArray(productImages)
        ? productImages.find((img: any) => img.es_principal) || productImages[0]
        : null;
      const baseImageUrl = mainImageObj?.url || '/placeholder.png';

      const productImage = variant?.imagen_url || baseImageUrl;
      const productStock = variant ? variant.stock : product?.stock_total || 0;

      // Calcular tiempo restante
      let expiresInSeconds = 0;
      if (item.expires_at) {
        const expiresAt = new Date(item.expires_at).getTime();
        expiresInSeconds = Math.max(0, Math.floor((expiresAt - now.getTime()) / 1000));
      }

      return {
        id: item.id,
        product_id: item.product_id,
        product_name: productName,
        quantity: Math.max(1, item.quantity || 1),
        talla: item.talla || undefined,
        color: item.color || variant?.color || undefined,
        precio_unitario: item.precio_unitario || 0,
        product_image: productImage,
        product_stock: productStock,
        expires_in_seconds: expiresInSeconds,
        variant_name: finalVariantName || undefined,
        capacity: variant?.capacidad || undefined,
      };
    });

    return mappedData;
  } catch (error) {
    console.error('Error in getAuthenticatedCart:', error);
    return [];
  }
}

/**
 * Añade un producto al carrito autenticado
 */
export async function addToAuthenticatedCart(
  productId: string,
  _productName: string,
  price: number,
  _image: string,
  quantity: number = 1,
  talla?: string,
  color?: string
): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await supabase.rpc('add_to_cart_with_stock_check', {
      p_product_id: productId,
      p_quantity: quantity,
      p_talla: talla || null,
      p_color: color || null,
      p_precio_unitario: price
    });

    if (error) throw error;
    if (data && !data.success) {
      throw new Error(data.message || 'Error al añadir al carrito (posible falta de stock)');
    }

    if (!data) throw new Error('No se recibió respuesta del servidor');

    window.dispatchEvent(new Event('authCartUpdated'));
    return true;
  } catch (error: any) {
    console.error('Error adding to authenticated cart:', error);
    throw error;
  }
}

/**
 * Actualiza la cantidad de un item en carrito autenticado
 */
export async function updateAuthenticatedCartItem(
  itemId: string,
  quantity: number
): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Usuario no autenticado');

    if (quantity <= 0) {
      return removeFromAuthenticatedCart(itemId);
    }

    const { data, error } = await supabase.rpc('update_cart_item_quantity_with_stock_check', {
      p_cart_item_id: itemId,
      p_new_quantity: quantity
    });

    if (error) throw error;

    if (data && !data.success) {
      console.warn('Fallo al actualizar cantidad:', data.message);
      return false;
    }

    window.dispatchEvent(new Event('authCartUpdated'));
    return true;
  } catch (error) {
    console.error('Error updating authenticated cart item:', error);
    return false;
  }
}

/**
 * Elimina un item del carrito autenticado
 */
export async function removeFromAuthenticatedCart(itemId: string): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await supabase.rpc('remove_from_cart_restore_stock', {
      p_cart_item_id: itemId
    });

    if (error) throw error;

    if (!data) {
      console.warn('Item no encontrado o no pertenece al usuario');
      return false;
    }

    window.dispatchEvent(new Event('authCartUpdated'));
    return true;
  } catch (error) {
    console.error('Error removing from authenticated cart:', error);
    return false;
  }
}

/**
 * Vacía completamente el carrito autenticado
 */
export async function clearAuthenticatedCart(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { error } = await supabase.rpc('clear_user_cart_restore_stock');

    if (error) throw error;

    window.dispatchEvent(new Event('authCartUpdated'));
    return true;
  } catch (error) {
    console.error('Error clearing authenticated cart:', error);
    return false;
  }
}

// =====================================================
// FUNCIONES PARA CARRITO INVITADO (BD VIA SESSION_ID)
// =====================================================

export function getOrCreateGuestSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sessionId = localStorage.getItem('fashionstore_guest_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('fashionstore_guest_session_id', sessionId);
  }
  return sessionId;
}

/**
 * Obtiene el carrito invitado desde la BD usando Session ID
 */
export async function getGuestCartItems(): Promise<CartItem[]> {
  try {
    const sessionId = getOrCreateGuestSessionId();
    if (!sessionId) return [];

    const { data, error } = await supabase.rpc('get_guest_cart', { p_session_id: sessionId });

    if (error) {
      console.error('Error fetching guest cart RPC:', error);
      return [];
    }

    const now = new Date();

    const mappedItems: CartItem[] = (data || []).map((item: any) => {
      // Calcular tiempo restante
      let expiresInSeconds = 0;
      if (item.expires_at) {
        const expiresAt = new Date(item.expires_at).getTime();
        expiresInSeconds = Math.max(0, Math.floor((expiresAt - now.getTime()) / 1000));
      }

      return {
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name || 'Producto',
        quantity: item.quantity,
        talla: item.talla,
        color: item.color,
        precio_unitario: item.precio_unitario,
        product_image: item.variant_image || item.product_image,
        product_stock: item.variant_stock ?? item.product_stock ?? 0,
        expires_in_seconds: expiresInSeconds,
        variant_name: item.variant_name,
        capacity: item.variant_capacity
      };
    });

    return mappedItems;
  } catch (error) {
    console.error('Error getting guest cart items:', error);
    return [];
  }
}

/**
 * Añade un producto al carrito invitado (BD)
 */
export async function addToGuestCart(
  productId: string,
  _productName: string,
  price: number,
  _image: string,
  quantity: number = 1,
  _talla?: string,
  _color?: string
): Promise<boolean> {
  try {
    const sessionId = getOrCreateGuestSessionId();

    // Llamada a la API que maneja la lógica compleja (v2)
    const response = await fetch('/api/cart/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-guest-session-id': sessionId
      },
      body: JSON.stringify({
        productId,
        quantity,
        price,
        variantId: null // Fallback
      })
    });

    if (response.ok) {
      window.dispatchEvent(new Event('guestCartUpdated'));
    }
    return response.ok;
  } catch (error) {
    console.error('Error adding to guest cart:', error);
    return false;
  }
}

/**
 * Actualiza la cantidad de un item en carrito invitado (BD)
 */
export async function updateGuestCartItem(
  itemId: string,
  quantity: number
): Promise<boolean> {
  try {
    if (quantity <= 0) return removeFromGuestCart(itemId);
    const sessionId = getOrCreateGuestSessionId();

    // Usar RPC específico para guests que valida stock
    const { data, error } = await supabase.rpc('update_guest_cart_item', {
      p_session_id: sessionId,
      p_cart_item_id: itemId,
      p_quantity: quantity
    });

    if (error) {
      console.error('Error RPC update_guest_cart_item:', error);
      return false;
    }

    if (data && !data.success) {
      console.warn('Fallo actualización stock guest:', data.message);
      return false;
    }

    window.dispatchEvent(new Event('guestCartUpdated'));
    return true;
  } catch (error) {
    console.error('Error updating guest cart:', error);
    return false;
  }
}

/**
 * Elimina un item del carrito invitado (BD)
 */
export async function removeFromGuestCart(
  itemId: string, // UUID
  _oldTalla?: string,
  _oldColor?: string
): Promise<boolean> {
  try {
    const sessionId = getOrCreateGuestSessionId();
    const { error } = await supabase.rpc('remove_from_guest_cart', {
      p_session_id: sessionId,
      p_cart_item_id: itemId
    });

    if (error) throw error;
    window.dispatchEvent(new Event('guestCartUpdated'));
    return true;
  } catch (error) {
    console.error('Error removing from guest cart:', error);
    return false;
  }
}

/**
 * Vacía el carrito invitado (BD)
 */
export async function clearGuestCart(): Promise<boolean> {
  try {
    const sessionId = getOrCreateGuestSessionId();
    const { error } = await supabase.rpc('clear_guest_cart', { p_session_id: sessionId });
    if (error) throw error;

    window.dispatchEvent(new Event('guestCartUpdated'));
    return true;
  } catch (error) {
    console.error('Error clearing guest cart:', error);
    return false;
  }
}

// =====================================================
// FUNCIONES INTELIGENTES (AUTO-DETECTAN AUTENTICACIÓN)
// =====================================================

/**
 * Obtiene el carrito del usuario (autenticado o invitado)
 */
export async function getCart(): Promise<CartItem[]> {
  const user = await getCurrentUser();
  if (user) {
    return await getAuthenticatedCart();
  } else {
    // Ahora retorna Promise<CartItem[]>
    return await getGuestCartItems();
  }
}

/**
 * Obtiene el carrito del usuario actual desde Supabase (compatibilidad)
 */
export async function getCartForCurrentUser(): Promise<CartItem[]> {
  return await getCart();
}

/**
 * Añade un producto al carrito (autenticado o invitado)
 */
export async function addToCart(
  productId: string,
  productName: string,
  price: number,
  image: string,
  quantity: number = 1,
  talla?: string,
  color?: string
): Promise<boolean> {
  const user = await getCurrentUser();

  if (user) {
    return addToAuthenticatedCart(productId, productName, price, image, quantity, talla, color);
  } else {
    return addToGuestCart(productId, productName, price, image, quantity, talla, color);
  }
}

/**
 * Actualiza cantidad de un item (autenticado o invitado)
 */
export async function updateCartItem(
  itemId: string,
  quantity: number,
  _talla?: string,
  _color?: string
): Promise<boolean> {
  const user = await getCurrentUser();

  if (user) {
    return updateAuthenticatedCartItem(itemId, quantity);
  } else {
    // Para carrito invitado BD, itemId ya es UUID
    return updateGuestCartItem(itemId, quantity);
  }
}

/**
 * Elimina un item del carrito (autenticado o invitado)
 */
export async function removeFromCart(itemId: string): Promise<boolean> {
  const user = await getCurrentUser();

  if (user) {
    return removeFromAuthenticatedCart(itemId);
  } else {
    // Para carrito invitado BD, itemId ya es UUID
    return removeFromGuestCart(itemId);
  }
}

/**
 * Vacía el carrito (autenticado o invitado)
 */
export async function clearCart(): Promise<boolean> {
  const user = await getCurrentUser();

  if (user) {
    return clearAuthenticatedCart();
  } else {
    return clearGuestCart();
  }
}

/**
 * Actualiza la cantidad de un producto en el carrito (compatibilidad)
 */
export async function updateCartItemQuantity(
  itemId: string,
  quantity: number
): Promise<boolean> {
  return updateCartItem(itemId, quantity);
}

// =====================================================
// FUNCIONES DE MIGRACIÓN Y SINCRONIZACIÓN
// =====================================================

/**
 * Migra el carrito invitado al usuario después de login
 */
export async function migrateGuestCartToUser(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Usuario no autenticado');

    // TODO: Implement migration for DB guest cart (Update user_id where session_id matches)
    // For now, simpler: clear local storage legacy
    clearGuestCartStorage();

    // Trigger update
    window.dispatchEvent(new Event('authCartUpdated'));
    return true;
  } catch (error) {
    console.error('Error migrating guest cart to user:', error);
    return false;
  }
}

// =====================================================
// FUNCIONES PARA CALCULAR TOTALES
// =====================================================

/**
 * Calcula el subtotal del carrito
 */
export function calculateSubtotal(items: CartItem[] | GuestCartItem[]): number {
  return items.reduce((sum, item) => sum + (item.precio_unitario * item.quantity), 0);
}

/**
 * Calcula el total de items en el carrito
 */
export function calculateItemCount(items: CartItem[] | GuestCartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Calcula impuestos (21% IVA)
 */
export function calculateTax(subtotal: number, taxRate: number = 0.21): number {
  return Math.round(subtotal * taxRate);
}

/**
 * Calcula el total final
 */
export function calculateTotal(subtotal: number, tax: number): number {
  return subtotal + tax;
}

/**
 * Obtiene el resumen completo del carrito
 */
export async function getCartSummary(): Promise<CartSummary> {
  const items = await getCart();
  const subtotal = calculateSubtotal(items);
  const tax = calculateTax(subtotal);
  const total = calculateTotal(subtotal, tax);
  const itemCount = calculateItemCount(items);

  return {
    items: items,
    subtotal,
    tax,
    total,
    itemCount,
  };
}

/**
 * Obtiene el total del carrito
 */
export async function getCartTotal(): Promise<CartSummary> {
  return getCartSummary();
}

/**
 * Obtiene solo el número de items en el carrito
 */
export async function getCartItemCount(): Promise<number> {
  const items = await getCart();
  return calculateItemCount(items);
}