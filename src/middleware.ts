/**
 * FASHIONMARKET - MIDDLEWARE
 * ===========================
 * Protección de rutas y CORS seguro
 */

import { defineMiddleware } from 'astro:middleware';

// =====================================================
// CORS - Lista blanca de orígenes permitidos
// =====================================================
const ALLOWED_ORIGINS: string[] = [
    'http://localhost:4321',
    'http://localhost:3000',
    'http://localhost:5173',
    import.meta.env.APP_URL,
    import.meta.env.PUBLIC_APP_URL,
].filter(Boolean) as string[];

function getAllowedOrigin(requestOrigin: string | null): string | null {
    if (!requestOrigin) return null;
    // En desarrollo permitir localhost
    if (!import.meta.env.PROD && requestOrigin.startsWith('http://localhost')) {
        return requestOrigin;
    }
    return ALLOWED_ORIGINS.includes(requestOrigin) ? requestOrigin : null;
}

const CORS_HEADERS = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-guest-session-id',
    'Access-Control-Max-Age': '86400',
};

export const onRequest = defineMiddleware(async ({ url, request }, next) => {
    // Excluir explícitamente /admin-secret-login de cualquier protección
    if (url.pathname === '/admin-secret-login') {
        return next();
    }

    // Las rutas /admin/ están protegidas por servidor
    if (url.pathname.startsWith('/admin/')) {
        const cookie = request.headers.get('cookie');
        const { isAdminFromCookie } = await import('@/lib/admin-auth');

        if (!isAdminFromCookie(cookie || '')) {
            console.log('[Middleware] Acceso denegado a ruta admin -> redirigiendo a login');
            return Response.redirect(new URL('/admin-secret-login', url));
        }

        return next();
    }

    // CORS para rutas API con origen restringido
    if (url.pathname.startsWith('/api/')) {
        const origin = request.headers.get('origin');
        const allowedOrigin = getAllowedOrigin(origin);

        // Responder a peticiones OPTIONS (Preflight) de forma inmediata
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: {
                    ...CORS_HEADERS,
                    ...(allowedOrigin ? { 'Access-Control-Allow-Origin': allowedOrigin } : {}),
                }
            });
        }

        const response = await next();

        // Inyectar CORS headers en la respuesta
        if (allowedOrigin) {
            response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
        }
        Object.entries(CORS_HEADERS).forEach(([key, value]) => {
            response.headers.set(key, value);
        });

        return response;
    }

    return await next();
});
