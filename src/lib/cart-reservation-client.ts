/**
 * Cliente para gestionar reservas de carrito
 * Proporciona métodos para crear, actualizar, eliminar y consultar reservas
 */

export interface CartReservation {
  id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  expires_at: string;
  expires_in_seconds: number;
}

export interface ReservationResponse {
  success: boolean;
  message?: string;
  error?: string;
  reservas?: CartReservation[];
  count?: number;
  expires_in_minutes?: number;
}

export class CartReservationClient {
  private baseUrl = '/api/reservas';
  private cleanupUrl = '/api/cleanup-expired-reservations';

  /**
   * Obtiene todas las reservas del usuario actual
   */
  async getReservations(): Promise<CartReservation[]> {
    try {
      const response = await fetch(this.baseUrl);

      if (!response.ok) {
        if (response.status === 401) {
          console.warn('Usuario no autenticado');
          return [];
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ReservationResponse = await response.json();
      return data.reservas || [];
    } catch (error) {
      console.error('Error fetching reservations:', error);
      throw error;
    }
  }

  /**
   * Obtiene el tiempo restante para una reserva específica
   */
  async getReservationTimeRemaining(productId: string): Promise<number> {
    try {
      const reservations = await this.getReservations();
      const reservation = reservations.find(r => r.product_id === productId);
      return reservation?.expires_in_seconds ?? -1;
    } catch (error) {
      console.error('Error getting reservation time:', error);
      return -1;
    }
  }

  /**
   * Crea una nueva reserva para un producto
   */
  async createReservation(productId: string, quantity: number): Promise<boolean> {
    try {
      // Importar auth para obtener el token
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();

      const headers: any = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          producto_id: productId,
          quantity: quantity
        })
      });

      if (!response.ok) {
        const data: ReservationResponse = await response.json();
        console.error('Reservation error:', data.error);
        return false;
      }

      const data: ReservationResponse = await response.json();
      console.log('Reservation created:', data.message);
      return data.success;
    } catch (error) {
      console.error('Error creating reservation:', error);
      throw error;
    }
  }

  /**
   * Actualiza la cantidad de una reserva existente
   */
  async updateReservation(productId: string, quantity: number): Promise<boolean> {
    try {
      // Importar auth para obtener el token
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();

      const headers: any = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(this.baseUrl, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          producto_id: productId,
          quantity: quantity
        })
      });

      if (!response.ok) {
        const data: ReservationResponse = await response.json();
        console.error('Update error:', data.error);
        return false;
      }

      const data: ReservationResponse = await response.json();
      console.log('Reservation updated:', data.message);
      return data.success;
    } catch (error) {
      console.error('Error updating reservation:', error);
      throw error;
    }
  }

  /**
   * Elimina una reserva (restaura el stock)
   */
  async deleteReservation(productId: string): Promise<boolean> {
    try {
      // Importar auth para obtener el token
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();

      const headers: any = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(this.baseUrl, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ producto_id: productId })
      });

      if (!response.ok) {
        const data: ReservationResponse = await response.json();
        console.error('Delete error:', data.error);
        return false;
      }

      const data: ReservationResponse = await response.json();
      console.log('Reservation deleted:', data.message);
      return data.success;
    } catch (error) {
      console.error('Error deleting reservation:', error);
      throw error;
    }
  }

  /**
   * Verifica si un producto tiene reserva activa
   */
  async isProductReserved(productId: string): Promise<boolean> {
    try {
      const reservations = await this.getReservations();
      const reserved = reservations.some(r => r.product_id === productId && r.expires_in_seconds > 0);
      return reserved;
    } catch (error) {
      console.error('Error checking reservation:', error);
      return false;
    }
  }

  /**
   * Obtiene la cantidad reservada para un producto
   */
  async getReservedQuantity(productId: string): Promise<number> {
    try {
      const reservations = await this.getReservations();
      const reservation = reservations.find(r => r.product_id === productId);
      return reservation?.quantity ?? 0;
    } catch (error) {
      console.error('Error getting reserved quantity:', error);
      return 0;
    }
  }

  /**
   * Limpia manualmente las reservas expiradas (admin)
   * Requiere CRON_SECRET token
   */
  async cleanupExpiredReservations(token?: string): Promise<boolean> {
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(this.cleanupUrl, {
        method: 'POST',
        headers
      });

      if (!response.ok) {
        console.error(`Cleanup failed with status ${response.status}`);
        return false;
      }

      const data = await response.json();
      console.log(`Cleanup completed: ${data.items_cleaned} items cleaned, ${data.stock_restored} stock restored`);
      return true;
    } catch (error) {
      console.error('Error cleaning up reservations:', error);
      throw error;
    }
  }

  /**
   * Verifica el estado de reservas expiradas (admin)
   */
  async checkExpiredReservations(token?: string): Promise<any> {
    try {
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(this.cleanupUrl, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error checking expired reservations:', error);
      throw error;
    }
  }
}

// Instancia global
export const reservationClient = new CartReservationClient();
