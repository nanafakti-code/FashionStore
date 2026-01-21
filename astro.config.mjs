/**
 * FASHIONMARKET - ASTRO CONFIGURATION
 * ===================================
 * Configuración de Astro 5.0 en modo híbrido
 */

import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import preact from '@astrojs/preact';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
    // Site URL para desarrollo local
    site: 'http://localhost:4321/',

    // Modo servidor: SSR por defecto, usa export const prerender = true para SSG
    // En Astro 5.0, 'hybrid' fue removido. Usamos 'server' y marcamos páginas estáticas con prerender
    output: 'server',
    
    // Adaptador para Node.js (producción)
    adapter: node({
        mode: 'standalone'
    }),

    // Integraciones
    integrations: [
        // Tailwind CSS con configuración personalizada
        tailwind({
            applyBaseStyles: true,
        }),

        // Preact para componentes interactivos (islands)
        preact({
            compat: true, // Habilita compatibilidad con React
        }),
    ],

    // Configuración de servidor de desarrollo
    server: {
        port: 4321,
        host: true,
    },

    // Optimizaciones de build
    build: {
        inlineStylesheets: 'auto',
    },

    // Configuración de imágenes
    image: {
        domains: ['supabase.co'], // Permitir imágenes de Supabase Storage
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**.supabase.co',
            },
        ],
    },

    // Vite configuration
    vite: {
        server: {
            allowedHosts: 'all',
        },
        optimizeDeps: {
            exclude: ['@astrojs/preact'],
        },
        ssr: {
            noExternal: ['@supabase/supabase-js'],
        },
    },
});
