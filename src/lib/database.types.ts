/**
 * FASHIONMARKET - DATABASE TYPES
 * ===============================
 * Tipos TypeScript generados desde el esquema de Supabase
 * 
 * Para regenerar estos tipos automáticamente:
 * npx supabase gen types typescript --project-id "tu-project-id" > src/lib/database.types.ts
 */

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            categories: {
                Row: {
                    id: string
                    name: string
                    slug: string
                    description: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    slug: string
                    description?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    slug?: string
                    description?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            products: {
                Row: {
                    id: string
                    name: string
                    slug: string
                    description: string | null
                    price: number
                    stock: number
                    category_id: string | null
                    images: string[]
                    sizes: string[]
                    featured: boolean
                    active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    slug: string
                    description?: string | null
                    price: number
                    stock?: number
                    category_id?: string | null
                    images?: string[]
                    sizes?: string[]
                    featured?: boolean
                    active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    slug?: string
                    description?: string | null
                    price?: number
                    stock?: number
                    category_id?: string | null
                    images?: string[]
                    sizes?: string[]
                    featured?: boolean
                    active?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
    }
}
