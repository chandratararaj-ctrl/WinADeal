# Render Quick Start - Deploy in 20 Minutes!

## Why Render is Perfect for You

✅ **100% FREE** for testing (no credit card needed!)  
✅ **Simplest setup** - Just set "Root Directory"  
✅ **Auto-deploy** - Push to GitHub = Auto deploy  
✅ **Free PostgreSQL** - 90 days free  
✅ **Free SSL** - Automatic HTTPS  

---

## 🚀 Quick Deployment (Follow These Steps)

### Step 1: Sign Up (2 minutes)

1. Go to: **https://render.com**
2. Click **"Get Started for Free"**
3. Sign up with **GitHub** (easiest!)
4. Authorize Render

---

### Step 2: Create Database (2 minutes)

1. Click **"New +"** → **"PostgreSQL"**
2. Fill in:
   ```
   Name: winadeal-db
   Database: winadeal
   User: winadeal
   Region: Oregon
   Plan: FREE ← Select this!
   ```
3. Click **"Create Database"**
4. Wait 1-2 minutes
5. **Copy "Internal Database URL"** (you'll need this!)

---

### Step 3: Deploy Backend (5 minutes)

1. Click **"New +"** → **"Web Service"**
2. Connect **GitHub** → Select `tararajc-gif/winadeal`
3. **IMPORTANT - Fill in these fields**:

```
Name: winadeal-backend
Region: Oregon (same as database!)
Branch: main
Root Directory: backend  ← CRITICAL! Don't skip this!
Runtime: Node
Build Command: npm install && npx prisma generate && npm run build
Start Command: npm run start
Plan: Free
```

4. Click **"Advanced"** → **"Add Environment Variable"**

Add these one by one:

```env
NODE_ENV = production
PORT = 10000
DATABASE_URL = <paste Internal Database URL from Step 2>
JWT_SECRET = <any random 32+ character string>
JWT_REFRESH_SECRET = <different random 32+ character string>
JWT_EXPIRES_IN = 15m
JWT_REFRESH_EXPIRES_IN = 7d
OTP_EXPIRES_IN = 10
CORS_ORIGIN = *
```

**Generate secrets** (run in terminal):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

5. Click **"Create Web Service"**
6. Wait 5-10 minutes for deployment
7. **Copy the URL** (e.g., `https://winadeal-backend.onrender.com`)

---

### Step 4: Run Database Migration (1 minute)

After backend finishes deploying:

1. Go to backend service
2. Click **"Shell"** tab
3. Run this command:
   ```bash
   npx prisma db push
   ```
4. Wait for "Migration complete"

---

### Step 5: Deploy Admin Panel (3 minutes)

1. Click **"New +"** → **"Static Site"**
2. Connect **GitHub** → Select `tararajc-gif/winadeal`
3. Fill in:

```
Name: winadeal-admin
Branch: main
Root Directory: admin-panel  ← CRITICAL!
Build Command: npm install && npm run build
Publish Directory: dist
```

4. **Add Environment Variable**:
```env
VITE_API_URL = https://winadeal-backend.onrender.com/api/v1
```
(Use YOUR backend URL from Step 3!)

5. Click **"Create Static Site"**

---

### Step 6: Deploy Vendor Panel (3 minutes)

1. Click **"New +"** → **"Static Site"**
2. Connect **GitHub** → Select `tararajc-gif/winadeal`
3. Fill in:

```
Name: winadeal-vendor
Branch: main
Root Directory: vendor-panel  ← CRITICAL!
Build Command: npm install && npm run build
Publish Directory: dist
```

4. **Add Environment Variable**:
```env
VITE_API_URL = https://winadeal-backend.onrender.com/api/v1
```

5. Click **"Create Static Site"**

---

### Step 7: Deploy Customer Web (3 minutes)

1. Click **"New +"** → **"Static Site"**
2. Connect **GitHub** → Select `tararajc-gif/winadeal`
3. Fill in:

```
Name: winadeal-customer
Branch: main
Root Directory: customer-web  ← CRITICAL!
Build Command: npm install && npm run build
Publish Directory: dist
```

4. **Add Environment Variable**:
```env
VITE_API_URL = https://winadeal-backend.onrender.com/api/v1
```

5. Click **"Create Static Site"**

---

### Step 8: Deploy Delivery Web (3 minutes)

1. Click **"New +"** → **"Static Site"**
2. Connect **GitHub** → Select `tararajc-gif/winadeal`
3. Fill in:

```
Name: winadeal-delivery
Branch: main
Root Directory: delivery-web  ← CRITICAL!
Build Command: npm install && npm run build
Publish Directory: dist
```

4. **Add Environment Variable**:
```env
VITE_API_URL = https://winadeal-backend.onrender.com/api/v1
```

5. Click **"Create Static Site"**

---

### Step 9: Update CORS (1 minute)

After all frontends are deployed:

1. Go to **backend service** → **Environment**
2. Find **CORS_ORIGIN** variable
3. Update to:
```
https://winadeal-admin.onrender.com,https://winadeal-vendor.onrender.com,https://winadeal-customer.onrender.com,https://winadeal-delivery.onrender.com
```
(Use YOUR actual URLs!)

4. Click **"Save Changes"**

---

## ✅ Testing (2 minutes)

### Test Backend:
Visit: `https://winadeal-backend.onrender.com/api/v1/health`  
Should see: `{"status":"ok"}`

### Test Admin:
Visit: `https://winadeal-admin.onrender.com`  
Login: 9876543210 / 123456

### Test Vendor:
Visit: `https://winadeal-vendor.onrender.com`  
Register new vendor

### Test Customer:
Visit: `https://winadeal-customer.onrender.com`  
Browse shops

### Test Delivery:
Visit: `https://winadeal-delivery.onrender.com`  
Register delivery partner

---

## 🎯 Key Success Points

1. **Root Directory** - MUST set for each service!
   - Backend: `backend`
   - Admin: `admin-panel`
   - Vendor: `vendor-panel`
   - Customer: `customer-web`
   - Delivery: `delivery-web`

2. **Database URL** - Use **Internal** URL (not External)

3. **Environment Variables** - Set for ALL services

4. **CORS** - Update after all frontends deploy

---

## 💰 Cost

**Everything is FREE!** 🎉

- Backend: Free (spins down after 15 min)
- Database: Free (90 days)
- 4 Frontends: Free (always on!)

**For Production** (optional):
- Backend Starter: $7/month (always on)
- Database Starter: $7/month (permanent)
- **Total: $14/month**

---

## ⚡ Pro Tips

1. **First Request Slow?**
   - Free backend spins down after 15 min
   - First request takes 30-60 seconds
   - Subsequent requests are fast!

2. **Auto-Deploy**
   - Push to GitHub = Auto deploy
   - No manual deployment needed!

3. **Logs**
   - Click service → "Logs" tab
   - See real-time deployment logs

4. **Rollback**
   - Click service → "Events" tab
   - Click "Rollback" on any previous deploy

---

## 🆘 Common Issues

### "Build failed"
✅ Check you set **Root Directory** correctly

### "Prisma error"
✅ Add `npx prisma generate` to build command

### "Database connection failed"
✅ Use **Internal** Database URL (not External)

### "CORS error"
✅ Update CORS_ORIGIN with all frontend URLs

### "Backend is slow"
✅ Free tier spins down - upgrade to $7/month for always-on

---

## 📝 Your URLs (Save These!)

After deployment, you'll have:

```
Backend: https://winadeal-backend.onrender.com
Admin: https://winadeal-admin.onrender.com
Vendor: https://winadeal-vendor.onrender.com
Customer: https://winadeal-customer.onrender.com
Delivery: https://winadeal-delivery.onrender.com
```

---

## 🎉 Done!

**Total Time**: ~20-30 minutes  
**Total Cost**: $0 (FREE!)  
**Your app is LIVE!** 🚀

---

**Questions?** Check `RENDER_DEPLOYMENT.md` for detailed guide!
