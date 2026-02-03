import type { APIRoute } from 'astro';
import { supabase } from '@/lib/supabase';

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const userMessage = body.message?.toLowerCase().trim() || '';
        let reply = "";
        let products: any[] = [];
        let buttons: any[] = [];

        // Simulando retardo
        await new Promise(resolve => setTimeout(resolve, 800));

        // ---------------------------------------------------------
        // 1. INTENCIÓN: PEDIDOS / MIS COMPRAS
        // ---------------------------------------------------------
        if (userMessage.match(/pedido|compra|encargo|historial/)) {
            reply = "Para ver el estado de tus pedidos y tu historial de compras, necesitas acceder a tu perfil de usuario. 📦\n\nPuedes verlo directamente aquí:";
            buttons = [{
                label: "Ver Mis Pedidos",
                url: "/perfil",
                primary: true
            }];
            return new Response(JSON.stringify({ reply, products: [], buttons }), {
                status: 200, headers: { 'Content-Type': 'application/json' }
            });
        }

        // ---------------------------------------------------------
        // 2. INTENCIÓN: OFERTAS / DESCUENTOS
        // ---------------------------------------------------------
        if (userMessage.match(/oferta|descuento|rebaja|chollo|barato/)) {
            const { data: offers } = await supabase
                .from('productos')
                .select('id, nombre, precio_venta, precio_original, slug, imagenes_producto(url), stock_total')
                .eq('activo', true)
                .not('precio_original', 'is', null)
                .gt('stock_total', 0)
                .limit(3);

            let validOffers = offers || [];
            // Filtrar en código para asegurar consistencia
            validOffers = validOffers.filter(p => p.precio_original && p.precio_venta < p.precio_original);

            if (validOffers.length > 0) {
                reply = "¡Claro! 🔥 Aquí tienes algunas de nuestras **mejores ofertas** activas ahora mismo:";
                products = validOffers.map(p => ({
                    id: p.id,
                    name: p.nombre,
                    price: p.precio_venta,
                    price_original: p.precio_original,
                    slug: p.slug,
                    image: p.imagenes_producto?.[0]?.url
                }));
                buttons = [{
                    label: "Ver Todas las Ofertas",
                    url: "/ofertas",
                    primary: false
                }];

                return new Response(JSON.stringify({ reply, products, buttons }), {
                    status: 200, headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // ---------------------------------------------------------
        // 3. BÚSQUEDA GENERAL DE PRODUCTOS (Supabase) + VARIANTES
        // ---------------------------------------------------------
        // Primero buscamos en PRODUCTOS
        const { data: searchResults } = await supabase
            .from('productos')
            .select('id, nombre, precio_venta, precio_original, slug, imagenes_producto(url)')
            .eq('activo', true)
            .textSearch('nombre', userMessage.split(' ').join(' | '), {
                type: 'websearch',
                config: 'spanish'
            })
            .limit(3);

        let finalProducts = searchResults || [];

        // Fallback 1: ILIKE en PRODUCTOS
        if (finalProducts.length === 0) {
            const { data: fallback } = await supabase
                .from('productos')
                .select('id, nombre, precio_venta, precio_original, slug, imagenes_producto(url)')
                .eq('activo', true)
                .ilike('nombre', `%${userMessage}%`)
                .limit(3);
            finalProducts = fallback || [];
        }

        // Fallback 2: Búsqueda en VARIANTES_PRODUCTOS
        // Si no encontramos el producto principal, buscamos en sus variantes (ej: tallas, colores, modelos específicos)
        if (finalProducts.length === 0) {
            // Buscamos IDs de productos que tengan variantes coincidentes
            const { data: variants } = await supabase
                .from('variantes_productos')
                .select('producto_id')
                .ilike('nombre', `%${userMessage}%`)
                .limit(5);

            if (variants && variants.length > 0) {
                const productIds = variants.map(v => v.producto_id);
                // Recuperamos los productos padres de esas variantes
                const { data: variantProducts } = await supabase
                    .from('productos')
                    .select('id, nombre, precio_venta, precio_original, slug, imagenes_producto(url)')
                    .in('id', productIds)
                    .eq('activo', true)
                    .limit(3);

                finalProducts = variantProducts || [];
            }
        }

        if (finalProducts.length > 0) {
            reply = `¡He encontrado estos productos coinciden con tu búsqueda! ✨`;
            products = finalProducts.map(p => ({
                id: p.id,
                name: p.nombre,
                price: p.precio_venta,
                price_original: p.precio_original,
                slug: p.slug,
                image: p.imagenes_producto?.[0]?.url
            }));

            buttons = [{
                label: "Ver Catálogo Completo",
                url: "/productos",
                primary: false
            }];

            return new Response(JSON.stringify({ reply, products, buttons }), {
                status: 200, headers: { 'Content-Type': 'application/json' }
            });
        }

        // ---------------------------------------------------------
        // 4. INTENTOS FALLIDOS / CHIT-CHAT
        // ---------------------------------------------------------
        if (userMessage.match(/hola|buenos dias|buenas/)) {
            reply = "¡Hola! 👋 Soy el asistente virtual de FashionStore. ¿Qué producto estás buscando hoy? Puedes preguntarme por 'ofertas', 'móviles' o 'mis pedidos'.";
        } else {
            reply = "Lo siento, no he encontrado ningún producto con ese nombre (ni en variantes). 🛑\n\n¿Buscas algo diferente o quieres ver nuestras ofertas?";
            buttons = [{
                label: "Ir a Ofertas",
                url: "/ofertas",
                primary: true
            }];
        }

        return new Response(JSON.stringify({ reply, products: [], buttons }), {
            status: 200, headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error en API chat:', error);
        return new Response(JSON.stringify({ reply: "Lo siento, hubo un error técnico." }), {
            status: 500, headers: { 'Content-Type': 'application/json' }
        });
    }
}
