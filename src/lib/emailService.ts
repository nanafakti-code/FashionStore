// emailService.ts - Clean, Minimal Email Service
// ALL prices are INTEGER CENTS. Only formatPrice divides by 100.

import nodemailer from 'nodemailer';

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

import {
  generateInvoicePDF,
} from './invoiceService';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
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
const ADMIN_EMAIL = import.meta.env.ADMIN_EMAIL || '';
const LOGO_URL = 'https://res.cloudinary.com/djvj32zic/image/upload/v1769980559/admin-logo_qq0qlz.png';

// =============================================================================
// TYPE GUARDS
// =============================================================================

function isDisputeData(data: any): data is DisputeData {
  return 'type' in data && data.type === 'payment_dispute';
}

function isReturnData(data: any): data is ReturnData {
  return 'type' in data && data.type === 'return_request';
}

// =============================================================================
// HELPER: FORMAT PRICE (ONLY place that divides by 100)
// =============================================================================

function formatPrice(cents: number): string {
  if (!Number.isInteger(cents)) {
    throw new Error('[EMAIL CRITICAL] Price must be integer cents, got: ' + cents);
  }
  const euros = cents / 100;
  return euros.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
}

// =============================================================================
// HELPER: VALIDATE DATA
// =============================================================================

function validateOrderData(order: OrderData): void {
  const fields = ['subtotal', 'impuestos', 'envio', 'descuento', 'total'];
  for (const field of fields) {
    const value = order[field as keyof OrderData] as number;
    if (!Number.isInteger(value)) {
      throw new Error('[EMAIL CRITICAL] Field ' + field + ' must be integer cents, got: ' + value);
    }
  }
  for (const item of order.items) {
    if (!Number.isInteger(item.precio_unitario)) {
      throw new Error('[EMAIL CRITICAL] Item precio_unitario must be integer cents, got: ' + item.precio_unitario);
    }
  }
}

function validateReturnData(data: ReturnData): void {
  if (!Number.isInteger(data.total)) {
    throw new Error('[EMAIL CRITICAL] Return total must be integer cents, got: ' + data.total);
  }
  if (!data.order_number) throw new Error('Missing order_number');
  if (!data.customer_email) throw new Error('Missing customer_email');
}

// =============================================================================
// SEND EMAIL (LOW LEVEL)
// =============================================================================

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  console.log('[EMAIL] ========================================');
  console.log('[EMAIL] sendEmail() CALLED');
  console.log('[EMAIL] To:', options.to);
  console.log('[EMAIL] Subject:', options.subject);
  console.log('[EMAIL] ========================================');

  // CRITICAL: Validate SMTP configuration
  console.log('[EMAIL] SMTP_HOST:', SMTP_HOST ? '✓ SET' : '✗ MISSING');
  console.log('[EMAIL] SMTP_PORT:', SMTP_PORT);
  console.log('[EMAIL] SMTP_USER:', SMTP_USER ? '✓ SET' : '✗ MISSING');
  console.log('[EMAIL] SMTP_PASS:', SMTP_PASS ? '✓ SET (hidden)' : '✗ MISSING');
  console.log('[EMAIL] SMTP_FROM:', SMTP_FROM);

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    const errorMsg = '[EMAIL] ❌ CRITICAL: SMTP credentials are NOT configured. Email CANNOT be sent.';
    console.error(errorMsg);
    console.error('[EMAIL] Missing: ' +
      (!SMTP_HOST ? 'SMTP_HOST ' : '') +
      (!SMTP_USER ? 'SMTP_USER ' : '') +
      (!SMTP_PASS ? 'SMTP_PASS' : '')
    );
    // DO NOT return true - this was hiding the problem!
    throw new Error('SMTP credentials not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS environment variables.');
  }

  try {
    console.log('[EMAIL] Creating nodemailer transporter...');
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    console.log('[EMAIL] Transporter created. Calling sendMail()...');

    const result = await transporter.sendMail({
      from: SMTP_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments,
    });

    console.log('[EMAIL] ✅ sendMail() SUCCESS');
    console.log('[EMAIL] Message ID:', result.messageId);
    console.log('[EMAIL] Response:', result.response);
    return true;
  } catch (error: any) {
    console.error('[EMAIL] ❌ sendMail() FAILED');
    console.error('[EMAIL] Error name:', error.name);
    console.error('[EMAIL] Error message:', error.message);
    console.error('[EMAIL] Error code:', error.code);
    console.error('[EMAIL] Full error:', error);
    // Re-throw so caller knows email failed
    throw error;
  }
}

// =============================================================================
// BUILD ITEMS TABLE ROWS (returns HTML string)
// =============================================================================

function buildItemsHTML(items: OrderItem[]): string {
  let html = '';
  for (const item of items) {
    const lineTotal = item.precio_unitario * item.cantidad;
    const tallaText = item.talla ? 'Talla: ' + item.talla : '';
    const colorText = item.color ? 'Color: ' + item.color : '';
    const details = [tallaText, colorText].filter(Boolean).join(' | ');

    html += '<tr>';
    html += '<td style="padding:12px 8px;border-bottom:1px solid #e0e0e0;vertical-align:top;">';
    html += '<table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>';
    html += '<td width="50" style="vertical-align:top;">';
    if (item.imagen) {
      html += '<img src="' + item.imagen + '" width="50" height="50" style="display:block;border:1px solid #eee;" alt="' + item.nombre + '">';
    }
    html += '</td>';
    html += '<td style="padding-left:10px;vertical-align:top;">';
    html += '<div style="font-weight:bold;color:#333;">' + item.nombre + '</div>';
    if (details) {
      html += '<div style="font-size:12px;color:#666;margin-top:4px;">' + details + '</div>';
    }
    html += '</td>';
    html += '</tr></table>';
    html += '</td>';
    html += '<td style="padding:12px 8px;border-bottom:1px solid #e0e0e0;text-align:center;vertical-align:top;">' + item.cantidad + '</td>';
    html += '<td style="padding:12px 8px;border-bottom:1px solid #e0e0e0;text-align:right;vertical-align:top;font-weight:bold;">' + formatPrice(lineTotal) + '</td>';
    html += '</tr>';
  }
  return html;
}

// =============================================================================
// MAIN: SEND ORDER CONFIRMATION EMAIL
// =============================================================================

export async function sendOrderConfirmationEmail(order: OrderData): Promise<boolean> {
  try {
    // Validate all prices are integers
    validateOrderData(order);

    // Debug log (values must be integer cents)
    console.log('[EMAIL DEBUG] Order Confirmation:', {
      numero_orden: order.numero_orden,
      subtotal: order.subtotal,
      impuestos: order.impuestos,
      envio: order.envio,
      descuento: order.descuento,
      total: order.total,
    });

    const fecha = new Date().toLocaleDateString('es-ES');
    const itemsHTML = buildItemsHTML(order.items);

    // ============================================================
    // GENERATE INVOICE PDF
    // ============================================================
    let attachments: any[] = [];
    try {
      console.log('[EMAIL] Generating Invoice PDF...');
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
          precio_unitario: item.precio_unitario, // Integer cents
          precio_original: item.precio_original, // Integer cents
          talla: item.talla,
          color: item.color,
        })),
        subtotal: order.subtotal,
        descuento: order.descuento,
        impuestos: order.impuestos,
        total: order.total,
      });

      attachments.push({
        filename: `Factura-FashionStore-${order.numero_orden}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      });
      console.log('[EMAIL] ✅ PDF Invoice generated successfully');
    } catch (pdfError) {
      console.error('[EMAIL] ❌ Failed to generate PDF invoice:', pdfError);
      // Continue sending email even if PDF fails, but log error
    }


    // Build discount row if applicable
    let discountRow = '';
    if (order.descuento > 0) {
      discountRow = '<tr><td style="padding:6px 0;color:#16a34a;">Descuento</td><td style="padding:6px 0;text-align:right;color:#16a34a;">-' + formatPrice(order.descuento) + '</td></tr>';
    }

    // Build address
    let addressHTML = 'Direccion no disponible';
    if (order.direccion) {
      addressHTML = '';
      if (order.direccion.calle) addressHTML += order.direccion.calle + '<br>';
      if (order.direccion.codigo_postal || order.direccion.ciudad) {
        addressHTML += (order.direccion.codigo_postal || '') + ' ' + (order.direccion.ciudad || '') + '<br>';
      }
      addressHTML += order.direccion.pais || 'Espana';
    }

    // Build email HTML (TABLE-BASED, INLINE CSS ONLY)
    const html = '<!DOCTYPE html>' +
      '<html>' +
      '<head><meta charset="utf-8"><title>Pedido Confirmado</title></head>' +
      '<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,sans-serif;">' +
      '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f5f5f5;padding:40px 20px;">' +
      '<tr><td align="center">' +
      '<table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color:#ffffff;border:1px solid #e0e0e0;">' +

      // Header with logo
      '<tr><td style="padding:30px;text-align:center;border-bottom:2px solid #333;">' +
      '<img src="' + LOGO_URL + '" alt="FashionStore" style="max-height:60px;max-width:150px;">' +
      '</td></tr>' +

      // Title
      '<tr><td style="padding:30px 30px 20px 30px;text-align:center;">' +
      '<h1 style="margin:0;font-size:22px;color:#333;font-weight:normal;">PEDIDO CONFIRMADO</h1>' +
      '<p style="margin:10px 0 0 0;color:#666;font-size:14px;">Gracias por tu compra</p>' +
      '</td></tr>' +

      // Order info
      '<tr><td style="padding:0 30px 20px 30px;">' +
      '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-bottom:1px solid #e0e0e0;padding-bottom:15px;">' +
      '<tr>' +
      '<td style="vertical-align:top;">' +
      '<div style="font-size:11px;color:#666;text-transform:uppercase;">Numero de Pedido</div>' +
      '<div style="font-size:16px;font-weight:bold;color:#333;margin-top:4px;">#' + order.numero_orden + '</div>' +
      '</td>' +
      '<td style="text-align:right;vertical-align:top;">' +
      '<div style="font-size:11px;color:#666;text-transform:uppercase;">Fecha</div>' +
      '<div style="font-size:16px;color:#333;margin-top:4px;">' + fecha + '</div>' +
      '</td>' +
      '</tr>' +
      '</table>' +
      '</td></tr>' +

      // Items table
      '<tr><td style="padding:0 30px 20px 30px;">' +
      '<table cellpadding="0" cellspacing="0" border="0" width="100%">' +
      '<tr>' +
      '<th style="text-align:left;font-size:11px;color:#666;padding-bottom:10px;border-bottom:1px solid #333;">PRODUCTO</th>' +
      '<th style="text-align:center;font-size:11px;color:#666;padding-bottom:10px;border-bottom:1px solid #333;">CANT.</th>' +
      '<th style="text-align:right;font-size:11px;color:#666;padding-bottom:10px;border-bottom:1px solid #333;">PRECIO</th>' +
      '</tr>' +
      itemsHTML +
      '</table>' +
      '</td></tr>' +

      // Totals
      '<tr><td style="padding:0 30px 20px 30px;">' +
      '<table cellpadding="0" cellspacing="0" border="0" width="100%">' +
      '<tr><td width="50%"></td><td width="50%">' +
      '<table cellpadding="0" cellspacing="0" border="0" width="100%">' +
      '<tr><td style="padding:6px 0;color:#666;">Subtotal</td><td style="padding:6px 0;text-align:right;">' + formatPrice(order.subtotal) + '</td></tr>' +
      '<tr><td style="padding:6px 0;color:#666;">Envio</td><td style="padding:6px 0;text-align:right;">' + (order.envio > 0 ? formatPrice(order.envio) : 'Gratis') + '</td></tr>' +
      '<tr><td style="padding:6px 0;color:#666;">IVA (21%)</td><td style="padding:6px 0;text-align:right;">' + formatPrice(order.impuestos) + '</td></tr>' +
      discountRow +
      '<tr><td style="padding:12px 0;border-top:1px solid #333;font-weight:bold;font-size:16px;">Total</td><td style="padding:12px 0;border-top:1px solid #333;text-align:right;font-weight:bold;font-size:16px;">' + formatPrice(order.total) + '</td></tr>' +
      '</table>' +
      '</td></tr>' +
      '</table>' +
      '</td></tr>' +

      // Shipping address
      '<tr><td style="padding:0 30px 30px 30px;">' +
      '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top:1px solid #e0e0e0;padding-top:20px;">' +
      '<tr>' +
      '<td style="vertical-align:top;width:50%;">' +
      '<div style="font-size:11px;color:#666;text-transform:uppercase;margin-bottom:8px;">Direccion de Envio</div>' +
      '<div style="color:#333;font-size:14px;line-height:1.5;">' +
      '<strong>' + order.nombre + '</strong><br>' +
      addressHTML +
      '</div>' +
      '</td>' +
      '<td style="vertical-align:top;width:50%;">' +
      '<div style="font-size:11px;color:#666;text-transform:uppercase;margin-bottom:8px;">Proximos Pasos</div>' +
      '<div style="color:#333;font-size:14px;line-height:1.5;">' +
      'Estamos procesando tu pedido.<br>' +
      'Recibiras un email con el seguimiento.<br>' +
      'Entrega: 3-5 dias laborables.' +
      '</div>' +
      '</td>' +
      '</tr>' +
      '</table>' +
      '</td></tr>' +

      // CTA button
      '<tr><td style="padding:0 30px 30px 30px;text-align:center;">' +
      '<a href="' + SITE_URL + '/mis-pedidos" style="display:inline-block;background-color:#333;color:#ffffff;padding:14px 40px;text-decoration:none;font-size:14px;font-weight:bold;">VER MIS PEDIDOS</a>' +
      '</td></tr>' +

      // Footer
      '<tr><td style="padding:20px 30px;background-color:#f9f9f9;text-align:center;border-top:1px solid #e0e0e0;">' +
      '<p style="margin:0;color:#999;font-size:11px;">' +
      '&copy; ' + new Date().getFullYear() + ' FashionStore. Todos los derechos reservados.' +
      '</p>' +
      '</td></tr>' +

      '</table>' +
      '</td></tr>' +
      '</table>' +
      '</body>' +
      '</html>';

    return await sendEmail({
      to: order.email,
      subject: 'Pedido Confirmado #' + order.numero_orden,
      html: html,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

  } catch (error) {
    console.error('[EMAIL] Error in sendOrderConfirmationEmail:', error);
    return false;
  }
}

// =============================================================================
// ADMIN NOTIFICATION EMAIL
// =============================================================================

export async function sendAdminNotificationEmail(data: OrderData | DisputeData | ReturnData): Promise<boolean> {
  if (!ADMIN_EMAIL) {
    console.log('[EMAIL] No ADMIN_EMAIL configured, skipping admin notification');
    return true;
  }

  // HANDLE DISPUTE
  if (isDisputeData(data)) {
    try {
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
    } catch (error) {
      console.error('[EMAIL] Error sending dispute notification:', error);
      return false;
    }
  }

  // HANDLE RETURN REQUEST
  if (isReturnData(data)) {
    try {
      validateReturnData(data);

      const html = `<!DOCTYPE html>
      <html><body>
        <h1>↩️ SOLICITUD DE DEVOLUCIÓN</h1>
        <p>Se ha solicitado una devolución.</p>
        <ul>
          <li><strong>Pedido:</strong> #${data.order_number}</li>
          <li><strong>Cliente:</strong> ${data.customer_name} (${data.customer_email})</li>
          <li><strong>Total Pedido:</strong> ${formatPrice(data.total)}</li>
          <li><strong>Items:</strong> ${data.items_count}</li>
          <li><strong>Motivo:</strong> ${data.return_reason}</li>
        </ul>
        <p>Revisa el panel de administración para aprobar o rechazar.</p>
      </body></html>`;

      return await sendEmail({
        to: ADMIN_EMAIL,
        subject: `[DEVOLUCIÓN] Solicitud para Pedido #${data.order_number}`,
        html: html,
      });
    } catch (error) {
      console.error('[EMAIL] Error sending return notification:', error);
      return false;
    }
  }

  // HANDLE NEW ORDER (Fallback)
  // We assume it's OrderData if not the others, but we must treat it as such
  const order = data as OrderData;
  try {
    validateOrderData(order);

    const fecha = new Date().toLocaleDateString('es-ES', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    const itemsHTML = buildItemsHTML(order.items);

    // Admin dashboard URL
    const adminLink = `${SITE_URL}/admin-secret-login`;

    const html = '<!DOCTYPE html>' +
      '<html><head><meta charset="utf-8"><title>Nueva Venta - Admin</title></head>' +
      '<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,sans-serif;">' +
      '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f5f5f5;padding:40px 20px;">' +
      '<tr><td align="center">' +
      '<table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color:#ffffff;border:1px solid #e0e0e0;">' +

      // Header
      '<tr><td style="padding:20px;background-color:#1a1a1a;text-align:center;">' +
      '<img src="' + LOGO_URL + '" alt="FashionStore" style="max-height:50px;">' +
      '<h1 style="margin:10px 0 0 0;font-size:18px;color:#ffffff;text-transform:uppercase;letter-spacing:1px;">NUEVA VENTA REALIZADA</h1>' +
      '</td></tr>' +

      // Main Info
      '<tr><td style="padding:30px;">' +
      '<table cellpadding="0" cellspacing="0" border="0" width="100%">' +
      '<tr>' +
      '<td style="vertical-align:top;padding-bottom:20px;">' +
      '<div style="font-size:12px;color:#666;text-transform:uppercase;margin-bottom:5px;">Cliente</div>' +
      '<div style="font-size:16px;color:#333;font-weight:bold;">' + order.nombre + '</div>' +
      '<div style="font-size:14px;color:#666;"><a href="mailto:' + order.email + '" style="color:#2563eb;text-decoration:none;">' + order.email + '</a></div>' +
      (order.telefono ? '<div style="font-size:14px;color:#666;">' + order.telefono + '</div>' : '') +
      '</td>' +
      '<td style="text-align:right;vertical-align:top;padding-bottom:20px;">' +
      '<div style="font-size:12px;color:#666;text-transform:uppercase;margin-bottom:5px;">Pedido</div>' +
      '<div style="font-size:16px;color:#333;font-weight:bold;">#' + order.numero_orden + '</div>' +
      '<div style="font-size:14px;color:#666;">' + fecha + '</div>' +
      '</td>' +
      '</tr>' +
      '</table>' +

      // Items Table
      '<div style="margin-top:20px;border-top:1px solid #e0e0e0;padding-top:20px;">' +
      '<div style="font-size:12px;color:#666;text-transform:uppercase;margin-bottom:15px;font-weight:bold;">Detalle del Pedido</div>' +
      '<table cellpadding="0" cellspacing="0" border="0" width="100%">' +
      itemsHTML +
      '</table>' +
      '</div>' +

      // Totals
      '<div style="margin-top:20px;border-top:1px solid #e0e0e0;padding-top:20px;">' +
      '<table cellpadding="0" cellspacing="0" border="0" width="100%">' +
      '<tr><td style="text-align:right;padding:5px 0;">Subtotal: <strong>' + formatPrice(order.subtotal) + '</strong></td></tr>' +
      '<tr><td style="text-align:right;padding:5px 0;">Envío: <strong>' + (order.envio > 0 ? formatPrice(order.envio) : 'Gratis') + '</strong></td></tr>' +
      (order.descuento > 0 ? '<tr><td style="text-align:right;padding:5px 0;color:#16a34a;">Descuento: <strong>-' + formatPrice(order.descuento) + '</strong></td></tr>' : '') +
      '<tr><td style="text-align:right;padding:15px 0;font-size:18px;color:#1a1a1a;">Total Ingreso: <strong>' + formatPrice(order.total) + '</strong></td></tr>' +
      '</table>' +
      '</div>' +

      // Actions
      '<div style="margin-top:30px;text-align:center;">' +
      '<a href="' + adminLink + '" style="display:inline-block;background-color:#1a1a1a;color:#ffffff;padding:14px 40px;text-decoration:none;font-size:14px;font-weight:bold;border-radius:4px;">GESTIONAR EN PANEL ADMIN</a>' +
      '</div>' +

      '</td></tr>' +
      '</table>' +
      '</td></tr>' +
      '</table>' +
      '</body></html>';

    return await sendEmail({
      to: ADMIN_EMAIL,
      subject: `[NUEVA VENTA] #${order.numero_orden} - ${formatPrice(order.total)} - ${order.nombre}`,
      html: html,
    });

  } catch (error) {
    console.error('[EMAIL] Error in sendAdminNotificationEmail:', error);
    return false;
  }
}

// =============================================================================
// ORDER STATUS UPDATE EMAIL
// =============================================================================

export async function sendOrderStatusUpdateEmail(
  email: string,
  nombre: string,
  numero_orden: string,
  nuevo_estado: 'Enviado' | 'Entregado' | 'Cancelado',
  tracking?: string
): Promise<boolean> {
  try {
    const statusMessages: Record<string, { title: string; message: string; color: string }> = {
      Enviado: {
        title: 'Tu pedido esta en camino',
        message: 'Hemos enviado tu pedido. Pronto lo recibiras.',
        color: '#2563eb',
      },
      Entregado: {
        title: 'Pedido entregado',
        message: 'Tu pedido ha sido entregado. Esperamos que disfrutes tu compra.',
        color: '#16a34a',
      },
      Cancelado: {
        title: 'Pedido cancelado',
        message: 'Tu pedido ha sido cancelado. Si tienes dudas, contacta con soporte.',
        color: '#dc2626',
      },
    };

    const status = statusMessages[nuevo_estado];

    if (!status) {
      console.error('[EMAIL] Invalid estado:', nuevo_estado);
      return false;
    }

    let trackingHTML = '';
    if (tracking && nuevo_estado === 'Enviado') {
      trackingHTML = '<p style="margin:20px 0;padding:15px;background-color:#f0f9ff;border:1px solid #bae6fd;"><strong>Numero de seguimiento:</strong> ' + tracking + '</p>';
    }

    const html = '<!DOCTYPE html>' +
      '<html><head><meta charset="utf-8"><title>Actualizacion de Pedido</title></head>' +
      '<body style="margin:0;padding:20px;background-color:#f5f5f5;font-family:Arial,sans-serif;">' +
      '<table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color:#ffffff;border:1px solid #e0e0e0;margin:0 auto;">' +
      '<tr><td style="padding:30px;text-align:center;border-bottom:2px solid ' + status.color + ';">' +
      '<img src="' + LOGO_URL + '" alt="FashionStore" style="max-height:50px;">' +
      '</td></tr>' +
      '<tr><td style="padding:30px;text-align:center;">' +
      '<h1 style="margin:0 0 10px 0;font-size:20px;color:' + status.color + ';">' + status.title + '</h1>' +
      '<p style="margin:0;color:#666;">' + status.message + '</p>' +
      '<p style="margin:20px 0;padding:15px;background-color:#f5f5f5;"><strong>Pedido:</strong> #' + numero_orden + '</p>' +
      trackingHTML +
      '<a href="' + SITE_URL + '/mis-pedidos" style="display:inline-block;background-color:#333;color:#ffffff;padding:12px 30px;text-decoration:none;font-size:14px;">VER PEDIDO</a>' +
      '</td></tr>' +
      '<tr><td style="padding:20px;background-color:#f9f9f9;text-align:center;">' +
      '<p style="margin:0;color:#999;font-size:11px;">&copy; ' + new Date().getFullYear() + ' FashionStore</p>' +
      '</td></tr>' +
      '</table>' +
      '</body></html>';

    return await sendEmail({
      to: email,
      subject: 'Pedido #' + numero_orden + ': ' + status.title,
      html: html,
    });

  } catch (error) {
    console.error('[EMAIL] Error in sendOrderStatusUpdateEmail:', error);
    return false;
  }
}

// =============================================================================
// WELCOME EMAIL
// =============================================================================

export async function sendWelcomeEmail(email: string, nombre: string): Promise<boolean> {
  try {
    const html = '<!DOCTYPE html>' +
      '<html><head><meta charset="utf-8"><title>Bienvenido a FashionStore</title></head>' +
      '<body style="margin:0;padding:20px;background-color:#f5f5f5;font-family:Arial,sans-serif;">' +
      '<table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color:#ffffff;border:1px solid #e0e0e0;margin:0 auto;">' +
      '<tr><td style="padding:30px;text-align:center;border-bottom:2px solid #000;">' +
      '<img src="' + LOGO_URL + '" alt="FashionStore" style="max-height:50px;">' +
      '</td></tr>' +
      '<tr><td style="padding:40px 30px;text-align:center;">' +
      '<h1 style="margin:0 0 20px 0;font-size:24px;color:#333;">¡Bienvenido/a, ' + nombre + '!</h1>' +
      '<p style="margin:0 0 30px 0;color:#666;line-height:1.6;">Gracias por unirte a FashionStore. Estamos encantados de tenerte con nosotros.</p>' +
      '<a href="' + SITE_URL + '" style="display:inline-block;background-color:#000;color:#ffffff;padding:14px 40px;text-decoration:none;font-size:14px;font-weight:bold;border-radius:4px;">EMPEZAR A COMPRAR</a>' +
      '</td></tr>' +
      '<tr><td style="padding:30px;background-color:#f9f9f9;text-align:center;font-size:12px;color:#999;">' +
      '&copy; ' + new Date().getFullYear() + ' FashionStore' +
      '</td></tr>' +
      '</table>' +
      '</body></html>';

    return await sendEmail({
      to: email,
      subject: '¡Bienvenido a FashionStore! 🎉',
      html: html,
    });
  } catch (error) {
    console.error('[EMAIL] Error in sendWelcomeEmail:', error);
    return false;
  }
}
