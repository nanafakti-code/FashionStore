// =====================================================
// BILLING SETTINGS — Facturación con PDF real
// jsPDF + autotable para facturas y resúmenes
// =====================================================
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY
);

// ── Tipos ──
interface Orden {
  id: string;
  numero_orden: string;
  estado: string;
  total: number;
  subtotal: number;
  impuestos: number;
  descuento: number;
  coste_envio: number;
  nombre_cliente: string;
  email_cliente: string;
  telefono_cliente: string;
  direccion_envio: any;
  fecha_creacion: string;
  fecha_pago: string | null;
}

interface ItemOrden {
  producto_nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  talla: string | null;
  color: string | null;
}

// ── Constantes ──
const COMPANY = {
  nombre: 'FashionStore',
  nif: 'B-12345678',
  email: 'fashionstorerbv@gmail.com',
  telefono: '+34 658 823 543',
  direccion: 'Chipiona, Cádiz',
  pais: 'España',
};

const EXCLUDED_STATES = ['Cancelado', 'Devolucion_Solicitada'];
const BRAND = '#00aa45';

// ── Helpers ──
const fmt = (cents: number) =>
  (cents / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });

const fmtNum = (cents: number) => (cents / 100).toFixed(2).replace('.', ',');

const fmtDate = (d: string) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtDateFull = (d: string) =>
  new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

const STATUS_MAP: Record<string, { bg: string; text: string; label: string }> = {
  Pagado:                 { bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700', label: 'Pagado' },
  Completado:             { bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700', label: 'Completado' },
  Enviado:                { bg: 'bg-blue-50 border-blue-100',       text: 'text-blue-700',    label: 'Enviado' },
  'En Proceso':           { bg: 'bg-amber-50 border-amber-100',     text: 'text-amber-700',   label: 'En Proceso' },
  Pendiente:              { bg: 'bg-slate-50 border-slate-200',     text: 'text-slate-600',   label: 'Pendiente' },
  Cancelado:              { bg: 'bg-red-50 border-red-100',         text: 'text-red-700',     label: 'Cancelado' },
  Devolucion_Solicitada:  { bg: 'bg-orange-50 border-orange-100',   text: 'text-orange-700',  label: 'Devolución' },
  Devuelto:               { bg: 'bg-red-50 border-red-100',         text: 'text-red-600',     label: 'Devuelto' },
};

// ── Component ──
export default function BillingSettings() {
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [search, setSearch] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => { loadOrdenes(); }, []);

  // ── Data fetch ──
  const loadOrdenes = async () => {
    try {
      setLoading(true);
      setError('');
      const { data, error: fetchErr } = await supabase
        .from('ordenes')
        .select('id, numero_orden, estado, total, subtotal, impuestos, descuento, coste_envio, nombre_cliente, email_cliente, telefono_cliente, direccion_envio, fecha_creacion, fecha_pago')
        .order('fecha_creacion', { ascending: false });

      if (fetchErr) throw fetchErr;
      setOrdenes(data || []);
    } catch (err: any) {
      console.error('Error cargando órdenes:', err);
      setError('No se pudieron cargar las facturas.');
    } finally {
      setLoading(false);
    }
  };

  // ── Filtering ──
  const searchLower = search.toLowerCase().trim();
  const filtered = ordenes
    .filter(o => filtroEstado === 'todos' || o.estado === filtroEstado)
    .filter(o => {
      if (!searchLower) return true;
      return (
        o.numero_orden.toLowerCase().includes(searchLower) ||
        (o.email_cliente || '').toLowerCase().includes(searchLower) ||
        (o.nombre_cliente || '').toLowerCase().includes(searchLower)
      );
    });

  // ── Stats (excluir Cancelado y Devolucion_Solicitada) ──
  const validOrders = ordenes.filter(o => !EXCLUDED_STATES.includes(o.estado));
  const totalVentas = validOrders.reduce((s, o) => s + o.total, 0);

  const estados = ['todos', ...Array.from(new Set(ordenes.map(o => o.estado)))];

  // ================================================
  // PDF: Factura individual
  // ================================================
  const downloadInvoice = async (orden: Orden) => {
    setDownloading(orden.id);
    try {
      // Fetch items
      const { data: items } = await supabase
        .from('items_orden')
        .select('producto_nombre, cantidad, precio_unitario, subtotal, talla, color')
        .eq('orden_id', orden.id);

      const rows: ItemOrden[] = items || [];
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const w = doc.internal.pageSize.getWidth();

      // ── Header verde ──
      doc.setFillColor(0, 170, 69);
      doc.rect(0, 0, w, 38, 'F');
      doc.setTextColor(255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('FACTURA', 15, 18);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`#${orden.numero_orden}`, 15, 26);
      doc.text(fmtDateFull(orden.fecha_creacion), 15, 32);

      // Logo text right side
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('FashionStore', w - 15, 18, { align: 'right' });
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(COMPANY.email, w - 15, 25, { align: 'right' });
      doc.text(`${COMPANY.direccion}, ${COMPANY.pais}`, w - 15, 30, { align: 'right' });
      doc.text(`NIF: ${COMPANY.nif}`, w - 15, 35, { align: 'right' });

      // ── Info boxes ──
      const yInfo = 48;
      doc.setTextColor(100);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('FACTURADO A', 15, yInfo);
      doc.text('DATOS DE PAGO', w / 2 + 10, yInfo);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30);
      doc.setFontSize(10);
      doc.text(orden.nombre_cliente || '—', 15, yInfo + 7);
      doc.setFontSize(9);
      doc.setTextColor(80);
      doc.text(orden.email_cliente || '', 15, yInfo + 13);
      doc.text(orden.telefono_cliente || '', 15, yInfo + 18);

      const dir = orden.direccion_envio;
      if (dir) {
        const addr = typeof dir === 'string' ? dir : [dir.calle, dir.ciudad, dir.codigo_postal, dir.pais].filter(Boolean).join(', ');
        if (addr) {
          doc.setFontSize(8);
          doc.text(addr.substring(0, 70), 15, yInfo + 24);
        }
      }

      doc.setFontSize(10);
      doc.setTextColor(30);
      doc.text(`Estado: ${orden.estado}`, w / 2 + 10, yInfo + 7);
      doc.setTextColor(80);
      doc.setFontSize(9);
      doc.text(`Fecha pago: ${orden.fecha_pago ? fmtDateFull(orden.fecha_pago) : 'Pendiente'}`, w / 2 + 10, yInfo + 13);

      // ── Tabla de items ──
      const tableY = yInfo + 34;

      autoTable(doc, {
        startY: tableY,
        head: [['Producto', 'Talla', 'Color', 'Cant.', 'P. Unit.', 'Subtotal']],
        body: rows.map(i => [
          i.producto_nombre || '—',
          i.talla || '—',
          i.color || '—',
          String(i.cantidad),
          `${fmtNum(i.precio_unitario)} €`,
          `${fmtNum(i.subtotal)} €`,
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
          3: { halign: 'center', cellWidth: 15 },
          4: { halign: 'right', cellWidth: 25 },
          5: { halign: 'right', cellWidth: 25 },
        },
        margin: { left: 15, right: 15 },
      });

      // ── Totales ──
      const finalY = (doc as any).lastAutoTable?.finalY || tableY + 30;
      const totX = w - 75;
      let tY = finalY + 10;

      doc.setFontSize(9);
      doc.setTextColor(80);
      const printRow = (label: string, value: string, bold = false) => {
        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        if (bold) doc.setTextColor(30); else doc.setTextColor(80);
        if (bold) doc.setFontSize(11); else doc.setFontSize(9);
        doc.text(label, totX, tY);
        doc.text(value, w - 15, tY, { align: 'right' });
        tY += bold ? 8 : 6;
      };

      printRow('Subtotal', `${fmtNum(orden.subtotal)} €`);
      printRow('Impuestos', `${fmtNum(orden.impuestos)} €`);
      if (orden.descuento > 0) printRow('Descuento', `-${fmtNum(orden.descuento)} €`);
      if (orden.coste_envio > 0) printRow('Envío', `${fmtNum(orden.coste_envio)} €`);
      doc.setDrawColor(200);
      doc.line(totX, tY - 2, w - 15, tY - 2);
      tY += 2;
      printRow('TOTAL', `${fmtNum(orden.total)} €`, true);

      // ── Footer ──
      const pageH = doc.internal.pageSize.getHeight();
      doc.setFillColor(248, 250, 252);
      doc.rect(0, pageH - 20, w, 20, 'F');
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.setFont('helvetica', 'normal');
      doc.text(`${COMPANY.nombre} · ${COMPANY.nif} · ${COMPANY.direccion}, ${COMPANY.pais}`, w / 2, pageH - 12, { align: 'center' });
      doc.text('Gracias por su compra', w / 2, pageH - 7, { align: 'center' });

      doc.save(`Factura_${orden.numero_orden}.pdf`);
    } catch (err) {
      console.error('Error generando PDF:', err);
    } finally {
      setDownloading(null);
    }
  };

  // ================================================
  // PDF: Resumen de periodo
  // ================================================
  const downloadSummary = (period: 'dia' | 'semana' | 'mes') => {
    const now = new Date();
    let from: Date;
    let prevFrom: Date;
    let prevTo: Date;
    let periodLabel: string;

    if (period === 'dia') {
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      prevTo = new Date(from);
      prevFrom = new Date(prevTo);
      prevFrom.setDate(prevFrom.getDate() - 1);
      periodLabel = `Día ${fmtDateFull(now.toISOString())}`;
    } else if (period === 'semana') {
      const day = now.getDay() || 7;
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1);
      prevTo = new Date(from);
      prevFrom = new Date(prevTo);
      prevFrom.setDate(prevFrom.getDate() - 7);
      periodLabel = `Semana del ${fmtDate(from.toISOString())} al ${fmtDate(now.toISOString())}`;
    } else {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      prevTo = new Date(from);
      prevFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      periodLabel = now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
      periodLabel = periodLabel.charAt(0).toUpperCase() + periodLabel.slice(1);
    }

    const inRange = (d: string, a: Date, b: Date) => {
      const t = new Date(d);
      return t >= a && t < b;
    };

    const current = ordenes.filter(o => new Date(o.fecha_creacion) >= from);
    const previous = ordenes.filter(o => inRange(o.fecha_creacion, prevFrom, prevTo));

    const sumValid = (arr: Orden[]) => arr.filter(o => !EXCLUDED_STATES.includes(o.estado)).reduce((s, o) => s + o.total, 0);
    const countByStatus = (arr: Orden[]) => {
      const m: Record<string, number> = {};
      arr.forEach(o => { m[o.estado] = (m[o.estado] || 0) + 1; });
      return m;
    };

    const curTotal = sumValid(current);
    const prevTotal = sumValid(previous);
    const curCount = current.length;
    const prevCount = previous.length;
    const curStatuses = countByStatus(current);
    const prevStatuses = countByStatus(previous);
    const allStatuses = Array.from(new Set([...Object.keys(curStatuses), ...Object.keys(prevStatuses)])).sort();

    // Build PDF
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const w = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(0, 170, 69);
    doc.rect(0, 0, w, 34, 'F');
    doc.setTextColor(255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumen de Ventas', 15, 16);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(periodLabel, 15, 24);
    doc.setFontSize(9);
    doc.text(`Generado: ${fmtDateFull(now.toISOString())}`, 15, 30);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('FashionStore', w - 15, 16, { align: 'right' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(COMPANY.email, w - 15, 23, { align: 'right' });

    let y = 44;

    // ── KPI boxes ──
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80);
    doc.text('RESUMEN GENERAL', 15, y);
    y += 7;

    const pct = (a: number, b: number) => {
      if (b === 0) return a > 0 ? '+100%' : '0%';
      const p = ((a - b) / b) * 100;
      return `${p >= 0 ? '+' : ''}${p.toFixed(1)}%`;
    };

    autoTable(doc, {
      startY: y,
      head: [['Métrica', 'Periodo actual', 'Periodo anterior', 'Variación']],
      body: [
        ['Ventas totales', `${fmtNum(curTotal)} €`, `${fmtNum(prevTotal)} €`, pct(curTotal, prevTotal)],
        ['Nº Pedidos', String(curCount), String(prevCount), pct(curCount, prevCount)],
        ['Pedidos válidos', String(current.filter(o => !EXCLUDED_STATES.includes(o.estado)).length), String(previous.filter(o => !EXCLUDED_STATES.includes(o.estado)).length), '—'],
      ],
      theme: 'grid',
      headStyles: { fillColor: [0, 170, 69], textColor: 255, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: [40, 40, 40] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'center' },
      },
      margin: { left: 15, right: 15 },
    });

    y = (doc as any).lastAutoTable?.finalY + 12 || y + 40;

    // ── Desglose por estado ──
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80);
    doc.text('DESGLOSE POR ESTADO', 15, y);
    y += 7;

    autoTable(doc, {
      startY: y,
      head: [['Estado', 'Pedidos actual', 'Pedidos anterior', 'Importe actual', 'Importe anterior']],
      body: allStatuses.map(st => {
        const cOrd = current.filter(o => o.estado === st);
        const pOrd = previous.filter(o => o.estado === st);
        return [
          st,
          String(curStatuses[st] || 0),
          String(prevStatuses[st] || 0),
          `${fmtNum(cOrd.reduce((s, o) => s + o.total, 0))} €`,
          `${fmtNum(pOrd.reduce((s, o) => s + o.total, 0))} €`,
        ];
      }),
      theme: 'grid',
      headStyles: { fillColor: [51, 65, 85], textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
      bodyStyles: { fontSize: 8.5, textColor: [40, 40, 40] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'right' },
        4: { halign: 'right' },
      },
      margin: { left: 15, right: 15 },
    });

    y = (doc as any).lastAutoTable?.finalY + 12 || y + 40;

    // ── Top clientes del periodo ──
    const clientMap: Record<string, { nombre: string; total: number; count: number }> = {};
    current.filter(o => !EXCLUDED_STATES.includes(o.estado)).forEach(o => {
      const key = o.email_cliente || 'sin-email';
      if (!clientMap[key]) clientMap[key] = { nombre: o.nombre_cliente || key, total: 0, count: 0 };
      clientMap[key].total += o.total;
      clientMap[key].count += 1;
    });
    const topClients = Object.values(clientMap).sort((a, b) => b.total - a.total).slice(0, 10);

    if (topClients.length > 0) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(80);
      doc.text('TOP CLIENTES', 15, y);
      y += 7;

      autoTable(doc, {
        startY: y,
        head: [['#', 'Cliente', 'Pedidos', 'Total']],
        body: topClients.map((c, i) => [
          String(i + 1),
          c.nombre,
          String(c.count),
          `${fmtNum(c.total)} €`,
        ]),
        theme: 'grid',
        headStyles: { fillColor: [51, 65, 85], textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
        bodyStyles: { fontSize: 8.5, textColor: [40, 40, 40] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { halign: 'center', cellWidth: 12 },
          2: { halign: 'center', cellWidth: 20 },
          3: { halign: 'right', cellWidth: 30 },
        },
        margin: { left: 15, right: 15 },
      });

      y = (doc as any).lastAutoTable?.finalY + 12 || y + 40;
    }

    // ── Listado de pedidos del periodo ──
    if (current.length > 0 && current.length <= 60) {
      // Check if need new page
      if (y > 220) doc.addPage();
      y = y > 220 ? 20 : y;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(80);
      doc.text('DETALLE DE PEDIDOS', 15, y);
      y += 7;

      autoTable(doc, {
        startY: y,
        head: [['Pedido', 'Cliente', 'Email', 'Fecha', 'Estado', 'Importe']],
        body: current.map(o => [
          `#${o.numero_orden}`,
          o.nombre_cliente || '—',
          o.email_cliente || '—',
          fmtDate(o.fecha_creacion),
          o.estado,
          `${fmtNum(o.total)} €`,
        ]),
        theme: 'grid',
        headStyles: { fillColor: [0, 170, 69], textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
        bodyStyles: { fontSize: 7.5, textColor: [40, 40, 40] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 32 },
          5: { halign: 'right', cellWidth: 22 },
        },
        margin: { left: 15, right: 15 },
      });
    }

    // ── Footer ──
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      const pH = doc.internal.pageSize.getHeight();
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text(`${COMPANY.nombre} · Resumen de ventas · Página ${i}/${pages}`, w / 2, pH - 7, { align: 'center' });
    }

    const fileName = `Resumen_${period === 'dia' ? 'Diario' : period === 'semana' ? 'Semanal' : 'Mensual'}_${now.toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
  };

  // ── Status badge ──
  const badge = (estado: string) => {
    const s = STATUS_MAP[estado] || { bg: 'bg-slate-50 border-slate-200', text: 'text-slate-600', label: estado };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-bold rounded-md border ${s.bg} ${s.text}`}>
        {s.label}
      </span>
    );
  };

  // ================================================
  // RENDER
  // ================================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900">Facturación</h2>
        <p className="text-sm text-slate-400 mt-0.5">Historial de ventas procesadas y facturas.</p>
      </div>

      {/* ── Stats (2 cards) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Ventas totales</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{fmt(totalVentas)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Excluye cancelados y devoluciones</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Pedidos procesados</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{ordenes.length}</p>
        </div>
      </div>

      {/* ── Descargar resúmenes ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Descargar resumen de ventas</h3>
        <div className="flex flex-wrap gap-3">
          {([
            { key: 'dia', label: 'Hoy', icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5' },
            { key: 'semana', label: 'Esta semana', icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z' },
            { key: 'mes', label: 'Este mes', icon: 'M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6' },
          ] as const).map(p => (
            <button
              key={p.key}
              onClick={() => downloadSummary(p.key)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 transition-colors"
            >
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={p.icon} />
              </svg>
              {p.label}
              <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* ── Tabla de pedidos ── */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-slate-100 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-700">Historial de ventas</h3>
            {/* Search */}
            <div className="relative w-full sm:w-72">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e: any) => setSearch(e.target.value)}
                placeholder="Buscar por nº pedido o email..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-slate-200 text-slate-400">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
          </div>
          {/* Status tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {estados.map(est => (
              <button
                key={est}
                onClick={() => setFiltroEstado(est)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                  filtroEstado === est
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                {est === 'todos' ? 'Todos' : (STATUS_MAP[est]?.label || est)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-48 text-slate-400">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-sm font-medium">Cargando facturas...</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <svg className="w-8 h-8 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <p className="text-sm text-red-400 font-medium">{error}</p>
            <button onClick={loadOrdenes} className="text-xs text-slate-500 hover:text-slate-700 font-medium underline">Reintentar</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2">
            <svg className="w-8 h-8 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <p className="text-sm font-medium">Sin resultados</p>
            <p className="text-xs">
              {search ? 'Prueba con otro término de búsqueda.' : 'No hay ventas con ese filtro.'}
            </p>
          </div>
        ) : (
          <>
            {/* ── Desktop table ── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6 py-3">Pedido</th>
                    <th className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6 py-3">Cliente</th>
                    <th className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6 py-3">Fecha</th>
                    <th className="text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6 py-3">Importe</th>
                    <th className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6 py-3">Estado</th>
                    <th className="text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6 py-3">Factura</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(o => (
                    <tr key={o.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-3.5">
                        <span className="text-sm font-bold text-slate-700">#{o.numero_orden}</span>
                      </td>
                      <td className="px-6 py-3.5">
                        <p className="text-sm text-slate-700">{o.nombre_cliente || '—'}</p>
                        <p className="text-xs text-slate-400">{o.email_cliente || ''}</p>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-slate-500">{fmtDate(o.fecha_creacion)}</td>
                      <td className="px-6 py-3.5 text-right">
                        <span className="text-sm font-bold text-slate-900">{fmt(o.total)}</span>
                      </td>
                      <td className="px-6 py-3.5 text-center">{badge(o.estado)}</td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={() => downloadInvoice(o)}
                          disabled={downloading === o.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold transition-colors border border-slate-200 disabled:opacity-50"
                          title="Descargar factura"
                        >
                          {downloading === o.id ? (
                            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                          )}
                          PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Mobile cards ── */}
            <div className="md:hidden divide-y divide-slate-100">
              {filtered.map(o => (
                <div key={o.id} className="px-5 py-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-700">#{o.numero_orden}</span>
                    {badge(o.estado)}
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">{o.nombre_cliente || '—'}</p>
                      <p className="text-xs text-slate-400">{o.email_cliente}</p>
                      <p className="text-xs text-slate-400">{fmtDate(o.fecha_creacion)}</p>
                    </div>
                    <span className="text-sm font-bold text-slate-900">{fmt(o.total)}</span>
                  </div>
                  <button
                    onClick={() => downloadInvoice(o)}
                    disabled={downloading === o.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold transition-colors border border-slate-200 disabled:opacity-50"
                  >
                    {downloading === o.id ? (
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                    )}
                    Descargar PDF
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Result count */}
        {!loading && !error && filtered.length > 0 && (
          <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-400">
            Mostrando {filtered.length} de {ordenes.length} pedidos
            {search && <span className="ml-1">para «{search}»</span>}
          </div>
        )}
      </div>
    </div>
  );
}
