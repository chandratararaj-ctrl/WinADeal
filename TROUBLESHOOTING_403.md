# 403 Error Troubleshooting Guide

## Current Status
Added debug logging to help identify the issue.

## Steps to Debug

### 1. Restart Backend Server
```bash
cd backend
npm run dev
```

### 2. Check Backend Console Output
When you try to create a city, you should see logs like:

```
[AUTH] Token decoded successfully: {
  userId: '...',
  roles: [...],
  selectedRole: '...'
}

[AUTH] User authenticated: {
  userId: '...',
  roles: [...],
  selectedRole: '...'
}

[AUTH] Authorization check: {
  userId: '...',
  userRoles: [...],
  selectedRole: '...',
  allowedRoles: ['ADMIN'],
  endpoint: '/cities'
}
```

### 3. Check What the Logs Show

**If you see:**
```
selectedRole: 'CUSTOMER'
allowedRoles: ['ADMIN']
```
**Problem**: Token has wrong selectedRole

**If you see:**
```
selectedRole: 'ADMIN'
allowedRoles: ['ADMIN']
```
**Problem**: Something else is wrong (shouldn't get 403)

### 4. Verify Admin User Roles in Database

Run this SQL query:
```sql
SELECT id, name, phone, email, roles, "isActive", "isVerified" 
FROM "User" 
WHERE phone = '+919999999999' OR email = 'admin@winadeal.com';
```

**Expected result:**
```
roles: ['ADMIN']
```

**If roles is wrong**, fix it:
```sql
UPDATE "User" 
SET roles = ARRAY['ADMIN']::text[]
WHERE phone = '+919999999999' OR email = 'admin@winadeal.com';
```

### 5. Clear Browser Storage

**Important**: After logging out, clear:
1. LocalStorage (F12 → Application → Local Storage → Clear)
2. SessionStorage
3. Cookies
4. Browser cache (Ctrl+Shift+Delete)

### 6. Login Again

1. Open admin panel
2. Login with admin credentials
3. Check browser console for any errors
4. Check backend console for auth logs

### 7. Try Creating a City

1. Navigate to Cities page
2. Click "Add City"
3. Fill in details
4. Click "Create"
5. **Check backend console** for the auth logs

## Common Issues

### Issue 1: Old Token in LocalStorage
**Symptom**: Token was created before the fix
**Solution**: Clear browser storage and login again

### Issue 2: Wrong User Roles in Database
**Symptom**: User has `roles: ['CUSTOMER']` instead of `['ADMIN']`
**Solution**: Run the UPDATE SQL query above

### Issue 3: Backend Not Restarted
**Symptom**: Code changes not applied
**Solution**: Stop and restart backend server

### Issue 4: Multiple Role Array
**Symptom**: User has `roles: ['CUSTOMER', 'ADMIN']` and CUSTOMER is first
**Solution**: Either:
- Reorder roles: `UPDATE "User" SET roles = ARRAY['ADMIN', 'CUSTOMER']::text[]`
- Or use only ADMIN: `UPDATE "User" SET roles = ARRAY['ADMIN']::text[]`

## What to Share

If the issue persists, please share:

1. **Backend console logs** when you try to create a city
2. **Browser console errors** (F12 → Console)
3. **Database query result** for admin user roles
4. **Network tab** (F12 → Network → find the POST /cities request → Headers → Request Headers → Authorization)

## Expected Flow

```
1. User logs in
   → Backend generates token with selectedRole: 'ADMIN'
   → Frontend stores token in localStorage

2. User tries to create city
   → Frontend sends request with Authorization: Bearer <token>
   → Backend decodes token
   → Backend checks: selectedRole ('ADMIN') in allowedRoles (['ADMIN'])
   → ✅ Authorization succeeds
   → City is created

3. If authorization fails:
   → Backend logs show why
   → Fix the issue based on logs
```

## Debug Logs Added

The following logs were added to help debug:

### In `authenticate` middleware:
- Token decoded data (userId, roles, selectedRole)
- User authenticated data
- Invalid role selection errors

### In `authorize` middleware:
- Authorization check details (userId, roles, selectedRole, allowedRoles, endpoint)
- Authorization denied reasons
- Authorization success confirmations

## Next Steps

1. **Restart backend** to apply debug logging
2. **Clear browser storage** completely
3. **Login again** to get a fresh token
4. **Try creating a city** and check backend logs
5. **Share the logs** if issue persists

---

**Remember**: The token is created at login time. If you logged in before the fix, you need to logout, clear storage, and login again!
