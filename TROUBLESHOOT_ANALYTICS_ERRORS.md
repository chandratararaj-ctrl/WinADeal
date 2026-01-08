# Troubleshooting Analytics 401 & 500 Errors

## Current Issues

1. **401 Unauthorized** - Not logged in to vendor panel
2. **500 Internal Server Error** - Backend may not have reloaded changes

## Solutions

### Solution 1: Log In to Vendor Panel

You need to log in with vendor credentials:

**Vendor Login:**
- Phone: `+919999999998`
- Password: `vendor123`

OR

- Email: `vendor@winadeal.com`
- Password: `vendor123`

### Solution 2: Restart Backend Server

The backend needs to restart to pick up the SQL query changes:

1. **Stop the backend** (Ctrl+C in the terminal running `npm run dev`)
2. **Start it again**:
   ```bash
   cd backend
   npm run dev
   ```

### Solution 3: Check Backend Logs

If you still get 500 errors after restarting, check the backend console for the actual error message. It will show which SQL query is failing.

## Quick Test

After logging in and restarting backend, test the endpoint:

```powershell
# Login as vendor
$loginBody = @{phone='+919999999998'; password='vendor123'} | ConvertTo-Json
$loginResponse = Invoke-WebRequest -Uri 'http://localhost:5000/api/v1/auth/login' -Method POST -Body $loginBody -ContentType 'application/json'
$token = ($loginResponse.Content | ConvertFrom-Json).data.accessToken

# Test analytics
$headers = @{'Authorization' = "Bearer $token"}
Invoke-WebRequest -Uri 'http://localhost:5000/api/v1/analytics/vendor?startDate=2025-12-02&endDate=2026-01-01' -Headers $headers
```

## Expected Result

After logging in and restarting backend:
- ✅ No 401 errors (authenticated)
- ✅ No 500 errors (SQL queries work)
- ✅ Analytics data loads successfully

## If Still Getting 500 Errors

The SQL queries might need additional fixes. Check the backend console output for the specific error message and share it so I can help fix it.

## Common Causes

1. **Not logged in** → Log in to vendor panel
2. **Backend not restarted** → Restart backend server
3. **Wrong credentials** → Use vendor credentials above
4. **SQL syntax error** → Check backend logs for details
