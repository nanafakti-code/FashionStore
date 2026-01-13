/**
 * FASHIONMARKET - TAILWIND CSS CONFIGURATION
 * ==========================================
 * Tema personalizado - Estética Moderna Colorida
 * Paleta: Azul Celeste, Rosa Coral, Naranja Cálido, Verde Menta, Blanco
 */

/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
    theme: {
        extend: {
            // =====================================================
            // PALETA DE COLORES - MODERN COLORFUL
            // =====================================================
            colors: {
                // Azul celeste (primario)
                sky: {
                    50: '#f0f9ff',
                    100: '#e0f2fe',
                    200: '#bae6fd',
                    300: '#7dd3fc',
                    400: '#38bdf8',
                    500: '#0ea5e9',
                    600: '#0284c7',
                    700: '#0369a1',
                    800: '#075985',
                    900: '#0c3d66',
                },
                // Rosa coral (secundario)
                pink: {
                    100: '#ffe4e6',
                    200: '#fccedd',
                    300: '#f8a3b0',
                    400: '#f472b6',
                    500: '#ec4899',
                    600: '#db2777',
                },
                // Naranja cálido (accent)
                amber: {
                    300: '#fcd34d',
                    400: '#fbbf24',
                    500: '#f59e0b',
                    600: '#d97706',
                },
                // Verde menta
                emerald: {
                    100: '#d1fae5',
                    400: '#34d399',
                    500: '#10b981',
                    600: '#059669',
                },
                // Gris suave
                slate: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a',
                },
                charcoal: {
                    50: '#f7f7f7',
                    100: '#e3e3e3',
                    200: '#c8c8c8',
                    300: '#a4a4a4',
                    400: '#818181',
                    500: '#666666',
                    600: '#515151',
                    700: '#434343',
                    800: '#383838',
                    900: '#1a1a1a',
                },
                // Blanco roto / Cream
                cream: {
                    50: '#fefefe',
                    100: '#fdfcfb',
                    200: '#faf8f5',
                    300: '#f7f4ef',
                    400: '#f4f0e9',
                    500: '#f1ece3',
                    600: '#e8e0d3',
                    700: '#dfd4c3',
                    800: '#d6c8b3',
                    900: '#cdbca3',
                },
                // Dorado mate (acentos)
                gold: {
                    50: '#fefaf3',
                    100: '#fdf5e7',
                    200: '#fae6c3',
                    300: '#f7d79f',
                    400: '#f1b957',
                    500: '#d4a574',
                    600: '#c08d5a',
                    700: '#a07548',
                    800: '#805d36',
                    900: '#604524',
                },
            },

            // =====================================================
            // TIPOGRAFÍAS
            // =====================================================
            fontFamily: {
                // Monoespaciada para títulos (sistema)
                mono: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto Mono', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Code', 'Droid Sans Mono', 'Source Code Pro', 'monospace'],
                // Serif moderna para títulos (Playfair Display)
                serif: ['"Playfair Display"', 'Georgia', 'serif'],
                // Sans-serif limpia para textos (Inter)
                sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
            },

            // =====================================================
            // ESPACIADO PERSONALIZADO
            // =====================================================
            spacing: {
                '18': '4.5rem',
                '88': '22rem',
                '128': '32rem',
            },

            // =====================================================
            // SOMBRAS PREMIUM
            // =====================================================
            boxShadow: {
                'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
                'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 30px -5px rgba(0, 0, 0, 0.04)',
                'strong': '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 20px 50px -10px rgba(0, 0, 0, 0.1)',
                'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
            },

            // =====================================================
            // ANIMACIONES SUAVES
            // =====================================================
            animation: {
                'fade-in': 'fadeIn 0.5s ease-in-out',
                'slide-up': 'slideUp 0.4s ease-out',
                'slide-down': 'slideDown 0.4s ease-out',
                'scale-in': 'scaleIn 0.3s ease-out',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                slideDown: {
                    '0%': { transform: 'translateY(-20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                scaleIn: {
                    '0%': { transform: 'scale(0.95)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
            },

            // =====================================================
            // TRANSICIONES
            // =====================================================
            transitionDuration: {
                '400': '400ms',
            },
            transitionTimingFunction: {
                'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
            },

            // =====================================================
            // TAMAÑOS MÁXIMOS
            // =====================================================
            maxWidth: {
                '8xl': '88rem',
                '9xl': '96rem',
            },

            // =====================================================
            // ASPECT RATIOS
            // =====================================================
            aspectRatio: {
                'product': '3 / 4', // Ratio típico para fotos de moda
            },
        },
    },
    plugins: [
        // Plugin para formularios (opcional, pero recomendado)
        // require('@tailwindcss/forms'),
    ],
}
