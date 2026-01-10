# Coolify Deployment - Environment Variables Configuration

## 🚨 **CRITICAL: Fix City Dropdown and API Calls**

All frontend apps need their `VITE_API_URL` set to point to the deployed backend, not `localhost:5000`.

---

## **1. Find Your Backend URL**

First, identify your backend service URL in Coolify:

1. Open Coolify Dashboard
2. Go to your backend service
3. Find the **Public URL** (should be like `http://xxxxx.20.193.142.10.sslip.io`)
4. Copy this URL

**Example Backend URL**: `http://kgg4s88kwwskcsgg0c4ss8ko.20.193.142.10.sslip.io`

---

## **2. Configure Environment Variables for Each Service**

### **✅ Delivery Web** (Currently Broken)
**Service**: delivery-web  
**Current Issue**: Trying to call `localhost:5000` from deployed app

**Required Environment Variable**:
```bash
VITE_API_URL=http://[YOUR-BACKEND-URL]/api/v1
```

**Example**:
```bash
VITE_API_URL=http://kgg4s88kwwskcsgg0c4ss8ko.20.193.142.10.sslip.io/api/v1
```

---

### **✅ Customer Web**
```bash
VITE_API_URL=http://[YOUR-BACKEND-URL]/api/v1
```

---

### **✅ Admin Panel**
```bash
VITE_API_URL=http://[YOUR-BACKEND-URL]/api/v1
```

---

### **✅ Vendor Panel**
```bash
VITE_API_URL=http://[YOUR-BACKEND-URL]/api/v1
```

---

### **✅ Backend**
```bash
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]
JWT_SECRET=[your-jwt-secret]
JWT_REFRESH_SECRET=[your-refresh-secret]

# Frontend URLs (for CORS)
ADMIN_PANEL_URL=http://uoog04kg4kgks80cckk4wg04.20.193.142.10.sslip.io
CUSTOMER_WEB_URL=http://w4o4c44o0oc0g0cg8w4gs8ko.20.193.142.10.sslip.io
VENDOR_PANEL_URL=http://s8sg8844wwo8ss8gs4w4k4ks.20.193.142.10.sslip.io
DELIVERY_PANEL_URL=http://xgk48c0wgco8wos0wwgocww0.20.193.142.10.sslip.io
```

---

## **3. Steps to Update in Coolify**

### **For Delivery Web (Priority - Fix Now)**:

1. **Open Coolify Dashboard**
2. **Navigate to your Project** → **delivery-web** service
3. **Click on "Environment Variables"**
4. **Add New Variable**:
   - **Name**: `VITE_API_URL`
   - **Value**: `http://[YOUR-BACKEND-URL]/api/v1`
5. **Click "Save"**
6. **Restart** the delivery-web service

### **Repeat for Other Frontend Services**:
- customer-web
- admin-panel
- vendor-panel

---

## **4. How to Find Backend URL in Coolify**

```bash
# Method 1: From Coolify Dashboard
1. Go to Services
2. Click on "backend" service
3. Look for "Domains" or "Public URL" section
4. Copy the URL (e.g., http://xxxxx.20.193.142.10.sslip.io)

# Method 2: Check Backend Landing Page
1. Open any of your frontend apps
2. They should redirect or show a landing page
3. That landing page lists all service URLs
```

---

## **5. Verification**

After updating the environment variables:

1. **Clear Browser Cache** (Ctrl + Shift + Delete)
2. **Hard Refresh** the delivery app (Ctrl + F5)
3. **Open Browser Console** (F12)
4. **Go to Network Tab**
5. **Try registering** - you should see:
   - API call to `http://[backend-url]/api/v1/cities/active` ✅
   - Response with cities list ✅
   - No CORS errors ✅

---

## **6. Common Issues**

### **Issue**: Still calling localhost
**Solution**: Environment variable not set correctly. Double-check spelling: `VITE_API_URL` (not `API_URL`)

### **Issue**: CORS error with correct backend URL
**Solution**: Backend's CORS configuration needs to include the frontend URL. Check `server.ts` CORS settings.

### **Issue**: 404 error on API calls
**Solution**: Make sure `/api/v1` is included in `VITE_API_URL`

---

## **7. Quick Test**

After configuration, test with:

```bash
# From your delivery app console (F12)
console.log(import.meta.env.VITE_API_URL)

# Should output:
# http://[backend-url]/api/v1
```

---

## **8. Production Build Note**

Vite apps read environment variables **at build time**, so:

1. **Set environment variables in Coolify BEFORE deploying**
2. **If you change env vars, you MUST rebuild** (not just restart)
3. **Check Coolify build logs** to ensure env vars are picked up

