# Multi-Role Implementation - Progress Update

## ✅ **COMPLETED - Backend Updates**

### 1. Database Schema ✅
- Changed `User.role` to `User.roles` (array)
- Migrated all existing users
- Added CUSTOMER role to Tararaj: `["VENDOR", "CUSTOMER"]`

### 2. JWT Token Structure ✅
**File:** `backend/src/utils/auth.ts`
- Updated `generateAccessToken(userId, roles, selectedRole?)`
- Token now includes: `{ userId, roles, selectedRole }`

### 3. Authentication Middleware ✅
**File:** `backend/src/middleware/auth.middleware.ts`
- Updated `authenticate` to query `roles` array
- Validates `selectedRole` is in user's roles
- Updated `req.user` interface:
  ```typescript
  {
    userId: string;
    roles: string[];
    selectedRole: string;
  }
  ```
- Updated `authorize` to check `selectedRole`
- Updated `optionalAuth` for roles array

### 4. Controllers ✅
**Files Updated:**
- `order.controller.ts` - Uses `selectedRole` instead of `role`
- `delivery.controller.ts` - Uses `selectedRole`
- `auth.controller.ts` - All login/register endpoints updated:
  - Token generation uses `roles` array
  - Response includes `roles` and `selectedRole`
  - Role checks use `.includes()` instead of `===`

---

## 🔄 **NEXT STEPS - To Complete**

### 5. Regenerate Prisma Client ⏳
```bash
cd backend
npx prisma generate
```

### 6. Add Role Switcher Endpoint ⏳
**New endpoint:** `POST /api/v1/auth/switch-role`

Create in `backend/src/controllers/auth.controller.ts`:
```typescript
export const switchRole = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { selectedRole } = req.body;
    
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { roles: true }
    });
    
    if (!user.roles.includes(selectedRole)) {
        return errorResponse(res, 'Invalid role', 400);
    }
    
    const accessToken = generateAccessToken(userId, user.roles, selectedRole);
    const refreshToken = generateRefreshToken(userId);
    
    return successResponse(res, { accessToken, refreshToken }, 'Role switched');
};
```

Add route in `backend/src/routes/auth.routes.ts`:
```typescript
router.post('/switch-role', authenticate, switchRole);
```

### 7. Update Frontend Auth Stores ⏳
**Files to update:**
- `customer-web/src/store/authStore.ts`
- `vendor-panel/src/store/authStore.ts`
- `admin-panel/src/store/authStore.ts`
- `delivery-web/src/store/authStore.ts`

Change User interface:
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  roles: string[];        // NEW
  selectedRole: string;   // NEW
}
```

### 8. Update Frontend Login Pages ⏳
**Files:** All `Login.tsx` files

After successful login, if user has multiple roles, show role selector or default to first role.

### 9. Add Role Switcher Component (Optional) ⏳
**New file:** `customer-web/src/components/RoleSwitcher.tsx`

Dropdown in header to switch between available roles.

---

## 🧪 **Testing Steps**

1. **Stop backend server**
2. **Regenerate Prisma client**: `cd backend && npx prisma generate`
3. **Restart backend**: `npm run dev`
4. **Clear all frontend localStorage**:
   ```javascript
   localStorage.clear();
   location.reload();
   ```
5. **Login as Tararaj** in customer-web
6. **Verify orders appear** (should see 2 orders including ASSIGNED)
7. **Test role switching** (if implemented)

---

## 📊 **Current State**

### Database
```sql
SELECT name, roles FROM "User" WHERE name = 'Tararaj';
-- Result: Tararaj | ["VENDOR", "CUSTOMER"]
```

### Backend
- ✅ All controllers updated
- ✅ Middleware updated
- ✅ Token generation updated
- ⏳ Prisma client needs regeneration
- ⏳ Role switcher endpoint needed

### Frontend
- ⏳ Auth stores need update
- ⏳ Login flows need update
- ⏳ Role switcher UI (optional)

---

## ⚡ **Quick Test (Without Frontend Updates)**

You can test the backend immediately:

1. **Regenerate Prisma client**
2. **Restart backend**
3. **Login via Postman/curl**:
   ```bash
   POST http://localhost:5000/api/v1/auth/login
   {
     "phone": "+919830450252",
     "password": "your-password"
   }
   ```
4. **Check response** - should include:
   ```json
   {
     "user": {
       "roles": ["VENDOR", "CUSTOMER"],
       "selectedRole": "VENDOR"
     }
   }
   ```
5. **Get orders with CUSTOMER role**:
   - Manually change token's `selectedRole` to "CUSTOMER"
   - Or call switch-role endpoint (once implemented)

---

## ⚠️ **Breaking Changes**

- All existing JWT tokens are **invalid**
- Users must **re-login** after deployment
- Frontend localStorage must be **cleared**

---

**Status:** Backend implementation complete, awaiting Prisma regeneration and frontend updates.
