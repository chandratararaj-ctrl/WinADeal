# CORS Issue Troubleshooting for Coolify Deployment

## 🔴 **Current Issue:**
Backend is still not sending `Access-Control-Allow-Origin` headers despite CORS being configured.

---

## ✅ **Latest Fix Applied:**

Simplified CORS configuration to allow ALL `.sslip.io` domains with better logging.

**Commit:** `d0a6a55` - "Simplify CORS configuration for better Coolify deployment compatibility"

---

## 🔍 **Troubleshooting Steps:**

### **Step 1: Verify Backend is Running**

Test if backend is accessible:

```bash
curl http://uoog04kg4kgks80cckk4wg04.20.193.142.10.sslip.io/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "message": "WinADeal API is running",
  "timestamp": "...",
  "environment": "production"
}
```

---

### **Step 2: Check CORS Headers Manually**

Test CORS with curl:

```bash
curl -H "Origin: http://xgk48c0wgco8wos0wwgocww0.20.193.142.10.sslip.io" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     --verbose \
     http://uoog04kg4kgks80cckk4wg04.20.193.142.10.sslip.io/api/v1/cities/active
```

**Look for these headers in the response:**
- `Access-Control-Allow-Origin: http://xgk48c0wgco8wos0wwgocww0.20.193.142.10.sslip.io`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS`
- `Access-Control-Allow-Credentials: true`

---

### **Step 3: Verify Coolify Deployed Latest Code**

In Coolify:

1. **Go to backend service**
2. **Click "Logs" tab**
3. **Look for deployment logs** - should show:
   ```
   Commit: d0a6a55
   ```
4. **Check application logs** for CORS debug messages:
   ```
   [CORS] Request from: http://xgk48c0wgco8wos0wwgocww0.20.193.142.10.sslip.io
   [CORS] ✅ Allowed (sslip.io): ...
   ```

---

### **Step 4: Force Redeploy Backend**

If Coolify didn't auto-deploy:

1. **Go to Coolify Dashboard**
2. **Navigate to backend service**
3. **Click "Redeploy" or "Force Redeploy"**
4. **Wait for build to complete** (check build logs)
5. **Verify it's using commit** `d0a6a55`

---

### **Step 5: Check for Reverse Proxy Issues**

Coolify might be using a reverse proxy (Nginx/Traefik) that strips CORS headers.

**Check Coolify's proxy settings:**

1. Go to backend service settings
2. Look for "Proxy" or "Advanced" settings
3. Check if there are any custom headers being set
4. Ensure no "Header Removal" rules are configured

---

### **Step 6: Verify Build Configuration**

Ensure Coolify is building correctly:

1. **In Coolify, go to backend service**
2. **Check "Build Settings"**:
   - **Build Command**: Should be `npm install && npm run build` (or similar)
   - **Start Command**: Should be `npm start` or `node dist/server.js`
   - **Port**: Should be `5000`

3. **Check Environment Variables**:
   - `NODE_ENV=production` ✅
   - `PORT=5000` ✅
   - `DATABASE_URL=...` ✅

---

### **Step 7: Test from Browser Console**

Open delivery app in browser: `http://xgk48c0wgco8wos0wwgocww0.20.193.142.10.sslip.io`

**Run in console:**

```javascript
// Test 1: Simple fetch to check if backend is responding
fetch('http://uoog04kg4kgks80cckk4wg04.20.193.142.10.sslip.io/health')
  .then(res => res.json())
  .then(data => console.log('Health Check:', data))
  .catch(err => console.error('Error:', err));

// Test 2: Check CORS headers
fetch('http://uoog04kg4kgks80cckk4wg04.20.193.142.10.sslip.io/api/v1/cities/active', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
  .then(res => {
    console.log('Status:', res.status);
    console.log('Headers:', Array.from(res.headers.entries()));
    return res.json();
  })
  .then(data => console.log('Cities:', data))
  .catch(err => console.error('CORS Error:', err));
```

---

## 🆘 **If CORS Still Doesn't Work:**

### **Alternative Solution: Add Manual CORS Middleware**

If the `cors()` npm package isn't working, we can add manual headers.

**Create file:** `backend/src/middleware/manual-cors.middleware.ts`

```typescript
import { Request, Response, NextFunction } from 'express';

export const manualCorsMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const origin = req.get('Origin');
    
    // Log for debugging
    console.log(`[Manual CORS] Origin: ${origin}`);

    // Allow localhost and sslip.io domains
    if (!origin || origin.includes('localhost') || origin.includes('.sslip.io')) {
        res.header('Access-Control-Allow-Origin', origin || '*');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.header('Access-Control-Expose-Headers', 'Content-Length, X-Request-Id');
        res.header('Access-Control-Max-Age', '86400');
        
        console.log(`[Manual CORS] ✅ Headers set for: ${origin}`);
    }

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }

    next();
};
```

**Then in `server.ts`, BEFORE the routes:**

```typescript
import { manualCorsMiddleware } from './middleware/manual-cors.middleware';

// Use BEFORE routes
app.use(manualCorsMiddleware);
```

---

## 🎯 **Quick Checklist:**

- [ ] Latest code pushed to Git (commit `d0a6a55`)
- [ ] Coolify backend service redeployed
- [ ] Backend logs show CORS messages
- [ ] Backend `/health` endpoint works
- [ ] CORS headers present in OPTIONS request
- [ ] Environment variables are correct
- [ ] No reverse proxy stripping headers

---

## 📞 **Get Backend Logs:**

To see what's actually happening:

1. **In Coolify** → **Backend Service** → **Logs**
2. **Look for:**
   - `[CORS] Request from: ...` messages
   - Any error messages
   - Port binding confirmation

---

## **Most Common Issues:**

1. ❌ **Backend didn't redeploy** → Force redeploy in Coolify
2. ❌ **Reverse proxy stripping CORS headers** → Check Coolify proxy settings
3. ❌ **Wrong commit deployed** → Verify commit hash in deployment logs
4. ❌ **CORS package not installed** → Check `package.json` has `cors` dependency
5. ❌ **Environment not set to production** → Add `NODE_ENV=production`

