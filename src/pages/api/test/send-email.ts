/**
 * ENDPOINT DE PRUEBA - ENVÍO DE EMAIL
 * ====================================
 * Para testear si el servicio de email funciona
 * 
 * Uso:
 * GET /api/test/send-email?to=tu-email@gmail.com
 */

import type { APIRoute } from 'astro';
import { sendEmail } from '@/lib/emailService';

export const GET: APIRoute = async (context) => {
  try {
    const to = context.url.searchParams.get('to') || 'test@example.com';
    
    console.log('\n[TEST EMAIL] ========================================');
    console.log(`[TEST EMAIL] Intentando enviar email de prueba a: ${to}`);
    console.log('[TEST EMAIL] ========================================\n');

    // Variables de entorno
    const smtpUser = import.meta.env.SMTP_USER;
    const smtpPass = import.meta.env.SMTP_PASS;
    const adminEmail = import.meta.env.ADMIN_EMAIL;

    console.log('[TEST EMAIL] Verificando configuración:');
    console.log(`  SMTP_USER: ${smtpUser ? '✓ Configurado' : '✗ NO CONFIGURADO'}`);
    console.log(`  SMTP_PASS: ${smtpPass ? '✓ Configurado' : '✗ NO CONFIGURADO'}`);
    console.log(`  ADMIN_EMAIL: ${adminEmail ? `✓ ${adminEmail}` : '✗ NO CONFIGURADO'}\n`);

    if (!smtpUser || !smtpPass) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'SMTP_USER o SMTP_PASS no están configurados en .env',
          config: {
            SMTP_USER: smtpUser ? 'Configurado' : 'NO CONFIGURADO',
            SMTP_PASS: smtpPass ? 'Configurado' : 'NO CONFIGURADO',
            ADMIN_EMAIL: adminEmail || 'NO CONFIGURADO',
          },
          instructions: [
            '1. Ve a https://myaccount.google.com/apppasswords',
            '2. Genera un app password para Gmail',
            '3. Copia las 16 caracteres (sin espacios)',
            '4. Agrega a .env: SMTP_PASS=xxxxxxxxxxxxxxxx',
            '5. Agrega a .env: SMTP_USER=tu-email@gmail.com',
            '6. Agrega a .env: ADMIN_EMAIL=tu-email@gmail.com',
          ],
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Intentar enviar email
    const success = await sendEmail({
      to: to,
      subject: '[TEST] Email de Prueba - FashionStore',
      html: `
        <html>
          <head><meta charset="utf-8"></head>
          <body style="font-family: Arial; margin: 20px; background: #f4f4f5;">
            <div style="max-width: 600px; margin: 0 auto; background: white; padding: 32px; border-radius: 8px;">
              <h1 style="color: #00aa45; text-align: center;">✅ Test de Email Exitoso</h1>
              <p style="color: #52525b;">Si recibes este email, significa que tu configuración SMTP funciona correctamente.</p>
              
              <div style="background: #f0fdf4; border-left: 4px solid #00aa45; padding: 16px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #166534;">
                  <strong>Credenciales verificadas:</strong><br>
                  • SMTP_USER: ${smtpUser}<br>
                  • SMTP_PASS: ••••••••••••••••<br>
                  • ADMIN_EMAIL: ${adminEmail || 'No configurado'}
                </p>
              </div>

              <h2 style="color: #1a1a1a; margin-top: 32px;">Próximos Pasos:</h2>
              <ol style="color: #52525b; line-height: 1.8;">
                <li>Este test verifica que el servidor puede enviar emails</li>
                <li>Los emails de pedidos se enviarán automáticamente después de pagar</li>
                <li>Revisa tu carpeta de SPAM si no ves los emails</li>
                <li>Asegúrate de que ADMIN_EMAIL en .env sea tu email para recibir notificaciones</li>
              </ol>

              <hr style="margin: 32px 0; border: none; border-top: 1px solid #e4e4e7;">
              <p style="color: #a1a1aa; font-size: 12px; text-align: center;">
                Este es un email automático de prueba. No responder a este correo.
              </p>
            </div>
          </body>
        </html>
      `,
    });

    if (success) {
      console.log(`[TEST EMAIL] ✅ Email enviado exitosamente a: ${to}\n`);
      return new Response(
        JSON.stringify({
          success: true,
          message: `Email de prueba enviado a ${to}`,
          to: to,
          config: {
            SMTP_USER: smtpUser,
            ADMIN_EMAIL: adminEmail,
          },
          next_steps: [
            'Revisa tu bandeja de entrada (incluye SPAM)',
            'Si recibes el email, el sistema está configurado correctamente',
            'Los emails de pedidos se enviarán automáticamente tras pagar',
          ],
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } else {
      console.log(`[TEST EMAIL] ❌ Error al enviar email a: ${to}\n`);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Error al enviar el email. Revisa los logs del servidor.',
          to: to,
          troubleshooting: [
            '1. Verifica que SMTP_PASS sea el app password correcto (16 caracteres)',
            '2. Verifica que SMTP_USER sea tu email de Gmail',
            '3. Asegúrate de tener 2FA activado en Gmail',
            '4. Revisa los logs del servidor para más detalles',
            '5. Intenta generar un nuevo app password si el anterior expira',
          ],
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('[TEST EMAIL] ❌ Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: String(error),
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
