import type { APIRoute } from 'astro';
import { sendContactFormEmail } from '@/lib/emailService';

export const POST: APIRoute = async ({ request }) => {
    try {
        const data = await request.json();
        const { nombre, email, asunto, mensaje } = data;

        // Validación básica
        if (!nombre || !email || !asunto || !mensaje) {
            return new Response(
                JSON.stringify({ error: 'Todos los campos son obligatorios' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Enviar email
        const success = await sendContactFormEmail(nombre, email, asunto, mensaje);

        if (success) {
            return new Response(
                JSON.stringify({ message: 'Mensaje enviado correctamente' }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        } else {
            return new Response(
                JSON.stringify({ error: 'Error al enviar el email' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

    } catch (error) {
        console.error('API Contact Error:', error);
        return new Response(
            JSON.stringify({ error: 'Error interno del servidor' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
