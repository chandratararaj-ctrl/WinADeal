# Customer Web - Environment Variable Fix

## Problem
The `.env` file in `customer-web` has:
```
VITE_API_URL=http://localhost:5000
```

This overrides the corrected default in `api.ts`, causing 404 errors.

## Solution

Update the `.env` file in `customer-web` directory:

### File: `customer-web/.env`

Change from:
```
VITE_API_URL=http://localhost:5000
```

To:
```
VITE_API_URL=http://localhost:5000/api/v1
```

## Steps

1. Open `customer-web/.env` file
2. Change `VITE_API_URL` to include `/api/v1`
3. Save the file
4. Restart the customer-web dev server:
   ```bash
   cd customer-web
   # Press Ctrl+C to stop
   npm run dev
   ```
5. Hard refresh browser (Ctrl+Shift+R)

## Why This Happens

Vite loads environment variables from `.env` files and makes them available via `import.meta.env.VITE_*`.

In `api.ts`:
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
```

If `VITE_API_URL` is set in `.env`, it uses that value instead of the default.

## Verification

After the fix, check the browser Network tab:
- Requests should go to `http://localhost:5000/api/v1/cities/all` ✅
- Not `http://localhost:5000/cities/all` ❌

---

**Update the .env file and restart the server!**
