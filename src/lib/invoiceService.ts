/**
 * FASHIONSTORE - INVOICE PDF SERVICE
 * ===================================
 * Genera facturas en PDF para pedidos
 */

import PDFDocument from 'pdfkit';
import { Buffer } from 'buffer';

interface InvoiceItem {
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  precio_original?: number;
  talla?: string;
  color?: string;
}

interface InvoiceData {
  numero_orden: string;
  fecha: string;
  nombre_cliente: string;
  email_cliente: string;
  telefono_cliente?: string;
  direccion?: {
    calle?: string;
    ciudad?: string;
    codigo_postal?: string;
    pais?: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  descuento: number;
  impuestos: number;
  envio?: number;
  total: number;
}

// Helper para formato estricto de precio
function formatPrice(cents: number): string {
  if (!Number.isInteger(cents)) {
    console.error('[INVOICE CRITICAL] Price must be integer cents:', cents);
    // For safety in invoice generation, we might floor it or throw. 
    // Consistent with email service:
    cents = Math.round(cents);
  }
  return (cents / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
}

// Helper to fetch image buffer
async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('[INVOICE] Error fetching logo:', error);
    return null;
  }
}

// Helper to separate PDF generation logic
async function buildPdfContent(doc: PDFKit.PDFDocument, data: InvoiceData): Promise<void> {
  const LOGO_URL = 'https://res.cloudinary.com/djvj32zic/image/upload/v1769980559/admin-logo_qq0qlz.png';

  // 1. HEADER
  const logoBuffer = await fetchImageBuffer(LOGO_URL);

  if (logoBuffer) {
    doc.image(logoBuffer, 50, 45, { width: 140 });
  } else {
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#000000').text('FASHIONSTORE', 50, 50);
  }

  // Company Info (Right Aligned) - NO EMOJIS to avoid encoding issues
  doc.fontSize(9).font('Helvetica').fillColor('#666666');
  doc.text('Tienda Online de Moda', 350, 50, { align: 'right' });
  doc.text('info@fashionstore.com', 350, 65, { align: 'right' });
  doc.text('fashionstorerbv3.victoriafp.online', 350, 80, { align: 'right' });

  // Divider
  doc.moveTo(50, 115).lineTo(545, 115).stroke('#e5e7eb');

  // 2. INVOICE DETAILS & BILLING INFO
  const startY = 140;

  // Column 1: Client Info
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#111827').text('FACTURADO A', 50, startY);
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica').fillColor('#374151');
  doc.text(data.nombre_cliente, { width: 250 });
  doc.text(data.email_cliente);
  if (data.telefono_cliente) doc.text(data.telefono_cliente);

  if (data.direccion) {
    doc.moveDown(0.5);
    if (data.direccion.calle) doc.text(data.direccion.calle);
    doc.text(`${data.direccion.codigo_postal || ''} ${data.direccion.ciudad || ''} ${data.direccion.pais || ''}`);
  }

  // Column 2: Invoice Meta
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#111827').text('Nº FACTURA', 350, startY, { align: 'right' });
  doc.fontSize(10).font('Helvetica').fillColor('#374151').text(data.numero_orden, 350, doc.y, { align: 'right' });

  doc.moveDown(1);
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#111827').text('FECHA', 350, doc.y, { align: 'right' });
  doc.fontSize(10).font('Helvetica').fillColor('#374151').text(new Date(data.fecha).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'long', year: 'numeric'
  }), 350, doc.y, { align: 'right' });

  // 3. ITEMS TABLE
  const tableTop = 260;
  const colProduct = 50;
  const colQty = 330;
  const colPrice = 380;
  const colTotal = 470;
  const colTotalRight = 545; // Right edge for alignment

  // Table Header
  doc.rect(50, tableTop - 15, 495, 25).fill('#f9fafb');
  doc.fillColor('#111827').font('Helvetica-Bold').fontSize(9);
  doc.text('PRODUCTO', colProduct + 10, tableTop - 7);
  doc.text('CANT.', colQty, tableTop - 7, { align: 'center', width: 40 });
  doc.text('PRECIO', colPrice, tableTop - 7, { align: 'right', width: 70 });
  doc.text('TOTAL', colTotal, tableTop - 7, { align: 'right', width: 75 });

  let y = tableTop + 25;

  // Table Items
  doc.font('Helvetica').fontSize(9).fillColor('#374151');

  data.items.forEach((item) => {
    const totalItem = item.precio_unitario * item.cantidad;
    const itemDesc = `${item.nombre} ${item.talla ? `(${item.talla})` : ''} ${item.color ? `- ${item.color}` : ''}`;

    // Calculate height needed
    const nameHeight = doc.heightOfString(itemDesc, { width: 260 });
    const rowHeight = Math.max(nameHeight, 20); // Min height

    // Check page break
    if (y + rowHeight > 700) {
      doc.addPage();
      y = 50;
    }

    doc.text(itemDesc, colProduct + 10, y, { width: 260 });
    doc.text(item.cantidad.toString(), colQty, y, { align: 'center', width: 40 });
    doc.text(formatPrice(item.precio_unitario), colPrice, y, { align: 'right', width: 70 });
    doc.text(formatPrice(totalItem), colTotal, y, { align: 'right', width: 75 });

    y += rowHeight + 10;

    // Tiny divider line
    doc.save()
      .moveTo(50, y - 5)
      .lineTo(545, y - 5)
      .lineWidth(0.5)
      .stroke('#f3f4f6')
      .restore();
  });

  // 4. SUMMARY
  y += 20;
  const summaryXLabel = 350;
  const summaryXValue = 450;
  const valueWidth = 95;

  doc.fontSize(10);

  // Subtotal
  doc.font('Helvetica').fillColor('#374151');
  doc.text('Subtotal', summaryXLabel, y, { align: 'right', width: 90 });
  doc.text(formatPrice(data.subtotal), summaryXValue, y, { align: 'right', width: valueWidth });
  y += 18;

  // Envío
  doc.text('Envío', summaryXLabel, y, { align: 'right', width: 90 });
  doc.text(data.envio !== undefined && data.envio > 0 ? formatPrice(data.envio) : 'Gratis', summaryXValue, y, { align: 'right', width: valueWidth });
  y += 18;

  // Descuento (only if exists)
  if (data.descuento > 0) {
    doc.fillColor('#16a34a');
    doc.text('Descuento', summaryXLabel, y, { align: 'right', width: 90 });
    doc.text('-' + formatPrice(data.descuento), summaryXValue, y, { align: 'right', width: valueWidth });
    y += 18;
  }

  // Impuestos
  doc.fillColor('#374151');
  doc.text('IVA (incluido)', summaryXLabel, y, { align: 'right', width: 90 });
  doc.text(formatPrice(data.impuestos), summaryXValue, y, { align: 'right', width: valueWidth });
  y += 25;

  // Total
  doc.rect(summaryXLabel, y - 8, 200, 30).fill('#f9fafb');
  doc.fillColor('#111827').font('Helvetica-Bold').fontSize(12);
  doc.text('TOTAL', summaryXLabel + 10, y, { align: 'left', width: 90 });
  doc.text(formatPrice(data.total), summaryXValue, y, { align: 'right', width: valueWidth });


  // 5. FOOTER
  const footerY = 750;
  doc.fontSize(8).font('Helvetica').fillColor('#9ca3af');
  doc.text('Gracias por su confianza', 50, footerY, { align: 'center' });
  doc.text('FashionStore - Tienda Online de Moda', 50, footerY + 12, { align: 'center' });
}

export function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', chunks.push.bind(chunks));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      buildPdfContent(doc, data)
        .then(() => doc.end())
        .catch(reject);

    } catch (error) {
      reject(error);
    }
  });
}
