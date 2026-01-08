# Analytics SQL Queries - Manual Fix Required ⚠️

## Current Issue

The VendorAnalytics page is still getting 500 errors because the raw SQL queries in `analytics.controller.ts` use incorrect column names.

## What Needs to Be Fixed

All `$queryRaw` SQL statements need to be updated with:

### 1. **Column Name Changes**
- `total_amount` → `total`
- `vendor_id` → `user_id` (in Shop table)

### 2. **Table Name Changes** (Prisma uses Pascal case)
- `orders` → `"Order"`
- `shops` → `"Shop"`
- `users` → `"User"`
- `order_items` → `"OrderItem"`
- `products` → `"Product"`

### 3. **Status Changes**
- Remove `'COMPLETED'` from all status checks
- Use only `status = 'DELIVERED'`

## Locations to Fix

### Admin Analytics (Lines 50-118)

#### Line 50-61: Daily Revenue
```sql
-- CHANGE:
SUM(total_amount) → SUM(total)
FROM orders → FROM "Order"
status IN ('DELIVERED', 'COMPLETED') → status = 'DELIVERED'
```

#### Line 64-84: Top Vendors
```sql
-- CHANGE:
s.vendor_id → s.user_id
SUM(o.total_amount) → SUM(o.total)
FROM orders o → FROM "Order" o
JOIN shops s → JOIN "Shop" s
JOIN users u → JOIN "User" u
ON s.vendor_id → ON s.user_id
status IN ('DELIVERED', 'COMPLETED') → status = 'DELIVERED'
```

#### Line 86-107: Top Products
```sql
-- CHANGE:
FROM order_items oi → FROM "OrderItem" oi
JOIN products p → JOIN "Product" p
JOIN orders o → JOIN "Order" o
status IN ('DELIVERED', 'COMPLETED') → status = 'DELIVERED'
```

#### Line 109-118: User Growth
```sql
-- CHANGE:
FROM users → FROM "User"
```

### Vendor Analytics (Lines 216-282)

#### Line 216-228: Daily Revenue
```sql
-- CHANGE:
SUM(total_amount) → SUM(total)
FROM orders → FROM "Order"
status IN ('DELIVERED', 'COMPLETED') → status = 'DELIVERED'
```

#### Line 230-252: Top Products
```sql
-- CHANGE:
FROM order_items oi → FROM "OrderItem" oi
JOIN products p → JOIN "Product" p
JOIN orders o → JOIN "Order" o
status IN ('DELIVERED', 'COMPLETED') → status = 'DELIVERED'
```

#### Line 270-282: Peak Hours
```sql
-- CHANGE:
FROM orders → FROM "Order"
```

### Delivery Analytics (Lines 391-404)

#### Line 391-404: Daily Earnings
```sql
-- CHANGE:
FROM "Delivery" d → Already correct
JOIN "Order" o → Already correct
```

## Quick Fix Script

You can manually edit the file or use find/replace:

1. Find: `total_amount` → Replace: `total`
2. Find: `FROM orders` → Replace: `FROM "Order"`
3. Find: `FROM order_items` → Replace: `FROM "OrderItem"`
4. Find: `FROM products` → Replace: `FROM "Product"`
5. Find: `FROM users` → Replace: `FROM "User"`
6. Find: `FROM shops` → Replace: `FROM "Shop"`
7. Find: `JOIN orders` → Replace: `JOIN "Order"`
8. Find: `JOIN shops` → Replace: `JOIN "Shop"`
9. Find: `JOIN users` → Replace: `JOIN "User"`
10. Find: `JOIN products` → Replace: `JOIN "Product"`
11. Find: `s.vendor_id` → Replace: `s.user_id`
12. Find: `status IN ('DELIVERED', 'COMPLETED')` → Replace: `status = 'DELIVERED'`

## Why This Is Needed

Prisma generates PostgreSQL tables with Pascal case names (e.g., "Order", "Shop") and the schema has been updated to use:
- `total` instead of `totalAmount`
- `user_id` instead of `vendor_id` in the Shop table
- Only `DELIVERED` status (no `COMPLETED`)

## After Fixing

Once all SQL queries are updated, the analytics endpoints will work correctly and return real data from the database.

## File Location

`backend/src/controllers/analytics.controller.ts`

Lines to edit: 50-118, 216-282, 391-404
