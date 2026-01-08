# 401 Unauthorized Errors - Complete Solution Guide ✅

## Issue Summary
Multiple pages in the admin panel are showing 401 Unauthorized errors:
```
Failed to load resource: the server responded with a status of 401 (Unauthorized)
/api/v1/payouts/stats
/api/v1/delivery/
```

## Root Cause

**The user is not logged in or the authentication token has expired.**

### Why This Happens

1. **No Active Session**: User hasn't logged in yet
2. **Token Expired**: Access token expires after 15 minutes
3. **Refresh Token Expired**: Refresh token expires after 7 days
4. **Token Cleared**: Browser cache/localStorage was cleared
5. **Wrong Credentials**: Using incorrect login credentials

## ✅ **SOLUTION: Log In to Admin Panel**

### Step 1: Navigate to Login Page
Go to: `http://localhost:5173/login` (or your admin panel URL)

### Step 2: Use Correct Credentials

**Option 1: Phone Login**
- Phone: `+919999999999`
- Password: `admin123`

**Option 2: Email Login**
- Email: `admin@winadeal.com`
- Password: `admin123`

### Step 3: Verify Login Success
After successful login, you should:
1. See a "Login successful!" toast message
2. Be redirected to `/dashboard`
3. See your name in the header/navbar

---

## 🔍 **How to Verify You're Logged In**

### Method 1: Check Browser DevTools
1. Open **DevTools** (F12)
2. Go to **Application** tab
3. Click **Local Storage** → `http://localhost:5173`
4. Verify these keys exist:
   - `accessToken` - Should have a JWT token value
   - `refreshToken` - Should have a JWT token value

### Method 2: Check Network Tab
1. Open **DevTools** (F12)
2. Go to **Network** tab
3. Refresh the page
4. Click any API request
5. Check **Request Headers**
6. Verify `Authorization: Bearer <token>` is present

---

## 🔧 **Troubleshooting Steps**

### If Login Fails

#### 1. **Check Backend is Running**
```powershell
# Check if backend is running on port 5000
netstat -ano | findstr :5000
```

If not running:
```powershell
cd backend
npm run dev
```

#### 2. **Verify Database is Seeded**
```powershell
cd backend
npx ts-node prisma/seed.ts
```

This creates the admin user with correct credentials.

#### 3. **Check for Console Errors**
- Open browser DevTools → Console
- Look for error messages
- Common issues:
  - Network errors (backend not running)
  - CORS errors (backend CORS misconfigured)
  - 401 errors (wrong credentials)

### If Token Keeps Expiring

#### Token Lifetimes
- **Access Token**: 15 minutes (default)
- **Refresh Token**: 7 days (default)

#### Automatic Token Refresh
The API service automatically refreshes tokens:
```typescript
// When access token expires (401 error):
// 1. Get refresh token from localStorage
// 2. Call /api/v1/auth/refresh
// 3. Get new access token
// 4. Retry original request
```

#### If Refresh Fails
- Refresh token has also expired
- **Solution**: Log in again

---

## 📋 **All Test Credentials**

From the database seed:

| Role | Email | Phone | Password |
|------|-------|-------|----------|
| **Admin** | admin@winadeal.com | +919999999999 | admin123 |
| **Vendor** | vendor@winadeal.com | +919999999998 | vendor123 |
| **Customer** | customer@winadeal.com | +919999999997 | customer123 |
| **Delivery** | delivery@winadeal.com | +919999999996 | delivery123 |

---

## 🔐 **How Authentication Works**

### Login Flow
```
1. User enters credentials
   ↓
2. POST /api/v1/auth/login
   ↓
3. Backend validates credentials
   ↓
4. Backend returns:
   - user object
   - accessToken (JWT)
   - refreshToken (JWT)
   ↓
5. Frontend stores in localStorage:
   - localStorage.setItem('accessToken', ...)
   - localStorage.setItem('refreshToken', ...)
   ↓
6. Frontend redirects to /dashboard
```

### API Request Flow
```
1. User navigates to page
   ↓
2. Page calls API (e.g., /payouts/stats)
   ↓
3. API interceptor adds token:
   Authorization: Bearer <accessToken>
   ↓
4. Backend validates token
   ↓
5. If valid: Return data
   If expired (401): Trigger refresh
```

### Token Refresh Flow
```
1. API returns 401 Unauthorized
   ↓
2. Interceptor catches error
   ↓
3. POST /api/v1/auth/refresh
   Body: { refreshToken }
   ↓
4. Backend validates refresh token
   ↓
5. Backend returns new accessToken
   ↓
6. Update localStorage
   ↓
7. Retry original request
```

---

## 🚀 **Quick Fix Checklist**

- [ ] Backend is running (`npm run dev` in backend folder)
- [ ] Frontend is running (`npm run dev` in admin-panel folder)
- [ ] Database is seeded (admin user exists)
- [ ] Using correct credentials: `+919999999999` / `admin123`
- [ ] Browser DevTools shows `accessToken` in localStorage
- [ ] No console errors in browser
- [ ] Network requests show `Authorization` header

---

## 📁 **Files Modified**

1. `admin-panel/src/pages/Login.tsx`
   - ✅ Updated demo credentials to show correct phone number
   - ✅ Added email credential display

2. `admin-panel/src/pages/CommissionSettings.tsx`
   - ✅ Replaced fetch with api service (previous fix)

3. `admin-panel/src/services/api.ts`
   - ✅ Already configured with token interceptors

---

## 💡 **Prevention Tips**

1. **Stay Logged In**: Tokens last 7 days if you keep using the app
2. **Don't Clear Cache**: Clearing browser data removes tokens
3. **Use Refresh**: The app auto-refreshes tokens for you
4. **Check Expiry**: If you see 401s, just log in again

---

## 🎯 **Expected Behavior After Login**

Once logged in successfully:

✅ **Dashboard** loads without errors
✅ **Commission Settings** shows vendor and delivery partner data
✅ **Payout Management** shows payout statistics
✅ **Vendor Verification** shows pending vendors
✅ **All API calls** include authentication headers
✅ **Tokens auto-refresh** when they expire

---

## 🆘 **Still Having Issues?**

If you're still seeing 401 errors after logging in:

1. **Hard Refresh**: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
2. **Clear Site Data**:
   - DevTools → Application → Clear Storage
   - Click "Clear site data"
   - Log in again
3. **Check Backend Logs**: Look for authentication errors
4. **Verify Token Format**: Token should start with `eyJ...`

---

## ✨ **Summary**

The 401 errors are **expected behavior** when not logged in. Simply:

1. **Go to login page**
2. **Use credentials**: `+919999999999` / `admin123`
3. **Click Sign In**
4. **You're done!** All pages will work now.

The authentication system is working correctly - you just need to log in! 🎊
