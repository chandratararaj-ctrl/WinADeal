# Multi-Role Support Implementation Summary

## ✅ Completed Steps

### 1. Database Migration
- ✅ Changed `User.role` from single `UserRole` enum to `roles` array of `UserRole[]`
- ✅ Migrated all existing users to have their role in an array
- ✅ Added CUSTOMER role to Tararaj (now has `["VENDOR", "CUSTOMER"]`)

### 2. Database State
```
Tararaj:
  - ID: ba1e3dbe-9665-4b67-948c-9b09e3b2027d
  - Roles: ["VENDOR", "CUSTOMER"]
  - Orders as CUSTOMER: 2 (including 1 ASSIGNED order)
```

## 🔄 Next Steps Required

### 3. Backend Updates

#### A. Update JWT Token Structure
**File:** `backend/src/utils/auth.ts`
- Change `generateAccessToken(userId, role)` to `generateAccessToken(userId, roles, selectedRole)`
- Token payload should include:
  ```typescript
  {
    userId: string,
    roles: UserRole[],      // All roles the user has
    selectedRole: UserRole  // The role they're currently using
  }
  ```

#### B. Update Authentication Middleware
**File:** `backend/src/middleware/auth.middleware.ts`
- Change `user.role` to `user.roles` in the database query
- Update `req.user` to include both `roles` and `selectedRole`:
  ```typescript
  req.user = {
    userId: user.id,
    roles: user.roles,
    selectedRole: decoded.selectedRole || user.roles[0]
  }
  ```

#### C. Update Authorization Middleware
**File:** `backend/src/middleware/auth.middleware.ts`
- Change authorization check from:
  ```typescript
  if (!allowedRoles.includes(req.user.role))
  ```
  to:
  ```typescript
  if (!req.user.roles.some(role => allowedRoles.includes(role)))
  ```

#### D. Update Controllers
**Files:** All controllers that use `req.user.role`
- `order.controller.ts` - line 12, 17, 26
- `delivery.controller.ts` - line 65
- Others as needed

Change from:
```typescript
const userRole = req.user?.role;
```
to:
```typescript
const userRole = req.user?.selectedRole;
const userRoles = req.user?.roles;
```

### 4. Frontend Updates

#### A. Update Auth Stores
**Files:**
- `customer-web/src/store/authStore.ts`
- `vendor-panel/src/store/authStore.ts`
- `admin-panel/src/store/authStore.ts`
- `delivery-web/src/store/authStore.ts`

Add:
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  roles: string[];        // NEW: Array of all roles
  selectedRole: string;   // NEW: Currently active role
}
```

#### B. Add Role Switcher Component
**New file:** `customer-web/src/components/RoleSwitcher.tsx`
- Dropdown to switch between available roles
- On switch, call backend to get new token with different `selectedRole`
- Update local storage and reload

#### C. Update Login Flow
**Files:** All `Login.tsx` files
- When user logs in, if they have multiple roles, show role selector
- Or default to first role and allow switching later

### 5. New Backend Endpoint

**File:** `backend/src/routes/auth.routes.ts`
Add endpoint:
```typescript
POST /api/v1/auth/switch-role
Body: { role: UserRole }
Response: { token, refreshToken }
```

This allows users to switch roles without re-logging in.

## 🎯 Quick Fix for Immediate Testing

Since the full implementation is complex, here's a **temporary workaround** to test Tararaj's orders:

### Option A: Force CUSTOMER role in backend
Modify `order.controller.ts` line 26:
```typescript
// Temporary: Check if user has CUSTOMER in their roles array
if (userRoles.includes('CUSTOMER')) {
    where.customerId = userId;
}
```

### Option B: Update Tararaj's primary role
Run this script to make CUSTOMER the first role:
```sql
UPDATE "User" 
SET "roles" = '{"CUSTOMER", "VENDOR"}'::"UserRole"[] 
WHERE id = 'ba1e3dbe-9665-4b67-948c-9b09e3b2027d';
```

Then restart the backend and regenerate Prisma client.

## 📝 Testing Plan

1. **Stop the backend server**
2. **Regenerate Prisma client**: `npx prisma generate`
3. **Update backend code** (auth.ts, auth.middleware.ts, controllers)
4. **Restart backend server**
5. **Clear customer-web localStorage**
6. **Login as Tararaj**
7. **Verify orders appear** (should see 2 orders including 1 ASSIGNED)

## ⚠️ Important Notes

- The JWT token structure change is **breaking** - all existing tokens will be invalid
- Users will need to re-login after deployment
- Consider implementing a migration period where both old and new token formats are accepted

---

**Current Status:** Database migration complete, backend code updates pending.
**Estimated Time:** 30-45 minutes for full implementation
**Quick Fix Time:** 5 minutes
