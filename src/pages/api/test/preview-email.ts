
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const type = url.searchParams.get('type') || 'customer'; // 'customer' or 'admin'

  // Mock Invoice Data (STRICT: CENTS)
  const order = {
    numero_orden: 'ORD-2026-001',
    email: 'cliente@ejemplo.com',
    nombre: 'Juan Pérez',
    telefono: '+34 600 123 456',
    items: [
      {
        nombre: 'Camiseta Básica Premium',
        cantidad: 2,
        precio_unitario: 2500, // 25.00 EUR (2500 cents)
        precio_original: 3000,
        imagen: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        talla: 'M',
        color: 'Negro',
      },
      {
        nombre: 'Pantalón Chino Slim',
        cantidad: 1,
        precio_unitario: 4500, // 45.00 EUR (4500 cents)
        imagen: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        talla: '32',
        color: 'Beige',
      }
    ],
    subtotal: 9500,
    impuestos: 1995, // 21% de approx 9500
    descuento: 1000,
    envio: 500,
    total: 10995, // 9500 - 1000 + 500 + 1995
    direccion: {
      calle: 'Av. de la Castellana 123, 4º B',
      ciudad: 'Madrid',
      codigo_postal: '28046',
      pais: 'España',
    },
    is_guest: false,
  };

  function formatPrice(cents: number): string {
    return (cents / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
  }

  const siteUrl = import.meta.env.SITE_URL || 'http://localhost:4321';
  const logoUrl = `${siteUrl}/admin-logo.png`;

  let html = '';

  if (type === 'admin') {
    html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nuevo Pedido Recibido</title>
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 4px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: #1a1a1a; padding: 24px; text-align: left;">
               <div style="font-size: 14px; font-weight: 700; color: #ffffff; text-transform: uppercase;">Notificación Admin</div>
               <h1 style="color: #ffffff; margin: 8px 0 0; font-size: 20px; font-weight: 300;">Nuevo Pedido Recibido</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e4e4e7; padding-bottom: 16px; margin-bottom: 24px;">
                 <div>
                    <span style="display: block; font-size: 11px; text-transform: uppercase; color: #71717a; font-weight: 600;">Pedido</span>
                    <span style="font-size: 18px; font-weight: 700; color: #1a1a1a;">#${order.numero_orden}</span>
                 </div>
                 <div style="text-align: right;">
                    <span style="display: block; font-size: 11px; text-transform: uppercase; color: #71717a; font-weight: 600;">Total</span>
                    <span style="font-size: 18px; font-weight: 700; color: #166534;">${formatPrice(order.total)}</span>
                 </div>
              </div>

              <!-- Customer Info -->
              <h3 style="font-size: 12px; text-transform: uppercase; color: #71717a; font-weight: 700; margin-bottom: 12px;">Datos del Cliente</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; font-size: 14px;">
                <tr>
                  <td width="30%" style="padding: 8px 0; color: #71717a;">Nombre:</td>
                  <td style="padding: 8px 0; color: #1a1a1a; font-weight: 600;">${order.nombre}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #71717a;">Email:</td>
                  <td style="padding: 8px 0; color: #1a1a1a;">
                    <a href="mailto:${order.email}" style="color: #2563eb; text-decoration: none;">${order.email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #71717a; vertical-align: top;">Envío:</td>
                  <td style="padding: 8px 0; color: #1a1a1a; line-height: 1.5;">
                     ${order.direccion.calle}<br>
                     ${order.direccion.codigo_postal} ${order.direccion.ciudad}<br>
                     ${order.direccion.pais}
                  </td>
                </tr>
              </table>
              
              <!-- Product Summary Table -->
              <h3 style="font-size: 12px; text-transform: uppercase; color: #71717a; font-weight: 700; margin-bottom: 12px; border-top: 1px solid #e4e4e7; padding-top: 24px;">Productos (${order.items.length})</h3>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #f9f9f9; border-radius: 4px; overflow: hidden; font-size: 13px;">
                ${order.items.map(item => `
                <tr>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">
                    <div style="font-weight: 600; color: #1a1a1a;">${item.nombre}</div>
                    <div style="color: #71717a;">Cant: ${item.cantidad} &bull; ${item.talla}</div>
                  </td>
                  <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e5e5; font-weight: 600; color: #1a1a1a;">
                    ${formatPrice(item.precio_unitario * item.cantidad)}
                  </td>
                </tr>
                `).join('')}
              </table>
              
              <!-- Payment Info -->
              <div style="margin-top: 24px; background: #eef2ff; padding: 16px; border-radius: 4px; border: 1px solid #e0e7ff;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-size: 13px; color: #4338ca;">Pago</td>
                    <td style="text-align: right; font-weight: 700; color: #4338ca; font-size: 13px;">Stripe (Tarjeta)</td>
                  </tr>
                </table>
              </div>
              
              <!-- CTA -->
              <div style="margin-top: 32px; text-align: center;">
                <a href="${siteUrl}/admin/dashboard?section=orders" 
                   style="display: inline-block; background: #1a1a1a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 13px;">
                  Ver Pedido en Admin
                </a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0;">
              <p style="color: #a1a1aa; margin: 0; font-size: 11px; text-align: center;">Notificación Automática del Sistema<br>${new Date().toLocaleString('es-ES')}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `;
  } else {
    // CUSTOMER EMAIL
    html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Pedido Confirmado</title>
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 2px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Logo Header (STRICT RULE: Centered Logo, No Text Header) -->
          <tr>
            <td style="background: #ffffff; padding: 32px; text-align: center; border-bottom: 3px solid #1a1a1a;">
              <img src="${logoUrl}" alt="FashionStore" style="max-height: 80px; max-width: 180px; width: auto; display: block; margin: 0 auto;">
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              
              <h1 style="text-align: center; color: #1a1a1a; margin: 0 0 8px; font-size: 24px; font-weight: 300; text-transform: uppercase; letter-spacing: 2px;">Pedido Confirmado</h1>
              <p style="text-align: center; color: #71717a; margin: 0 0 32px; font-size: 14px;">Gracias por tu compra.</p>
              
              <!-- Order Details Header -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px; border-bottom: 1px solid #e4e4e7; padding-bottom: 16px;">
                <tr>
                   <td style="vertical-align: top;">
                      <div style="font-size: 11px; text-transform: uppercase; color: #71717a; font-weight: 600; letter-spacing: 0.5px;">Número de Pedido</div>
                      <div style="font-size: 16px; font-weight: 700; color: #1a1a1a; margin-top: 4px;">#${order.numero_orden}</div>
                   </td>
                   <td style="text-align: right; vertical-align: top;">
                      <div style="font-size: 11px; text-transform: uppercase; color: #71717a; font-weight: 600; letter-spacing: 0.5px;">Fecha</div>
                      <div style="font-size: 16px; color: #1a1a1a; margin-top: 4px;">${new Date().toLocaleDateString('es-ES')}</div>
                   </td>
                </tr>
              </table>
              
              <!-- Items Section (Strict Spanish) -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                <thead>
                  <tr>
                    <th style="text-align: left; font-size: 11px; text-transform: uppercase; color: #71717a; padding-bottom: 12px; border-bottom: 1px solid #1a1a1a; width: 60%;">Producto</th>
                     <th style="text-align: center; font-size: 11px; text-transform: uppercase; color: #71717a; padding-bottom: 12px; border-bottom: 1px solid #1a1a1a; width: 10%;">Cant.</th>
                    <th style="text-align: right; font-size: 11px; text-transform: uppercase; color: #71717a; padding-bottom: 12px; border-bottom: 1px solid #1a1a1a; width: 30%;">Precio</th>
                  </tr>
                </thead>
                <tbody>
                  ${order.items.map(item => `
                  <tr>
                    <td style="padding: 16px 0; border-bottom: 1px solid #e4e4e7;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td width="60" style="vertical-align: top;">
                            <img src="${item.imagen || 'https://via.placeholder.com/60'}" 
                                 alt="${item.nombre}" 
                                 style="width: 60px; height: 60px; object-fit: cover; border: 1px solid #f4f4f5;" />
                          </td>
                          <td style="padding-left: 16px; vertical-align: top;">
                            <div style="font-weight: 600; color: #1a1a1a; font-size: 14px; margin-bottom: 4px;">${item.nombre}</div>
                            <div style="color: #71717a; font-size: 12px;">
                              ${item.talla ? `Talla: ${item.talla}` : ''}
                              ${item.color ? ` &bull; Color: ${item.color}` : ''}
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                    <td style="padding: 16px 0; text-align: center; vertical-align: top; border-bottom: 1px solid #e4e4e7; font-size: 14px; color: #1a1a1a;">
                      ${item.cantidad}
                    </td>
                    <td style="padding: 16px 0; text-align: right; vertical-align: top; border-bottom: 1px solid #e4e4e7; font-weight: 600; font-size: 14px; color: #1a1a1a;">
                      ${formatPrice(item.precio_unitario * item.cantidad)}
                    </td>
                  </tr>
                  `).join('')}
                </tbody>
              </table>
              
              <!-- Totals Section (Strict Data Source) -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                   <td width="50%"></td>
                   <td width="50%">
                     <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding: 6px 0; color: #71717a; font-size: 14px;">Subtotal</td>
                          <td style="padding: 6px 0; text-align: right; color: #1a1a1a; font-size: 14px;">${formatPrice(order.subtotal)}</td>
                        </tr>
                        <tr>
                          <td style="padding: 6px 0; color: #71717a; font-size: 14px;">Envío</td>
                          <td style="padding: 6px 0; text-align: right; color: #1a1a1a; font-size: 14px;">${order.envio > 0 ? formatPrice(order.envio) : 'Gratis'}</td>
                        </tr>
                        <tr>
                          <td style="padding: 6px 0; color: #71717a; font-size: 14px;">Impuestos (IVA 21%)</td>
                          <td style="padding: 6px 0; text-align: right; color: #1a1a1a; font-size: 14px;">${formatPrice(order.impuestos)}</td>
                        </tr>
                        ${order.descuento > 0 ? `
                        <tr>
                          <td style="padding: 6px 0; color: #166534; font-size: 14px;">Descuento</td>
                          <td style="padding: 6px 0; text-align: right; color: #166534; font-size: 14px;">-${formatPrice(order.descuento)}</td>
                        </tr>` : ''}
                        <tr>
                          <td style="padding: 16px 0; border-top: 1px solid #1a1a1a; font-weight: 700; color: #1a1a1a; font-size: 16px;">Total Pagado</td>
                          <td style="padding: 16px 0; border-top: 1px solid #1a1a1a; text-align: right; font-weight: 700; color: #1a1a1a; font-size: 18px;">${formatPrice(order.total)}</td>
                        </tr>
                     </table>
                   </td>
                </tr>
              </table>
              
              <!-- Addresses and Info -->
              <div style="margin-top: 40px; padding-top: 32px; border-top: 1px solid #e4e4e7;">
                <table width="100%" cellpadding="0" cellspacing="0">
                   <tr>
                      <td style="vertical-align: top; padding-right: 20px;">
                         <h3 style="margin: 0 0 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #71717a;">Dirección de Envío</h3>
                         <p style="margin: 0; color: #1a1a1a; font-size: 14px; line-height: 1.6;">
                            <strong>${order.nombre}</strong><br>
                            ${order.direccion ? `
                              ${order.direccion.calle || ''}<br>
                              ${order.direccion.codigo_postal || ''} ${order.direccion.ciudad || ''}<br>
                              ${order.direccion.pais || 'España'}
                            ` : 'Dirección no disponible'}
                         </p>
                      </td>
                      <td style="vertical-align: top;">
                         <h3 style="margin: 0 0 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #71717a;">Próximos Pasos</h3>
                         <p style="margin: 0; color: #1a1a1a; font-size: 14px; line-height: 1.6;">
                            Estamos procesando tu pedido.<br>
                            Recibirás un número de seguimiento cuando sea enviado.<br>
                            Entrega estimada: 3-5 días laborables.
                         </p>
                      </td>
                   </tr>
                </table>
              </div>

              <!-- CTA -->
              <div style="text-align: center; margin-top: 48px;">
                <a href="${siteUrl}/mis-pedidos" 
                   style="display: inline-block; background: #1a1a1a; color: #ffffff; padding: 16px 48px; text-decoration: none; border-radius: 0; font-weight: 500; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">
                  Seguimiento del Pedido
                </a>
              </div>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: #fcfcfc; padding: 32px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="color: #a1a1aa; margin: 0; font-size: 11px;">
                &copy; ${new Date().getFullYear()} FashionStore. Todos los derechos reservados.<br>
                Si tienes preguntas, responde a este correo.
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
  }

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  });
};
