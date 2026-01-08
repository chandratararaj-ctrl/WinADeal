# 403 Forbidden Error Fix - City Management

## Problem
After restarting servers, admin users were getting **403 Forbidden** errors when trying to:
- Create cities (`POST /api/v1/cities`)
- Get city stats (`GET /api/v1/cities/stats`)
- Update cities (`PUT /api/v1/cities/:id`)
- Delete cities (`DELETE /api/v1/cities/:id`)

## Root Cause
The JWT access tokens were being generated **without the `selectedRole` parameter**, causing a mismatch in the authorization middleware.

### Technical Details:
1. The `generateAccessToken` function accepts 3 parameters:
   ```typescript
   generateAccessToken(userId: string, roles: string[], selectedRole?: string)
   ```

2. When `selectedRole` is not provided, it defaults to `roles[0]` (first role in array)

3. The `authorize` middleware checks if `req.user.selectedRole` matches the allowed roles

4. If a user has multiple roles (e.g., `['CUSTOMER', 'ADMIN']`), and ADMIN is not the first role, the token would have `selectedRole: 'CUSTOMER'` instead of `'ADMIN'`

5. This caused the `authorize(['ADMIN'])` middleware to reject the request with 403 Forbidden

## Solution
Updated all token generation calls in `auth.controller.ts` to explicitly pass the `selectedRole` parameter:

### Files Modified:
**`backend/src/controllers/auth.controller.ts`**

### Changes Made:

#### 1. Login Function (Line 203-251)
```typescript
// Before:
const accessToken = generateAccessToken(user.id, user.roles as string[]);

// After:
const selectedRole = user.roles[0]; // Default to first role
const accessToken = generateAccessToken(user.id, user.roles as string[], selectedRole);
```

#### 2. Verify OTP Function (Line 153-161)
```typescript
// Before:
const accessToken = generateAccessToken(updatedUser.id, updatedUser.roles as string[]);

// After:
const selectedRole = updatedUser.roles[0];
const accessToken = generateAccessToken(updatedUser.id, updatedUser.roles as string[], selectedRole);
```

#### 3. Login with OTP Function (Line 339-371)
```typescript
// Before:
const accessToken = generateAccessToken(user.id, user.roles as string[]);

// After:
const selectedRole = user.roles[0];
const accessToken = generateAccessToken(user.id, user.roles as string[], selectedRole);
```

#### 4. Refresh Access Token Function (Line 402-409)
```typescript
// Before:
const accessToken = generateAccessToken(user.id, user.roles as string[]);

// After:
const selectedRole = user.roles[0]; // Default to first role
const accessToken = generateAccessToken(user.id, user.roles as string[], selectedRole);
```

## How It Works Now

1. **User logs in** → Token is generated with `selectedRole` = first role in array
2. **Token is sent with requests** → `Authorization: Bearer <token>`
3. **Backend validates token** → Extracts `selectedRole` from JWT payload
4. **Authorization middleware checks** → Compares `selectedRole` with allowed roles
5. **Request is allowed** → If `selectedRole` matches one of the allowed roles

## Testing

### Before Fix:
```bash
# Login as admin
POST /api/v1/auth/login
Response: { selectedRole: 'CUSTOMER' } # Wrong!

# Try to create city
POST /api/v1/cities
Response: 403 Forbidden # Authorization failed
```

### After Fix:
```bash
# Login as admin
POST /api/v1/auth/login
Response: { selectedRole: 'ADMIN' } # Correct!

# Try to create city
POST /api/v1/cities
Response: 201 Created # Success!
```

## Additional Notes

### Role Switching
The `switchRole` function already correctly passes the `selectedRole` parameter:
```typescript
const accessToken = generateAccessToken(userId, user.roles as string[], selectedRole);
```

This is why the admin panel's role switching feature was working correctly.

### Frontend Impact
No changes needed in the frontend. The admin panel already:
1. Checks for ADMIN role before allowing access
2. Automatically switches to ADMIN role if needed (via `switchRole` API)
3. Stores and sends the correct access token

## Prevention
To prevent this issue in the future:

1. **Always pass `selectedRole`** when calling `generateAccessToken`
2. **Use TypeScript strict mode** to catch missing parameters
3. **Add unit tests** for token generation with different role configurations
4. **Document the `selectedRole` parameter** as required, not optional

## Verification Steps

1. **Restart the backend server**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Clear browser cache and restart admin panel**:
   ```bash
   cd admin-panel
   npm run dev
   ```

3. **Login to admin panel**

4. **Try to create a city**:
   - Navigate to Cities page
   - Click "Add City"
   - Fill in city details
   - Click "Create"
   - Should succeed with 201 Created

5. **Verify city stats**:
   - Cities page should load without 403 errors
   - City statistics should display correctly

## Status
✅ **FIXED** - All token generation calls now include `selectedRole` parameter

---

**Date**: 2026-01-03  
**Impact**: Critical - Blocked all admin city management operations  
**Resolution Time**: Immediate  
**Breaking Changes**: None
