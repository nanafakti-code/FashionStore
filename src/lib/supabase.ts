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

// En desarrollo, permitir valores placeholder
const isProduction = import.meta.env.PROD;
const isConfigured = supabaseUrl && 
                     supabaseAnonKey && 
                     !supabaseUrl.includes('placeholder') &&
                     !supabaseAnonKey.includes('placeholder');

if (!isConfigured && isProduction) {
    throw new Error(
        'Missing Supabase environment variables. Please check your .env file.'
    );
}

console.warn(
    `⚠️ Supabase ${isConfigured ? 'configurado' : 'NO CONFIGURADO'} - Solo rutas públicas funcionarán`
);

// =====================================================
// CLIENTE SUPABASE
// =====================================================

// Mock client para desarrollo sin Supabase
class MockSupabaseClient {
    from(table: string) {
        return {
            select: (fields = '*') => ({
                eq: () => ({
                    eq: () => ({
                        limit: () => ({
                            data: [],
                            error: null,
                        }),
                        data: [],
                        error: null,
                    }),
                    limit: () => ({
                        data: [],
                        error: null,
                    }),
                    data: [],
                    error: null,
                }),
                order: () => ({
                    data: [],
                    error: null,
                }),
                limit: () => ({
                    data: [],
                    error: null,
                }),
                data: [],
                error: null,
            }),
        };
    }

    auth = {
        getUser: async () => ({
            data: { user: null },
            error: null,
        }),
        signUp: async () => ({
            data: null,
            error: new Error('Supabase no configurado'),
        }),
        signIn: async () => ({
            data: null,
            error: new Error('Supabase no configurado'),
        }),
        signOut: async () => ({
            data: null,
            error: null,
        }),
    };
}

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
export function createServerClient(accessToken?: string, refreshToken?: string) {
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
