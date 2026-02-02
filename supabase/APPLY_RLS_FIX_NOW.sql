-- =====================================================
-- CRITICAL FIX: RLS SELECT POLICY FOR CART
-- =====================================================
-- ISSUE: Authenticated users can INSERT into cart_items,
--        but CANNOT READ (SELECT) their own rows.
-- CAUSE: RLS is enabled, but the SELECT policy is missing
--        or was never applied to the production database.
-- =====================================================
-- EXECUTE THIS SCRIPT IN SUPABASE SQL EDITOR
-- =====================================================

-- Step 1: Ensure RLS is enabled (idempotent)
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can read their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can insert into their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can insert their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can update their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can delete their own cart items" ON cart_items;

-- Step 3: Create all necessary CRUD policies

-- SELECT: Allow users to read their own cart items
CREATE POLICY "Users can read their own cart items"
ON cart_items FOR SELECT
USING (auth.uid() = user_id);

-- INSERT: Allow users to add items to their own cart
CREATE POLICY "Users can insert their own cart items"
ON cart_items FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Allow users to modify their own cart items
CREATE POLICY "Users can update their own cart items"
ON cart_items FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: Allow users to remove their own cart items
CREATE POLICY "Users can delete their own cart items"
ON cart_items FOR DELETE
USING (auth.uid() = user_id);

-- Step 4: Verify policies were created
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'cart_items';

-- =====================================================
-- EXPECTED OUTPUT: 4 rows (SELECT, INSERT, UPDATE, DELETE)
-- =====================================================
