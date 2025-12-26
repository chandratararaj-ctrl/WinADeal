# DigitalOcean Deployment - Complete Checklist

## ✅ Pre-Deployment Checklist

- [ ] GitHub repository exists: `tararajc-gif/winadeal`
- [ ] Code is pushed to GitHub
- [ ] DigitalOcean account created
- [ ] Credit card added (or $200 credit applied)

---

## 📋 Deployment Steps

### Step 1: Create Database (5 minutes)

- [ ] Go to: https://cloud.digitalocean.com/databases
- [ ] Click "Create Database Cluster"
- [ ] Select: PostgreSQL 15
- [ ] Choose: Basic ($15/month)
- [ ] Region: New York (or closest to you)
- [ ] Click "Create Database Cluster"
- [ ] Wait for "Available" status
- [ ] Copy connection string
- [ ] Add `?sslmode=require` to end of connection string

**Connection String Format:**
```
postgresql://user:password@host:port/database?sslmode=require
```

---

### Step 2: Create App (10 minutes)

- [ ] Go to: https://cloud.digitalocean.com/apps
- [ ] Click "Create App"
- [ ] Choose "GitHub"
- [ ] Select repository: `tararajc-gif/winadeal`
- [ ] Branch: `main`
- [ ] Click "Next"

---

### Step 3: Configure Backend Component

**When you see "No components detected":**

- [ ] Click "Edit Plan"
- [ ] Click "Add Component" → "Web Service"
- [ ] Set configuration:

```
Name: backend
Source Directory: backend  ← CRITICAL!
Build Command: npm install && npx prisma generate && npm run build
Run Command: npm run start
HTTP Port: 5000
Instance Size: Basic ($5/month)
```

- [ ] Add Environment Variables:

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=<paste connection string from Step 1>
JWT_SECRET=<generate random 32+ char string>
JWT_REFRESH_SECRET=<generate different random 32+ char string>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
OTP_EXPIRES_IN=10
CORS_ORIGIN=*
```

**Generate secrets:**
```bash
# Run this in terminal to generate secure secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### Step 4: Add Admin Panel Component

- [ ] Click "Add Component" → "Static Site"
- [ ] Configure:

```
Name: admin-panel
Source Directory: admin-panel  ← CRITICAL!
Build Command: npm install && npm run build
Output Directory: dist
```

- [ ] Add Environment Variable:
```env
VITE_API_URL=${backend.PUBLIC_URL}/api/v1
```

---

### Step 5: Add Vendor Panel Component

- [ ] Click "Add Component" → "Static Site"
- [ ] Configure:

```
Name: vendor-panel
Source Directory: vendor-panel  ← CRITICAL!
Build Command: npm install && npm run build
Output Directory: dist
```

- [ ] Add Environment Variable:
```env
VITE_API_URL=${backend.PUBLIC_URL}/api/v1
```

---

### Step 6: Add Customer Web Component

- [ ] Click "Add Component" → "Static Site"
- [ ] Configure:

```
Name: customer-web
Source Directory: customer-web  ← CRITICAL!
Build Command: npm install && npm run build
Output Directory: dist
```

- [ ] Add Environment Variable:
```env
VITE_API_URL=${backend.PUBLIC_URL}/api/v1
```

---

### Step 7: Add Delivery Web Component

- [ ] Click "Add Component" → "Static Site"
- [ ] Configure:

```
Name: delivery-web
Source Directory: delivery-web  ← CRITICAL!
Build Command: npm install && npm run build
Output Directory: dist
```

- [ ] Add Environment Variable:
```env
VITE_API_URL=${backend.PUBLIC_URL}/api/v1
```

---

### Step 8: Review and Deploy

- [ ] Click "Next"
- [ ] Review all 5 components
- [ ] Verify source directories are set
- [ ] Click "Create Resources"
- [ ] Wait for deployment (10-15 minutes)

---

### Step 9: Run Database Migration

After backend is deployed:

- [ ] Go to backend component
- [ ] Click "Console" tab
- [ ] Run command:
```bash
npx prisma db push
```
- [ ] Wait for "Migration complete"

---

### Step 10: Update CORS

- [ ] Copy all frontend URLs
- [ ] Go to backend → Settings → Environment Variables
- [ ] Update `CORS_ORIGIN`:
```env
CORS_ORIGIN=https://admin-panel-xxxxx.ondigitalocean.app,https://vendor-panel-xxxxx.ondigitalocean.app,https://customer-web-xxxxx.ondigitalocean.app,https://delivery-web-xxxxx.ondigitalocean.app
```
- [ ] Save and redeploy backend

---

## ✅ Post-Deployment Testing

### Test Backend:
- [ ] Visit: `https://backend-xxxxx.ondigitalocean.app/api/v1/health`
- [ ] Should return: `{"status":"ok"}`

### Test Admin Panel:
- [ ] Visit: `https://admin-panel-xxxxx.ondigitalocean.app`
- [ ] Login: 9876543210 / 123456
- [ ] Should see dashboard

### Test Vendor Panel:
- [ ] Visit: `https://vendor-panel-xxxxx.ondigitalocean.app`
- [ ] Register new vendor
- [ ] Create shop

### Test Customer Web:
- [ ] Visit: `https://customer-web-xxxxx.ondigitalocean.app`
- [ ] Browse shops
- [ ] Should see verified shops

### Test Delivery Web:
- [ ] Visit: `https://delivery-web-xxxxx.ondigitalocean.app`
- [ ] Register delivery partner

---

## 💰 Cost Summary

| Component | Cost/Month |
|-----------|------------|
| PostgreSQL Database | $15 |
| Backend API | $5 |
| Admin Panel | $3 |
| Vendor Panel | $3 |
| Customer Web | $3 |
| Delivery Web | $3 |
| **Total** | **$32/month** |

**Free Trial**: $200 credit = 6+ months free!

---

## 🆘 Troubleshooting

### "No components detected"
✅ **Solution**: Set Source Directory for each component

### Build failed
✅ **Solution**: Check logs, ensure package.json exists in source directory

### Database connection error
✅ **Solution**: Add `?sslmode=require` to DATABASE_URL

### CORS error
✅ **Solution**: Update CORS_ORIGIN with all frontend URLs

### Prisma error
✅ **Solution**: Add `npx prisma generate` to build command

---

## 📝 Important URLs

After deployment, save these:

```
Backend API: https://backend-xxxxx.ondigitalocean.app
Admin Panel: https://admin-panel-xxxxx.ondigitalocean.app
Vendor Panel: https://vendor-panel-xxxxx.ondigitalocean.app
Customer Web: https://customer-web-xxxxx.ondigitalocean.app
Delivery Web: https://delivery-web-xxxxx.ondigitalocean.app
Database: <connection string>
```

---

**Estimated Total Time**: 30-45 minutes 🚀

**Key Success Factor**: Setting the **Source Directory** for each component!
