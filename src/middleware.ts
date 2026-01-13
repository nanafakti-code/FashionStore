/**
 * FASHIONMARKET - MIDDLEWARE
 * ===========================
 * Protección de rutas /admin con autenticación
 */

import { defineMiddleware } from 'astro:middleware';

let supabase: any = null;

// Intenta cargar Supabase solo si las credenciales están disponibles
try {
    const { supabase: sb } = await import('./lib/supabase');
    supabase = sb;
} catch (error) {
    console.warn('⚠️ Supabase no está disponible. Las rutas /admin no serán protegidas.');
}

export const onRequest = defineMiddleware(async ({ url, cookies, redirect }, next) => {
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

    // Rutas públicas, continuar sin verificación
    return next();
});
