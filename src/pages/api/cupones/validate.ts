import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const POST: APIRoute = async ({ request }) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { codigo, subtotal } = await request.json();

    if (!codigo) {
      return new Response(
        JSON.stringify({ valid: false, message: 'Código de cupón requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Buscar el cupón
    const { data: cupon, error: cuponError } = await supabase
      .from('cupones_descuento')
      .select('*')
      .eq('codigo', codigo.toUpperCase())
      .eq('activo', true)
      .single();

    if (cuponError || !cupon) {
      return new Response(
        JSON.stringify({ valid: false, message: 'Cupón no encontrado o inactivo' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar fechas
    const now = new Date();
    if (cupon.fecha_inicio && new Date(cupon.fecha_inicio) > now) {
      return new Response(
        JSON.stringify({ valid: false, message: 'El cupón aún no está activo' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (cupon.fecha_fin && new Date(cupon.fecha_fin) < now) {
      return new Response(
        JSON.stringify({ valid: false, message: 'El cupón ha expirado' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar límite de usos
    if (cupon.maximo_uses && cupon.usos_actuales >= cupon.maximo_uses) {
      return new Response(
        JSON.stringify({ valid: false, message: 'El cupón ha alcanzado su límite de usos' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar mínimo de compra
    if (cupon.minimo_compra && subtotal < cupon.minimo_compra) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          message: `Compra mínima requerida: ${(cupon.minimo_compra / 100).toFixed(2)}€` 
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Calcular descuento
    let descuento_calculado = 0;
    if (cupon.tipo === 'Porcentaje') {
      descuento_calculado = Math.round((subtotal * cupon.valor) / 100);
    } else {
      // Cantidad fija (valor está en euros, convertir a céntimos)
      descuento_calculado = Math.min(cupon.valor * 100, subtotal);
    }

    return new Response(
      JSON.stringify({
        valid: true,
        message: '¡Cupón aplicado correctamente!',
        tipo: cupon.tipo,
        valor: cupon.valor,
        descuento_calculado,
        cupon_id: cupon.id
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error validating coupon:', error);
    return new Response(
      JSON.stringify({ valid: false, message: 'Error al validar el cupón' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
