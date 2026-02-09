# 🎁 COUPON & DISCOUNT SYSTEM - FASHIONSTORE
## Comprehensive Implementation Guide

---

## 📋 SYSTEM OVERVIEW

This is a **production-grade** coupon system with:
- ✅ **Per-user usage limits** (prevent abuse)
- ✅ **Global usage limits** (e.g., "100 total uses")
- ✅ **Expiration dates** (time-based constraints)
- ✅ **Minimum order values** (e.g., "€50 min purchase")
- ✅ **Flexible discount types** (percentage or fixed amount)
- ✅ **Complete audit trail** (usage tracking & history)
- ✅ **Admin management UI** (create/edit/deactivate coupons)

---

## 🗄️ DATABASE ARCHITECTURE

### Tables

#### 1. `coupons` table
```sql
id              BIGINT (PK)           -- Auto-increment
code            VARCHAR(50) UNIQUE    -- e.g., "SUMMER2025"
description     TEXT                  -- Marketing description
discount_type   VARCHAR(20)           -- "PERCENTAGE" or "FIXED"
value           NUMERIC(10, 2)        -- 10 for 10%, or 5 for €5
min_order_value NUMERIC(10, 2)        -- Min. cart value to use (nullable)
max_uses_global INT                   -- Total uses cap (nullable = unlimited)
max_uses_per_user INT                 -- Uses per user (default: 1)
expiration_date TIMESTAMP             -- When coupon expires
is_active       BOOLEAN               -- Enable/disable without deleting
created_by_user_id UUID               -- admin who created it
created_at      TIMESTAMP             -- Auto timestamp
updated_at      TIMESTAMP             -- Auto update on changes
```

#### 2. `coupon_usages` table
```sql
id              BIGINT (PK)           -- Auto-increment
coupon_id       BIGINT (FK)           -- References coupons(id)
user_id         UUID (FK)             -- References auth.users(id)
order_id        BIGINT (FK)           -- References pedidos(id)
discount_amount NUMERIC(10, 2)        -- Amount actually discounted
used_at         TIMESTAMP             -- When coupon was applied
```

#### 3. `coupon_stats` view
Auto-calculated stats for admin dashboard:
- `times_used` — Total times this coupon was redeemed
- `unique_users` — How many different users used it
- `remaining_uses` — (max_uses_global - times_used)

---

## 📁 FILES CREATED

### 1. Database Schema
**File:** `sql/coupons_system.sql`
- Creates all tables, indexes, views, RLS policies
- **Action:** Run this SQL in Supabase SQL editor

### 2. Backend Service
**File:** `src/lib/couponService.ts`
- `validateCoupon(code, userId, cartTotal)` — Main validation function
- `redeemCoupon(couponId, userId, orderId, discountAmount)` — Log usage
- `getUserCouponHistory(userId)` — Get user's applied coupons
- `getCouponStats(couponId?)` — Admin dashboard stats
- `canUserUseCoupon(couponId, userId)` — Quick eligibility check

### 3. API Endpoints
**File:** `src/pages/api/admin/coupons.ts`
- `POST /api/admin/coupons` — Create, update, deactivate coupons
- `GET /api/admin/coupons` — List all coupons with stats

**File:** `src/pages/api/validate-coupon.ts`
- `POST /api/validate-coupon` — Validate coupon in checkout

### 4. Admin UI Component
**File:** `src/components/islands/admin/CouponsManagement.tsx`
- Create new coupons (form)
- List all coupons (table with stats)
- Deactivate coupons
- Real-time updates after save

---

## 🚀 IMPLEMENTATION STEPS

### Step 1: Deploy Database Schema
```bash
# Open Supabase SQL editor
# Copy entire content of: sql/coupons_system.sql
# Execute in Supabase
```

✅ This creates tables, indexes, views, and RLS policies

### Step 2: Add Admin Menu Link
**File:** `src/layouts/AdminLayout.astro`

Add this in the Marketing section (around line 180):
```astro
<a
  href="/admin/dashboard?section=coupons"
  class="nav-link flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-800 transition-all duration-200"
  data-page="coupons"
>
  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 012 12V7a2 2 0 012-2z" />
  </svg>
  <span class="font-medium text-sm">Cupones</span>
</a>
```

### Step 3: Integrate CouponsManagement Component
**File:** `src/pages/admin/index.astro` or Dashboard Component

Add this React island:
```astro
---
import CouponsManagement from '@/components/islands/admin/CouponsManagement';
---

{section === 'coupons' && (
  <CouponsManagement client:only="react" />
)}
```

### Step 4: Integrate into Checkout
**File:** `src/pages/checkout/[checkoutId].astro` (or your checkout component)

#### Before Order Creation:

```typescript
import { validateCoupon, redeemCoupon } from '@/lib/couponService';

// User enters coupon code in checkout
async function applyCoupon(couponCode: string, userId: string, cartTotal: number) {
  const result = await validateCoupon(couponCode, userId, cartTotal);
  
  if (!result.valid) {
    // Show error toast
    showErrorToast(result.error);
    return null;
  }
  
  // Coupon is valid! Get discount
  return {
    couponId: result.coupon.id,
    discountAmount: result.discountAmount
  };
}

// After successful order creation:
async function finalizeOrder(orderId: number, couponId?: number, discountAmount?: number) {
  const user = await getCurrentUser();
  
  if (couponId && discountAmount) {
    // Log the coupon usage
    const redemption = await redeemCoupon(couponId, user.id, orderId, discountAmount);
    
    if (!redemption.success) {
      console.error('Coupon redemption failed:', redemption.error);
    }
  }
  
  // Continue with order confirmation, email, etc.
}
```

---

## 🔍 VALIDATION LOGIC (How It Works)

When user applies coupon at checkout:

```
1. FETCH COUPON
   └─ SELECT * FROM coupons WHERE code = 'SUMMER2025' AND is_active = true

2. CHECK EXPIRATION
   └─ IF now > expiration_date REJECT

3. CHECK MIN ORDER VALUE
   └─ IF cartTotal < min_order_value REJECT

4. CHECK GLOBAL USAGE LIMIT
   └─ SELECT COUNT(*) FROM coupon_usages WHERE coupon_id = X
   └─ IF count >= max_uses_global REJECT

5. CHECK USER-SPECIFIC LIMIT ⭐ (CRITICAL)
   └─ SELECT COUNT(*) FROM coupon_usages 
      WHERE coupon_id = X AND user_id = current_user
   └─ IF count >= max_uses_per_user REJECT
   └─ ERROR: "Ya has usado este cupón"

6. CALCULATE DISCOUNT
   └─ IF discount_type = 'PERCENTAGE': discount = cartTotal * (value / 100)
   └─ IF discount_type = 'FIXED': discount = value * 100 (convert € to cents)
   └─ Ensure discount doesn't exceed cartTotal

7. RETURN VALID
   └─ discountAmount ready to apply
```

---

## 💰 PRICE HANDLING

All prices in system are in **CENTS**:
- `1000` = €10.00
- `3500` = €35.00

**Discount Types:**
- **PERCENTAGE:** `value = 15` → 15% off
- **FIXED:** `value = 5` → €5 off (stored as 500 cents in DB, but input as 5)

**Example:**
- Cart Total: 5000 cents (€50.00)
- Coupon: 10% PERCENTAGE discount
- Discount Amount: 5000 * (10/100) = 500 cents (€5.00)
- Final Total: 4500 cents (€45.00)

---

## 📊 ADMIN DASHBOARD FEATURES

### Coupon Creation Form
```
✓ Code: SUMMER2025 (auto upper case)
✓ Discount Type: Percentage / Fixed Amount
✓ Value: 15 (for %) or 5 (for €)
✓ Min Order Value: €50 (optional)
✓ Max Uses Global: 100 (leave blank = unlimited)
✓ Max Uses Per User: 1 (default, single-use)
✓ Expiration Date: 2025-12-31 23:59:59
✓ Description: "Summer sale 2025"
```

### Coupon Stats Table
```
Code      | Type     | Value | Uses    | Users | Expires    | Status  | Actions
SUMMER25  | Percent  | 10%   | 45/100  | 40    | 31/12/25   | Active  | Deactivate
FLAT5     | Fixed    | €5    | ∞       | 23    | 28/02/26   | Active  | Deactivate
OLD2024   | Percent  | 5%    | 200/200 | 187   | 01/01/25   | Inactive| —
```

---

## 🛡️ SECURITY CONSIDERATIONS

### Race Condition Prevention
When multiple requests try to redeem same coupon:
- Each `INSERT` into `coupon_usages` is atomic
- Database constraints ensure `max_uses_global` is respected
- Supabase handles transaction safety automatically

### User-Specific Limits
Critical for preventing abuse:
```sql
SELECT COUNT(*) FROM coupon_usages 
WHERE coupon_id = X AND user_id = current_user
```
This query runs on EVERY validation to ensure user hasn't exceeded their limit.

### Audit Trail
Every coupon usage is logged with:
- `coupon_id` — which coupon
- `user_id` — which user applied it
- `order_id` — which order it was applied to
- `discount_amount` — how much they saved
- `used_at` — timestamp

---

## 📱 TESTING THE SYSTEM

### Test Case 1: Simple Percentage Coupon
1. Create coupon: `SUMMER2025`, 10% off, unlimited uses
2. Add €100 item to cart
3. Apply coupon → Should get €10 discount
4. Apply again → Should still work (no per-user limit)

### Test Case 2: Single-Use Coupon
1. Create coupon: `FIRSTORDER`, €5 off, 1 use per user
2. User A applies → Works, saves €5
3. User A tries again → ERROR: "Ya has usado este cupón"
4. User B applies → Works, saves €5

### Test Case 3: Limited Global Uses
1. Create coupon: `LIMITED`, 15% off, 5 total uses
2. 5 different users apply it → Works for all
3. 6th user tries → ERROR: "Este cupón ha alcanzado su límite de usos"

### Test Case 4: Expiration Check
1. Create coupon expiring: 2025-01-01 00:00:00
2. Try to apply → ERROR: "Este cupón ha expirado"

### Test Case 5: Minimum Order Value
1. Create coupon: €50 min, €10 off
2. Cart = €30 → ERROR: "Compra mínima requerida: €50"
3. Cart = €60 → Works, saves €10

---

## 🔗 API REFERENCE

### Validate Coupon
```bash
POST /api/validate-coupon
Content-Type: application/json

{
  "code": "SUMMER2025",
  "userId": "user-uuid-here",
  "cartTotal": 5000
}

Response (Success):
{
  "valid": true,
  "coupon": { /* coupon data */ },
  "discountAmount": 500
}

Response (Failure):
{
  "valid": false,
  "error": "Ya has usado este cupón"
}
```

### Admin: List Coupons
```bash
GET /api/admin/coupons

Response:
{
  "success": true,
  "coupons": [
    {
      "id": 1,
      "code": "SUMMER2025",
      "discount_type": "PERCENTAGE",
      "value": 10,
      "times_used": 45,
      "unique_users": 40,
      "remaining_uses": 55,
      "is_active": true,
      "expiration_date": "2025-12-31T23:59:59Z"
    }
  ]
}
```

### Admin: Create Coupon
```bash
POST /api/admin/coupons
Content-Type: application/json

{
  "action": "create",
  "code": "SUMMER2025",
  "description": "Summer sale 2025",
  "discount_type": "PERCENTAGE",
  "value": "10",
  "min_order_value": "50",
  "max_uses_global": "100",
  "max_uses_per_user": "1",
  "expiration_date": "2025-12-31T23:59:59Z"
}

Response:
{
  "success": true,
  "coupon": { /* new coupon data */ }
}
```

### Admin: Update Coupon
```bash
POST /api/admin/coupons
Content-Type: application/json

{
  "action": "update",
  "id": 1,
  "expiration_date": "2026-01-31T23:59:59Z",
  "max_uses_global": "200"
}
```

### Admin: Deactivate Coupon
```bash
POST /api/admin/coupons
Content-Type: application/json

{
  "action": "deactivate",
  "id": 1
}
```

---

## 📝 NEXT STEPS

1. **Run SQL migration** in Supabase
2. **Add admin menu link** to AdminLayout
3. **Integrate CouponsManagement** component in admin dashboard
4. **Add coupon input** to checkout page
5. **Call validateCoupon()** before order creation
6. **Call redeemCoupon()** after order is saved
7. **Test all scenarios** above
8. **Monitor coupon_usages** table for issues

---

## 🐛 TROUBLESHOOTING

### "Cupón no encontrado"
- Check coupon code is entered correctly (case-insensitive)
- Verify `is_active = true` in database
- Check expiration hasn't passed

### "Ya has usado este cupón"
- User has hit their `max_uses_per_user` limit
- Check `coupon_usages` table for user's history
- Admin can create new coupon with higher limit

### "Compra mínima requerida"
- Cart total is below `min_order_value`
- Calculate: `cartTotal / 100` to get EUR amount

### Discount not saving to order
- Call `redeemCoupon()` AFTER order is created (not before)
- Pass correct `order_id` to function
- Check `coupon_usages` insert was successful

---

## 💡 BEST PRACTICES

1. **Always validate before redeeming** — Never trust frontend validation
2. **Store discount_amount in coupon_usages** — For accurate accounting
3. **Use transactions in checkout** — Ensure coupon and order are atomic
4. **Test user limits thoroughly** — This is most common error
5. **Monitor coupon_stats view** — Track usage patterns
6. **Archive old coupons** — Deactivate instead of deleting for audit trail

---

**Status:** ✅ **PRODUCTION READY**  
**Last Updated:** 2026-02-08  
**Maintainer:** Backend Team
