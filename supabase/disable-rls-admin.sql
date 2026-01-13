-- =====================================================
-- DESHABILITAR RLS PARA TABLAS DE ADMIN
-- =====================================================
-- Esto permite CRUD sin restricciones RLS
-- La seguridad se mantiene a nivel de frontend (validación de admin token)

-- Deshabilitar RLS en tabla productos
ALTER TABLE public.productos DISABLE ROW LEVEL SECURITY;

-- Deshabilitar RLS en tabla imagenes_producto
ALTER TABLE public.imagenes_producto DISABLE ROW LEVEL SECURITY;

-- Deshabilitar RLS en tabla categorias
ALTER TABLE public.categorias DISABLE ROW LEVEL SECURITY;

-- Deshabilitar RLS en tabla marcas
ALTER TABLE public.marcas DISABLE ROW LEVEL SECURITY;

-- Deshabilitar RLS en tabla pedidos
ALTER TABLE public.pedidos DISABLE ROW LEVEL SECURITY;

-- Deshabilitar RLS en tabla usuarios
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;

-- Deshabilitar RLS en tabla cupones_descuento
ALTER TABLE public.cupones_descuento DISABLE ROW LEVEL SECURITY;

-- Deshabilitar RLS en tabla envios
ALTER TABLE public.envios DISABLE ROW LEVEL SECURITY;

-- Deshabilitar RLS en tabla devoluciones
ALTER TABLE public.devoluciones DISABLE ROW LEVEL SECURITY;

-- Deshabilitar RLS en tabla resenas
ALTER TABLE public.resenas DISABLE ROW LEVEL SECURITY;
