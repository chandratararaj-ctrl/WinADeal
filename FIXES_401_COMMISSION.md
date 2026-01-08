# CommissionSettings 401 Unauthorized - Fixed ✅

## Issue Summary
The CommissionSettings page was getting a 401 Unauthorized error when trying to fetch delivery partners:
```
GET http://localhost:5000/api/v1/delivery/ 401 (Unauthorized)
```

## Root Causes

### 1. **Using fetch Instead of API Service**
The CommissionSettings component was using raw `fetch` calls instead of the configured `api` service:
- **Problem**: Used `localStorage.getItem('token')` which doesn't exist
- **Correct**: Should use `localStorage.getItem('accessToken')`

### 2. **Token Key Mismatch**
```typescript
// Wrong - token doesn't exist in localStorage
fetch('...', {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
});

// Correct - accessToken is stored by authStore
const token = localStorage.getItem('accessToken');
```

### 3. **Missing Automatic Token Refresh**
Raw `fetch` calls don't benefit from the axios interceptors that:
- Automatically add the Authorization header
- Handle token refresh on 401 errors
- Retry failed requests with new tokens

## Fixes Applied

### 1. **Added API Service Import**
```typescript
import api from '../services/api';
```

### 2. **Replaced fetch with API Service**

**Before:**
```typescript
const shopsResponse = await fetch('http://localhost:5000/api/v1/shops', {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
});
const shopsData = await shopsResponse.json();
setShops(shopsData.data?.shops || []);

const partnersResponse = await fetch('http://localhost:5000/api/v1/delivery/', {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
});
const partnersData = await partnersResponse.json();
setPartners(partnersData.data?.partners || []);
```

**After:**
```typescript
const shopsResponse = await api.get('/shops');
setShops(shopsResponse.data.data?.shops || []);

const partnersResponse = await api.get('/delivery/');
setPartners(partnersResponse.data.data?.partners || []);
```

## Benefits of Using API Service

1. **Automatic Authentication**: Token is automatically added to all requests
2. **Token Refresh**: Automatically refreshes expired tokens
3. **Retry Logic**: Retries failed requests after token refresh
4. **Centralized Configuration**: All API calls use the same base URL and headers
5. **Error Handling**: Consistent error handling across the app

## How API Service Works

### Request Interceptor
```typescript
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
```

### Response Interceptor (Token Refresh)
```typescript
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401 && !originalRequest._retry) {
            // Try to refresh token
            const refreshToken = localStorage.getItem('refreshToken');
            const response = await axios.post('/auth/refresh', { refreshToken });
            const { accessToken } = response.data.data;
            
            // Update token and retry request
            localStorage.setItem('accessToken', accessToken);
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
        }
        return Promise.reject(error);
    }
);
```

## Token Storage

The authStore correctly manages tokens:

```typescript
setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    // ...
}
```

## Troubleshooting

If you still get 401 errors:

### 1. **Check if Logged In**
- Open browser DevTools → Application → Local Storage
- Verify `accessToken` exists and is not expired

### 2. **Re-login**
- Log out and log back in to get fresh tokens
- Use admin credentials:
  - Phone: `+919999999999`
  - Password: `admin123`

### 3. **Check Token Expiry**
- Access tokens expire after 15 minutes (default)
- Refresh tokens expire after 7 days (default)
- If both expired, you need to log in again

### 4. **Verify Backend is Running**
```bash
# Check if backend is running on port 5000
netstat -ano | findstr :5000
```

## Files Modified

1. `admin-panel/src/pages/CommissionSettings.tsx`
   - Added `api` service import
   - Replaced `fetch` calls with `api.get()` calls
   - Removed hardcoded token retrieval

## Testing

After this fix:
1. ✅ Requests use correct token key (`accessToken`)
2. ✅ Automatic token refresh on 401 errors
3. ✅ Consistent authentication across all API calls
4. ✅ Better error handling and user experience

## Next Steps

1. **Log in to admin panel** with admin credentials
2. **Navigate to Commission Settings**
3. **Page should load** without 401 errors
4. If still getting 401, **log out and log back in** to get fresh tokens
