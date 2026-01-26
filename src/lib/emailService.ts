/**
 * FASHIONSTORE - EMAIL SERVICE
 * =============================
 * Servicio centralizado de envío de emails profesionales
 * Usa Nodemailer con Gmail SMTP
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

// Configuración SMTP
const SMTP_HOST = import.meta.env.SMTP_HOST || process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(import.meta.env.SMTP_PORT || process.env.SMTP_PORT || '587');
const SMTP_USER = import.meta.env.SMTP_USER || process.env.SMTP_USER;
const SMTP_PASS = import.meta.env.SMTP_PASS || process.env.SMTP_PASS;
const ADMIN_EMAIL = import.meta.env.ADMIN_EMAIL || process.env.ADMIN_EMAIL;
const FROM_NAME = 'FashionStore';
const FROM_EMAIL = SMTP_USER || 'noreply@fashionstore.com';

// Log de configuración
console.log('[EmailService] Configuración SMTP:');
console.log('  SMTP_HOST:', SMTP_HOST);
console.log('  SMTP_PORT:', SMTP_PORT);
console.log('  SMTP_USER:', SMTP_USER ? `${SMTP_USER.substring(0, 5)}...` : 'NOT SET');
console.log('  SMTP_PASS:', SMTP_PASS ? '***' : 'NOT SET');
console.log('  ADMIN_EMAIL:', ADMIN_EMAIL || 'NOT SET');

// Interfaces
interface OrderItem {
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  precio_original?: number;
  imagen?: string;
  talla?: string;
  color?: string;
}

interface OrderData {
  numero_orden: string;
  email: string;
  nombre: string;
  telefono?: string;
  items: OrderItem[];
  subtotal: number;
  impuestos: number;
  descuento: number;
  envio: number;
  total: number;
  direccion?: {
    calle?: string;
    ciudad?: string;
    codigo_postal?: string;
    pais?: string;
  };
  is_guest: boolean;
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

// Crear transporter
let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: false,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }
  return transporter;
}

// Función base de envío
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    console.log('\n[EMAIL] ========== ENVIANDO EMAIL ==========');
    console.log(`[EMAIL] Para: ${options.to}`);
    console.log(`[EMAIL] Asunto: ${options.subject}`);

    // Validar configuración
    if (!SMTP_USER || !SMTP_PASS) {
      console.error('[EMAIL] ❌ Credenciales SMTP no configuradas');
      console.error('[EMAIL] SMTP_USER:', SMTP_USER ? 'SET' : 'NOT SET');
      console.error('[EMAIL] SMTP_PASS:', SMTP_PASS ? 'SET' : 'NOT SET');
      return false;
    }

    console.log(`[EMAIL] SMTP_USER: ${SMTP_USER}`);
    console.log(`[EMAIL] SMTP_PASS: ***`);
    console.log(`[EMAIL] SMTP_PASS longitud: ${SMTP_PASS.length} caracteres`);

    const transport = getTransporter();

    const mailOptions: any = {
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || '',
    };

    // Añadir adjuntos si existen
    if (options.attachments && options.attachments.length > 0) {
      mailOptions.attachments = options.attachments;
      console.log(`[EMAIL] Adjuntos: ${options.attachments.map(a => a.filename).join(', ')}`);
    }

    console.log('[EMAIL] Intentando enviar...');
    const info = await transport.sendMail(mailOptions);
    console.log(`[EMAIL] ✅ Enviado exitosamente`);
    console.log(`[EMAIL] Response: ${info.response}`);
    console.log('[EMAIL] ========== FIN ==========\n');
    return true;
  } catch (error) {
    console.error('[EMAIL] ❌ ERROR ENVIANDO EMAIL:');
    console.error(`[EMAIL] Tipo de error: ${error instanceof Error ? error.name : typeof error}`);
    console.error(`[EMAIL] Mensaje: ${error instanceof Error ? error.message : String(error)}`);
    if (error instanceof Error && error.stack) {
      console.error(`[EMAIL] Stack: ${error.stack}`);
    }
    console.error('[EMAIL] ========== FIN ERROR ==========\n');
    return false;
  }
}

// ============================================================
// PLANTILLAS HTML PROFESIONALES
// ============================================================

const baseStyles = `
  body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5; }
  .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
  .header { background: #1a1a1a; padding: 32px; text-align: center; }
  .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
  .content { padding: 32px; }
  .footer { background: #f4f4f5; padding: 24px 32px; text-align: center; color: #71717a; font-size: 12px; }
  .btn { display: inline-block; background: #00aa45; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; }
  .btn:hover { background: #009340; }
  .order-number { background: #f4f4f5; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0; }
  .order-number span { font-size: 24px; font-weight: 700; color: #1a1a1a; }
  .item { display: flex; padding: 16px 0; border-bottom: 1px solid #e4e4e7; }
  .item-image { width: 80px; height: 80px; object-fit: cover; border-radius: 8px; background: #f4f4f5; }
  .item-info { flex: 1; padding-left: 16px; }
  .item-name { font-weight: 600; color: #1a1a1a; margin-bottom: 4px; }
  .item-details { color: #71717a; font-size: 14px; }
  .item-price { font-weight: 600; color: #1a1a1a; text-align: right; }
  .totals { margin-top: 24px; }
  .totals-row { display: flex; justify-content: space-between; padding: 8px 0; }
  .totals-row.total { border-top: 2px solid #1a1a1a; padding-top: 16px; margin-top: 8px; font-size: 18px; font-weight: 700; }
  .address-box { background: #f4f4f5; padding: 20px; border-radius: 8px; margin-top: 24px; }
  .status-badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
  .status-paid { background: #dcfce7; color: #166534; }
  .status-shipped { background: #dbeafe; color: #1e40af; }
  .status-delivered { background: #d1fae5; color: #065f46; }
  .status-cancelled { background: #fee2e2; color: #991b1b; }
  .icon { width: 48px; height: 48px; margin: 0 auto 16px; }
`;

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2) + ' EUR';
}

function generateItemsHTML(items: OrderItem[]): string {
  return items.map(item => `
    <tr>
      <td style="padding: 16px 0; border-bottom: 1px solid #e4e4e7;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="80" style="vertical-align: top;">
              <img src="${item.imagen || 'https://via.placeholder.com/80x80?text=Producto'}" 
                   alt="${item.nombre}" 
                   style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; background: #f4f4f5;" />
            </td>
            <td style="padding-left: 16px; vertical-align: top;">
              <div style="font-weight: 600; color: #1a1a1a; margin-bottom: 4px;">${item.nombre}</div>
              <div style="color: #71717a; font-size: 14px;">
                Cantidad: ${item.cantidad}
                ${item.talla ? ` | Talla: ${item.talla}` : ''}
                ${item.color ? ` | Color: ${item.color}` : ''}
              </div>
              ${item.precio_original && item.precio_original > item.precio_unitario ? `
              <div style="color: #166534; font-size: 13px; margin-top: 4px;">
                <span style="text-decoration: line-through; color: #a1a1aa;">Precio original: ${formatPrice(item.precio_original)}</span>
              </div>
              ` : ''}
            </td>
            <td style="text-align: right; font-weight: 600; color: #1a1a1a; vertical-align: top;">
              ${formatPrice(item.precio_unitario * item.cantidad)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('');
}

/**
 * 1. EMAIL DE CONFIRMACIÓN DE COMPRA (CLIENTE)
 */

export async function sendOrderConfirmationEmail(order: OrderData): Promise<boolean> {
  try {
    // Importar el servicio de factura
    const { generateInvoicePDF } = await import('./invoiceService');

    // Generar PDF de factura
    let pdfBuffer: Buffer | undefined;
    try {
      pdfBuffer = await generateInvoicePDF({
        numero_orden: order.numero_orden,
        fecha: new Date().toISOString(),
        nombre_cliente: order.nombre,
        email_cliente: order.email,
        telefono_cliente: order.telefono || undefined,
        direccion: order.direccion,
        items: order.items.map(item => ({
          nombre: item.nombre,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          talla: item.talla,
          color: item.color,
        })),
        subtotal: order.subtotal,
        descuento: order.descuento,
        impuestos: order.impuestos,
        total: order.total,
      });
      console.log('[EMAIL] PDF de factura generado correctamente');
    } catch (pdfError) {
      console.error('[EMAIL] Error generando PDF:', pdfError);
      // Continuar sin PDF si hay error
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de pedido</title>
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">FashionStore</h1>
              <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">Tu compra ha sido confirmada</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <!-- Success Icon -->
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="width: 64px; height: 64px; background: #dcfce7; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#166534" stroke-width="2">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                </div>
              </div>
              
              <h2 style="text-align: center; color: #1a1a1a; margin: 0 0 8px; font-size: 24px;">¡Pedido confirmado!</h2>
              <p style="text-align: center; color: #71717a; margin: 0 0 32px; font-size: 16px;">Gracias por tu compra, <strong>${order.nombre}</strong>. Tu pedido está siendo procesado.</p>
              
              <!-- Order Number - Destacado -->
              <div style="background: linear-gradient(135deg, #00aa45 0%, #008a35 100%); padding: 24px; border-radius: 8px; text-align: center; margin-bottom: 32px; color: #ffffff;">
                <div style="font-size: 12px; opacity: 0.9;">Número de pedido</div>
                <div style="font-size: 28px; font-weight: 700; letter-spacing: 2px; margin-top: 8px;">${order.numero_orden}</div>
              </div>
              
              <!-- Items Section -->
              <h3 style="color: #1a1a1a; margin: 32px 0 16px; font-size: 18px; border-bottom: 2px solid #00aa45; padding-bottom: 8px;">Productos Pedidos</h3>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${generateItemsHTML(order.items)}
              </table>
              
              <!-- Totals Section -->
              <div style="margin-top: 32px; background: #f4f4f5; padding: 24px; border-radius: 8px;">
                <h3 style="color: #1a1a1a; margin: 0 0 16px; font-size: 14px; font-weight: 600;">Resumen de pago</h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0; color: #71717a; border-bottom: 1px solid #e4e4e7;">Subtotal</td>
                    <td style="padding: 8px 0; text-align: right; color: #1a1a1a; border-bottom: 1px solid #e4e4e7; font-weight: 600;">${formatPrice(order.subtotal)}</td>
                  </tr>
                  ${order.descuento > 0 ? `
                  <tr>
                    <td style="padding: 8px 0; color: #166534; border-bottom: 1px solid #e4e4e7;">Descuento aplicado</td>
                    <td style="padding: 8px 0; text-align: right; color: #166534; border-bottom: 1px solid #e4e4e7; font-weight: 600;">-${formatPrice(order.descuento)}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 8px 0; color: #71717a; border-bottom: 1px solid #e4e4e7;">Gastos de envío</td>
                    <td style="padding: 8px 0; text-align: right; color: #1a1a1a; border-bottom: 1px solid #e4e4e7; font-weight: 600;">${order.envio > 0 ? formatPrice(order.envio) : 'Gratis'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #71717a;">IVA (21%)</td>
                    <td style="padding: 8px 0; text-align: right; color: #1a1a1a; font-weight: 600;">${formatPrice(order.impuestos)}</td>
                  </tr>
                  <tr>
                    <td colspan="2"><hr style="border: none; border-top: 2px solid #00aa45; margin: 12px 0;" /></td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; font-size: 16px; font-weight: 700; color: #1a1a1a;">Total pagado</td>
                    <td style="padding: 12px 0; text-align: right; font-size: 20px; font-weight: 700; color: #00aa45;">${formatPrice(order.total)}</td>
                  </tr>
                </table>
              </div>
              
              ${order.direccion ? `
              <!-- Shipping Address -->
              <div style="margin-top: 32px; border-left: 4px solid #00aa45; padding-left: 16px;">
                <h3 style="color: #1a1a1a; margin: 0 0 12px; font-size: 14px; font-weight: 600;">Dirección de envío</h3>
                <p style="color: #52525b; margin: 0; line-height: 1.8;">
                  <strong>${order.nombre}</strong><br>
                  ${order.direccion.calle || ''}<br>
                  ${order.direccion.codigo_postal || ''} ${order.direccion.ciudad || ''}<br>
                  ${order.direccion.pais || 'España'}
                </p>
              </div>
              ` : ''}
              
              <!-- Timeline/Next Steps -->
              <div style="margin-top: 32px; background: #f0fdf4; padding: 24px; border-radius: 8px;">
                <h3 style="color: #166534; margin: 0 0 16px; font-size: 14px; font-weight: 600;">¿Qué sucede ahora?</h3>
                <div style="color: #166534; font-size: 14px; line-height: 2;">
                  <div>✓ Tu pago ha sido procesado</div>
                  <div>✓ Preparamos tu pedido en 24 horas</div>
                  <div>✓ Te enviaremos el código de seguimiento</div>
                  <div>✓ Recibe tu compra en 2-3 días laborales</div>
                </div>
              </div>
              
              <!-- CTA -->
              <div style="text-align: center; margin-top: 32px;">
                <a href="${import.meta.env.SITE_URL || 'http://localhost:4321'}/mi-cuenta" 
                   style="display: inline-block; background: #00aa45; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Seguimiento de pedido
                </a>
              </div>
              
              <!-- Support Info -->
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e4e4e7; text-align: center;">
                <p style="color: #71717a; margin: 0 0 8px; font-size: 14px;">¿Tienes preguntas?</p>
                <p style="margin: 0; color: #1a1a1a;">
                  <strong>Email:</strong> <a href="mailto:soporte@fashionstore.com" style="color: #00aa45; text-decoration: none;">soporte@fashionstore.com</a>
                </p>
                <p style="margin: 8px 0 0; color: #1a1a1a;">
                  <strong>Teléfono:</strong> <a href="tel:+34912345678" style="color: #00aa45; text-decoration: none;">+34 912 345 678</a>
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: #f4f4f5; padding: 32px; text-align: center;">
              <p style="color: #71717a; margin: 0 0 8px; font-size: 12px;">
                Este email contiene tu factura de compra adjunta en PDF
              </p>
              <p style="color: #a1a1aa; margin: 0; font-size: 11px;">
                &copy; ${new Date().getFullYear()} FashionStore. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

    // Enviar email con PDF adjunto
    return sendEmail({
      to: order.email,
      subject: `Pedido confirmado: ${order.numero_orden}`,
      html,
      attachments: pdfBuffer
        ? [
          {
            filename: `Factura_${order.numero_orden}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ]
        : undefined,
    });
  } catch (error) {
    console.error('[EMAIL] Error en sendOrderConfirmationEmail:', error);
    return false;
  }
}

// ============================================================
// 2. EMAIL DE NUEVA VENTA (ADMIN)
// ============================================================

export async function sendNewSaleNotificationEmail(order: OrderData): Promise<boolean> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Nueva venta</title>
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #166534 0%, #147028 100%); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700;">🛒 Nueva Venta Recibida</h1>
              <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">Pedido confirmado y pagado</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <!-- Pedido Info -->
              <div style="background: #dcfce7; border-left: 4px solid #166534; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
                <p style="color: #166534; margin: 0; font-weight: 600; font-size: 16px;">Pedido #${order.numero_orden}</p>
              </div>
              
              <!-- Cliente Info -->
              <h3 style="color: #1a1a1a; margin: 0 0 12px; font-size: 14px; font-weight: 600;">Información del Cliente</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="padding: 8px 0; color: #71717a; width: 40%;">Nombre:</td>
                  <td style="padding: 8px 0; color: #1a1a1a; font-weight: 600;">${order.nombre}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #71717a;">Email:</td>
                  <td style="padding: 8px 0; color: #1a1a1a;">
                    <a href="mailto:${order.email}" style="color: #00aa45; text-decoration: none;">${order.email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #71717a;">Tipo cliente:</td>
                  <td style="padding: 8px 0;">
                    <span style="display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; ${order.is_guest ? 'background: #fef3c7; color: #92400e;' : 'background: #dbeafe; color: #1e40af;'}">
                      ${order.is_guest ? '👤 Invitado' : '👤 Registrado'}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #71717a;">Fecha/Hora:</td>
                  <td style="padding: 8px 0; color: #1a1a1a;">${new Date().toLocaleString('es-ES')}</td>
                </tr>
              </table>
              
              <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">
              
              <!-- Productos -->
              <h3 style="color: #1a1a1a; margin: 0 0 16px; font-size: 14px; font-weight: 600;">Productos Ordenados (${order.items.length})</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #f4f4f5; border-radius: 8px; margin-bottom: 24px;">
                ${order.items.map(item => `
                <tr>
                  <td style="padding: 12px; border-bottom: 1px solid #e4e4e7;">
                    <div style="font-weight: 600; color: #1a1a1a;">${item.nombre}</div>
                    <div style="font-size: 12px; color: #71717a; margin-top: 4px;">Cantidad: ${item.cantidad}${item.talla ? ` | Talla: ${item.talla}` : ''}${item.color ? ` | Color: ${item.color}` : ''}</div>
                  </td>
                  <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e4e4e7; font-weight: 600; color: #1a1a1a;">
                    ${formatPrice(item.precio_unitario * item.cantidad)}
                  </td>
                </tr>
                `).join('')}
              </table>
              
              <!-- Totales -->
              <div style="background: #f4f4f5; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0; color: #71717a;">Subtotal:</td>
                    <td style="padding: 8px 0; text-align: right; color: #1a1a1a; font-weight: 600;">${formatPrice(order.subtotal)}</td>
                  </tr>
                  ${order.descuento > 0 ? `
                  <tr>
                    <td style="padding: 8px 0; color: #166534;">Descuento:</td>
                    <td style="padding: 8px 0; text-align: right; color: #166534; font-weight: 600;">-${formatPrice(order.descuento)}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 8px 0; color: #71717a;">Envío:</td>
                    <td style="padding: 8px 0; text-align: right; color: #1a1a1a; font-weight: 600;">${order.envio > 0 ? formatPrice(order.envio) : 'Gratis'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #71717a;">IVA:</td>
                    <td style="padding: 8px 0; text-align: right; color: #1a1a1a; font-weight: 600;">${formatPrice(order.impuestos)}</td>
                  </tr>
                  <tr style="border-top: 2px solid #00aa45; padding-top: 12px;">
                    <td style="padding: 12px 0; font-size: 16px; font-weight: 700; color: #1a1a1a;">TOTAL PAGADO:</td>
                    <td style="padding: 12px 0; text-align: right; font-size: 18px; font-weight: 700; color: #166534;">${formatPrice(order.total)}</td>
                  </tr>
                </table>
              </div>
              
              <!-- CTA -->
              <div style="text-align: center;">
                <a href="${import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321'}/admin/pedidos" 
                   style="display: inline-block; background: #1a1a1a; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                  📋 Ver Pedido en Admin
                </a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: #f4f4f5; padding: 24px; text-align: center;">
              <p style="color: #a1a1aa; margin: 0; font-size: 11px;">
                Este es un email automático del sistema. &copy; ${new Date().getFullYear()} FashionStore.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `[VENTA] ${order.numero_orden} - ${formatPrice(order.total)} - ${order.is_guest ? 'Invitado' : 'Registrado'}`,
    html,
  });
}

// ============================================================
// 3. EMAIL DE CAMBIO DE ESTADO
// ============================================================

export async function sendOrderStatusUpdateEmail(
  email: string,
  nombre: string,
  numero_orden: string,
  nuevo_estado: 'Enviado' | 'Entregado' | 'Cancelado',
  tracking?: string
): Promise<boolean> {
  const statusConfig = {
    Enviado: {
      icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1e40af" stroke-width="2"><path d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"/></svg>`,
      bgColor: '#dbeafe',
      textColor: '#1e40af',
      title: 'Tu pedido está en camino',
      message: 'Hemos enviado tu pedido. Pronto lo recibirás en tu dirección.',
    },
    Entregado: {
      icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#065f46" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>`,
      bgColor: '#d1fae5',
      textColor: '#065f46',
      title: 'Pedido entregado',
      message: '¡Tu pedido ha sido entregado! Esperamos que disfrutes tu compra.',
    },
    Cancelado: {
      icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#991b1b" stroke-width="2"><path d="M6 18L18 6M6 6l12 12"/></svg>`,
      bgColor: '#fee2e2',
      textColor: '#991b1b',
      title: 'Pedido cancelado',
      message: 'Tu pedido ha sido cancelado. Si tienes dudas, contacta con soporte.',
    },
  };

  const config = statusConfig[nuevo_estado];

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Actualización de pedido</title>
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 12px; overflow: hidden;">
          <tr>
            <td style="background: #1a1a1a; padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">FashionStore</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px; text-align: center;">
              <div style="width: 64px; height: 64px; background: ${config.bgColor}; border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;">
                ${config.icon}
              </div>
              
              <h2 style="color: #1a1a1a; margin: 0 0 8px;">${config.title}</h2>
              <p style="color: #71717a; margin: 0 0 24px;">${config.message}</p>
              
              <div style="background: #f4f4f5; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                <div style="color: #71717a; font-size: 14px;">Pedido</div>
                <div style="font-size: 20px; font-weight: 700; color: #1a1a1a;">${numero_orden}</div>
              </div>
              
              ${tracking ? `
              <div style="background: ${config.bgColor}; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                <div style="color: ${config.textColor}; font-size: 14px;">Número de seguimiento</div>
                <div style="font-size: 18px; font-weight: 600; color: ${config.textColor};">${tracking}</div>
              </div>
              ` : ''}
              
              <a href="${import.meta.env.SITE_URL || 'http://localhost:4321'}/mis-pedidos" 
                 style="display: inline-block; background: #00aa45; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Ver detalles del pedido
              </a>
            </td>
          </tr>
          <tr>
            <td style="background: #f4f4f5; padding: 24px; text-align: center;">
              <p style="color: #a1a1aa; margin: 0; font-size: 12px;">
                &copy; ${new Date().getFullYear()} FashionStore
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail({
    to: email,
    subject: `Pedido ${numero_orden}: ${config.title}`,
    html,
  });
}

// ============================================================
// 4. EMAIL DE CÓDIGO DE DESCUENTO (NEWSLETTER)
// ============================================================


export async function sendWelcomeDiscountEmail(email: string, codigo: string): Promise<boolean> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Tu código de descuento</title>
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 12px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #00aa45 0%, #009340 100%); padding: 48px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0 0 8px; font-size: 32px; font-weight: 700;">Bienvenido a FashionStore</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 18px;">Gracias por suscribirte a nuestra newsletter</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 48px; text-align: center;">
              <p style="color: #52525b; margin: 0 0 32px; font-size: 16px; line-height: 1.6;">
                Como agradecimiento, te ofrecemos un <strong>10% de descuento</strong> en tu primera compra.
              </p>
              
              <div style="background: #f4f4f5; border: 2px dashed #00aa45; padding: 24px; border-radius: 12px; margin-bottom: 32px;">
                <div style="color: #71717a; font-size: 14px; margin-bottom: 8px;">Tu código de descuento</div>
                <div style="font-size: 32px; font-weight: 700; color: #00aa45; letter-spacing: 4px;">${codigo}</div>
              </div>
              
              <p style="color: #71717a; margin: 0 0 32px; font-size: 14px;">
                Válido durante 30 días. Uso único por cliente.
              </p>
              
              <a href="${import.meta.env.SITE_URL || 'http://localhost:4321'}" 
                 style="display: inline-block; background: #1a1a1a; color: #ffffff; padding: 16px 48px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Empezar a comprar
              </a>
            </td>
          </tr>
          <tr>
            <td style="background: #f4f4f5; padding: 24px; text-align: center;">
              <p style="color: #a1a1aa; margin: 0; font-size: 12px;">
                &copy; ${new Date().getFullYear()} FashionStore. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail({
    to: email,
    subject: 'Tu 10% de descuento en FashionStore',
    html,
  });
}

// ============================================================
// 6. EMAIL DE BIENVENIDA PARA NUEVOS USUARIOS
// ============================================================

interface WelcomeProduct {
  nombre: string;
  precio_venta: number;
  precio_original?: number;
  imagen?: string;
  descripcion?: string;
}

export async function sendWelcomeEmail(
  email: string,
  nombre: string,
  productos: WelcomeProduct[] = []
): Promise<boolean> {
  // Generar HTML de productos dinámicamente
  const productosHTML = productos.length > 0
    ? productos.map((producto, index) => {
      const descuento = producto.precio_original
        ? Math.round(((producto.precio_original - producto.precio_venta) / producto.precio_original) * 100)
        : 0;

      // Emojis por defecto si no hay imagen
      const emojis = ['📱', '💻', '⌚', '🎧', '📷', '🖥️'];
      const emoji = emojis[index % emojis.length];

      return `
                <!-- Product ${index + 1} -->
                <tr>
                  <td style="padding: 16px 0; ${index < productos.length - 1 ? 'border-bottom: 1px solid #e4e4e7;' : ''}">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="100" style="vertical-align: top;">
                          ${producto.imagen
          ? `<img src="${producto.imagen}" alt="${producto.nombre}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 12px; background: #f4f4f5;" />`
          : `<div style="width: 100px; height: 100px; background: linear-gradient(135deg, #f4f4f5 0%, #e4e4e7 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                                <span style="font-size: 40px;">${emoji}</span>
                              </div>`
        }
                        </td>
                        <td style="padding-left: 16px; vertical-align: top;">
                          <div style="font-weight: 700; color: #1a1a1a; margin-bottom: 6px; font-size: 16px;">${producto.nombre}</div>
                          <div style="color: #71717a; font-size: 14px; margin-bottom: 8px;">${producto.descripcion || 'Producto destacado'}</div>
                          <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 18px; font-weight: 700; color: #00aa45;">${formatPrice(producto.precio_venta)}</span>
                            ${producto.precio_original && producto.precio_original > producto.precio_venta
          ? `<span style="font-size: 14px; color: #a1a1aa; text-decoration: line-through;">${formatPrice(producto.precio_original)}</span>
                                 <span style="background: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">-${descuento}%</span>`
          : ''
        }
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>`;
    }).join('')
    : `
                <!-- Productos por defecto si no se proporcionan -->
                <tr>
                  <td style="padding: 16px 0; border-bottom: 1px solid #e4e4e7;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="100" style="vertical-align: top;">
                          <div style="width: 100px; height: 100px; background: linear-gradient(135deg, #f4f4f5 0%, #e4e4e7 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                            <span style="font-size: 40px;">📱</span>
                          </div>
                        </td>
                        <td style="padding-left: 16px; vertical-align: top;">
                          <div style="font-weight: 700; color: #1a1a1a; margin-bottom: 6px; font-size: 16px;">Productos Destacados</div>
                          <div style="color: #71717a; font-size: 14px; margin-bottom: 8px;">Descubre nuestras mejores ofertas</div>
                          <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 18px; font-weight: 700; color: #00aa45;">Desde 99€</span>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>¡Bienvenido a FashionStore!</title>
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 48px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0 0 8px; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                Fashion<span style="color: #00aa45;">Store</span>
              </h1>
              <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 16px;">Tu destino para la moda</p>
            </td>
          </tr>
          
          <!-- Welcome Message -->
          <tr>
            <td style="padding: 48px;">
              <!-- Welcome Icon -->
              <div style="text-align: center; margin-bottom: 32px;">
                <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #00aa45 0%, #009340 100%); border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
              </div>
              
              <h2 style="text-align: center; color: #1a1a1a; margin: 0 0 16px; font-size: 28px; font-weight: 700;">
                ¡Bienvenido, ${nombre}!
              </h2>
              
              <p style="text-align: center; color: #52525b; margin: 0 0 32px; font-size: 16px; line-height: 1.6;">
                Estamos encantados de tenerte en <strong>FashionStore</strong>. Has dado el primer paso para descubrir las mejores ofertas en electrónica y moda.
              </p>
              
              <!-- Special Offers Section -->
              <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 32px; border-radius: 12px; margin-bottom: 32px; border: 2px solid #00aa45;">
                <h3 style="color: #166534; margin: 0 0 20px; font-size: 20px; font-weight: 700; text-align: center;">
                  🎁 Ofertas Especiales para Ti
                </h3>
                
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid rgba(22, 101, 52, 0.2);">
                      <div style="display: flex; align-items: center;">
                        <span style="font-size: 24px; margin-right: 12px;">✓</span>
                        <span style="color: #166534; font-size: 15px; font-weight: 600;">Envío gratis en pedidos superiores a 50€</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid rgba(22, 101, 52, 0.2);">
                      <div style="display: flex; align-items: center;">
                        <span style="font-size: 24px; margin-right: 12px;">✓</span>
                        <span style="color: #166534; font-size: 15px; font-weight: 600;">Devoluciones gratis durante 30 días</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid rgba(22, 101, 52, 0.2);">
                      <div style="display: flex; align-items: center;">
                        <span style="font-size: 24px; margin-right: 12px;">✓</span>
                        <span style="color: #166534; font-size: 15px; font-weight: 600;">Acceso exclusivo a ofertas flash</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0;">
                      <div style="display: flex; align-items: center;">
                        <span style="font-size: 24px; margin-right: 12px;">✓</span>
                        <span style="color: #166534; font-size: 15px; font-weight: 600;">Productos refurbished con garantía</span>
                      </div>
                    </td>
                  </tr>
                </table>
              </div>
              
              <!-- Featured Products -->
              <h3 style="color: #1a1a1a; margin: 0 0 24px; font-size: 22px; font-weight: 700; text-align: center; border-bottom: 3px solid #00aa45; padding-bottom: 12px;">
                🔥 Productos Destacados
              </h3>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                ${productosHTML}
              </table>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin-top: 40px;">
                <a href="${import.meta.env.SITE_URL || 'http://localhost:4321'}" 
                   style="display: inline-block; background: linear-gradient(135deg, #00aa45 0%, #009340 100%); color: #ffffff; padding: 18px 48px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 18px; box-shadow: 0 4px 12px rgba(0, 170, 69, 0.3);">
                  🛍️ Explorar Productos
                </a>
              </div>
              
              <!-- Support Info -->
              <div style="margin-top: 40px; padding-top: 32px; border-top: 2px solid #e4e4e7; text-align: center;">
                <p style="color: #71717a; margin: 0 0 16px; font-size: 15px; font-weight: 600;">¿Necesitas ayuda?</p>
                <p style="margin: 0 0 8px; color: #1a1a1a; font-size: 14px;">
                  <strong>Email:</strong> <a href="mailto:soporte@fashionstore.com" style="color: #00aa45; text-decoration: none;">soporte@fashionstore.com</a>
                </p>
                <p style="margin: 0; color: #1a1a1a; font-size: 14px;">
                  <strong>Teléfono:</strong> <a href="tel:+34912345678" style="color: #00aa45; text-decoration: none;">+34 912 345 678</a>
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: #f4f4f5; padding: 32px; text-align: center;">
              <p style="color: #71717a; margin: 0 0 8px; font-size: 13px;">
                Gracias por unirte a nuestra comunidad de más de 10,000 clientes satisfechos
              </p>
              <p style="color: #a1a1aa; margin: 0; font-size: 11px;">
                &copy; ${new Date().getFullYear()} FashionStore. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail({
    to: email,
    subject: `¡Bienvenido a FashionStore, ${nombre}! 🎉`,
    html,
  });
}




// ============================================================
// 5. EMAIL DE SOLICITUD DE DEVOLUCIÓN
// ============================================================

export async function sendReturnRequestEmail(
  email: string,
  nombre: string,
  numero_orden: string,
  numero_autorizacion: string
): Promise<boolean> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Solicitud de devolución</title>
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 12px; overflow: hidden;">
          <tr>
            <td style="background: #1a1a1a; padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0;">FashionStore</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #1a1a1a; margin: 0 0 16px;">Solicitud de devolución recibida</h2>
              <p style="color: #52525b; margin: 0 0 24px;">Hola ${nombre}, hemos recibido tu solicitud de devolución.</p>
              
              <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                <div style="color: #92400e; font-size: 14px; margin-bottom: 8px;">Número de autorización (RMA)</div>
                <div style="font-size: 24px; font-weight: 700; color: #78350f;">${numero_autorizacion}</div>
              </div>
              
              <div style="background: #f4f4f5; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                <div style="color: #71717a; font-size: 14px; margin-bottom: 8px;">Pedido original</div>
                <div style="font-size: 18px; font-weight: 600; color: #1a1a1a;">${numero_orden}</div>
              </div>
              
              <h3 style="color: #1a1a1a; margin: 24px 0 16px;">Próximos pasos</h3>
              <ol style="color: #52525b; padding-left: 20px; line-height: 1.8;">
                <li>Empaqueta los productos en su embalaje original</li>
                <li>Incluye el número RMA visible en el paquete</li>
                <li>Envíalo a nuestra dirección en un plazo de 14 días</li>
                <li>Una vez recibido, procesaremos el reembolso en 5-7 días laborables</li>
              </ol>
              
              <div style="text-align: center; margin-top: 32px;">
                <a href="${import.meta.env.SITE_URL || 'http://localhost:4321'}/mis-pedidos" 
                   style="display: inline-block; background: #00aa45; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                  Ver estado de la devolución
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background: #f4f4f5; padding: 24px; text-align: center;">
              <p style="color: #a1a1aa; margin: 0; font-size: 12px;">&copy; ${new Date().getFullYear()} FashionStore</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail({
    to: email,
    subject: `Devolución autorizada: ${numero_autorizacion}`,
    html,
  });
}

// ============================================================
// NOTIFICACIÓN AL ADMIN - Nuevos pedidos y eventos
// ============================================================

interface AdminNotificationOptions {
  type: 'new_order' | 'payment_confirmed' | 'payment_dispute' | 'return_request';
  order_number: string;
  customer_email: string;
  customer_name: string;
  total?: number;
  items_count?: number;
  dispute_id?: string;
  return_reason?: string;
}

export async function sendAdminNotificationEmail(
  options: AdminNotificationOptions
): Promise<boolean> {
  const adminEmail = import.meta.env.ADMIN_EMAIL || 'raafaablanco@gmail.com';

  let subject = '';
  let html = '';

  // ========== NUEVO PEDIDO ==========
  if (options.type === 'new_order') {
    subject = `Nuevo pedido: ${options.order_number}`;
    html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 12px; overflow: hidden;">
          <tr>
            <td style="background: #1a1a1a; padding: 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Nuevo Pedido Recibido</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <div style="background: #dcfce7; border-left: 4px solid #166534; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
                <p style="color: #166534; margin: 0; font-weight: 600;">Pedido #${options.order_number}</p>
              </div>
              
              <h3 style="color: #1a1a1a; margin: 0 0 12px;">Información del Cliente</h3>
              <p style="color: #52525b; margin: 0 0 8px;"><strong>Nombre:</strong> ${options.customer_name}</p>
              <p style="color: #52525b; margin: 0 0 24px;"><strong>Email:</strong> ${options.customer_email}</p>
              
              <h3 style="color: #1a1a1a; margin: 0 0 12px;">Detalles</h3>
              <p style="color: #52525b; margin: 0 0 8px;"><strong>Productos:</strong> ${options.items_count || 'N/A'} artículos</p>
              <p style="color: #52525b; margin: 0 0 8px;"><strong>Total:</strong> ${options.total ? formatPrice(options.total) : 'N/A'}</p>
              
              <div style="text-align: center; margin-top: 32px;">
                <a href="${import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321'}/admin/pedidos/${options.order_number}" 
                   style="display: inline-block; background: #1a1a1a; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                  Ver Pedido en Admin
                </a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0;">
              <p style="color: #a1a1aa; margin: 0; font-size: 12px;">Este es un email automático del sistema. No responder a este correo.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  // ========== DISPUTA DE PAGO ==========
  if (options.type === 'payment_dispute') {
    subject = `ALERTA: Disputa de pago - ${options.order_number}`;
    html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 12px; overflow: hidden;">
          <tr>
            <td style="background: #dc2626; padding: 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">ALERTA: Disputa de Pago</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
                <p style="color: #991b1b; margin: 0; font-weight: 600;">Pedido #${options.order_number}</p>
              </div>
              
              <p style="color: #52525b; margin: 0 0 24px;">Se ha abierto una disputa para este pedido. Revisa los detalles y toma acción inmediatamente.</p>
              
              <h3 style="color: #1a1a1a; margin: 0 0 12px;">Información</h3>
              <p style="color: #52525b; margin: 0 0 8px;"><strong>Cliente:</strong> ${options.customer_name}</p>
              <p style="color: #52525b; margin: 0 0 8px;"><strong>Email:</strong> ${options.customer_email}</p>
              <p style="color: #52525b; margin: 0 0 24px;"><strong>ID Disputa:</strong> ${options.dispute_id}</p>
              
              <div style="text-align: center; margin-top: 32px;">
                <a href="https://dashboard.stripe.com" 
                   style="display: inline-block; background: #dc2626; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                  Ver en Dashboard Stripe
                </a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  // ========== SOLICITUD DE DEVOLUCIÓN ==========
  if (options.type === 'return_request') {
    subject = `Solicitud de devolución - ${options.order_number}`;
    html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 12px; overflow: hidden;">
          <tr>
            <td style="background: #f59e0b; padding: 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Solicitud de Devolución</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
                <p style="color: #92400e; margin: 0; font-weight: 600;">Pedido #${options.order_number}</p>
              </div>
              
              <h3 style="color: #1a1a1a; margin: 0 0 12px;">Cliente</h3>
              <p style="color: #52525b; margin: 0 0 8px;"><strong>Nombre:</strong> ${options.customer_name}</p>
              <p style="color: #52525b; margin: 0 0 24px;"><strong>Email:</strong> ${options.customer_email}</p>
              
              ${options.return_reason ? `
              <h3 style="color: #1a1a1a; margin: 0 0 12px;">Motivo de Devolución</h3>
              <p style="color: #52525b; margin: 0 0 24px;">${options.return_reason}</p>
              ` : ''}
              
              <div style="text-align: center; margin-top: 32px;">
                <a href="${import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321'}/admin/devoluciones" 
                   style="display: inline-block; background: #f59e0b; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                  Procesar Devolución
                </a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  return sendEmail({
    to: adminEmail,
    subject,
    html,
  });
}

// ============================================================
// NOTA: Las funciones ya están exportadas individualmente con 'export'
// No es necesario un bloque de exportación adicional
// ============================================================
