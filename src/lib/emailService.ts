// emailService.ts - Responsive & Aesthetic Email Service
// ALL prices are INTEGER CENTS. Only formatPrice divides by 100.

import nodemailer from 'nodemailer';
import { generateInvoicePDF } from './invoiceService';
import fs from 'node:fs';
import pathMod from 'node:path';
import { supabase } from './supabase';

// =============================================================================
// TYPES
// =============================================================================

interface OrderItem {
  nombre: string;
  cantidad: number;
  precio_unitario: number; // INTEGER CENTS
  precio_original?: number; // INTEGER CENTS (Optional)
  talla?: string;
  color?: string;
  imagen?: string;
}

interface DireccionEnvio {
  calle?: string;
  ciudad?: string;
  codigo_postal?: string;
  pais?: string;
}

interface OrderData {
  numero_orden: string;
  email: string;
  nombre: string;
  telefono?: string;
  direccion?: DireccionEnvio;
  items: OrderItem[];
  subtotal: number;    // INTEGER CENTS
  impuestos: number;   // INTEGER CENTS
  envio: number;       // INTEGER CENTS
  descuento: number;   // INTEGER CENTS
  total: number;       // INTEGER CENTS
  type?: string;       // Optional discriminator
}

interface DisputeData {
  type: 'payment_dispute';
  order_number: string;
  customer_email: string;
  customer_name: string;
  dispute_id: string;
}

interface ReturnData {
  type: 'return_request';
  order_number: string;
  customer_email: string;
  customer_name: string;
  total: number;
  items_count: number;
  return_reason: string;
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content?: Buffer;
    path?: string;
    contentType?: string;
  }>;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const SITE_URL = import.meta.env.SITE_URL || 'https://fashionstorerbv3.victoriafp.online';
const SMTP_HOST = import.meta.env.SMTP_HOST || '';
const SMTP_PORT = parseInt(import.meta.env.SMTP_PORT || '587');
const SMTP_USER = import.meta.env.SMTP_USER || '';
const SMTP_PASS = import.meta.env.SMTP_PASS || '';
const SMTP_FROM = import.meta.env.SMTP_FROM || 'FashionStore <noreply@fashionstore.com>';
const ADMIN_EMAIL = 'fashionstorerbv@gmail.com'; // Hardcoded as per requirement
const LOGO_URL = 'https://res.cloudinary.com/djvj32zic/image/upload/v1769980559/admin-logo_qq0qlz.png';
const BRAND_COLOR = '#00aa45';
const BG_COLOR = '#f5f5f7';

// =============================================================================
// HELPERS
// =============================================================================

function formatPrice(cents: number): string {
  if (!Number.isInteger(cents)) return '0,00 €';
  const euros = cents / 100;
  return euros.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
}

function isDisputeData(data: any): data is DisputeData {
  return 'type' in data && data.type === 'payment_dispute';
}

function isReturnData(data: any): data is ReturnData {
  return 'type' in data && data.type === 'return_request';
}

function validateOrderData(order: OrderData): void {
  // Basic validation without throwing error to prevent crashing the flow
  // Just ensure we have valid numbers for calculations
  order.subtotal = order.subtotal || 0;
  order.impuestos = order.impuestos || 0;
  order.envio = order.envio || 0;
  order.descuento = order.descuento || 0;
  order.total = order.total || 0;
}

// =============================================================================
// RESPONSIVE STYLES (INLINED WHERE POSSIBLE, BUT ALSO HEAD)
// =============================================================================

const EMAIL_HEAD = `
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FashionStore</title>
  <style>
    body { margin: 0; padding: 0; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; max-width: 100% !important; }
      .mobile-padding { padding-left: 15px !important; padding-right: 15px !important; }
      .mobile-stack { display: block !important; width: 100% !important; }
      .mobile-center { text-align: center !important; }
      .mobile-right { text-align: right !important; }
      .mobile-hidden { display: none !important; }
      .item-row { display: block !important; width: 100% !important; padding-bottom: 15px !important; border-bottom: 1px solid #eeeeee; margin-bottom: 15px; }
      .item-image { width: 80px !important; float: left; margin-right: 15px; }
      .item-details { overflow: hidden; }
      .header-title { font-size: 24px !important; }
    }
  </style>
</head>
`;

// =============================================================================
// SEND EMAIL (LOW LEVEL)
// =============================================================================

// Singleton transporter — reuse TCP connections, avoid re-handshake per email
let _transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (_transporter) return _transporter;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.error('[EMAIL] ❌ CRITICAL: SMTP credentials missing. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env');
    // ─── WHERE TO PUT ENVIRONMENT VARIABLES ───
    // .env file at project root:
    //   SMTP_HOST=smtp.gmail.com
    //   SMTP_PORT=587
    //   SMTP_USER=fashionstorerbv@gmail.com
    //   SMTP_PASS=xxxx xxxx xxxx xxxx   ← Gmail App Password (NOT your regular password)
    //   SMTP_FROM=FashionStore <fashionstorerbv@gmail.com>
    //
    // For Gmail: Enable 2FA → Google Account → Security → App Passwords → generate one
    return null;
  }

  _transporter = (nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    // Connection pool for reliability
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
    // Timeouts to prevent hanging
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 30_000,
  }) as any);

  console.log(`[EMAIL] Transporter created → ${SMTP_HOST}:${SMTP_PORT} (user: ${SMTP_USER})`);
  return _transporter;
}

/**
 * Verify SMTP connection is alive.
 * Call on server startup to fail fast if credentials are wrong.
 * Returns true if connection is OK, false otherwise.
 */
export async function verifySmtpConnection(): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) {
    console.error('[EMAIL] ❌ Cannot verify — transporter not created (missing SMTP env vars).');
    return false;
  }

  try {
    await transporter.verify();
    console.log('[EMAIL] ✅ SMTP connection verified successfully.');
    return true;
  } catch (error: any) {
    const code = error.code || error.responseCode || 'UNKNOWN';
    console.error(`[EMAIL] ❌ SMTP verify FAILED — code: ${code}, message: ${error.message}`);

    if (code === 'EAUTH' || error.responseCode === 535) {
      console.error('[EMAIL]    → Authentication failed. Check SMTP_USER and SMTP_PASS (use App Password for Gmail).');
    } else if (code === 'ECONNREFUSED') {
      console.error('[EMAIL]    → Connection refused. Check SMTP_HOST and SMTP_PORT.');
    } else if (code === 'ESOCKET' || code === 'ETIMEDOUT') {
      console.error('[EMAIL]    → Network timeout. Ensure SMTP server is reachable and port is correct.');
    }

    return false;
  }
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  console.log('[EMAIL] Sending to:', options.to);

  const transporter = getTransporter();
  if (!transporter) {
    console.error('[EMAIL] ❌ CRITICAL: SMTP credentials missing — cannot send.');
    return false;
  }

  try {
    const info = await transporter.sendMail({
      from: SMTP_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments,
    });

    console.log(`[EMAIL] ✅ Email sent successfully — messageId: ${info.messageId}`);
    return true;
  } catch (error: any) {
    const code = error.code || error.responseCode || 'UNKNOWN';
    console.error(`[EMAIL] ❌ Failed to send email — errorCode: ${code}`);
    console.error(`[EMAIL]    to: ${options.to}`);
    console.error(`[EMAIL]    subject: ${options.subject}`);
    console.error(`[EMAIL]    message: ${error.message}`);

    // Reset transporter on auth/connection errors so next attempt creates fresh one
    if (['EAUTH', 'ECONNREFUSED', 'ESOCKET', 'ETIMEDOUT', 'ECONNRESET'].includes(code)) {
      console.error('[EMAIL]    → Resetting transporter for next retry.');
      _transporter = null;
    }

    return false;
  }
}

// =============================================================================
// HTML BUILDERS
// =============================================================================

function buildItemsRows(items: OrderItem[]): string {
  let html = '';

  for (const item of items) {
    const lineTotal = item.precio_unitario * item.cantidad;
    const details = [
      item.talla ? `Talla: ${item.talla}` : '',
      item.color ? `Color: ${item.color}` : ''
    ].filter(Boolean).join(' | ');

    // Desktop view uses table cells, but we style it to stack on mobile via CSS if possible
    // or use a smart grid layout safe for emails
    html += `
    <tr>
      <td style="padding: 15px 0; border-bottom: 1px solid #f0f0f0;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <!-- IMAGEN -->
            <td width="70" style="vertical-align: top; padding-right: 15px;">
              ${item.imagen ? `<img src="${item.imagen}" width="70" height="70" style="border-radius: 8px; object-fit: cover; border: 1px solid #eee; display: block;" alt="${item.nombre}">` : ''}
            </td>
            
            <!-- DETALLES -->
            <td style="vertical-align: top;">
              <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 4px;">
                ${item.nombre}
              </div>
              ${details ? `<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; color: #6b7280; margin-bottom: 4px;">${details}</div>` : ''}
              <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; color: #6b7280;">
                Cant: ${item.cantidad} x ${formatPrice(item.precio_unitario)}
              </div>
            </td>

            <!-- PRECIO TOTAL ROW -->
            <td style="vertical-align: top; text-align: right; white-space: nowrap;" width="90">
              <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 700; color: #111827;">
                ${formatPrice(lineTotal)}
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
  }
  return html;
}

// =============================================================================
// SEND ORDER CONFIRMATION
// =============================================================================

export async function sendOrderConfirmationEmail(order: OrderData): Promise<boolean> {
  validateOrderData(order);

  // Generate PDF Invoice
  let attachments = [];
  try {
    const pdfBuffer = await generateInvoicePDF({
      numero_orden: order.numero_orden,
      fecha: new Date().toISOString(),
      nombre_cliente: order.nombre,
      email_cliente: order.email,
      telefono_cliente: order.telefono,
      direccion: order.direccion ? {
        calle: order.direccion.calle,
        ciudad: order.direccion.ciudad,
        codigo_postal: order.direccion.codigo_postal,
        pais: order.direccion.pais,
      } : undefined,
      items: order.items.map(item => ({
        nombre: item.nombre,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        precio_original: item.precio_original,
        talla: item.talla,
        color: item.color,
      })),
      subtotal: order.subtotal,
      descuento: order.descuento,
      impuestos: order.impuestos,
      total: order.total,
    });

    attachments.push({
      filename: `Factura-${order.numero_orden}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf',
    });
  } catch (e) {
    console.error('PDF Generation failed', e);
  }

  // ── Global PDF attachment from company_settings ──
  try {
    const { data: companyRow } = await supabase
      .from('company_settings')
      .select('invoice_attachment_path')
      .limit(1)
      .single();

    if (companyRow?.invoice_attachment_path) {
      // Try multiple paths to find the attachment
      const tryPaths = [
        pathMod.resolve('public', companyRow.invoice_attachment_path.replace(/^\//, '')),
        pathMod.resolve(companyRow.invoice_attachment_path.replace(/^\//, '')),
      ];

      for (const p of tryPaths) {
        if (fs.existsSync(p)) {
          attachments.push({
            filename: 'Condiciones_FashionStore.pdf',
            path: p,
            contentType: 'application/pdf',
          });
          console.log(`[EMAIL] ✅ Global PDF adjuntado: ${p}`);
          break;
        }
      }
    }
  } catch (e) {
    console.error('[EMAIL] Error al cargar adjunto global:', e);
  }

  const itemsHTML = buildItemsRows(order.items);
  const addressBlock = order.direccion ?
    `${order.direccion.calle || ''}<br>
     ${order.direccion.codigo_postal || ''} ${order.direccion.ciudad || ''}<br>
     ${order.direccion.pais || ''}` : 'Dirección no disponible';

  const html = `<!DOCTYPE html>
  <html>
    ${EMAIL_HEAD}
    <body style="background-color: ${BG_COLOR}; margin: 0; padding: 0;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${BG_COLOR}">
        <tr>
          <td align="center" style="padding: 20px 10px;">
            <!-- CONTAINER -->
            <table class="container" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
              
              <!-- HEADER -->
              <tr>
                <td style="background-color: #111827; padding: 25px 20px; text-align: center;">
                  <img src="${LOGO_URL}" alt="FashionStore" width="120" height="auto" style="width: 120px; height: auto; display: block; margin: 0 auto; border: 0;">
                </td>
              </tr>

              <!-- SUCCESS MESSAGE -->
              <tr>
                <td class="mobile-padding" style="padding: 40px 40px 20px 40px; text-align: center;">
                  <div style="background-color: #ecfdf5; color: ${BRAND_COLOR}; width: 64px; height: 64px; border-radius: 50%; margin: 0 auto 20px auto; line-height: 64px; font-size: 32px;">✓</div>
                  <h1 class="header-title" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 30px; font-weight: 800; color: #111827; margin: 0 0 10px 0;">¡Pedido Confirmado!</h1>
                  <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; color: #6b7280; margin: 0; line-height: 1.5;">
                    Gracias por tu compra, ${order.nombre.split(' ')[0]}. Hemos recibido tu pedido correctamente.
                  </p>
                </td>
              </tr>

              <!-- ORDER INFO BAR -->
              <tr>
                <td class="mobile-padding" style="padding: 0 40px 30px 40px;">
                  <table width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f9fafb; border-radius: 12px; border: 1px solid #f3f4f6;">
                    <tr>
                      <td width="50%" class="mobile-stack mobile-center" style="padding: 20px; border-right: 1px solid #f3f4f6; text-align: center;">
                        <span style="display: block; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; margin-bottom: 5px;">Pedido</span>
                        <span style="display: block; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 700; color: #111827;">#${order.numero_orden}</span>
                      </td>
                      <td width="50%" class="mobile-stack mobile-center" style="padding: 20px; text-align: center;">
                        <span style="display: block; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; margin-bottom: 5px;">Fecha</span>
                        <span style="display: block; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 700; color: #111827;">${new Date().toLocaleDateString('es-ES')}</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- ITEMS LIST -->
              <tr>
                <td class="mobile-padding" style="padding: 0 40px;">
                  <h3 style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #111827; border-bottom: 2px solid #111827; padding-bottom: 10px; margin: 0 0 15px 0;">Tu Pedido</h3>
                  <table width="100%" cellspacing="0" cellpadding="0" border="0">
                    ${itemsHTML}
                  </table>
                </td>
              </tr>

              <!-- TOTALS -->
              <tr>
                <td class="mobile-padding" style="padding: 0 40px 30px 40px;">
                  <table width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tr><td height="15" style="border-bottom: 1px solid #f0f0f0;"></td></tr>
                    <tr><td height="15"></td></tr>
                  </table>
                  <table width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td style="padding: 5px 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; color: #6b7280;">Subtotal</td>
                      <td style="padding: 5px 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; color: #111827; text-align: right; font-weight: 600;">${formatPrice(order.subtotal)}</td>
                    </tr>
                    <tr>
                      <td style="padding: 5px 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; color: #6b7280;">Envío</td>
                      <td style="padding: 5px 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; color: #111827; text-align: right; font-weight: 600;">${order.envio > 0 ? formatPrice(order.envio) : 'Gratis'}</td>
                    </tr>
                    <tr>
                      <td style="padding: 5px 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; color: #6b7280;">IVA (21%)</td>
                      <td style="padding: 5px 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; color: #111827; text-align: right; font-weight: 600;">${formatPrice(order.impuestos)}</td>
                    </tr>
                    ${order.descuento > 0 ? `
                    <tr>
                      <td style="padding: 5px 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; color: ${BRAND_COLOR};">Descuento</td>
                      <td style="padding: 5px 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; color: ${BRAND_COLOR}; text-align: right; font-weight: 600;">-${formatPrice(order.descuento)}</td>
                    </tr>` : ''}
                    <tr><td height="10"></td><td height="10"></td></tr>
                    <tr>
                      <td style="padding: 15px 0; border-top: 2px solid #111827; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 800; color: #111827;">Total</td>
                      <td style="padding: 15px 0; border-top: 2px solid #111827; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 800; color: ${BRAND_COLOR}; text-align: right;">${formatPrice(order.total)}</td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- DETAILS (ADDRESS) -->
              <tr>
                <td class="mobile-padding" style="padding: 0 40px 40px 40px; background-color: #f9fafb; border-top: 1px solid #f3f4f6;">
                   <table width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 30px;">
                     <tr>
                       <td class="mobile-stack" style="vertical-align: top; padding-bottom: 20px;">
                         <h4 style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; text-transform: uppercase; color: #111827; margin: 0 0 10px 0;">Dirección de Envío</h4>
                         <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; color: #4b5563; line-height: 1.6; margin: 0;">
                           <strong>${order.nombre}</strong><br>
                           ${addressBlock}
                         </p>
                       </td>
                       <td class="mobile-stack" style="vertical-align: top;">
                         <h4 style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; text-transform: uppercase; color: #111827; margin: 0 0 10px 0;">¿Qué sigue?</h4>
                         <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; color: #4b5563; line-height: 1.6; margin: 0;">
                           Recibirás otro email cuando tu pedido salga del almacén. El tiempo estimado es de 3-5 días laborables.
                         </p>
                       </td>
                     </tr>
                   </table>
                   
                   <!-- CTA -->
                   <table width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 30px;">
                     <tr>
                       <td align="center">
                         <a href="${SITE_URL}/mis-pedidos" style="display: inline-block; padding: 16px 32px; background-color: ${BRAND_COLOR}; color: #ffffff; text-decoration: none; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: bold; border-radius: 8px;">
                           Ver Mis Pedidos
                         </a>
                       </td>
                     </tr>
                   </table>
                </td>
              </tr>

              <!-- FOOTER -->
              <tr>
                <td style="background-color: #111827; padding: 30px; text-align: center;">
                  <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; color: #9ca3af; margin: 0;">
                    &copy; ${new Date().getFullYear()} FashionStore. Todos los derechos reservados.
                  </p>
                  <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; color: #6b7280; margin: 10px 0 0 0;">
                    Has recibido este email porque realizaste una compra en FashionStore.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;

  return await sendEmail({
    to: order.email,
    subject: `✅ Pedido Confirmado #${order.numero_orden}`,
    html: html,
    attachments: attachments,
  });
}

// =============================================================================
// SEND ADMIN NOTIFICATION
// =============================================================================

export async function sendAdminNotificationEmail(data: OrderData | DisputeData | ReturnData): Promise<boolean> {
  console.log('[EMAIL] sendAdminNotificationEmail called');
  if (!ADMIN_EMAIL) {
    console.log('[EMAIL] No ADMIN_EMAIL defined, skipping info to admin');
    return true;
  }

  if (isDisputeData(data)) {
    // Keep existing dispute template
    const html = `<!DOCTYPE html>
      <html><body>
        <h1>⚠️ DISPUTA DE PAGO ABIERTA</h1>
        <p>Se ha abierto una disputa en Stripe.</p>
        <ul>
          <li><strong>Pedido:</strong> #${data.order_number}</li>
          <li><strong>Cliente:</strong> ${data.customer_name} (${data.customer_email})</li>
          <li><strong>ID Disputa:</strong> ${data.dispute_id}</li>
        </ul>
        <p><a href="https://dashboard.stripe.com/disputes/${data.dispute_id}">Ver en Stripe Dashboard</a></p>
      </body></html>`;

    return await sendEmail({
      to: ADMIN_EMAIL,
      subject: `[DISPUTA] Pedido #${data.order_number} - Disputa Abierta`,
      html: html,
    });
  }

  if (isReturnData(data)) {
    const html = `<!DOCTYPE html>
    <html>
      ${EMAIL_HEAD}
      <body style="background-color: ${BG_COLOR}; margin: 0; padding: 0;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${BG_COLOR}">
          <tr>
            <td align="center" style="padding: 20px 10px;">
              <table class="container" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
                <tr>
                   <td style="background-color: #dc2626; padding: 20px; text-align: center;">
                     <h1 style="font-family: sans-serif; font-size: 18px; color: #ffffff; margin: 0; text-transform: uppercase;">Nueva Devolución</h1>
                   </td>
                </tr>
                <tr>
                  <td style="padding: 30px;">
                    <div style="margin-bottom: 25px; text-align: center;">
                       <div style="font-family: sans-serif; font-size: 14px; color: #6b7280; text-transform: uppercase; margin-bottom: 5px;">Pedido Afectado</div>
                       <div style="font-family: sans-serif; font-size: 20px; font-weight: bold; color: #111827;">#${data.order_number}</div>
                    </div>

                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
                      <tr>
                        <td width="30%" style="font-family: sans-serif; font-size: 14px; color: #6b7280; padding: 8px 0;">Cliente:</td>
                        <td style="font-family: sans-serif; font-size: 14px; color: #111827; font-weight: bold;">${data.customer_name}</td>
                      </tr>
                      <tr>
                        <td style="font-family: sans-serif; font-size: 14px; color: #6b7280; padding: 8px 0;">Email:</td>
                        <td style="font-family: sans-serif; font-size: 14px; color: #111827;">${data.customer_email}</td>
                      </tr>
                      <tr>
                        <td style="font-family: sans-serif; font-size: 14px; color: #6b7280; padding: 8px 0;">Total Pedido:</td>
                        <td style="font-family: sans-serif; font-size: 14px; color: #111827;">${formatPrice(data.total)}</td>
                      </tr>
                       <tr>
                        <td style="font-family: sans-serif; font-size: 14px; color: #6b7280; padding: 8px 0;">Motivo:</td>
                        <td style="font-family: sans-serif; font-size: 14px; color: #dc2626; font-weight: bold;">${data.return_reason}</td>
                      </tr>
                    </table>

                     <a href="${SITE_URL}/admin-secret-login" style="display: block; padding: 14px; background-color: #111827; color: #ffffff; text-decoration: none; font-weight: bold; border-radius: 8px; font-family: sans-serif; text-align: center;">
                       Gestionar Devolución
                     </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>`;

    return await sendEmail({
      to: ADMIN_EMAIL,
      subject: `[DEVOLUCIÓN] Solicitud para Pedido #${data.order_number}`,
      html: html,
    });
  }

  // NEW ORDER ADMIN EMAIL
  const order = data as OrderData;
  validateOrderData(order);

  const itemsHTML = buildItemsRows(order.items);
  const adminLink = `${SITE_URL}/admin-secret-login`;

  const html = `<!DOCTYPE html>
  <html>
    ${EMAIL_HEAD}
    <body style="background-color: ${BG_COLOR}; margin: 0; padding: 0;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${BG_COLOR}">
        <tr>
          <td align="center" style="padding: 20px 10px;">
            <table class="container" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
              
              <!-- ADMIN HEADER -->
              <tr>
                <td style="background-color: #111827; padding: 20px; text-align: center;">
                  <h1 style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 18px; color: #ffffff; margin: 0; text-transform: uppercase; letter-spacing: 2px;">Nueva Venta</h1>
                </td>
              </tr>

              <!-- INFO GRID -->
              <tr>
                <td style="padding: 30px;">
                  <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 25px; font-family: monospace; font-size: 20px; font-weight: bold;">
                    +${formatPrice(order.total)}
                  </div>

                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td width="50%" class="mobile-stack" style="vertical-align: top; padding-bottom: 20px;">
                        <div style="font-size: 11px; text-transform: uppercase; color: #6b7280; font-family: sans-serif;">Cliente</div>
                        <div style="font-size: 16px; font-weight: bold; color: #111827; font-family: sans-serif;">${order.nombre}</div>
                        <div style="font-size: 14px; color: #2563eb; font-family: sans-serif;"><a href="mailto:${order.email}" style="color: #2563eb; text-decoration: none;">${order.email}</a></div>
                      </td>
                      <td width="50%" class="mobile-stack" style="vertical-align: top; text-align: right;">
                        <div style="font-size: 11px; text-transform: uppercase; color: #6b7280; font-family: sans-serif;">Pedido</div>
                        <div style="font-size: 16px; font-weight: bold; color: #111827; font-family: sans-serif;">#${order.numero_orden}</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- ITEMS -->
              <tr>
                <td style="padding: 0 30px 30px 30px;">
                  <div style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
                    <h3 style="margin: 0 0 15px 0; font-size: 14px; color: #374151; font-family: sans-serif;">Detalle de productos</h3>
                    <table width="100%" cellspacing="0" cellpadding="0" border="0">
                      ${itemsHTML}
                    </table>
                  </div>
                </td>
              </tr>

              <!-- CTA -->
              <tr>
                <td style="padding: 0 30px 30px 30px; text-align: center;">
                  <a href="${adminLink}" style="display: block; padding: 14px; background-color: #f3f4f6; color: #374151; text-decoration: none; font-weight: bold; border-radius: 8px; font-family: sans-serif; border: 1px solid #e5e7eb;">
                    Administrar Pedido
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;

  return await sendEmail({
    to: ADMIN_EMAIL,
    subject: `💰 Nueva venta: #${order.numero_orden} (${formatPrice(order.total)}) - ${order.nombre}`,
    html: html,
  });
}

// =============================================================================
// SEND STATUS UPDATE
// =============================================================================

export async function sendOrderStatusUpdateEmail(
  email: string,
  nombre: string,
  numero_orden: string,
  nuevo_estado: string,
  tracking?: string
): Promise<boolean> {
  const statusMessages: Record<string, { title: string; message: string; color: string }> = {
    Pendiente: { title: 'Pedido Pendiente 🕒', message: 'Tu pedido está pendiente de procesamiento.', color: '#f59e0b' },
    Pagado: { title: 'Pago Recibido ✅', message: 'Hemos recibido tu pago correctamente.', color: '#059669' },
    'En Proceso': { title: 'Pedido en Proceso ⚙️', message: 'Estamos preparando tu pedido.', color: '#3b82f6' },
    Enviado: { title: 'Tu pedido está en camino 🚚', message: '¡Buenas noticias! Hemos enviado tu pedido.', color: '#2563eb' },
    Entregado: { title: 'Pedido Entregado 📦', message: 'Tu pedido ha sido entregado correctamente.', color: '#16a34a' },
    Completado: { title: 'Pedido Completado 🌟', message: 'Tu pedido ha sido marcado como completado.', color: '#059669' },
    Cancelado: { title: 'Pedido Cancelado ❌', message: 'Tu pedido ha sido cancelado.', color: '#dc2626' },
  };

  const status = statusMessages[nuevo_estado] || {
    title: `Actualización: ${nuevo_estado}`,
    message: `El estado de tu pedido ha cambiado a: ${nuevo_estado}.`,
    color: '#6b7280'
  };
  const trackingHTML = (tracking && (nuevo_estado === 'Enviado' || nuevo_estado === 'Completado')) ?
    `<div style="background-color: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; padding: 15px; border-radius: 8px; margin: 20px 0;">
       <strong>Tracking:</strong> ${tracking}
     </div>` : '';

  const html = `<!DOCTYPE html>
  <html>
    ${EMAIL_HEAD}
    <body style="background-color: ${BG_COLOR}; margin: 0; padding: 0;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${BG_COLOR}">
        <tr>
          <td align="center" style="padding: 20px 10px;">
            <table class="container" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden;">
              <tr>
                <td style="padding: 40px 30px; text-align: center;">
                  <img src="${LOGO_URL}" alt="FashionStore" width="120" height="auto" style="width: 120px; height: auto; display: block; margin: 0 auto 20px auto; border: 0;">
                  <h1 style="color: ${status.color}; font-family: sans-serif; margin-bottom: 10px;">${status.title}</h1>
                  <p style="color: #4b5563; font-family: sans-serif; font-size: 16px; margin-bottom: 5px;">Hola ${nombre},</p>
                  <p style="color: #4b5563; font-family: sans-serif; font-size: 16px; margin-bottom: 20px;">${status.message}</p>
                  
                  <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-family: sans-serif; color: #374151;">
                    Pedido <strong>#${numero_orden}</strong>
                  </div>

                  ${trackingHTML}

                  <a href="${SITE_URL}/mis-pedidos" style="display: inline-block; padding: 12px 24px; background-color: #111827; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-family: sans-serif;">
                    Ver detalles
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;

  return await sendEmail({ to: email, subject: status.title, html });
}

// =============================================================================
// RETURN INSTRUCTIONS EMAIL
// =============================================================================

export async function sendReturnInstructionsEmail(
  email: string,
  nombre: string,
  numero_orden: string,
  return_number: string
): Promise<boolean> {
  const html = `<!DOCTYPE html>
  <html>
    ${EMAIL_HEAD}
    <body style="background-color: ${BG_COLOR}; margin: 0; padding: 0;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${BG_COLOR}">
        <tr>
          <td align="center" style="padding: 20px 10px;">
            <table class="container" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden;">
              <tr>
                <td style="padding: 40px 30px; text-align: center;">
                  <img src="${LOGO_URL}" alt="FashionStore" width="120" height="auto" style="width: 120px; height: auto; display: block; margin: 0 auto 20px auto; border: 0;">
                  <h1 style="color: #111827; font-family: sans-serif; font-size: 24px; margin-bottom: 15px;">Solicitud de Devolución Recibida</h1>
                  <p style="color: #4b5563; font-family: sans-serif; font-size: 16px; line-height: 1.6; margin-bottom: 10px;">
                    Hola ${nombre}, hemos recibido tu solicitud de devolución para el pedido <strong>#${numero_orden}</strong>.
                  </p>
                  <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; font-family: monospace; color: #111827; font-size: 18px;">
                    RMA: ${return_number}
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding: 0 40px 40px 40px;">
                   <h3 style="font-family: sans-serif; color: #111827; font-size: 16px; margin-bottom: 15px;">Instrucciones:</h3>
                   <ol style="color: #4b5563; font-family: sans-serif; font-size: 15px; line-height: 1.6; padding-left: 20px;">
                     <li style="margin-bottom: 10px;">Empaqueta los productos en su embalaje original.</li>
                     <li style="margin-bottom: 10px;">Incluye una nota con el número de RMA dentro del paquete.</li>
                     <li style="margin-bottom: 10px;">Envía el paquete a la siguiente dirección:</li>
                   </ol>
                   <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; font-family: sans-serif; color: #374151; font-size: 14px; margin-top: 20px;">
                     <strong>FashionStore Devoluciones</strong><br>
                     Calle Principal 123, Nave 4<br>
                     28000 Madrid, España
                   </div>
                   <p style="margin-top: 20px; font-size: 14px; color: #6b7280; font-family: sans-serif;">
                     Una vez recibamos el paquete, procesaremos tu reembolso en un plazo de 3 a 5 días laborables.
                   </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;

  return await sendEmail({ to: email, subject: `Instrucciones de Devolución #${numero_orden}`, html });
}

// =============================================================================
// WELCOME EMAIL
// =============================================================================

export async function sendWelcomeEmail(email: string, nombre: string): Promise<boolean> {
  const html = `<!DOCTYPE html>
  <html>
    ${EMAIL_HEAD}
    <body style="background-color: ${BG_COLOR}; margin: 0; padding: 0;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${BG_COLOR}">
        <tr>
          <td align="center" style="padding: 20px 10px;">
            <table class="container" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden;">
              <tr>
                <td style="padding: 40px 30px; text-align: center;">
                  <img src="${LOGO_URL}" alt="FashionStore" width="120" height="auto" style="width: 120px; height: auto; display: block; margin: 0 auto 20px auto; border: 0;">
                  <h1 style="color: #111827; font-family: sans-serif; font-size: 24px; margin-bottom: 15px;">¡Bienvenido/a, ${nombre}!</h1>
                  <p style="color: #4b5563; font-family: sans-serif; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                    Gracias por unirte a FashionStore. Estamos encantados de tenerte con nosotros. Explora nuestra colección y encuentra tu estilo.
                  </p>
                  <a href="${SITE_URL}" style="display: inline-block; padding: 14px 32px; background-color: ${BRAND_COLOR}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-family: sans-serif;">
                    Empezar a comprar
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;

  return await sendEmail({ to: email, subject: '¡Bienvenido a FashionStore! 🎉', html });
}

// =============================================================================
// CONTACT FORM EMAIL
// =============================================================================

export async function sendNewsletterWelcomeEmail(email: string, codigo: string): Promise<boolean> {
  const html = `<!DOCTYPE html>
  <html>
    ${EMAIL_HEAD}
    <body style="background-color: ${BG_COLOR}; margin: 0; padding: 0;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${BG_COLOR}">
        <tr>
          <td align="center" style="padding: 20px 10px;">
            <table class="container" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden;">
              <tr>
                <td style="padding: 40px 30px; text-align: center;">
                  <img src="${LOGO_URL}" alt="FashionStore" width="120" height="auto" style="width: 120px; height: auto; display: block; margin: 0 auto 20px auto; border: 0;">
                  <h1 style="color: ${BRAND_COLOR}; font-family: sans-serif; font-size: 28px; margin-bottom: 10px; font-weight: 800;">¡Gracias por suscribirte!</h1>
                  <p style="color: #4b5563; font-family: sans-serif; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                    Te damos la bienvenida a nuestra newsletter. Aquí tienes tu código de descuento exclusivo para tu primera compra:
                  </p>
                  
                  <div style="background-color: #f0fdf4; border: 2px dashed ${BRAND_COLOR}; padding: 20px; border-radius: 12px; margin-bottom: 25px; display: inline-block;">
                    <span style="display: block; font-family: sans-serif; font-size: 12px; color: #166534; text-transform: uppercase; margin-bottom: 5px; font-weight: bold;">Tu Código de Descuento</span>
                    <span style="display: block; font-family: monospace; font-size: 32px; font-weight: 800; color: ${BRAND_COLOR}; letter-spacing: 2px;">${codigo}</span>
                  </div>

                  <p style="color: #6b7280; font-family: sans-serif; font-size: 14px; margin-bottom: 30px;">
                    Este código es válido por 30 días. ¡Disfrútalo!
                  </p>

                  <a href="${SITE_URL}" style="display: inline-block; padding: 16px 32px; background-color: #111827; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-family: sans-serif; font-size: 16px;">
                    Ir a la tienda
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;

  return await sendEmail({ to: email, subject: '¡Tu código de 10% de descuento! 🎁', html });
}

export async function sendContactFormEmail(
  nombre: string,
  email: string,
  asunto: string,
  mensaje: string
): Promise<boolean> {
  if (!ADMIN_EMAIL) return false;

  const html = `<!DOCTYPE html>
  <html>
    ${EMAIL_HEAD}
    <body style="background-color: ${BG_COLOR}; margin: 0; padding: 0;">
       <table cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${BG_COLOR}">
        <tr>
          <td align="center" style="padding: 20px 10px;">
            <table class="container" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden;">
              <tr>
                <td style="background-color: #111827; padding: 20px; text-align: center;">
                  <h1 style="color: #ffffff; font-family: sans-serif; font-size: 18px; margin: 0;">Nuevo Mensaje de Contacto</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 30px;">
                  <div style="margin-bottom: 20px;">
                    <strong style="display: block; font-family: sans-serif; font-size: 11px; color: #6b7280; text-transform: uppercase;">De</strong>
                    <span style="font-family: sans-serif; font-size: 16px; color: #111827;">${nombre}</span> <a href="mailto:${email}" style="color: #2563eb;">&lt;${email}&gt;</a>
                  </div>
                  <div style="margin-bottom: 20px;">
                     <strong style="display: block; font-family: sans-serif; font-size: 11px; color: #6b7280; text-transform: uppercase;">Asunto</strong>
                     <span style="font-family: sans-serif; font-size: 16px; color: #111827;">${asunto}</span>
                  </div>
                  <div>
                    <strong style="display: block; font-family: sans-serif; font-size: 11px; color: #6b7280; text-transform: uppercase; margin-bottom: 5px;">Mensaje</strong>
                    <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; color: #374151; font-family: sans-serif; line-height: 1.6;">${mensaje}</div>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;

  return await sendEmail({ to: ADMIN_EMAIL, subject: `[CONTACTO] ${asunto} - ${nombre}`, html });
}
