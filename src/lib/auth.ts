// =====================================================
// AUTH MODULE - USES SHARED SUPABASE CLIENT
// =====================================================
// IMPORTANT: This module uses the shared Supabase client from supabase.ts
// to ensure session state is consistent across the application.
// DO NOT create a new client here!
// =====================================================

import { supabase } from './supabase';

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
    console.error("Error signing in with Google:", error);
    throw error;
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
    console.error("Error signing in with Apple:", error);
    throw error;
  }

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Error signing out:", error);
    throw error;
  }
}

export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("Error getting user:", error);
    return null;
  }

  return user;
}

export async function getCurrentSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error("Error getting session:", error);
    return null;
  }

  return session;
}

// Función para crear usuario en tabla users
export async function createUserProfile(user: any) {
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
    // Si el usuario ya existe, no hay problema
    if (error.code !== "23505") {
      console.error("Error creating user profile:", error);
      throw error;
    }
  }

  return data;
}

// Función para obtener perfil de usuario
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error getting user profile:", error);
    return null;
  }

  return data;
}

// Función para actualizar perfil
export async function updateUserProfile(
  userId: string,
  updates: { display_name?: string; avatar_url?: string }
) {
  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", userId);

  if (error) {
    console.error("Error updating user profile:", error);
    throw error;
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
        await createUserProfile(user);
      }
      callback(user);
    } else {
      callback(null);
    }
  });

  return subscription;
}
