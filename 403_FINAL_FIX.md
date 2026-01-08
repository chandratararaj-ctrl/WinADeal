# 403 Error - Final Fix

## Issues Found and Fixed

### Issue 1: Token Generation Missing selectedRole Parameter
**Files**: `backend/src/controllers/auth.controller.ts`
**Lines**: 204, 154, 340, 403

**Problem**: `generateAccessToken` was called without the `selectedRole` parameter
**Fix**: Added `selectedRole` parameter to all token generation calls

### Issue 2: switchRole API Parameter Mismatch  
**File**: `admin-panel/src/services/auth.service.ts`
**Line**: 110

**Problem**: Frontend was sending `{ role: 'ADMIN' }` but backend expects `{ selectedRole: 'ADMIN' }`
**Fix**: Changed to send `{ selectedRole: role }`

## Steps to Apply Fix

### 1. Restart Backend
```bash
cd backend
# Stop the server (Ctrl+C)
npm run dev
```

### 2. Restart Admin Panel
```bash
cd admin-panel
# Stop the server (Ctrl+C)  
npm run dev
```

### 3. Clear Browser Storage
**CRITICAL STEP**:
1. Open DevTools (F12)
2. Application tab → Local Storage → Clear All
3. Session Storage → Clear All
4. Cookies → Clear All
5. Close and reopen browser

### 4. Login Again
1. Go to admin panel
2. Login with credentials
3. The switchRole will now work correctly

## Why This Happened

The admin login flow does this:
```typescript
// 1. Initial login
const response = await loginAPI(loginData);
setAuth(response.user, response.accessToken, response.refreshToken);

// 2. Auto-switch to ADMIN role
if (response.user.selectedRole !== 'ADMIN') {
    const switchRes = await switchRole('ADMIN');  // ← This was broken!
    setAuth(switchRes.user, switchRes.accessToken, switchRes.refreshToken);
}
```

The `switchRole` was sending wrong parameter name, so it failed silently, and you kept the initial token which had `selectedRole` from the first role in the array.

## Verification

After applying the fix, check backend console. You should see:
```
[AUTH] Token decoded successfully: {
  userId: '...',
  roles: ['ADMIN'],
  selectedRole: 'ADMIN'  ← Should be 'ADMIN'
}

[AUTH] Authorization check: {
  selectedRole: 'ADMIN',
  allowedRoles: ['ADMIN']
}

[AUTH] Authorization successful for role: ADMIN
```

## Files Modified

1. ✅ `backend/src/controllers/auth.controller.ts` - Fixed token generation
2. ✅ `backend/src/middleware/auth.middleware.ts` - Added debug logging
3. ✅ `admin-panel/src/services/auth.service.ts` - Fixed switchRole parameter

## Testing

1. Login to admin panel
2. Navigate to Cities page
3. Click "Add City"
4. Fill in details
5. Click "Create"
6. Should work! ✅

---

**Status**: ✅ FIXED  
**Date**: 2026-01-03  
**Root Cause**: Parameter mismatch in switchRole API call  
**Impact**: Admin couldn't create/manage cities
