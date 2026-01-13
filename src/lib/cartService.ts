import { supabase } from './supabase';
import { getCurrentUser } from './auth';

export interface CartItem {
  id: string;
  carrito_item_id: string;
  producto_id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  talla?: string;
  color?: string;
}

/**
 * Obtiene el carrito del usuario actual desde Supabase o localStorage
 */
export async function getCartForCurrentUser(): Promise<CartItem[]> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      // Si no hay usuario, devolver carrito local
      return getLocalCart();
    }

    // Obtener carrito del usuario
    const { data: carritoData, error: carritoError } = await supabase
      .from('carrito')
      .select('id')
      .eq('usuario_id', user.id)
      .single();

    if (carritoError && carritoError.code !== 'PGRST116') {
      console.error('Error fetching cart:', carritoError);
      return getLocalCart();
    }

    if (!carritoData) {
      // Carrito no existe, devolver vacío
      return [];
    }

    // Obtener items del carrito
    const { data: itemsData, error: itemsError } = await supabase
      .from('carrito_items')
      .select(`
        id,
        cantidad,
        talla,
        color,
        precio_unitario,
        productos:producto_id (
          id,
          nombre,
          imagen_principal
        )
      `)
      .eq('carrito_id', carritoData.id);

    if (itemsError) {
      console.error('Error fetching cart items:', itemsError);
      return getLocalCart();
    }

    // Mapear datos
    const cartItems: CartItem[] = (itemsData || []).map((item: any) => ({
      id: item.productos.id,
      carrito_item_id: item.id,
      producto_id: item.productos.id,
      name: item.productos.nombre,
      price: item.precio_unitario,
      image: item.productos.imagen_principal,
      quantity: item.cantidad,
      talla: item.talla,
      color: item.color,
    }));

    return cartItems;
  } catch (error) {
    console.error('Error in getCartForCurrentUser:', error);
    return getLocalCart();
  }
}

/**
 * Añade un producto al carrito
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
  try {
    // Siempre usar carrito local en el cliente - simplifica la lógica
    addToLocalCart(productId, productName, price, image, quantity);
    
    // Intentar sincronizar con la BD si hay usuario autenticado
    try {
      const user = await getCurrentUser();
      if (!user) {
        return true; // Guardado en localStorage, está bien
      }

      // Obtener o crear carrito del usuario
      let carritoData = await getOrCreateUserCart(user.id);
      if (!carritoData) {
        return true; // Fallback al localStorage ya funcionó
      }

      // Verificar si el producto ya está en el carrito de la BD
      const { data: existingItem } = await supabase
        .from('carrito_items')
        .select('id, cantidad')
        .eq('carrito_id', carritoData.id)
        .eq('producto_id', productId)
        .single();

      if (existingItem) {
        // Actualizar cantidad
        await supabase
          .from('carrito_items')
          .update({ cantidad: existingItem.cantidad + quantity })
          .eq('id', existingItem.id);
      } else {
        // Crear nuevo item
        await supabase
          .from('carrito_items')
          .insert({
            carrito_id: carritoData.id,
            producto_id: productId,
            cantidad: quantity,
            talla: talla || null,
            color: color || null,
            precio_unitario: price,
          });
      }
    } catch (dbError) {
      // Si hay error en BD, no importa - el carrito local ya está guardado
      console.warn('DB sync failed, using local cart:', dbError);
    }

    return true;
  } catch (error) {
    console.error('Error adding to cart:', error);
    return false;
  }
}

/**
 * Actualiza la cantidad de un producto en el carrito
 */
export async function updateCartItemQuantity(
  carritoItemId: string,
  quantity: number
): Promise<boolean> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      // Carrito local
      updateLocalCartQuantity(carritoItemId, quantity);
      return true;
    }

    if (quantity <= 0) {
      // Eliminar item
      return removeFromCart(carritoItemId);
    }

    const { error } = await supabase
      .from('carrito_items')
      .update({ cantidad: quantity })
      .eq('id', carritoItemId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating cart item:', error);
    return false;
  }
}

/**
 * Elimina un producto del carrito
 */
export async function removeFromCart(carritoItemId: string): Promise<boolean> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      // Carrito local
      removeFromLocalCart(carritoItemId);
      return true;
    }

    const { error } = await supabase
      .from('carrito_items')
      .delete()
      .eq('id', carritoItemId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error removing from cart:', error);
    return false;
  }
}

/**
 * Vacía el carrito del usuario
 */
export async function clearCart(): Promise<boolean> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      clearLocalCart();
      return true;
    }

    const carritoData = await getOrCreateUserCart(user.id);
    if (!carritoData) return false;

    const { error } = await supabase
      .from('carrito_items')
      .delete()
      .eq('carrito_id', carritoData.id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error clearing cart:', error);
    return false;
  }
}

/**
 * Obtiene o crea el carrito de un usuario
 */
async function getOrCreateUserCart(userId: string): Promise<{ id: string } | null> {
  try {
    // Buscar carrito existente
    let { data: carritoData } = await supabase
      .from('carrito')
      .select('id')
      .eq('usuario_id', userId)
      .single();

    // Si no existe, crear uno
    if (!carritoData) {
      const { data: newCarrito, error } = await supabase
        .from('carrito')
        .insert({
          usuario_id: userId,
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating cart:', error);
        return null;
      }
      carritoData = newCarrito;
    }

    return carritoData;
  } catch (error) {
    console.error('Error in getOrCreateUserCart:', error);
    return null;
  }
}

// ============================================
// FUNCIONES DE CARRITO LOCAL (FALLBACK)
// ============================================

function getLocalCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const cart = localStorage.getItem('fashionstore_cart_local');
    return cart ? JSON.parse(cart) : [];
  } catch {
    return [];
  }
}

function addToLocalCart(
  productId: string,
  productName: string,
  price: number,
  image: string,
  quantity: number
): void {
  if (typeof window === 'undefined') return;

  const cart = getLocalCart();
  const existingItem = cart.find((item) => item.id === productId);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({
      id: productId,
      carrito_item_id: productId,
      producto_id: productId,
      name: productName,
      price,
      image,
      quantity,
    });
  }

  localStorage.setItem('fashionstore_cart_local', JSON.stringify(cart));
}

function updateLocalCartQuantity(itemId: string, quantity: number): void {
  if (typeof window === 'undefined') return;

  const cart = getLocalCart();
  const item = cart.find((i) => i.id === itemId);

  if (item) {
    item.quantity = quantity;
    localStorage.setItem('fashionstore_cart_local', JSON.stringify(cart));
  }
}

function removeFromLocalCart(itemId: string): void {
  if (typeof window === 'undefined') return;

  const cart = getLocalCart().filter((item) => item.id !== itemId);
  localStorage.setItem('fashionstore_cart_local', JSON.stringify(cart));
}

function clearLocalCart(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('fashionstore_cart_local');
}
