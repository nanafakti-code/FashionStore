import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const POST: APIRoute = async ({ request }) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { codigo, subtotal, userId } = await request.json();

    if (!codigo) {
      return new Response(
        JSON.stringify({ valid: false, message: 'Código de cupón requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[API] Validating coupon:', { codigo, userId, subtotal });

    // Call the RPC that handles all validation logic (dates, limits, ownership, etc.)
    const { data: result, error } = await supabase
      .rpc('validate_coupon', {
        p_codigo: codigo.toUpperCase(),
        p_subtotal: subtotal, // Corrected parameter name from p_monto_total to p_subtotal
        p_usuario_id: userId || null // We will update the RPC to accept this
      });

    if (error) {
      console.error('[API] RPC Error:', error);
      throw error;
    }

    console.log('[API] RPC Result:', result);

    // RPC with RETURNS TABLE returns an array. Get the first item.
    const validationResult = Array.isArray(result) ? result[0] : result;

    if (!validationResult || !validationResult.valid) {
      return new Response(
        JSON.stringify({ valid: false, message: validationResult?.message || 'Cupón inválido' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Success
    return new Response(
      JSON.stringify({
        valid: true,
        message: validationResult.message || '¡Cupón aplicado correctamente!',
        tipo: validationResult.tipo,
        valor: validationResult.valor,
        descuento_calculado: validationResult.descuento_calculado, // The RPC returns the calculated discount amount as 'descuento_calculado'
        cupon_id: validationResult.cupon_id
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error validating coupon:', error);
    return new Response(
      JSON.stringify({ valid: false, message: 'Error interno al validar el cupón' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
