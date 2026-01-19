#!/bin/bash
# 🧪 Script de Verificación del Carrito
# Ejecutar en: Supabase SQL Editor

echo "=== VERIFICACIÓN DEL CARRITO ==="
echo ""
echo "Paso 1: Verificar que la tabla existe"
echo "---"

# Query 1: Estructura de la tabla
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'cart_items'
ORDER BY ordinal_position;

echo ""
echo "Paso 2: Verificar índices"
echo "---"

# Query 2: Ver índices
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'cart_items'
ORDER BY indexname;

echo ""
echo "Paso 3: Verificar Políticas RLS"
echo "---"

# Query 3: Ver políticas
SELECT 
  schemaname,
  tablename,
  policyname,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'cart_items'
ORDER BY policyname;

echo ""
echo "Paso 4: Contar elementos en el carrito"
echo "---"

# Query 4: Contar items
SELECT 
  COUNT(*) as total_items,
  COUNT(DISTINCT user_id) as usuarios,
  COUNT(DISTINCT product_id) as productos
FROM cart_items;

echo ""
echo "Paso 5: Verificar RLS habilitado"
echo "---"

# Query 5: RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'cart_items';

echo ""
echo "✅ CHECKLIST DE VERIFICACIÓN:"
echo ""
echo "□ Tabla cart_items existe"
echo "  - 9 columnas: id, user_id, product_id, quantity, talla, color, precio_unitario, created_at, updated_at"
echo "  - user_id es NOT NULL"
echo ""
echo "□ Índices creados"
echo "  - idx_cart_items_unique (UNIQUE)"
echo "  - idx_cart_items_user_id"
echo "  - idx_cart_items_product_id"
echo ""
echo "□ Políticas RLS"
echo "  - Users can view their own cart items (SELECT)"
echo "  - Users can insert their own cart items (INSERT)"
echo "  - Users can update their own cart items (UPDATE)"
echo "  - Users can delete their own cart items (DELETE)"
echo ""
echo "□ RLS habilitado: true"
echo ""
echo "---"
echo "Si todo está en verde, ¡el carrito está listo! ✅"
