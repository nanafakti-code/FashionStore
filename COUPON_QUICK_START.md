# 🎁 COUPON SYSTEM - QUICK START DEPLOYMENT

> **Status:** ✅ Production Ready  
> **Time to Deploy:** ~30 minutes  
> **Complexity:** Medium (Database + API + UI)

---

## 📦 WHAT WAS DELIVERED

| Component | File | Status |
|-----------|------|--------|
| **Database Schema** | `sql/coupons_system.sql` | ✅ Ready to execute |
| **Backend Service** | `src/lib/couponService.ts` | ✅ Complete |
| **Admin CRUD API** | `src/pages/api/admin/coupons.ts` | ✅ Complete |
| **Validation API** | `src/pages/api/validate-coupon.ts` | ✅ Complete |
| **Admin UI** | `src/components/islands/admin/CouponsManagement.tsx` | ✅ Complete |
| **Integration Guide** | `COUPON_SYSTEM_GUIDE.md` | ✅ Detailed |
| **Code Examples** | `COUPON_INTEGRATION_EXAMPLES.ts` | ✅ Ready |

---

## ⚡ DEPLOYMENT CHECKLIST

### PHASE 1: Database Setup (5 min)

- [ ] Open [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql/new)
- [ ] Copy entire contents of `sql/coupons_system.sql`
- [ ] Paste into Supabase SQL editor
- [ ] Run (⌘ + Enter)
- [ ] Verify: No errors, 3 tables created (coupons, coupon_usages, coupon_audit_log + 1 view)

**Expected Output:**
```
✅ CREATE TABLE coupons
✅ CREATE TABLE coupon_usages
✅ CREATE TABLE coupon_audit_log
✅ CREATE INDEX (×4)
✅ CREATE VIEW coupon_stats
```

---

### PHASE 2: Admin Dashboard Integration (10 min)

#### 2a. Add Menu Link

**File:** `src/layouts/AdminLayout.astro` (line ~180)

Add after Devoluciones section:
```astro
<!-- Coupons -->
<a
  href="/admin/dashboard?section=coupons"
  class="nav-link flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-800 transition-all duration-200 group"
  data-page="coupons"
>
  <div class="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-[#00aa45]"></div>
  <span class="font-medium text-sm">Cupones</span>
</a>
```

#### 2b. Import & Use Component

**File:** `src/pages/admin/index.astro` (or Dashboard page)

```astro
---
import CouponsManagement from '@/components/islands/admin/CouponsManagement';
---

<!-- Inside your dashboard sections -->
{section === 'coupons' && (
  <CouponsManagement client:only="react" />
)}
```

**Test:** ✅ Navigate to `/admin/dashboard?section=coupons` → See coupon UI

---

### PHASE 3: Checkout Integration (15 min)

#### 3a. Add Coupon Input to Checkout

**File:** Your checkout page/component

```astro
---
import CouponInput from '@/components/CouponInput';
---

<!-- In your checkout form -->
<CouponInput cartTotal={cartTotal} userId={userId} onApply={handleCouponApply} />
```

#### 3b. Create CouponInput Component

**File:** `src/components/CouponInput.tsx` (NEW)

```jsx
'use client';
import { useState } from 'react';

export default function CouponInput({ cartTotal, userId, onApply }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleApply = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, userId, cartTotal })
      });

      const data = await res.json();

      if (data.valid) {
        setMessage(`✅ Ahorras €${(data.discountAmount / 100).toFixed(2)}`);
        onApply(data); // Pass to parent
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (err) {
      setMessage('❌ Error validating coupon');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleApply} className="space-y-2">
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Código de cupón..."
        className="w-full px-3 py-2 border border-gray-300 rounded"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#00aa45] text-white py-2 rounded hover:bg-green-700"
      >
        {loading ? 'Verificando...' : 'Aplicar Cupón'}
      </button>
      {message && (
        <p className={message.includes('✅') ? 'text-green-600' : 'text-red-600'}>
          {message}
        </p>
      )}
    </form>
  );
}
```

#### 3c. Apply Coupon to Order

**In your order creation function:**

```typescript
import { redeemCoupon } from '@/lib/couponService';

// After order is created successfully:
async function finalizeOrder(orderId, appliedCoupon) {
  if (appliedCoupon) {
    await redeemCoupon(
      appliedCoupon.coupon.id,
      userId,
      orderId,
      appliedCoupon.discountAmount
    );
  }
  
  // Continue with email, redirect, etc.
}
```

---

## 🧪 TESTING

### Test 1: Create Coupon in Admin
```
URL: http://localhost:3000/admin/dashboard?section=coupons
1. Click "+ Nuevo Cupón"
2. Fill form:
   - Code: TEST2025
   - Type: Percentage
   - Value: 10
   - Max Uses Per User: 1
   - Expiration: Tomorrow
3. Click "Crear Cupón"
✅ Should see coupon in list
```

### Test 2: Apply Valid Coupon
```
URL: http://localhost:3000/checkout
1. Cart Total: €50
2. Enter coupon code: TEST2025
3. Click "Aplicar Cupón"
✅ Should show: "Ahorras €5.00"
✅ Form details should update with discount
```

### Test 3: Apply Same Coupon Twice
```
Same user, same coupon
1. First apply: ✅ Success
2. Second apply: ❌ "Ya has usado este cupón"
```

### Test 4: Expired Coupon
```
1. Create coupon expiring yesterday
2. Try to apply
❌ "Este cupón ha expirado"
```

### Test 5: Global Limit Reached
```
1. Create coupon with max_uses_global = 1
2. User A applies: ✅ Success
3. User B applies: ❌ "Este cupón ha alcanzado su límite"
```

---

## 🔍 VERIFY INSTALLATION

### 1. Database Tables Exist
```sql
-- Run in Supabase SQL editor
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('coupons', 'coupon_usages', 'coupon_stats');

-- Expected: 2 rows (coupons, coupon_usages)
-- (coupon_stats is a VIEW, not shown in this query)
```

### 2. API Endpoints Working
```bash
# Test validation endpoint
curl -X POST http://localhost:3000/api/validate-coupon \
  -H "Content-Type: application/json" \
  -d '{
    "code": "TEST2025",
    "userId": "any-user-id",
    "cartTotal": 5000
  }'

# Should return JSON with valid/error
```

### 3. Admin UI Accessible
```
Navigate to: http://localhost:3000/admin/dashboard?section=coupons
Should see: "Gestión de Cupones" header + "+ Nuevo Cupón" button
```

---

## 📊 MONITORING

### Check Coupon Usage
```sql
SELECT 
  c.code,
  COUNT(cu.id) as times_used,
  COUNT(DISTINCT cu.user_id) as unique_users,
  SUM(cu.discount_amount) as total_saved
FROM coupons c
LEFT JOIN coupon_usages cu ON c.id = cu.coupon_id
GROUP BY c.code
ORDER BY times_used DESC;
```

### Check Single User History
```sql
SELECT 
  c.code,
  cu.used_at,
  cu.discount_amount,
  cu.order_id
FROM coupon_usages cu
JOIN coupons c ON cu.coupon_id = c.id
WHERE cu.user_id = 'user-uuid'
ORDER BY cu.used_at DESC;
```

---

## ⚠️ COMMON ISSUES

| Issue | Cause | Fix |
|-------|-------|-----|
| "Cupón no encontrado" | Code doesn't exist in DB | Check spelling, verify coupon was created |
| "Ya has usado este cupón" | User exceeded limit | Create new coupon or increase `max_uses_per_user` |
| API 404 on validation | Component path wrong | Verify `src/pages/api/validate-coupon.ts` exists |
| Coupon not deducting in order | `redeemCoupon()` not called | Call it after order creation, pass correct orderId |
| RLS policy error | Database permissions | Rerun SQL migration |

---

## 🚀 NEXT FEATURES (Future)

- [ ] Bulk coupon code generation (upload CSV)
- [ ] Coupon performance analytics dashboard
- [ ] Automatic coupon email campaigns
- [ ] Referral code system (special coupons per user)
- [ ] Social sharing (coupon reward referrals)
- [ ] Dynamic coupon creation (time-based, seasonal)

---

## 📞 SUPPORT

### If Something Breaks

1. **Check database** — Tables exist?
   ```sql
   SELECT * FROM coupons LIMIT 1;
   ```

2. **Check API logs** — Any errors?
   ```bash
   # In terminal
   npm run dev  # Look for errors in console
   ```

3. **Check RLS policies** — Can select from tables?
   ```sql
   SELECT * FROM coupon_usages LIMIT 1;
   -- If "new row violates row-level security policy", run SQL migration again
   ```

4. **Check import paths** — File exists?
   ```bash
   ls src/lib/couponService.ts
   ls src/pages/api/validate-coupon.ts
   ls src/components/islands/admin/CouponsManagement.tsx
   ```

---

## 📄 DOCUMENTATION FILES

- **Full Guide:** `COUPON_SYSTEM_GUIDE.md` (complete reference)
- **Code Examples:** `COUPON_INTEGRATION_EXAMPLES.ts` (integration patterns)
- **Database Schema:** `sql/coupons_system.sql` (SQL DDL)
- **Backend Service:** `src/lib/couponService.ts` (validation logic)
- **Admin UI:** `src/components/islands/admin/CouponsManagement.tsx` (React component)

---

## ✅ DEPLOYMENT COMPLETE

Once all phases are done:

```
✅ Database: Coupons table with tracking
✅ API: Validation & admin endpoints
✅ UI: Admin dashboard & checkout integration
✅ Logic: Per-user limits enforced
✅ Monitoring: Usage stats available
```

**Next:** Create first coupon in admin panel and test!

---

**Deployed:** 2026-02-08  
**System Version:** 1.0.0  
**Status:** Production Ready 🚀
