import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        middlewareMode: true,
        allowedHosts: 'all',
    },
    optimizeDeps: {
        exclude: ['@astrojs/preact'],
    },
    ssr: {
        noExternal: ['@supabase/supabase-js'],
    },
});
