/**
 * FASHIONMARKET - UTILITY FUNCTIONS
 * ==================================
 * Funciones helper reutilizables
 */

// =====================================================
// FORMATEO DE PRECIOS
// =====================================================

/**
 * Convierte céntimos a euros formateados
 * @param cents - Precio en céntimos
 * @returns Precio formateado (ej: "49,99 €")
 */
export function formatPrice(cents: number): string {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
    }).format(cents / 100);
}

/**
 * Convierte euros a céntimos
 * @param euros - Precio en euros
 * @returns Precio en céntimos
 */
export function eurosToCents(euros: number): number {
    return Math.round(euros * 100);
}

// =====================================================
// GENERACIÓN DE SLUGS
// =====================================================

/**
 * Genera un slug a partir de un texto
 * @param text - Texto a convertir
 * @returns Slug (ej: "camisa-oxford-blanca")
 */
export function generateSlug(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD') // Descomponer caracteres acentuados
        .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
        .replace(/[^a-z0-9\s-]/g, '') // Eliminar caracteres especiales
        .trim()
        .replace(/\s+/g, '-') // Reemplazar espacios con guiones
        .replace(/-+/g, '-'); // Eliminar guiones duplicados
}

// =====================================================
// VALIDACIÓN
// =====================================================

/**
 * Valida si hay stock suficiente
 * @param requested - Cantidad solicitada
 * @param available - Stock disponible
 * @returns true si hay stock suficiente
 */
export function hasStock(requested: number, available: number): boolean {
    return requested > 0 && requested <= available;
}

/**
 * Valida formato de email
 * @param email - Email a validar
 * @returns true si el email es válido
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// =====================================================
// FORMATEO DE URLS DE IMÁGENES
// =====================================================

/**
 * Obtiene la primera imagen de un array o retorna placeholder
 * @param images - Array de URLs de imágenes
 * @returns URL de la primera imagen o placeholder
 */
export function getFirstImage(images: string[] | null | undefined): string {
    if (!images || images.length === 0) {
        return '/placeholder-product.jpg';
    }
    return images[0];
}

/**
 * Extrae el path de una URL de Supabase Storage
 * @param url - URL completa de Supabase Storage
 * @returns Path del archivo
 */
export function extractStoragePath(url: string): string | null {
    try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        // Formato: /storage/v1/object/public/bucket-name/path/to/file
        const bucketIndex = pathParts.indexOf('public');
        if (bucketIndex === -1) return null;

        return pathParts.slice(bucketIndex + 2).join('/');
    } catch {
        return null;
    }
}

// =====================================================
// FORMATEO DE FECHAS
// =====================================================

/**
 * Formatea una fecha en español
 * @param date - Fecha a formatear
 * @returns Fecha formateada (ej: "15 de enero de 2024")
 */
export function formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    return new Intl.DateTimeFormat('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(dateObj);
}

/**
 * Formatea una fecha de forma relativa
 * @param date - Fecha a formatear
 * @returns Fecha relativa (ej: "hace 2 días")
 */
export function formatRelativeDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

    if (diffInSeconds < 60) return 'hace un momento';
    if (diffInSeconds < 3600) return `hace ${Math.floor(diffInSeconds / 60)} minutos`;
    if (diffInSeconds < 86400) return `hace ${Math.floor(diffInSeconds / 3600)} horas`;
    if (diffInSeconds < 604800) return `hace ${Math.floor(diffInSeconds / 86400)} días`;

    return formatDate(dateObj);
}

// =====================================================
// UTILIDADES DE ARRAY
// =====================================================

/**
 * Agrupa items por una clave
 * @param items - Array de items
 * @param key - Clave por la que agrupar
 * @returns Objeto con items agrupados
 */
export function groupBy<T>(items: T[], key: keyof T): Record<string, T[]> {
    return items.reduce((result, item) => {
        const groupKey = String(item[key]);
        if (!result[groupKey]) {
            result[groupKey] = [];
        }
        result[groupKey].push(item);
        return result;
    }, {} as Record<string, T[]>);
}

/**
 * Mezcla un array aleatoriamente
 * @param array - Array a mezclar
 * @returns Array mezclado
 */
export function shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// =====================================================
// UTILIDADES DE STRING
// =====================================================

/**
 * Trunca un texto a un número máximo de caracteres
 * @param text - Texto a truncar
 * @param maxLength - Longitud máxima
 * @returns Texto truncado con "..."
 */
export function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
}

/**
 * Capitaliza la primera letra de un string
 * @param text - Texto a capitalizar
 * @returns Texto capitalizado
 */
export function capitalize(text: string): string {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}
