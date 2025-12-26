# DigitalOcean Quick Fix - "No Components Detected"

## The Problem

DigitalOcean can't find your app because your project is a **monorepo** (multiple apps in one repository).

## The Solution

**Set the Source Directory for each component!**

---

## Quick Steps

### 1. When Creating App

1. Go to: https://cloud.digitalocean.com/apps
2. Click "Create App"
3. Choose GitHub → Select `tararajc-gif/winadeal`
4. Click "Next"

### 2. Configure Backend

**⚠️ CRITICAL STEP:**

When DigitalOcean shows "No components detected":

1. Click "Edit Plan"
2. Click "Add Component" → "Web Service"
3. **Set Source Directory**: `backend` ← THIS IS THE KEY!
4. Configure:
   ```
   Name: backend
   Source Directory: backend  ← MUST SET THIS!
   Build Command: npm install && npx prisma generate && npm run build
   Run Command: npm run start
   HTTP Port: 5000
   ```

### 3. Add Frontend Apps

For each frontend, click "Add Component" → "Static Site":

**Admin Panel:**
```
Name: admin-panel
Source Directory: admin-panel  ← MUST SET THIS!
Build Command: npm install && npm run build
Output Directory: dist
```

**Vendor Panel:**
```
Name: vendor-panel
Source Directory: vendor-panel  ← MUST SET THIS!
Build Command: npm install && npm run build
Output Directory: dist
```

**Customer Web:**
```
Name: customer-web
Source Directory: customer-web  ← MUST SET THIS!
Build Command: npm install && npm run build
Output Directory: dist
```

**Delivery Web:**
```
Name: delivery-web
Source Directory: delivery-web  ← MUST SET THIS!
Build Command: npm install && npm run build
Output Directory: dist
```

---

## Alternative: Use App Spec YAML

**Easier Method:**

1. The file `.do/app.yaml` is already in your repository
2. When creating app, choose "Import from App Spec"
3. Select the `.do/app.yaml` file
4. DigitalOcean will auto-configure everything!

---

## Visual Guide

### Where to Set Source Directory:

```
Create App
  ↓
Select GitHub Repo
  ↓
[!] "No components detected" ← You'll see this
  ↓
Click "Edit Plan"
  ↓
Click "Add Component"
  ↓
Choose "Web Service" or "Static Site"
  ↓
[!] Set "Source Directory" ← THIS IS CRITICAL!
  ↓
backend → for backend
admin-panel → for admin
vendor-panel → for vendor
customer-web → for customer
delivery-web → for delivery
```

---

## Why This Happens

Your repository structure:
```
winadeal/
├── backend/          ← App 1
│   └── package.json
├── admin-panel/      ← App 2
│   └── package.json
├── vendor-panel/     ← App 3
│   └── package.json
├── customer-web/     ← App 4
│   └── package.json
└── delivery-web/     ← App 5
    └── package.json
```

DigitalOcean looks in the **root** directory and doesn't find `package.json`, so it says "No components detected".

**Solution**: Tell DigitalOcean where each app is by setting the **Source Directory**!

---

## Complete Configuration

### Backend Component:
```yaml
Type: Web Service
Source Directory: backend
Build Command: npm install && npx prisma generate && npm run build
Run Command: npm run start
HTTP Port: 5000
Environment Variables:
  - NODE_ENV=production
  - DATABASE_URL=<from database>
  - JWT_SECRET=<your secret>
  - CORS_ORIGIN=*
```

### Frontend Components (all 4):
```yaml
Type: Static Site
Source Directory: <respective folder>
Build Command: npm install && npm run build
Output Directory: dist
Environment Variables:
  - VITE_API_URL=<backend URL>/api/v1
```

---

## After Configuration

1. ✅ Click "Next"
2. ✅ Review all components
3. ✅ Click "Create Resources"
4. ✅ Wait for deployment (5-10 minutes)
5. ✅ Test your app!

---

## Verification

After deployment, you should see:
- ✅ backend: `https://backend-xxxxx.ondigitalocean.app`
- ✅ admin-panel: `https://admin-panel-xxxxx.ondigitalocean.app`
- ✅ vendor-panel: `https://vendor-panel-xxxxx.ondigitalocean.app`
- ✅ customer-web: `https://customer-web-xxxxx.ondigitalocean.app`
- ✅ delivery-web: `https://delivery-web-xxxxx.ondigitalocean.app`

---

## Still Getting Error?

### Option 1: Manual Component Creation
1. Create app without auto-detection
2. Manually add each component
3. Set source directory for each

### Option 2: Use App Spec
1. Upload `.do/app.yaml` from your repo
2. DigitalOcean will read configuration
3. Auto-create all components

### Option 3: Deploy One at a Time
1. Start with backend only
2. Set source directory: `backend`
3. Deploy
4. Then add frontend components one by one

---

**Key Takeaway**: Always set the **Source Directory** when deploying a monorepo! 🎯
