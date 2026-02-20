// =====================================================
// AUTH MODULE - USES SHARED SUPABASE CLIENT
// =====================================================
// IMPORTANT: This module uses the shared Supabase client from supabase.ts
// to ensure session state is consistent across the application.
// DO NOT create a new client here!
// =====================================================

import { supabase } from './supabase';

// =====================================================
// CUSTOM ERROR CLASS
// =====================================================

export class AuthError extends Error {
  code: string;
  constructor(message: string, code: string = 'AUTH_ERROR') {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

// Funciones de autenticación
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    throw new AuthError(`Error al iniciar sesión con Google: ${error.message}`, error.status?.toString() || 'OAUTH_ERROR');
  }

  return data;
}

export async function signInWithApple() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "apple",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    throw new AuthError(`Error al iniciar sesión con Apple: ${error.message}`, error.status?.toString() || 'OAUTH_ERROR');
  }

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new AuthError(`Error al cerrar sesión: ${error.message}`, 'SIGNOUT_ERROR');
  }
}

export async function getCurrentUser() {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      // Ignore session missing error (expected for guests)
      if (error.message?.includes("Auth session missing")) {
        return null;
      }
      console.error('[Auth] Error obteniendo usuario:', { code: (error as any).code, message: error.message });
      return null;
    }

    return user;
  } catch (err) {
    console.error('[Auth] Error inesperado en getCurrentUser:', err);
    return null;
  }
}

export async function getCurrentSession() {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error('[Auth] Error obteniendo sesión:', { code: (error as any).code, message: error.message });
      return null;
    }

    return session;
  } catch (err) {
    console.error('[Auth] Error inesperado en getCurrentSession:', err);
    return null;
  }
}

// Función para crear usuario en tabla users
export async function createUserProfile(user: any) {
  if (!user?.id || !user?.email) {
    throw new AuthError('Datos de usuario inválidos para crear perfil', 'INVALID_USER_DATA');
  }

  const { data, error } = await supabase.from("users").insert([
    {
      id: user.id,
      email: user.email,
      display_name:
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0],
      avatar_url: user.user_metadata?.avatar_url || null,
      provider: user.app_metadata?.provider || "email",
    },
  ]);

  if (error) {
    // Si el usuario ya existe, no hay problema (constraint violation)
    if (error.code !== "23505") {
      throw new AuthError(`Error creando perfil de usuario: ${error.message}`, error.code);
    }
  }

  return data;
}

// Función para obtener perfil de usuario
export async function getUserProfile(userId: string) {
  if (!userId) return null;

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error('[Auth] Error obteniendo perfil:', { userId, code: error.code });
    return null;
  }

  return data;
}

// Función para actualizar perfil
export async function updateUserProfile(
  userId: string,
  updates: { display_name?: string; avatar_url?: string }
) {
  if (!userId) {
    throw new AuthError('userId es requerido para actualizar perfil', 'MISSING_USER_ID');
  }

  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", userId);

  if (error) {
    throw new AuthError(`Error actualizando perfil: ${error.message}`, error.code);
  }

  return data;
}

// Escuchar cambios de sesión
export function onAuthStateChange(callback: (user: any) => void) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (event: string, session: { user: any } | null) => {
    const user = session?.user;

    if (user) {
      // Crear perfil si es primer login
      if (event === "SIGNED_IN") {
        try {
          await createUserProfile(user);
        } catch (err) {
          console.error('[Auth] Error creando perfil en onAuthStateChange:', err);
        }
      }
      callback(user);
    } else {
      callback(null);
    }
  });

  return subscription;
}
