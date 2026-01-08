# 404 Error Resolution - API Base URL Fix

## Problem Summary

The customer web application was experiencing **404 (Not Found)** errors when trying to fetch data from the backend API.

### Errors Observed:
```
Failed to load resource: the server responded with a status of 404 (Not Found)
- /cities/available
- /cities/shops?city=Kolkata
```

## Root Cause

The issue was a **mismatch between the frontend API calls and backend route structure**:

### Frontend Configuration (BEFORE):
```typescript
// customer-web/src/services/api.ts
const API_URL = 'http://localhost:5000';  // Missing /api/v1 prefix

const api = axios.create({
    baseURL: API_URL,  // Results in: http://localhost:5000
});
```

### API Calls Made:
```typescript
// city.service.ts
api.get('/cities/available')  
// ❌ Resulted in: http://localhost:5000/cities/available

api.get('/cities/shops')      
// ❌ Resulted in: http://localhost:5000/cities/shops
```

### Backend Route Structure:
```typescript
// backend/src/server.ts
app.use('/api/v1/cities', cityRoutes);
// ✅ Expects: http://localhost:5000/api/v1/cities/available
// ✅ Expects: http://localhost:5000/api/v1/cities/shops
```

## The Fix

Updated the `API_URL` constant to include the `/api/v1` prefix:

```typescript
// customer-web/src/services/api.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
    baseURL: API_URL,  // Now: http://localhost:5000/api/v1
});
```

### Result:
```typescript
api.get('/cities/available')  
// ✅ Now calls: http://localhost:5000/api/v1/cities/available

api.get('/cities/shops')      
// ✅ Now calls: http://localhost:5000/api/v1/cities/shops
```

## Files Modified

1. **`customer-web/src/services/api.ts`**
   - Updated `API_URL` to include `/api/v1` prefix
   - Fixed refresh token endpoint to use the updated `API_URL` constant

## What This Fixes

✅ **Cities API calls** - `/cities/available` and `/cities/shops`  
✅ **All other API endpoints** - shops, products, orders, auth, etc.  
✅ **Consistent API routing** - All calls now properly route through `/api/v1`  

## Testing

After this fix, the following should work:

1. **City Selection** - Navbar city dropdown should populate with available cities
2. **Shop Filtering** - Shops should filter based on selected city
3. **All API Calls** - Any API call from the customer web app should now reach the correct backend endpoint

## Environment Variables

If you're using environment variables, make sure your `.env` file has:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

Or for production:
```env
VITE_API_URL=https://your-domain.com/api/v1
```

## Next Steps

1. **Restart the customer web development server** to pick up the changes
2. **Clear browser cache** or do a hard refresh (Ctrl+Shift+R)
3. **Test the city selection** in the navbar
4. **Verify no more 404 errors** in the browser console

---

**Status:** ✅ **RESOLVED**  
**Impact:** All API endpoints in customer web application  
**Severity:** High (blocking core functionality)  
**Resolution Time:** Immediate
