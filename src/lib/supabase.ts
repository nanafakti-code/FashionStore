/**
 * FASHIONMARKET - SUPABASE CLIENT
 * ================================
 * Cliente singleton de Supabase para uso en servidor y cliente
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// =====================================================
// VARIABLES DE ENTORNO
// =====================================================

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

// Log detallado para debugging en producción
const isProduction = import.meta.env.PROD;

console.log('=== SUPABASE CONFIG DEBUG ===');
console.log('Environment:', isProduction ? 'PRODUCTION' : 'DEVELOPMENT');
console.log('PUBLIC_SUPABASE_URL:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'NOT SET');
console.log('PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'NOT SET');

// Validar configuración
const isConfigured = Boolean(
    supabaseUrl && 
    supabaseAnonKey && 
    supabaseUrl.includes('supabase.co') &&
    supabaseAnonKey.length > 50
);

console.log('Supabase configured:', isConfigured);
console.log('=============================');

if (!isConfigured) {
    console.error(
        '❌ SUPABASE NOT CONFIGURED - Variables de entorno faltantes o inválidas.\n' +
        'Asegúrate de configurar en Coolify:\n' +
        '  - PUBLIC_SUPABASE_URL\n' +
        '  - PUBLIC_SUPABASE_ANON_KEY'
    );
}

// =====================================================
// CLIENTE SUPABASE
// =====================================================

// Mock client para desarrollo sin Supabase - DEVUELVE ERROR EN PRODUCCIÓN
class MockSupabaseClient {
    private mockError = { message: 'SUPABASE_NOT_CONFIGURED: Variables de entorno no configuradas en Coolify', code: 'ENV_MISSING' };
    
    from() {
        const self = this;
        return {
            select: () => ({
                eq: () => ({
                    eq: () => ({
                        limit: () => ({
                            single: () => ({ data: null, error: self.mockError }),
                            data: null,
                            error: self.mockError,
                        }),
                        single: () => ({ data: null, error: self.mockError }),
                        data: null,
                        error: self.mockError,
                    }),
                    limit: () => ({
                        single: () => ({ data: null, error: self.mockError }),
                        data: null,
                        error: self.mockError,
                    }),
                    single: () => ({ data: null, error: self.mockError }),
                    order: () => ({ data: null, error: self.mockError }),
                    data: null,
                    error: self.mockError,
                }),
                order: () => ({
                    data: null,
                    error: self.mockError,
                }),
                limit: () => ({
                    single: () => ({ data: null, error: self.mockError }),
                    data: null,
                    error: self.mockError,
                }),
                single: () => ({ data: null, error: self.mockError }),
                data: null,
                error: self.mockError,
            }),
            insert: () => ({ data: null, error: self.mockError }),
            update: () => ({ eq: () => ({ data: null, error: self.mockError }) }),
            delete: () => ({ eq: () => ({ data: null, error: self.mockError }) }),
        };
    }

    auth = {
        getUser: async () => ({
            data: { user: null },
            error: { message: 'Supabase no configurado' },
        }),
        getSession: async () => ({
            data: { session: null },
            error: { message: 'Supabase no configurado' },
        }),
        signUp: async () => ({
            data: null,
            error: new Error('Supabase no configurado'),
        }),
        signInWithPassword: async () => ({
            data: null,
            error: new Error('Supabase no configurado'),
        }),
        signOut: async () => ({
            data: null,
            error: null,
        }),
        onAuthStateChange: () => ({
            data: { subscription: { unsubscribe: () => {} } },
        }),
    };

    storage = {
        from: () => ({
            getPublicUrl: () => ({ data: { publicUrl: '' } }),
            upload: async () => ({ data: null, error: { message: 'Supabase no configurado' } }),
            remove: async () => ({ data: null, error: { message: 'Supabase no configurado' } }),
        }),
    };
}

// Variable para saber si está configurado (exportada para uso externo)
export const isSupabaseConfigured = isConfigured;

/**
 * Cliente Supabase para uso en cliente (browser)
 * Usa la anon key pública
 */
export const supabase = isConfigured
    ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
        },
    })
    : (new MockSupabaseClient() as any);

/**
 * Crea un cliente Supabase para uso en servidor (SSR)
 * Permite pasar cookies de sesión para autenticación
 */
export function createServerClient(accessToken?: string) {
    if (!isConfigured) {
        return new MockSupabaseClient() as any;
    }

    return createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
        },
        global: {
            headers: accessToken
                ? {
                    Authorization: `Bearer ${accessToken}`,
                }
                : {},
        },
    });
}

// =====================================================
// HELPERS DE AUTENTICACIÓN
// =====================================================

/**
 * Verifica si hay un usuario autenticado
 */
export async function getUser() {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
        console.error('Error getting user:', error);
        return null;
    }

    return user;
}

/**
 * Cierra la sesión del usuario actual
 */
export async function signOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
        console.error('Error signing out:', error);
        return false;
    }

    return true;
}

/**
 * Inicia sesión con email y contraseña
 */
export async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        console.error('Error signing in:', error);
        return { user: null, session: null, error };
    }

    return { user: data.user, session: data.session, error: null };
}

// =====================================================
// HELPERS DE STORAGE
// =====================================================

/**
 * Obtiene la URL pública de un archivo en Storage
 */
export function getPublicUrl(bucket: string, path: string): string {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
}

/**
 * Sube un archivo a Storage
 */
export async function uploadFile(
    bucket: string,
    path: string,
    file: File
): Promise<{ url: string | null; error: Error | null }> {
    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
            cacheControl: '3600',
            upsert: false,
        });

    if (error) {
        return { url: null, error };
    }

    const url = getPublicUrl(bucket, data.path);
    return { url, error: null };
}

/**
 * Elimina un archivo de Storage
 */
export async function deleteFile(
    bucket: string,
    path: string
): Promise<{ success: boolean; error: Error | null }> {
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
        return { success: false, error };
    }

    return { success: true, error: null };
}
