-- ============================================
-- COUPONS & DISCOUNT SYSTEM
-- Database Schema for FashionStore
-- ============================================

-- 1. COUPONS TABLE - Main coupon definitions
CREATE TABLE IF NOT EXISTS coupons (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('PERCENTAGE', 'FIXED')),
  value NUMERIC(10, 2) NOT NULL CHECK (value > 0),
  min_order_value NUMERIC(10, 2),
  max_uses_global INT,
  max_uses_per_user INT DEFAULT 1,
  expiration_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  assigned_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL = todos, UUID = solo ese usuario
  created_by_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups by code
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_expiration ON coupons(expiration_date);

-- 2. COUPON_USAGES TABLE - Tracks each coupon usage (redemption log)
CREATE TABLE IF NOT EXISTS coupon_usages (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  coupon_id BIGINT NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID, -- Optional: stores order reference (no FK to avoid ordenes/pedidos mismatch)
  discount_amount NUMERIC(10, 2),
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_coupon_usages_coupon_user ON coupon_usages(coupon_id, user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_coupon ON coupon_usages(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_user ON coupon_usages(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_order ON coupon_usages(order_id);

-- 3. RLS POLICIES (Row Level Security)
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usages ENABLE ROW LEVEL SECURITY;

-- Coupons: Anyone can read active coupons, only admins can create/edit
CREATE POLICY "Allow reading active coupons" ON coupons
  FOR SELECT USING (is_active = true OR auth.uid()::text = 'ADMIN');

CREATE POLICY "Allow admins to manage coupons" ON coupons
  FOR ALL USING (auth.uid()::text = 'ADMIN')
  WITH CHECK (auth.uid()::text = 'ADMIN');

-- Coupon Usages: Users can read their own usages
CREATE POLICY "Allow users to read own coupon usages" ON coupon_usages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow system to insert coupon usages" ON coupon_usages
  FOR INSERT WITH CHECK (true);

-- 4. HELPER VIEW - For Admin Dashboard Stats
CREATE OR REPLACE VIEW coupon_stats AS
SELECT 
  c.id,
  c.code,
  c.discount_type,
  c.value,
  c.is_active,
  c.max_uses_global,
  c.expiration_date,
  COUNT(cu.id) as times_used,
  COUNT(DISTINCT cu.user_id) as unique_users,
  CASE 
    WHEN c.max_uses_global IS NULL THEN NULL
    ELSE c.max_uses_global - COUNT(cu.id)
  END as remaining_uses
FROM coupons c
LEFT JOIN coupon_usages cu ON c.id = cu.coupon_id
GROUP BY c.id, c.code, c.discount_type, c.value, c.is_active, c.max_uses_global, c.expiration_date;

-- 5. AUDIT TABLE - Optional but recommended for compliance
CREATE TABLE IF NOT EXISTS coupon_audit_log (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  coupon_id BIGINT REFERENCES coupons(id),
  action VARCHAR(50),
  old_values JSONB,
  new_values JSONB,
  performed_by UUID REFERENCES auth.users(id),
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupon_audit_coupon ON coupon_audit_log(coupon_id);
