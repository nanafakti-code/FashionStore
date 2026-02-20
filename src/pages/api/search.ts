import type { APIRoute } from 'astro';
import { supabase } from '@/lib/supabase';

export const GET: APIRoute = async ({ url }) => {
    const query = url.searchParams.get('q');

    if (!query || query.length < 1) {
        return new Response(JSON.stringify([]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        // Lógica de búsqueda inteligente:
        // 1. Empieza por el término (ej: "Far" -> "Faro")
        // 2. Contiene una palabra que empieza por el término (ej: "Fa" -> "Panel de Faro")

        // Sanitize: eliminar caracteres especiales de PostgreSQL/PostgREST y limitar longitud
        const safeQuery = query
            .replace(/[^\w\sà-ÿÀ-ÜñÑ]/gi, '')  // Solo letras, números, espacios y acentos
            .trim()
            .substring(0, 100);  // Limitar longitud máxima

        if (!safeQuery) {
            return new Response(JSON.stringify([]), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { data, error } = await supabase
            .from('productos')
            .select('id, nombre, precio_venta, imagenes_producto(url), slug')
            .eq("activo", true)
            .or(`nombre.ilike.${safeQuery}%,nombre.ilike.% ${safeQuery}%`)
            .limit(10); // Limitar resultados para rendimiento

        if (error) {
            console.error('Error en búsqueda:', error);
            return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
        }

        // Procesar imágenes para devolver solo la principal o la primera
        const results = data.map((product: any) => {
            const mainImage = product.imagenes_producto?.[0]; // Simplificado por seguridad
            return {
                id: product.id,
                nombre: product.nombre,
                precio: product.precio_venta,
                imagen: mainImage?.url || '/productos/placeholder.jpg',
                slug: product.slug
            };
        });

        return new Response(JSON.stringify(results), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (e) {
        console.error('Error interno en búsqueda:', e);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
}
