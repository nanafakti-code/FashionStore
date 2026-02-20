/**
 * API ENDPOINT: ENVIAR EMAIL DE BIENVENIDA
 * ==========================================
 * Envía un email de bienvenida a nuevos usuarios registrados
 * Muestra productos destacados y ofertas especiales
 */

import type { APIRoute } from 'astro';
import { sendWelcomeEmail } from '@/lib/emailService';

export const POST: APIRoute = async ({ request }) => {
    try {
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
            console.error('[WELCOME-EMAIL] ❌ Email inválido:');
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
        // Enviar email de bienvenida
        const emailSent = await sendWelcomeEmail(email, nombre);

        if (emailSent) {
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
        console.error('[WELCOME-EMAIL] ❌ Error en endpoint:');
        return new Response(
            JSON.stringify({
                success: false,
                error: 'Error interno del servidor',
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
};
