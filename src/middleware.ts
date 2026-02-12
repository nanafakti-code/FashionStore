/**
 * FASHIONMARKET - MIDDLEWARE
 * ===========================
 * Protección de rutas /admin con autenticación
 */

import { defineMiddleware } from 'astro:middleware';

// Intenta cargar Supabase solo si las credenciales están disponibles
try {
    await import('./lib/supabase');
} catch (error) {
    console.warn('⚠️ Supabase no está disponible. Las rutas /admin no serán protegidas.');
}

export const onRequest = defineMiddleware(async ({ url, request }, next) => {
    // NOTA: Las rutas /admin/ usan autenticación client-side con localStorage
    // No necesitan protección de middleware basada en cookies de Supabase

    // Excluir explícitamente /admin-secret-login de cualquier protección
    if (url.pathname === '/admin-secret-login') {
        return next();
    }

    // Las rutas /admin/ están protegidas en el cliente con localStorage
    // No aplicar middleware de Supabase aquí para evitar redirect loops
    if (url.pathname.startsWith('/admin/')) {
        return next();
    }

    /* DESHABILITADO - Admin usa localStorage, no cookies de Supabase
    if (url.pathname.startsWith('/admin/')) {

        // Si Supabase no está disponible, permitir acceso en desarrollo
        if (!supabase) {
            console.warn('⚠️ Supabase no configurado. Permitiendo acceso a /admin en modo desarrollo.');
            return next();
        }

        // Obtener tokens de las cookies
        const accessToken = cookies.get('sb-access-token')?.value;
        const refreshToken = cookies.get('sb-refresh-token')?.value;

        // Si no hay tokens, redirigir a login
        if (!accessToken) {
            return redirect('/admin/login');
        }

        // Verificar sesión con Supabase
        const { data: { user }, error } = await supabase.auth.getUser(accessToken);

        // Si hay error o no hay usuario, redirigir a login
        if (error || !user) {
            // Limpiar cookies inválidas
            cookies.delete('sb-access-token', { path: '/' });
            cookies.delete('sb-refresh-token', { path: '/' });
            return redirect('/admin/login');
        }

        // Usuario autenticado, continuar
        return next();
    }
    */

    // HABILITAR CORS PARA TODAS LAS RUTAS (Necesario para Flutter Web/Mobile)
    const url_obj = new URL(request.url);
    if (url_obj.pathname.startsWith('/api/')) {
        // Responder a peticiones OPTIONS (Preflight) de forma inmediata
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-guest-session-id',
                    'Access-Control-Max-Age': '86400',
                }
            });
        }
    }

    const response = await next();

    // Inyectar headers en la respuesta normal de la API
    if (url_obj.pathname.startsWith('/api/')) {
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-guest-session-id');
        response.headers.set('Access-Control-Max-Age', '86400');
    }

    return response;
});
