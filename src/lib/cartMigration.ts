import { supabase } from './supabase';
import { getCurrentUser } from './auth';
import type { CartItem } from './cartService';

/**
 * Migra el carrito local a la base de datos cuando el usuario inicia sesión
 */
export async function migrateLocalCartToDatabase(): Promise<void> {
  try {
    // Obtener carrito local
    if (typeof window === 'undefined') return;

    const localCart = localStorage.getItem('fashionstore_cart_local');
    if (!localCart) return;

    const cart: CartItem[] = JSON.parse(localCart);
    if (cart.length === 0) {
      localStorage.removeItem('fashionstore_cart_local');
      return;
    }

    // Obtener usuario actual
    const user = await getCurrentUser();
    if (!user) return;

    // Obtener o crear carrito del usuario
    let { data: carritoData } = await supabase
      .from('carrito')
      .select('id')
      .eq('usuario_id', user.id)
      .single();

    if (!carritoData) {
      const { data: newCarrito, error } = await supabase
        .from('carrito')
        .insert({ usuario_id: user.id })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating cart:', error);
        return;
      }
      carritoData = newCarrito;
    }

    // Migrar cada item del carrito local
    for (const item of cart) {
      try {
        // Verificar si el producto ya está en el carrito
        const { data: existingItem } = await supabase
          .from('carrito_items')
          .select('id, cantidad')
          .eq('carrito_id', carritoData.id)
          .eq('producto_id', item.id)
          .single();

        if (existingItem) {
          // Actualizar cantidad
          await supabase
            .from('carrito_items')
            .update({ cantidad: existingItem.cantidad + item.quantity })
            .eq('id', existingItem.id);
        } else {
          // Crear nuevo item
          await supabase
            .from('carrito_items')
            .insert({
              carrito_id: carritoData.id,
              producto_id: item.id,
              cantidad: item.quantity,
              talla: item.talla || null,
              color: item.color || null,
              precio_unitario: (item as any).precio_unitario || (item as any).price || 0,
            });
        }
      } catch (error) {
        console.error(`Error migrating cart item ${item.id}:`, error);
      }
    }

    // Limpiar carrito local después de migrar
    localStorage.removeItem('fashionstore_cart_local');

    // Disparar evento para actualizar el carrito en la UI
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: {} }));
  } catch (error) {
    console.error('Error migrating local cart:', error);
  }
}

/**
 * Sincroniza el carrito cuando el usuario cambia
 */
export async function syncCartOnAuthChange(): Promise<void> {
  try {
    const user = await getCurrentUser();

    if (user) {
      // Usuario acaba de iniciar sesión, migrar carrito local
      await migrateLocalCartToDatabase();
    }
  } catch (error) {
    console.error('Error syncing cart:', error);
  }
}
