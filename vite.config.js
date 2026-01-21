import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        allowedHosts: 'all',
    },
    optimizeDeps: {
        exclude: ['@astrojs/preact'],
    },
    ssr: {
        noExternal: ['@supabase/supabase-js'],
    },
});
