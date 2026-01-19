import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

// Tipos para respuestas RPC
interface ReservationResponse {
  success: boolean;
  message?: string;
}

interface ReservationItem {
  id: string;
  producto_id: string;
  quantity: number;
  expires_at: string;
}

// GET: Obtiene las reservas del usuario actual (solo usuarios autenticados)
export const GET: APIRoute = async (context) => {
  try {
    // Obtener token del header
    const authHeader = context.request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return new Response(
        JSON.stringify({ 
          success: true,
          reservas: [],
          count: 0 
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Crear cliente con el token del usuario
    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Obtener todas las reservas del usuario
    const { data: reservas, error } = await supabase
      .rpc('get_user_cart_reservations') as { data: ReservationItem[] | null; error: any };

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        reservas: reservas || [],
        count: (reservas || []).length 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error getting reservations:', error);
    return new Response(
      JSON.stringify({ error: 'Error al obtener reservas' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// POST: Crea una nueva reserva (requiere autenticación)
export const POST: APIRoute = async (context) => {
  try {
    // Obtener token del header
    const authHeader = context.request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Debes iniciar sesión para reservar productos',
          guest: true 
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await context.request.json();
    const { producto_id, quantity } = body;

    if (!producto_id || !quantity || quantity <= 0) {
      return new Response(
        JSON.stringify({ error: 'Campos requeridos faltantes' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Crear cliente con el token del usuario
    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Crear reserva usando función RPC
    const { data: result, error } = await supabase
      .rpc('create_cart_reservation', {
        p_product_id: producto_id,
        p_quantity: quantity
      } as any) as { data: ReservationResponse[] | null; error: any };

    if (error) {
      console.error('Error creating reservation:', error);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: error.message || 'Error al crear la reserva' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const firstResult = result?.[0];
    if (firstResult && !firstResult.success) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: firstResult.message 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Reserva creada correctamente',
        producto_id,
        quantity,
        expires_in_minutes: 1
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating reservation:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// PUT: Actualiza una reserva existente
export const PUT: APIRoute = async (context) => {
  try {
    // Obtener token del header
    const authHeader = context.request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'No authenticated' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await context.request.json();
    const { producto_id, quantity } = body;

    if (!producto_id || !quantity || quantity <= 0) {
      return new Response(
        JSON.stringify({ error: 'Campos requeridos faltantes' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Crear cliente con el token del usuario
    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Actualizar reserva (usar la misma función de creación que maneja ON CONFLICT)
    const { data: result, error } = await supabase
      .rpc('create_cart_reservation', {
        p_product_id: producto_id,
        p_quantity: quantity
      } as any) as { data: ReservationResponse[] | null; error: any };

    if (error) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: error.message 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const updateResult = result?.[0];
    if (updateResult && !updateResult.success) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: updateResult.message 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Reserva actualizada correctamente',
        producto_id,
        quantity
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating reservation:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// DELETE: Elimina una reserva
export const DELETE: APIRoute = async (context) => {
  try {
    // Obtener token del header
    const authHeader = context.request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'No authenticated' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await context.request.json();
    const { producto_id } = body;

    if (!producto_id) {
      return new Response(
        JSON.stringify({ error: 'ID del producto requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Crear cliente con el token del usuario
    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Eliminar reserva
    const { error } = await supabase
      .rpc('delete_cart_reservation', {
        p_product_id: producto_id
      } as any);

    if (error) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: error.message 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Reserva eliminada correctamente',
        producto_id
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error deleting reservation:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
