-- ============================================
-- POLÍTICAS DE RLS (Row Level Security)
-- ============================================
-- Este archivo configura las políticas de seguridad para la tabla usuarios
-- Permite que los usuarios no autenticados creen cuentas

-- 1. TABLA: usuarios
-- Permitir que cualquiera cree una cuenta (INSERT)
CREATE POLICY "Allow unauthenticated users to create accounts" 
ON public.usuarios 
FOR INSERT 
WITH CHECK (true);

-- Permitir que cada usuario vea su propia información
CREATE POLICY "Users can view their own data" 
ON public.usuarios 
FOR SELECT 
USING (auth.uid() = id);

-- Permitir que cada usuario actualice su propia información
CREATE POLICY "Users can update their own data" 
ON public.usuarios 
FOR UPDATE 
USING (auth.uid() = id);

-- Permitir que administradores vean todos los usuarios
CREATE POLICY "Admins can view all users" 
ON public.usuarios 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 2. TABLA: productos
-- Permitir que todos vean los productos
CREATE POLICY "Anyone can view products" 
ON public.productos 
FOR SELECT 
USING (true);

-- 3. TABLA: carrito
-- Permitir que cada usuario vea su propio carrito
CREATE POLICY "Users can view their own cart" 
ON public.carrito 
FOR SELECT 
USING (auth.uid() = user_id);

-- Permitir que cada usuario inserte en su propio carrito
CREATE POLICY "Users can insert into their own cart" 
ON public.carrito 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Permitir que cada usuario actualice su propio carrito
CREATE POLICY "Users can update their own cart" 
ON public.carrito 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Permitir que cada usuario elimine de su propio carrito
CREATE POLICY "Users can delete from their own cart" 
ON public.carrito 
FOR DELETE 
USING (auth.uid() = user_id);

-- 4. TABLA: ordenes
-- Permitir que cada usuario vea sus propias órdenes
CREATE POLICY "Users can view their own orders" 
ON public.ordenes 
FOR SELECT 
USING (auth.uid() = user_id);

-- Permitir que cada usuario cree órdenes
CREATE POLICY "Users can create orders" 
ON public.ordenes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 5. TABLA: items_orden
-- Permitir que cada usuario vea los items de sus órdenes
CREATE POLICY "Users can view their order items" 
ON public.items_orden 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.ordenes 
    WHERE id = items_orden.orden_id 
    AND user_id = auth.uid()
  )
);
