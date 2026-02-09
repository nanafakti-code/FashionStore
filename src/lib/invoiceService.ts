/**
 * FASHIONSTORE — INVOICE PDF SERVICE (Server-side)
 * =================================================
 * Genera facturas PDF idénticas al panel de administración.
 * Usa jsPDF + jspdf-autotable (mismo motor que BillingSettings).
 * Todos los precios son INTEGER CENTS (se dividen por 100).
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// ── Tipos ──
interface InvoiceItem {
  nombre: string;
  cantidad: number;
  precio_unitario: number; // cents
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
  subtotal: number;   // cents
  descuento: number;  // cents
  impuestos: number;  // cents
  envio?: number;     // cents
  total: number;      // cents
}

// ── Company constants (mismos que BillingSettings) ──
const COMPANY = {
  nombre: 'FashionStore',
  nif: 'B-12345678',
  email: 'fashionstorerbv@gmail.com',
  telefono: '+34 658 823 543',
  direccion: 'Chipiona, Cádiz',
  pais: 'España',
};

// ── Helpers ──
function fmtNum(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',');
}

function fmtDateFull(d: string): string {
  return new Date(d).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

// ── Main export ──
export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const w = doc.internal.pageSize.getWidth();

  // ═══════════════════════════════════════════════
  // HEADER VERDE
  // ═══════════════════════════════════════════════
  doc.setFillColor(0, 170, 69);
  doc.rect(0, 0, w, 38, 'F');

  doc.setTextColor(255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURA', 15, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`#${data.numero_orden}`, 15, 26);
  doc.text(fmtDateFull(data.fecha), 15, 32);

  // Logo text right
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('FashionStore', w - 15, 18, { align: 'right' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(COMPANY.email, w - 15, 25, { align: 'right' });
  doc.text(`${COMPANY.direccion}, ${COMPANY.pais}`, w - 15, 30, { align: 'right' });
  doc.text(`NIF: ${COMPANY.nif}`, w - 15, 35, { align: 'right' });

  // ═══════════════════════════════════════════════
  // INFO BOXES
  // ═══════════════════════════════════════════════
  const yInfo = 48;

  doc.setTextColor(100);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURADO A', 15, yInfo);
  doc.text('DATOS DE PAGO', w / 2 + 10, yInfo);

  // Client info
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30);
  doc.setFontSize(10);
  doc.text(data.nombre_cliente || '—', 15, yInfo + 7);

  doc.setFontSize(9);
  doc.setTextColor(80);
  doc.text(data.email_cliente || '', 15, yInfo + 13);
  if (data.telefono_cliente) {
    doc.text(data.telefono_cliente, 15, yInfo + 18);
  }

  if (data.direccion) {
    const parts = [
      data.direccion.calle,
      data.direccion.ciudad,
      data.direccion.codigo_postal,
      data.direccion.pais,
    ].filter(Boolean);
    if (parts.length > 0) {
      doc.setFontSize(8);
      doc.text(parts.join(', ').substring(0, 70), 15, yInfo + 24);
    }
  }

  // Payment info
  doc.setFontSize(10);
  doc.setTextColor(30);
  doc.text('Estado: Pagado', w / 2 + 10, yInfo + 7);
  doc.setTextColor(80);
  doc.setFontSize(9);
  doc.text(`Fecha pago: ${fmtDateFull(data.fecha)}`, w / 2 + 10, yInfo + 13);

  // ═══════════════════════════════════════════════
  // TABLA DE ITEMS
  // ═══════════════════════════════════════════════
  const tableY = yInfo + 34;

  autoTable(doc, {
    startY: tableY,
    head: [['Producto', 'Talla', 'Color', 'Cant.', 'P. Unit.', 'Subtotal']],
    body: data.items.map(i => [
      i.nombre || '—',
      i.talla || '—',
      i.color || '—',
      String(i.cantidad),
      `${fmtNum(i.precio_unitario)} €`,
      `${fmtNum(i.precio_unitario * i.cantidad)} €`,
    ]),
    theme: 'grid',
    headStyles: {
      fillColor: [0, 170, 69],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: { fontSize: 9, textColor: [40, 40, 40] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 55 },
      3: { halign: 'center' as const, cellWidth: 15 },
      4: { halign: 'right' as const, cellWidth: 25 },
      5: { halign: 'right' as const, cellWidth: 25 },
    },
    margin: { left: 15, right: 15 },
  });

  // ═══════════════════════════════════════════════
  // TOTALES
  // ═══════════════════════════════════════════════
  const finalY = (doc as any).lastAutoTable?.finalY || tableY + 30;
  const totX = w - 75;
  let tY = finalY + 10;

  const printRow = (label: string, value: string, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    if (bold) { doc.setTextColor(30); doc.setFontSize(11); }
    else      { doc.setTextColor(80); doc.setFontSize(9);  }
    doc.text(label, totX, tY);
    doc.text(value, w - 15, tY, { align: 'right' });
    tY += bold ? 8 : 6;
  };

  printRow('Subtotal', `${fmtNum(data.subtotal)} €`);
  printRow('Impuestos', `${fmtNum(data.impuestos)} €`);
  if (data.descuento > 0) printRow('Descuento', `-${fmtNum(data.descuento)} €`);
  if (data.envio && data.envio > 0) printRow('Envío', `${fmtNum(data.envio)} €`);

  doc.setDrawColor(200);
  doc.line(totX, tY - 2, w - 15, tY - 2);
  tY += 2;

  printRow('TOTAL', `${fmtNum(data.total)} €`, true);

  // ═══════════════════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════════════════
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFillColor(248, 250, 252);
  doc.rect(0, pageH - 20, w, 20, 'F');
  doc.setFontSize(7);
  doc.setTextColor(150);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `${COMPANY.nombre} · ${COMPANY.nif} · ${COMPANY.direccion}, ${COMPANY.pais}`,
    w / 2, pageH - 12, { align: 'center' }
  );
  doc.text('Gracias por su compra', w / 2, pageH - 7, { align: 'center' });

  // ── Retornar como Buffer ──
  const arrayBuf = doc.output('arraybuffer');
  return Buffer.from(arrayBuf);
}
