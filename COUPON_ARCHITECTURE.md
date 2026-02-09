# 🎯 COUPON SYSTEM ARCHITECTURE

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER CHECKOUT FLOW                          │
└─────────────────────────────────────────────────────────────────┘

1. CHECKOUT PAGE                    2. COUPON VALIDATION
   ┌──────────────────┐                ┌──────────────────┐
   │ Cart: €50        │                │ POST /api/       │
   │ [SUMMER2025]  ──→│───────────────→│ validate-coupon  │
   │ [Apply Coupon]   │                │                  │
   └──────────────────┘                └────────┬─────────┘
                                               │
                                    ┌──────────▼─────────┐
                                    │ CHECK CONSTRAINTS  │
                                    │ ├─ Is active?      │
                                    │ ├─ Not expired?    │
                                    │ ├─ Min. value OK?  │
                                    │ ├─ Global limit?   │
                                    │ └─ USER LIMIT ✓    │
                                    └────────┬──────────┘
          3a. VALID                        3b. INVALID
        ┌─────────────┬──────────┐    ┌─────────────────┐
        │             │          │    │                 │
    ┌───▼──────┐ ┌──▼────────┐  │    │  ❌ Error Toast │
    │ Discount │ │ Store in  │  │    │  "Used coupon"  │
    │ €5.00    │ │ State     │  │    │  "Expired"  etc │
    └───┬──────┘ └──┬────────┘  │    └─────────────────┘
        │           │           │
        └─────┬─────┘           │
              │                 │
    4. USER CLICKS "PAY"        │ 5. USER SEES ERROR
    ┌─────────────────────┐     │    (tries again)
    │                     │     │
    │ - Order created     │     │ ┌──────────────┐
    │ - INSERT pedidos    │     │ │ Edit coupon  │
    │ - orderId = 12345 ◄─┼─────┼─│ Try again    │
    │                     │     │ └──────────────┘
    └──────────┬──────────┘     │
               │                │
    6. REDEEM COUPON            │
    ┌──────────▼────────────────▼──┐
    │ redeemCoupon(               │
    │   couponId: 1,              │
    │   userId: "user-123",       │
    │   orderId: 12345,           │
    │   discountAmount: 500       │
    │ )                           │
    └──────────┬─────────────────┘
               │
    ┌──────────▼──────────────────┐
    │ INSERT INTO coupon_usages   │
    │ ├─ coupon_id: 1             │
    │ ├─ user_id: "user-123"      │
    │ ├─ order_id: 12345          │
    │ ├─ discount_amount: 500     │
    │ └─ used_at: NOW            │
    └──────────┬──────────────────┘
               │
    ┌──────────▼──────────────────┐
    │ ✅ Order Confirmed          │
    │    - Email sent             │
    │    - Receipt PDF attached   │
    │    - Coupon logged          │
    └─────────────────────────────┘
```

---

## Database Schema Diagram

```
COUPONS TABLE
┌──────────────────────────────────────────────┐
│ id (PK)                                      │
│ code (UNIQUE) ──────── "SUMMER2025"         │
│ discount_type ────────  "PERCENTAGE"        │
│ value ─────────────── 10                    │
│ min_order_value ───── 5000 (€50 in cents)  │
│ max_uses_global ───── 100 (NULL = ∞)       │
│ max_uses_per_user ──── 1 ◄──── KEY!        │
│ expiration_date                             │
│ is_active ───────────  true                │
│ created_at, updated_at                      │
└────────────┬─────────────┬──────────────────┘
             │             │
          FOREIGN KEY      INDEX (for fast lookup)
             │             │
             │             │
    ┌────────▼─────────────▼──────────┐
    │  COUPON_USAGES TABLE            │
    ├────────────────────────────────┤
    │ id (PK)                        │
    │ coupon_id (FK) ────► coupons   │
    │ user_id (FK) ───► auth.users   │
    │ order_id (FK) ──► pedidos      │
    │ discount_amount ── 500 (euros) │
    │ used_at ─────────── timestamp  │
    └────────────────────────────────┘
         │                    │
         │                    └─ INDEX for fast query:
         │                       SELECT COUNT(*) 
         └─ Tracks EVERY       FROM coupon_usages
            application        WHERE coupon_id = X
                                 AND user_id = Y
            
            ⭐ This is how we enforce
               max_uses_per_user!
```

---

## Validation Logic Flowchart

```
INPUT: code, userId, cartTotal
│
├─ 1. FETCH COUPON by CODE
│     └─ SELECT * FROM coupons WHERE code = ?
│        ├─ ✓ Found & active  ─────┐
│        └─ ✗ Not found/inactive    │ ❌ "Cupón no encontrado"
│                                   │
├─ 2. CHECK EXPIRATION
│  ┌───────────┐
│  │  now >    │
│  │ exp_date? │
│  └─────┬─────┘
│        ├─ ✓ No  ──┐
│        └─ ✗ Yes   │ ❌ "Cupón expirado"
│                   │
├─ 3. CHECK MIN ORDER VALUE
│  ┌──────────────────┐
│  │ cartTotal <      │
│  │ min_order_value? │
│  └─────┬────────────┘
│        ├─ ✓ No  ──┐
│        └─ ✗ Yes   │ ❌ "Compra mínima requerida"
│                   │
├─ 4. CHECK GLOBAL USAGE
│  ┌─────────────────────────────────────┐
│  │ SELECT COUNT(*) FROM coupon_usages  │
│  │ WHERE coupon_id = ?                 │
│  │ IS count >= max_uses_global?        │
│  └──────┬──────────────────────────────┘
│         ├─ ✓ No  ──┐
│         └─ ✗ Yes   │ ❌ "Límite de usos alcanzado"
│                    │
├─ 5. CHECK USER LIMIT ⭐ CRITICAL
│  ┌──────────────────────────────────────────┐
│  │ SELECT COUNT(*) FROM coupon_usages       │
│  │ WHERE coupon_id = ? AND user_id = ?      │
│  │ IS count >= max_uses_per_user?           │
│  └──────┬───────────────────────────────────┘
│         ├─ ✓ No  ──┐
│         └─ ✗ Yes   │ ❌ "Ya usaste este cupón"
│                    │
├─ 6. CALCULATE DISCOUNT
│  ├─ IF PERCENTAGE: discount = cart * (value / 100)
│  ├─ IF FIXED: discount = value * 100 (€ to cents)
│  └─ discount = MIN(discount, cartTotal)
│
✅ RETURN VALID
   ├─ valid: true
   ├─ coupon: {...}
   └─ discountAmount: X
```

---

## Admin Dashboard Flow

```
ADMIN DASHBOARD
┌──────────────────────────────────┐
│    Gestión de Cupones            │
│  + Nuevo Cupón [button]          │
└────────────────┬─────────────────┘
                 │
                 ├─ CREATE FORM
                 │  ├─ Code: SUMMER2025
                 │  ├─ Type: %
                 │  ├─ Value: 10
                 │  ├─ Min Order: 50€
                 │  ├─ Max Uses: 100
                 │  ├─ Uses Per User: 1
                 │  └─ Expires: 2025-12-31
                 │     │
                 │     ├─ SUBMIT
                 │     │  └─► POST /api/admin/coupons
                 │     │      { action: "create", ... }
                 │     │
                 │     └─► ✅ Coupon created
                 │
                 └─ COUPONS TABLE
                    ┌────────────────────────┐
                    │ Code  │ Type │ Uses    │
                    ├───────┼──────┼─────────┤
                    │ SUM25 │  %   │ 45/100  │
                    │ FLAT5 │  €   │ ∞/120   │
                    │ OLD24 │  %   │ 200/200 │
                    └────────────────────────┘
                          │
                    ┌─────┴─────┐
                    │           │
              ┌─────▼────┐  Get Stats
              │ Deactivate   │  from VIEW
              │ Coupon       │  coupon_stats
              └────────────┘
```

---

## API Endpoints Summary

```
┌────────────────────────────────────────┐
│         FRONTEND (Client)              │
└────────────────────────────────────────┘
         │              │
    ┌────▼────┐    ┌────▼────┐
    │ Checkout │    │ Admin   │
    │  Page    │    │ Panel   │
    └────┬─────┘    └────┬────┘
         │               │
         │ POST          │ GET/POST
         │               │
    ┌────▼─────────────┐ ┌──────────┐
    │ /api/            │ │ /api/    │
    │validate-coupon   │ │admin/    │
    └──────────────────┘ │coupons   │
         │               │          │
         ├─ INPUT:       ├─ GET: List all coupons
         │ • code        │         (with stats)
         │ • userId      │
         │ • cartTotal   ├─ POST actions:
         │               │   • create
         ├─ OUTPUT:      │   • update  
         │ • valid ✓/✗   │   • deactivate
         │ • error msg   │
         │ • discount $  │
         │               │
         └───────────────┴──────────┘
                  │
         ┌────────▼────────────┐
         │ SUPABASE (Backend)  │
         │                     │
         ├─ Tables:           │
         │ • coupons          │
         │ • coupon_usages    │
         │                     │
         ├─ Views:            │
         │ • coupon_stats     │
         │                     │
         ├─ Policies:         │
         │ • RLS enabled      │
         │ • Row security     │
         │                     │
         └─────────────────────┘
```

---

## Coupon Lifecycle

```
CREATED
  │
  │ (1) Admin creates coupon
  │    - code, value, limits set
  │    - is_active = true
  │
  ├─────► ACTIVE (ready to use)
  │         │
  │         │ (2) Users apply it
  │         │    - Each use logged in coupon_usages
  │         │    - Counts checked against limits
  │         │
  │         ├─────► ALMOST EXHAUSTED
  │         │         (90-100% uses reached)
  │         │
  │         ├─────► EXHAUSTED
  │         │         (global limit reached)
  │         │         (no more uses available)
  │         │
  │         └─────► EXPIRED
  │                   (current date > expiration_date)
  │
  │ (3) Admin deactivates
  │     - is_active = false
  │
  └─────► INACTIVE (archived but not deleted)
            │
            └─ Can be reactivated
              (extend expiration, increase limit)
```

---

## Security & Constraints

```
🔒 ROW LEVEL SECURITY (RLS Policies)

COUPONS
├─ Public: Can READ active coupons
├─ Admin-Only: Can CREATE/UPDATE/DELETE
│
COUPON_USAGES
├─ Users: Can READ own usages only
├─ System: Can INSERT new usages
│
AUDIT_LOG
└─ Admins: Can READ all, no DELETE

🛡️ DATA INTEGRITY

✓ Unique coupon codes
  └─ UNIQUE(code) constraint

✓ No duplicate usage per user
  └─ Query runs on EVERY validation:
     SELECT COUNT(*) FROM coupon_usages
     WHERE coupon_id = X AND user_id = Y

✓ Transaction safety
  └─ INSERT into coupon_usages is atomic

✓ Audit trail
  └─ coupon_audit_log table records all changes

⚠️ POTENTIAL ATTACKS & PREVENTION

Attack: User applies same coupon multiple times
├─ Prevention: max_uses_per_user query runs EVERY TIME
└─ Result: Second attempt rejected

Attack: Admin deletes coupon to hide usage
├─ Prevention: Never delete, only deactivate
└─ Result: Usage history preserved

Attack: User IDs in browser console
├─ Prevention: RLS policies enforce user isolation
└─ Result: Can only see own data

Attack: Manipulate discount in browser
├─ Prevention: Validation happens on BACKEND only
└─ Result: Frontend can't change validation logic
```

---

## Performance Considerations

```
📊 QUERY PERFORMANCE

Index: coupons(code)
└─ Fast lookup by code in validateCoupon()
└─ ~1ms for exact match

Index: coupon_usages(coupon_id, user_id)
└─ Fast lookup for user limit check
└─ SELECT COUNT WHERE coupon_id + user_id
└─ ~2ms even with 1M+ rows

Index: coupons(is_active, expiration_date)
└─ Fast lookup for active/valid coupons
└─ ~1ms

Index: coupon_usages(coupon_id)
└─ Fast COUNT for global limits
└─ ~2ms

⚡ OPTIMIZATION TIPS

• Limit coupon_usages query with LIMIT 1
  └─ Only need to know if count > max
  └─ No need to get exact count, just 1+ is enough

• Cache coupon details
  └─ Coupons rarely change during checkout
  └─ Can cache for 5-10 seconds

• Batch user limit checks
  └─ If checking multiple coupons, query once
  
• Archive old coupons
  └─ Move expired to archive table
  └─ Keeps coupon_usages table lean
```

---

## Monitoring Dashboard (TODO)

```
METRICS TO TRACK

Real-Time:
├─ Active coupons: 15
├─ Today's redemptions: 243
├─ Today's discount given: €1,245.50
└─ Avg discount per user: €5.12

By Time:
├─ Redemptions over time (graph)
├─ Popular coupons (top 5)
├─ Peak redemption times
└─ Redemptions by day-of-week

By Business:
├─ Total discount budget spent
├─ ROI of coupon campaigns
├─ Redemption rate (redemptions / impressions)
├─ Avg order value with vs without coupon
└─ Repeat purchases after coupon use

Alerts:
├─ Coupon expiring soon
├─ Coupon almost exhausted (90% used)
├─ Unusual redemption pattern (spike)
├─ Failed redemptions (tracking errors)
└─ Abuse attempts
```

---

**End of Architecture Overview**  
For detailed info, see: `COUPON_SYSTEM_GUIDE.md`
