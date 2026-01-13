/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

// =====================================================
// VARIABLES DE ENTORNO
// =====================================================

interface ImportMetaEnv {
    readonly PUBLIC_SUPABASE_URL: string;
    readonly PUBLIC_SUPABASE_ANON_KEY: string;
    readonly PUBLIC_SITE_URL?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

// =====================================================
// TIPOS DE SUPABASE (generados automáticamente)
// =====================================================

// Para generar estos tipos automáticamente desde tu esquema:
// npx supabase gen types typescript --project-id "tu-project-id" > src/lib/database.types.ts
