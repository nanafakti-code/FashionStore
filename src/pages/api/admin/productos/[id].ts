import type { APIRoute } from 'astro';
import { supabase } from '@/lib/supabase';
import { getAdminTokenFromCookie, verifyAdminSessionToken } from '@/lib/admin-auth';

/**
 * Verificar autenticación del admin
 */
function verifyAdminAuth(request: Request): boolean {
  const cookieHeader = request.headers.get('cookie') || '';
  const token = getAdminTokenFromCookie(cookieHeader);
  
  if (!token) return false;
  
  const session = verifyAdminSessionToken(token);
  return !!session;
}

/**
 * GET - Obtener un producto específico
 */
export const GET: APIRoute = async ({ params, request }) => {
  if (!verifyAdminAuth(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { id } = params;

  try {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(data), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * PUT - Actualizar un producto
 */
export const PUT: APIRoute = async ({ params, request }) => {
  if (!verifyAdminAuth(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { id } = params;

  try {
    const body = await request.json();
    
    const { nombre, precio_venta, descripcion, stock_total } = body;

    const updateData: any = {};
    if (nombre !== undefined) updateData.nombre = nombre;
    if (precio_venta !== undefined) updateData.precio_venta = Math.round(precio_venta * 100); // Convertir a céntimos
    if (descripcion !== undefined) updateData.descripcion = descripcion;
    if (stock_total !== undefined) updateData.stock_total = stock_total;
    if (Object.keys(updateData).length === 0) {
      return new Response(JSON.stringify({ error: 'No fields to update' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { data, error } = await supabase
      .from('productos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(data), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * DELETE - Eliminar (soft delete) un producto
 */
export const DELETE: APIRoute = async ({ params, request }) => {
  if (!verifyAdminAuth(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { id } = params;

  try {
    // Soft delete: marcar como inactivo
    const { data, error } = await supabase
      .from('productos')
      .update({ activo: false })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, data }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
