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
  total: number;
}

/**
 * Genera una factura en PDF
 * @returns Buffer con el contenido del PDF
 */
export function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 40,
        size: 'A4',
      });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk: any) => {
        chunks.push(chunk);
      });

      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });

      doc.on('error', (err: any) => {
        reject(err);
      });

      // ============================================================
      // HEADER - LOGO Y DATOS EMPRESA
      // ============================================================
      doc.fontSize(20).font('Helvetica-Bold').text('FASHIONSTORE', { align: 'left' });
      doc.fontSize(10).font('Helvetica').fillColor('#666666');
      doc.text('FashionStore.com', { align: 'left' });
      doc.text('Email: info@fashionstore.com', { align: 'left' });
      doc.text('Teléfono: +34 912 345 678', { align: 'left' });

      // Línea separadora
      doc.moveTo(40, doc.y + 10).lineTo(550, doc.y + 10).stroke('#cccccc');
      doc.moveDown();

      // ============================================================
      // TÍTULO Y NÚMERO DE FACTURA
      // ============================================================
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#000000');
      doc.text('FACTURA', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').fillColor('#666666').text(
        `Factura: ${data.numero_orden} | Fecha: ${new Date(data.fecha).toLocaleDateString('es-ES')}`,
        { align: 'center' }
      );
      doc.moveDown();

      // ============================================================
      // DATOS CLIENTE Y EMPRESA (2 COLUMNAS)
      // ============================================================
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000').text('CLIENTE', 40);
      doc.fontSize(9).font('Helvetica').fillColor('#000000');
      doc.text(data.nombre_cliente, 40);
      if (data.telefono_cliente) {
        doc.text(`Tel: ${data.telefono_cliente}`);
      }
      doc.text(`Email: ${data.email_cliente}`);

      if (data.direccion) {
        doc.moveDown(0.5);
        doc.text('DIRECCIÓN DE ENVÍO:', 40);
        doc.fontSize(9).fillColor('#666666');
        if (data.direccion.calle) doc.text(data.direccion.calle);
        doc.text(
          `${data.direccion.codigo_postal || ''} ${data.direccion.ciudad || ''}`
        );
        if (data.direccion.pais) {
          doc.text(data.direccion.pais);
        }
      }

      doc.moveDown();

      // ============================================================
      // TABLA DE ARTÍCULOS
      // ============================================================
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000');

      // Encabezados tabla
      const tableTop = doc.y;
      const col1 = 40;
      const col2 = 280;
      const col3 = 420;
      const col4 = 500;

      doc.text('Producto', col1, tableTop);
      doc.text('Cantidad', col2, tableTop);
      doc.text('P.U.', col3, tableTop, { align: 'right' });
      doc.text('Total', col4, tableTop, { align: 'right' });

      // Línea separadora
      doc.moveTo(40, doc.y + 5).lineTo(550, doc.y + 5).stroke('#cccccc');
      doc.moveDown();

      // Datos tabla
      doc.fontSize(9).font('Helvetica').fillColor('#000000');

      data.items.forEach((item) => {
        const itemTotal = (item.precio_unitario * item.cantidad) / 100;
        const unitPrice = (item.precio_unitario / 100).toFixed(2);

        const itemText = `${item.nombre}${item.talla ? ` (${item.talla})` : ''}${
          item.color ? ` - ${item.color}` : ''
        }`;

        doc.text(itemText, col1, doc.y, { width: col2 - col1 - 10 });
        doc.text(item.cantidad.toString(), col2, doc.y - doc.heightOfString(itemText), {
          align: 'center',
        });
        doc.text(unitPrice + ' €', col3, doc.y - doc.heightOfString(itemText), {
          align: 'right',
        });
        doc.text(itemTotal.toFixed(2) + ' €', col4, doc.y - doc.heightOfString(itemText), {
          align: 'right',
        });

        doc.moveDown();
      });

      // Línea separadora
      doc.moveTo(40, doc.y + 5).lineTo(550, doc.y + 5).stroke('#cccccc');
      doc.moveDown();

      // ============================================================
      // RESUMEN FINANCIERO
      // ============================================================
      const summaryX = 380;
      doc.fontSize(9).font('Helvetica');

      const subtotal = (data.subtotal / 100).toFixed(2);
      const descuento = (data.descuento / 100).toFixed(2);
      const impuestos = (data.impuestos / 100).toFixed(2);
      const total = (data.total / 100).toFixed(2);

      doc.fillColor('#666666');
      doc.text('Subtotal:', summaryX);
      doc.text(subtotal + ' €', 480, doc.y - 10, { align: 'right' });

      if (data.descuento > 0) {
        doc.moveDown();
        doc.text('Descuento:', summaryX);
        doc.fillColor('#16a34a');
        doc.text('-' + descuento + ' €', 480, doc.y - 10, { align: 'right' });
        doc.fillColor('#666666');
      }

      doc.moveDown();
      doc.text('IVA (21%):', summaryX);
      doc.text(impuestos + ' €', 480, doc.y - 10, { align: 'right' });

      doc.moveDown();
      doc.font('Helvetica-Bold').fillColor('#000000').fontSize(11);
      doc.text('TOTAL:', summaryX);
      doc.text(total + ' €', 480, doc.y - 10, { align: 'right' });

      doc.moveDown(2);

      // ============================================================
      // NOTAS Y PIE DE PÁGINA
      // ============================================================
      doc.fontSize(8).fillColor('#999999');
      doc.moveTo(40, doc.y).lineTo(550, doc.y).stroke('#cccccc');
      doc.moveDown();

      doc.text(
        'Gracias por su compra. Esta factura es válida como comprobante de pago. Para cualquier duda, contáctenos.',
        40,
        doc.y,
        { width: 510, align: 'center' }
      );

      doc.moveDown();
      doc.fontSize(7).fillColor('#cccccc');
      doc.text(`FashionStore - ${new Date().getFullYear()} | Factura: ${data.numero_orden}`, {
        align: 'center',
      });

      // Finalizar documento
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
