
import type { APIRoute } from 'astro';
import { supabase } from '@/lib/supabase';
import { openai } from '@/lib/openai';

// ---------------------------------------------------------
// TYPES & CONSTANTS
// ---------------------------------------------------------
const ALLOWED_ACTIONS = ['buscar_productos', 'consultar_pedido', 'mostrar_ofertas', 'conversacion_general'] as const;
type AllowedAction = typeof ALLOWED_ACTIONS[number];

interface AiResponse {
    action: AllowedAction;
    message: string;
    filters?: {
        palabras_clave?: string;
        precio_max?: number;
        precio_min?: number;
        categoria?: string;
        pedido_id?: string;
    };
}

const FALLBACK_MESSAGE = "Lo siento, hubo un error procesando tu solicitud. ¿En qué más puedo ayudarte?";

// ---------------------------------------------------------
// HELPERS (FALLBACK LOGIC)
// ---------------------------------------------------------
const STOP_WORDS = new Set([
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
    'de', 'del', 'a', 'ante', 'bajo', 'cabe', 'con', 'contra',
    'que', 'cual', 'cuales', 'donde', 'como', 'cuando',
    'me', 'te', 'se', 'nos', 'os', 'le', 'les',
    'mi', 'tu', 'su', 'mis', 'tus', 'sus',
    'yo', 'tu', 'el', 'ella', 'nosotros', 'nosotras', 'vosotros', 'vosotras', 'ellos', 'ellas',
    'quiero', 'quisiera', 'busco', 'necesito', 'comprar', 'ver', 'tienes', 'hay',
    'recomienda', 'recomiendas', 'recomendacion', 'sugerencia', 'dime', 'muestrame',
    'mejor', 'mejores', 'buen', 'bueno', 'buena', 'buenos', 'buenas',
    'mas', 'menos', 'muy', 'poco', 'bastante'
]);

function cleanQuery(query: string): string[] {
    return query
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
        .split(/\s+/)
        .filter(word => !STOP_WORDS.has(word) && word.length > 2);
}

// ---------------------------------------------------------
// SYSTEM PROMPT
// ---------------------------------------------------------
const SYSTEM_PROMPT = `
Eres el asistente virtual de FashionStore, una tienda online de tecnología.
Hablas de forma natural, cercana y profesional.
Tu misión es ayudar al usuario a encontrar productos, ver ofertas, consultar pedidos y resolver dudas.

IMPORTANTE:
Debes responder SIEMPRE en JSON válido.

Acciones permitidas (EXACTAS):
- buscar_productos
- consultar_pedido
- mostrar_ofertas
- conversacion_general

Formato obligatorio:
{
  "action": "ACTION_NAME",
  "message": "Mensaje natural para el usuario",
  "filters": {
    "palabras_clave": "keywords string",
    "precio_max": 0, // numero o null
    "precio_min": 0, // numero o null
    "categoria": "string o null",
    "pedido_id": "string o null"
  }
}

Reglas:
1. Nunca inventes productos.
2. Si el usuario no da suficiente información, haz preguntas.
3. Si no hay coincidencias exactas, ofrece alternativas.
4. Usa lenguaje natural y amigable.
5. No escribas texto fuera del JSON.

Ejemplos:
Usuario: quiero un móvil barato
Respuesta:
{
"action": "buscar_productos",
"message": "Te voy a enseñar algunos móviles con buena calidad-precio 🔥",
"filters": { "palabras_clave": "movil smartphone", "precio_max": 300 }
}
`;

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        // Prepare context: History + Current Message
        const userMessage = body.message?.trim() || '';
        const history = Array.isArray(body.history) ? body.history : [];

        // Limit history to last 6 messages to save tokens
        const recentHistory = history.slice(-6).map((msg: any) => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
        }));

        const messages = [
            { role: "system", content: SYSTEM_PROMPT },
            ...recentHistory,
            { role: "user", content: userMessage }
        ];

        // Response Objects
        let reply = "";
        let products: any[] = [];
        let buttons: any[] = [];

        // Check if OpenAI Key is present
        const apiKey = import.meta.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY;

        if (apiKey) {
            // ---------------------------------------------------------
            // AI FLOW
            // ---------------------------------------------------------
            try {
                const completion = await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: messages as any,
                    temperature: 0.2, // Low temp for stability
                    response_format: { type: "json_object" }
                });

                const aiResponseContent = completion.choices[0].message.content || "{}";
                let aiData: AiResponse;

                // 1. JSON Validation
                try {
                    aiData = JSON.parse(aiResponseContent);
                } catch (e) {
                    console.error("Invalid JSON from LLM", e);
                    aiData = { action: 'conversacion_general', message: FALLBACK_MESSAGE };
                }

                // 2. Action Whitelist & Sanitization
                if (!ALLOWED_ACTIONS.includes(aiData.action)) {
                    aiData.action = 'conversacion_general';
                }

                reply = aiData.message || FALLBACK_MESSAGE;
                const filters = aiData.filters || {};

                // Sanitization of filters
                const safeFilters = {
                    palabras_clave: typeof filters.palabras_clave === 'string' && filters.palabras_clave.trim() !== '' ? filters.palabras_clave : undefined,
                    precio_max: typeof filters.precio_max === 'number' ? filters.precio_max : undefined,
                    precio_min: typeof filters.precio_min === 'number' ? filters.precio_min : undefined,
                };

                // EXECUTE ACTIONS
                if (aiData.action === 'buscar_productos') {
                    // Search DB using filters
                    let query = supabase
                        .from('productos')
                        .select('id, nombre, precio_venta, precio_original, slug, imagenes_producto(url)')
                        .eq('activo', true);

                    // Apply filters
                    if (safeFilters.palabras_clave) {
                        const cleanKeywords = safeFilters.palabras_clave.split(' ').join(' | ');
                        query = query.textSearch('nombre', cleanKeywords, { config: 'spanish', type: 'websearch' });
                    }
                    if (safeFilters.precio_max) query = query.lte('precio_venta', safeFilters.precio_max);
                    if (safeFilters.precio_min) query = query.gte('precio_venta', safeFilters.precio_min);

                    const { data: searchResults } = await query.limit(4);

                    // Fallback logic if NO results found
                    if (!searchResults || searchResults.length === 0) {
                        // A) Relaxed Search (ILIKE)
                        if (safeFilters.palabras_clave) {
                            const firstKeyword = safeFilters.palabras_clave.split(' ')[0];
                            const { data: fallback } = await supabase
                                .from('productos')
                                .select('id, nombre, precio_venta, precio_original, slug, imagenes_producto(url)')
                                .eq('activo', true)
                                .ilike('nombre', `%${firstKeyword}%`)
                                .limit(4);

                            if (fallback && fallback.length > 0) {
                                products = mapProducts(fallback);
                                reply += "\n\nNo encontré coincidencia exacta con tus filtros, pero mira estos:";
                            } else {
                                // B) Generic Bestsellers as last resort
                                const { data: bestsellers } = await supabase
                                    .from('productos')
                                    .select('id, nombre, precio_venta, precio_original, slug, imagenes_producto(url)')
                                    .eq('activo', true)
                                    .limit(3);
                                products = mapProducts(bestsellers || []);
                                reply = "Vaya, no encontré nada con esa descripción exacta. 😓 Pero estos son muy populares ahora mismo:";
                            }
                        } else {
                            // If no keywords but price filters failed, show bestsellers anyway
                            const { data: bestsellers } = await supabase
                                .from('productos')
                                .select('id, nombre, precio_venta, precio_original, slug, imagenes_producto(url)')
                                .eq('activo', true)
                                .limit(3);
                            products = mapProducts(bestsellers || []);
                            reply = "No encontré productos con esos precios. Mira nuestros destacados: 👇";
                        }
                    } else {
                        products = mapProducts(searchResults || []);
                    }

                    buttons = [{ label: "Ver Catálogo", url: "/productos", primary: false }];

                } else if (aiData.action === 'mostrar_ofertas') {
                    const { data: offers } = await supabase
                        .from('productos')
                        .select('id, nombre, precio_venta, precio_original, slug, imagenes_producto(url)')
                        .eq('activo', true)
                        .not('precio_original', 'is', null)
                        .gt('stock_total', 0)
                        .limit(4);

                    products = mapProducts(offers || []);
                    buttons = [{ label: "Ver Ofertas", url: "/ofertas", primary: true }];

                } else if (aiData.action === 'consultar_pedido') {
                    reply += "\n\nPuedes ver el estado de tus pedidos en tu perfil.";
                    buttons = [{ label: "Ir a Mi Perfil", url: "/perfil", primary: true }];
                }

            } catch (aiError) {
                console.error("OpenAI Error:", aiError);
                return fallbackLogic(userMessage);
            }

        } else {
            // No console.warn to keep logs validation clean in production if wanted
            return fallbackLogic(userMessage);
        }

        return new Response(JSON.stringify({ reply, products, buttons }), {
            status: 200, headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error en API chat:', error);
        return new Response(JSON.stringify({ reply: "Lo siento, hubo un error técnico." }), {
            status: 500, headers: { 'Content-Type': 'application/json' }
        });
    }
}

function mapProducts(list: any[]) {
    return list.map(p => ({
        id: p.id,
        name: p.nombre,
        price: p.precio_venta,
        price_original: p.precio_original,
        slug: p.slug,
        image: p.imagenes_producto?.[0]?.url
    }));
}

// ---------------------------------------------------------
// LEGACY / FALLBACK LOGIC (Natural & Professional)
// ---------------------------------------------------------
async function fallbackLogic(userMessage: string) {
    let reply = "";
    let products: any[] = [];
    let buttons: any[] = [];

    // Simulando retardo para naturalidad
    await new Promise(resolve => setTimeout(resolve, 600));

    userMessage = userMessage.toLowerCase();

    // 1. SALUDOS / CHIT-CHAT GENERAL
    if (userMessage.match(/^(hola|buenos|buenas|que tal|hey|hi)/)) {
        reply = "¡Hola! 👋 Soy tu asistente en FashionStore. Estoy aquí para ayudarte a elegir el mejor producto para ti. ¿Buscas algo en concreto o quieres ver nuestras ofertas?";
        buttons = [
            { label: "Ver Ofertas", url: "/ofertas", primary: true },
            { label: "Ver Catálogo", url: "/productos", primary: false }
        ];
        return new Response(JSON.stringify({ reply, products: [], buttons }), { status: 200 });
    }

    // 2. OFERTAS
    if (userMessage.match(/oferta|descuento|rebaja|chollo|barato/)) {
        const { data: offers } = await supabase
            .from('productos')
            .select('id, nombre, precio_venta, precio_original, slug, imagenes_producto(url)')
            .eq('activo', true)
            .not('precio_original', 'is', null)
            .limit(3);

        products = mapProducts(offers || []);
        if (products.length > 0) {
            reply = "¡Claro! 💸 Aquí tienes algunos de nuestros productos con mejor precio ahora mismo:";
            return new Response(JSON.stringify({ reply, products, buttons: [{ label: "Ver todas las ofertas", url: "/ofertas" }] }), { status: 200 });
        }
    }

    // 3. PEDIDOS
    if (userMessage.match(/pedido|envio|compra|track|estado/)) {
        reply = "Para consultar el estado de tus pedidos, puedes acceder directamente a tu área personal. 📦";
        buttons = [{ label: "Ir a Mis Pedidos", url: "/perfil", primary: true }];
        return new Response(JSON.stringify({ reply, products: [], buttons }), { status: 200 });
    }

    // 4. BÚSQUEDA DE PRODUCTOS
    const keywords = cleanQuery(userMessage);
    if (keywords.length > 0) {
        const searchTerms = keywords.join(' | ');
        const { data: searchResults } = await supabase
            .from('productos')
            .select('id, nombre, precio_venta, precio_original, slug, imagenes_producto(url)')
            .eq('activo', true)
            .textSearch('nombre', searchTerms, { type: 'websearch', config: 'spanish' })
            .limit(3);

        products = mapProducts(searchResults || []);

        if (products.length > 0) {
            reply = `¡He encontrado esto que te puede interesar! ✨`;
            buttons = [{ label: "Ver más resultados", url: "/productos" }];
            return new Response(JSON.stringify({ reply, products, buttons }), { status: 200 });
        }
    }

    // 5. SI NO HAY RESULTADOS -> SUGERENCIA + BESTSELLERS
    // En lugar de decir "error", sugerimos lo más popular
    const { data: bestsellers } = await supabase
        .from('productos')
        .select('id, nombre, precio_venta, precio_original, slug, imagenes_producto(url)')
        .eq('activo', true)
        .limit(3);

    products = mapProducts(bestsellers || []);

    if (keywords.length > 0) {
        reply = "No he encontrado exactamente ese modelo, pero estos son algunos de los favoritos de nuestros clientes 👇";
    } else {
        reply = "No estoy seguro de haberte entendido bien, pero aquí tienes algunos de nuestros productos más destacados. ¿Te gusta alguno?";
    }

    buttons = [{ label: "Ir a la tienda", url: "/productos", primary: true }];

    return new Response(JSON.stringify({ reply, products, buttons }), { status: 200 });
}
