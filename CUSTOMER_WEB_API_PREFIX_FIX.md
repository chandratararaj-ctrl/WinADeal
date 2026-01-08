# Customer Web - API Prefix Fix

## Problem
All service files in customer-web have hardcoded `/api/v1/` prefixes in their API calls. Since the `api` instance already has `baseURL: http://localhost:5000/api/v1`, this creates double prefixes like:

```
http://localhost:5000/api/v1/api/v1/categories
```

## Files That Need Fixing

### Already Fixed ✅
1. `src/services/shop.service.ts` - All endpoints fixed
2. `src/services/review.service.ts` - getMyReviews fixed  
3. `src/services/order.service.ts` - Partially fixed

### Still Need Fixing ❌
4. `src/services/coupon.service.ts`
5. `src/services/auth.service.ts`
6. `src/services/order.service.ts` - Remaining endpoints
7. `src/services/review.service.ts` - Remaining endpoints

## Solution

Remove `/api/v1` from all API calls in these files.

### Example Fix:
```typescript
// Before (WRONG):
const response = await api.get('/api/v1/categories');
const response = await api.post('/api/v1/orders', data);

// After (CORRECT):
const response = await api.get('/categories');
const response = await api.post('/orders', data);
```

## Quick Fix Script

Run this PowerShell script in the `customer-web` directory:

```powershell
# Fix all service files
$files = @(
    "src/services/auth.service.ts",
    "src/services/coupon.service.ts",
    "src/services/order.service.ts",
    "src/services/review.service.ts"
)

foreach ($file in $files) {
    $content = Get-Content $file -Raw
    $content = $content -replace "api\.get\('/api/v1/", "api.get('/"
    $content = $content -replace "api\.post\('/api/v1/", "api.post('/"
    $content = $content -replace "api\.put\('/api/v1/", "api.put('/"
    $content = $content -replace "api\.delete\('/api/v1/", "api.delete('/"
    $content = $content -replace "api\.patch\('/api/v1/", "api.patch('/"
    Set-Content $file $content -NoNewline
}

Write-Host "Fixed all service files!" -ForegroundColor Green
```

## Manual Fix

Or manually edit each file and remove `/api/v1` from all API calls:

### auth.service.ts
- Line 24: `/api/v1/auth/register` → `/auth/register`
- Line 32: `/api/v1/auth/login` → `/auth/login`
- Line 37: `/api/v1/auth/verify-otp` → `/auth/verify-otp`
- Line 42: `/api/v1/auth/logout` → `/auth/logout`
- Line 47: `/api/v1/auth/refresh` → `/auth/refresh`
- Line 52: `/api/v1/auth/request-otp` → `/auth/request-otp`
- Line 57: `/api/v1/auth/reset-password` → `/auth/reset-password`
- Line 62: `/api/v1/auth/switch-role` → `/auth/switch-role`

### coupon.service.ts
- Line 6: `/api/v1/coupons/verify` → `/coupons/verify`

### order.service.ts
- Line 51: `/api/v1/orders` → `/orders`
- Line 109: `/api/v1/addresses` → `/addresses`

### review.service.ts
- Line 31: `/api/v1/reviews` → `/reviews`

## After Fixing

1. **Restart customer-web server**:
   ```bash
   cd customer-web
   npm run dev
   ```

2. **Hard refresh browser**: Ctrl+Shift+R

3. **Test**: All API calls should work correctly

---

**This is a one-time fix needed because the customer-web services were written before the baseURL was corrected.**
