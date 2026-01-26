/**
 * API ENDPOINT: ENVIAR EMAIL DE BIENVENIDA
 * ==========================================
 * Envía un email de bienvenida a nuevos usuarios registrados
 * Muestra productos destacados y ofertas especiales
 */

import type { APIRoute } from 'astro';
import { sendWelcomeEmail } from '@/lib/emailService';
import { createClient } from '@supabase/supabase-js';

// Crear cliente de Supabase
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export const POST: APIRoute = async ({ request }) => {
    try {
        console.log('[WELCOME-EMAIL] Recibida petición de email de bienvenida');

        // Parsear body
        const body = await request.json();
        const { email, nombre } = body;

        // Validar datos
        if (!email || !nombre) {
            console.error('[WELCOME-EMAIL] ❌ Faltan datos requeridos');
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Email y nombre son requeridos',
                }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.error('[WELCOME-EMAIL] ❌ Email inválido:', email);
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Formato de email inválido',
                }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        console.log(`[WELCOME-EMAIL] Enviando email de bienvenida a: ${email}`);
        console.log(`[WELCOME-EMAIL] Nombre del usuario: ${nombre}`);

        // Obtener productos destacados de la base de datos
        console.log('[WELCOME-EMAIL] Obteniendo productos destacados de la BD...');
        const { data: productos, error: productosError } = await supabase
            .from('productos')
            .select(`
        id,
        nombre,
        descripcion,
        precio_venta,
        precio_original,
        destacado,
        imagenes_producto (
          url,
          es_principal
        )
      `)
            .eq('activo', true)
            .eq('destacado', true)
            .limit(3);

        if (productosError) {
            console.error('[WELCOME-EMAIL] Error al obtener productos:', productosError);
        }

        // Formatear productos para el email
        const productosFormateados = productos?.map(p => ({
            nombre: p.nombre,
            descripcion: p.descripcion || 'Producto destacado',
            precio_venta: p.precio_venta,
            precio_original: p.precio_original,
            imagen: p.imagenes_producto?.find((img: any) => img.es_principal)?.url ||
                p.imagenes_producto?.[0]?.url ||
                undefined
        })) || [];

        console.log(`[WELCOME-EMAIL] Productos obtenidos: ${productosFormateados.length}`);

        // Enviar email de bienvenida con productos
        const emailSent = await sendWelcomeEmail(email, nombre, productosFormateados);

        if (emailSent) {
            console.log(`[WELCOME-EMAIL] ✅ Email de bienvenida enviado exitosamente a ${email}`);
            return new Response(
                JSON.stringify({
                    success: true,
                    message: 'Email de bienvenida enviado correctamente',
                }),
                {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        } else {
            console.error(`[WELCOME-EMAIL] ❌ Error al enviar email a ${email}`);
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Error al enviar el email de bienvenida',
                }),
                {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }
    } catch (error) {
        console.error('[WELCOME-EMAIL] ❌ Error en endpoint:', error);
        return new Response(
            JSON.stringify({
                success: false,
                error: 'Error interno del servidor',
                details: error instanceof Error ? error.message : String(error),
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
};
