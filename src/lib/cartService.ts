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
}

// =====================================================
// CONSTANTES
// =====================================================

const GUEST_CART_KEY = 'fashionstore_guest_cart';
// const GUEST_SESSION_ID_KEY = 'fashionstore_session_id'; // No se utiliza en la implementación actual
const LOCAL_STORAGE_AVAILABLE = typeof window !== 'undefined' && !!window.localStorage;

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

/**
 * Obtiene o crea un ID de sesión para usuarios invitados
 * @deprecated - No se utiliza en la implementación actual
 */
/* function _getGuestSessionId(): string {
  if (!LOCAL_STORAGE_AVAILABLE) return '';
  
  let sessionId = localStorage.getItem(GUEST_SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(GUEST_SESSION_ID_KEY, sessionId);
  }
  return sessionId;
} */

/**
 * Obtiene el carrito invitado del localStorage o sessionStorage
 */
function getGuestCart(): GuestCartItem[] {
  if (!LOCAL_STORAGE_AVAILABLE) {
    console.warn('localStorage no disponible');
    return [];
  }
  
  try {
    console.log('Intentando leer carrito invitado...');
    console.log('Clave buscada:', GUEST_CART_KEY);
    console.log('Claves disponibles en localStorage:', Object.keys(localStorage));
    
    // Primero intentar localStorage
    let cart = localStorage.getItem(GUEST_CART_KEY);
    
    // Si no está en localStorage, intentar sessionStorage
    if (!cart && typeof sessionStorage !== 'undefined') {
      console.log('No encontrado en localStorage, intentando sessionStorage...');
      cart = sessionStorage.getItem(GUEST_CART_KEY);
      if (cart) {
        console.log('✓ Carrito encontrado en sessionStorage');
      }
    }
    
    if (!cart) {
      console.warn(`No se encontró "${GUEST_CART_KEY}" en localStorage ni sessionStorage`);
      // Intentar buscar con otros nombres posibles
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('cart') || key.includes('carrito'))) {
          console.log(`Encontrada clave alternativa: "${key}"`);
          const alternativeCart = localStorage.getItem(key);
          if (alternativeCart) {
            try {
              const parsed = JSON.parse(alternativeCart);
              if (Array.isArray(parsed)) {
                console.log(`Usando carrito alternativo de "${key}"`, parsed);
                return parsed;
              }
            } catch (e) {
              console.warn(`No se pudo parsear "${key}"`);
            }
          }
        }
      }
      return [];
    }
    
    const parsed = JSON.parse(cart);
    console.log('Carrito invitado parseado correctamente:', parsed);
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
  if (!LOCAL_STORAGE_AVAILABLE) {
    console.warn('localStorage no disponible para guardar carrito invitado');
    return;
  }
  
  try {
    console.log(`Guardando ${items.length} items en carrito invitado...`);
    const cartJSON = JSON.stringify(items);
    
    // Guardar en localStorage
    localStorage.setItem(GUEST_CART_KEY, cartJSON);
    console.log(`Carrito guardado en localStorage: "${GUEST_CART_KEY}"`);
    
    // TAMBIÉN guardar en sessionStorage como respaldo
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(GUEST_CART_KEY, cartJSON);
      console.log(`Carrito guardado en sessionStorage: "${GUEST_CART_KEY}"`);
    }
    
    console.log('Items guardados:', items);
    window.dispatchEvent(new Event('guestCartUpdated'));
  } catch (error) {
    console.error('Error saving guest cart to storage:', error);
  }
}

/**
 * Limpia localStorage del carrito invitado
 */
function clearGuestCartStorage(): void {
  if (!LOCAL_STORAGE_AVAILABLE) return;
  localStorage.removeItem(GUEST_CART_KEY);
}

// =====================================================
// FUNCIONES PARA CARRITO AUTENTICADO (BD)
// =====================================================

/**
 * Obtiene el carrito del usuario autenticado desde Supabase
 */
export async function getAuthenticatedCart(): Promise<CartItem[]> {
  try {
    console.log('Obteniendo carrito autenticado desde Supabase...');
    const user = await getCurrentUser();
    console.log('Usuario actual:', user?.id, user?.email);
    if (!user) {
      console.log('No hay usuario autenticado');
      return [];
    }

    const { data, error } = await supabase
      .rpc('get_user_cart');

    if (error) {
      console.error('Error fetching authenticated cart:', error);
      return [];
    }

    console.log('Datos del carrito autenticado:', data);

    // Mapear y validar datos
    const mappedData = (data || [])
      .filter((item: any) => item && item.id && item.product_id) // Filtrar items inválidos
      .map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name || 'Producto sin nombre',
        quantity: Math.max(1, item.quantity || 1),
        talla: item.talla || undefined,
        color: item.color || undefined,
        precio_unitario: item.precio_unitario || 0,
        product_image: item.product_image || '/placeholder.png', // Usar imagen por defecto si no existe
        product_stock: item.product_stock || 0,
        expires_in_seconds: item.expires_in_seconds && item.expires_in_seconds > 0 ? item.expires_in_seconds : 0,
      }));
    
    console.log('Carrito autenticado mapeado:', mappedData);
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

    // Construir query para buscar item existente
    let query = supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', user.id)
      .eq('product_id', productId);

    // Manejar talla y color correctamente (incluir NULL values)
    if (talla) {
      query = query.eq('talla', talla);
    } else {
      query = query.is('talla', null);
    }

    if (color) {
      query = query.eq('color', color);
    } else {
      query = query.is('color', null);
    }

    const { data: existingItems, error: selectError } = await query;

    if (selectError) throw selectError;

    const existingItem = existingItems?.[0];

    if (existingItem) {
      // Actualizar cantidad
      const { error: updateError } = await supabase
        .from('cart_items')
        .update({ 
          quantity: existingItem.quantity + quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingItem.id);

      if (updateError) throw updateError;
    } else {
      // Insertar nuevo item
      const { error: insertError } = await supabase
        .from('cart_items')
        .insert({
          user_id: user.id,
          product_id: productId,
          quantity,
          talla: talla || null,
          color: color || null,
          precio_unitario: price,
        });

      if (insertError) throw insertError;
    }

    window.dispatchEvent(new Event('authCartUpdated'));
    return true;
  } catch (error) {
    console.error('Error adding to authenticated cart:', error);
    return false;
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

    const { error } = await supabase
      .from('cart_items')
      .update({ 
        quantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .eq('user_id', user.id);

    if (error) throw error;

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

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId)
      .eq('user_id', user.id);

    if (error) throw error;

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

    const { error } = await supabase
      .rpc('clear_user_cart');

    if (error) throw error;

    window.dispatchEvent(new Event('authCartUpdated'));
    return true;
  } catch (error) {
    console.error('Error clearing authenticated cart:', error);
    return false;
  }
}

// =====================================================
// FUNCIONES PARA CARRITO INVITADO (LOCALSTORAGE)
// =====================================================

/**
 * Obtiene el carrito invitado del localStorage
 */
export function getGuestCartItems(): GuestCartItem[] {
  console.log('Obteniendo items del carrito invitado...');
  const items = getGuestCart();
  console.log(`Se obtuvieron ${items.length} items del carrito invitado`, items);
  return items;
}

/**
 * Añade un producto al carrito invitado
 */
export function addToGuestCart(
  productId: string,
  productName: string,
  price: number,
  image: string,
  quantity: number = 1,
  talla?: string,
  color?: string
): boolean {
  try {
    const cart = getGuestCart();
    
    // Buscar si el producto ya existe con las mismas características
    const existingIndex = cart.findIndex(
      item =>
        item.product_id === productId &&
        item.talla === talla &&
        item.color === color
    );

    if (existingIndex >= 0 && existingIndex < cart.length) {
      // Actualizar cantidad
      const existingItem = cart[existingIndex];
      if (existingItem) {
        existingItem.quantity += quantity;
      }
    } else {
      // Añadir nuevo item
      cart.push({
        product_id: productId,
        product_name: productName,
        quantity,
        talla,
        color,
        precio_unitario: price,
        product_image: image,
      });
    }

    saveGuestCart(cart);
    return true;
  } catch (error) {
    console.error('Error adding to guest cart:', error);
    return false;
  }
}

/**
 * Actualiza la cantidad de un item en carrito invitado
 */
export function updateGuestCartItem(
  productId: string,
  quantity: number,
  talla?: string,
  color?: string
): boolean {
  try {
    let cart = getGuestCart();

    if (quantity <= 0) {
      return removeFromGuestCart(productId, talla, color);
    }

    const index = cart.findIndex(
      item =>
        item.product_id === productId &&
        item.talla === talla &&
        item.color === color
    );

    if (index >= 0 && index < cart.length) {
      const itemToUpdate = cart[index];
      if (itemToUpdate) {
        itemToUpdate.quantity = quantity;
        saveGuestCart(cart);
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error updating guest cart item:', error);
    return false;
  }
}

/**
 * Elimina un item del carrito invitado
 */
export function removeFromGuestCart(
  productId: string,
  talla?: string,
  color?: string
): boolean {
  try {
    let cart = getGuestCart();

    cart = cart.filter(
      item =>
        !(
          item.product_id === productId &&
          item.talla === talla &&
          item.color === color
        )
    );

    saveGuestCart(cart);
    return true;
  } catch (error) {
    console.error('Error removing from guest cart:', error);
    return false;
  }
}

/**
 * Vacía completamente el carrito invitado
 */
export function clearGuestCart(): boolean {
  try {
    clearGuestCartStorage();
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
export async function getCart(): Promise<CartItem[] | GuestCartItem[]> {
  console.log('=== INICIANDO getCart ===');
  const user = await getCurrentUser();
  console.log('Usuario actual:', user);
  
  if (user) {
    console.log('Usuario autenticado, obteniendo carrito de BD...');
    const cartItems = await getAuthenticatedCart();
    console.log('Carrito autenticado:', cartItems);
    return cartItems;
  } else {
    console.log('Usuario no autenticado, obteniendo carrito invitado...');
    const guestItems = getGuestCartItems();
    console.log('Carrito invitado:', guestItems);
    return guestItems;
  }
}

/**
 * Obtiene el carrito del usuario actual desde Supabase (compatibilidad)
 */
export async function getCartForCurrentUser(): Promise<CartItem[]> {
  const result = await getCart();
  return result as CartItem[];
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
  talla?: string,
  color?: string
): Promise<boolean> {
  const user = await getCurrentUser();
  
  if (user) {
    return updateAuthenticatedCartItem(itemId, quantity);
  } else {
    return updateGuestCartItem(itemId, quantity, talla, color);
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
    // Para carrito invitado, itemId es product_id
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

    const guestCart = getGuestCart();
    if (guestCart.length === 0) {
      clearGuestCartStorage();
      return true;
    }

    // Convertir a formato esperado por la función RPC
    const guestItems = guestCart.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity,
      talla: item.talla || null,
      color: item.color || null,
      precio_unitario: item.precio_unitario,
    }));

    // Llamar a la función RPC de Supabase
    const { error } = await supabase
      .rpc('migrate_guest_cart_to_user', {
        guest_items: guestItems,
      });

    if (error) throw error;

    // Limpiar localStorage después de migración exitosa
    clearGuestCartStorage();
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
  const items = await getCart() as CartItem[] | GuestCartItem[];
  const subtotal = calculateSubtotal(items);
  const tax = calculateTax(subtotal);
  const total = calculateTotal(subtotal, tax);
  const itemCount = calculateItemCount(items);

  return {
    items: items as CartItem[],
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
  return calculateItemCount(items as CartItem[] | GuestCartItem[]);
}