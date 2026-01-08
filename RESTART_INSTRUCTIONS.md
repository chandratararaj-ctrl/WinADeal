# 🔄 How to Restart the Customer Web Dev Server

## The Issue
The API configuration has been updated in the code, but the **dev server is still running with the old configuration**. You need to restart it for the changes to take effect.

## Quick Fix - Restart the Customer Web Server

### Option 1: Using the Terminal (Recommended)

1. **Find the terminal running customer-web**
   - Look for a terminal with output like: `VITE v5.x.x ready in xxx ms`
   - Or showing: `Local: http://localhost:3001/`

2. **Stop the server**
   - Press `Ctrl + C` in that terminal
   - Wait for it to fully stop

3. **Start it again**
   ```bash
   cd customer-web
   npm run dev
   ```

### Option 2: Kill All Node Processes and Restart

If you can't find the right terminal:

1. **Stop all Node processes** (this will stop ALL your dev servers):
   ```powershell
   # In PowerShell
   Get-Process node | Stop-Process -Force
   ```

2. **Restart each application you need**:
   
   **Backend:**
   ```bash
   cd backend
   npm run dev
   ```
   
   **Customer Web:**
   ```bash
   cd customer-web
   npm run dev
   ```
   
   **Admin Panel (if needed):**
   ```bash
   cd admin-panel
   npm run dev
   ```
   
   **Vendor Panel (if needed):**
   ```bash
   cd vendor-panel
   npm run dev
   ```

### Option 3: Just Restart Customer Web (Safest)

If you know which terminal is running customer-web:

```bash
# In the customer-web terminal
# Press Ctrl+C to stop, then:
npm run dev
```

## After Restarting

1. **Clear browser cache**
   - Press `Ctrl + Shift + R` (Windows/Linux)
   - Or `Cmd + Shift + R` (Mac)
   - Or open DevTools (F12) → Right-click refresh button → "Empty Cache and Hard Reload"

2. **Check the browser console**
   - Open DevTools (F12)
   - Go to Console tab
   - Look for the API calls - they should now go to `/api/v1/cities/available`

3. **Test the city dropdown**
   - The navbar city selector should now work
   - No more 404 errors should appear

## Verification

After restarting, you should see:

✅ **In Network Tab (F12 → Network):**
- Requests going to: `http://localhost:5000/api/v1/cities/available`
- Status: `200 OK` (not 404)

✅ **In Console:**
- No "Failed to fetch cities" errors
- No 404 errors

✅ **In the UI:**
- City dropdown populates with cities
- Shops load based on selected city

## Still Having Issues?

If you still see 404 errors after restarting:

1. **Check if backend is running**
   ```bash
   # Test backend health
   curl http://localhost:5000/health
   ```

2. **Check backend logs**
   - Look at the terminal running the backend
   - Verify it shows: `✅ Running` on port 5000

3. **Verify the route is registered**
   - Backend should have logged: `[GET] /api/v1/cities/available`

4. **Check environment variables**
   - Create/check `customer-web/.env` file:
   ```env
   VITE_API_URL=http://localhost:5000/api/v1
   ```

---

## Current Status

✅ **Code Updated:** `customer-web/src/services/api.ts` has been fixed  
⏳ **Pending:** Dev server restart required  
📋 **Next Step:** Restart customer-web dev server using one of the options above
