# Render Deployment Guide - WinADeal

## Why Render?

✅ **Free Tier** - Great for testing  
✅ **Simple Setup** - Easier than Railway/DigitalOcean  
✅ **Auto-Deploy** - Deploys on git push  
✅ **Free PostgreSQL** - Included in free tier  
✅ **Free SSL** - Automatic HTTPS  

---

## Deployment Architecture

```
Render Project: WinADeal
├── Backend API (Web Service) - Free/$7/month
├── PostgreSQL Database - Free
├── Admin Panel (Static Site) - Free
├── Vendor Panel (Static Site) - Free
├── Customer Web (Static Site) - Free
└── Delivery Web (Static Site) - Free
```

**Total Cost**: FREE (or $7/month for faster backend)

---

## Step-by-Step Deployment

### 1. Create Render Account

1. Go to: https://render.com
2. Click "Get Started for Free"
3. Sign up with GitHub (easiest)
4. Authorize Render to access your repositories

---

### 2. Create PostgreSQL Database (FREE!)

1. Click "New +" → "PostgreSQL"
2. Configure:
   ```
   Name: winadeal-db
   Database: winadeal
   User: winadeal
   Region: Oregon (or closest to you)
   Plan: Free
   ```
3. Click "Create Database"
4. Wait 1-2 minutes for provisioning
5. **Copy Internal Database URL** (starts with `postgres://`)
   - You'll need this for backend

---

### 3. Deploy Backend API

1. Click "New +" → "Web Service"
2. Connect repository: `tararajc-gif/winadeal`
3. Configure:

```yaml
Name: winadeal-backend
Region: Oregon (same as database)
Branch: main
Root Directory: backend  ← CRITICAL!
Runtime: Node
Build Command: npm install && npx prisma generate && npm run build
Start Command: npm run start
Plan: Free (or Starter $7/month for better performance)
```

4. **Add Environment Variables**:

Click "Advanced" → "Add Environment Variable":

```env
NODE_ENV=production
PORT=10000

# Database - Use Internal Database URL from Step 2
DATABASE_URL=<paste Internal Database URL>

# JWT Secrets - Generate secure random strings
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-change-this
JWT_REFRESH_SECRET=your-different-secret-refresh-key-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# OTP
OTP_EXPIRES_IN=10

# CORS (will update after frontend deployment)
CORS_ORIGIN=*
```

**Generate Secrets:**
```bash
# Run in terminal to generate secure secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

5. Click "Create Web Service"
6. Wait for deployment (5-10 minutes)
7. **Copy the URL** (e.g., `https://winadeal-backend.onrender.com`)

---

### 4. Run Database Migration

After backend deploys successfully:

1. Go to backend service
2. Click "Shell" tab (or use "Manual Deploy" → "Clear build cache & deploy")
3. In the shell, run:
   ```bash
   npx prisma db push
   ```
4. Wait for "Migration complete"

---

### 5. Deploy Admin Panel

1. Click "New +" → "Static Site"
2. Connect repository: `tararajc-gif/winadeal`
3. Configure:

```yaml
Name: winadeal-admin
Branch: main
Root Directory: admin-panel  ← CRITICAL!
Build Command: npm install && npm run build
Publish Directory: dist
```

4. **Add Environment Variable**:
```env
VITE_API_URL=https://winadeal-backend.onrender.com/api/v1
```
(Replace with your actual backend URL from Step 3)

5. Click "Create Static Site"

---

### 6. Deploy Vendor Panel

1. Click "New +" → "Static Site"
2. Connect repository: `tararajc-gif/winadeal`
3. Configure:

```yaml
Name: winadeal-vendor
Branch: main
Root Directory: vendor-panel  ← CRITICAL!
Build Command: npm install && npm run build
Publish Directory: dist
```

4. **Add Environment Variable**:
```env
VITE_API_URL=https://winadeal-backend.onrender.com/api/v1
```

5. Click "Create Static Site"

---

### 7. Deploy Customer Web

1. Click "New +" → "Static Site"
2. Connect repository: `tararajc-gif/winadeal`
3. Configure:

```yaml
Name: winadeal-customer
Branch: main
Root Directory: customer-web  ← CRITICAL!
Build Command: npm install && npm run build
Publish Directory: dist
```

4. **Add Environment Variable**:
```env
VITE_API_URL=https://winadeal-backend.onrender.com/api/v1
```

5. Click "Create Static Site"

---

### 8. Deploy Delivery Web

1. Click "New +" → "Static Site"
2. Connect repository: `tararajc-gif/winadeal`
3. Configure:

```yaml
Name: winadeal-delivery
Branch: main
Root Directory: delivery-web  ← CRITICAL!
Build Command: npm install && npm run build
Publish Directory: dist
```

4. **Add Environment Variable**:
```env
VITE_API_URL=https://winadeal-backend.onrender.com/api/v1
```

5. Click "Create Static Site"

---

### 9. Update CORS in Backend

After all frontends are deployed:

1. Go to backend service → Environment
2. Update `CORS_ORIGIN` with all frontend URLs:
   ```env
   CORS_ORIGIN=https://winadeal-admin.onrender.com,https://winadeal-vendor.onrender.com,https://winadeal-customer.onrender.com,https://winadeal-delivery.onrender.com
   ```
3. Click "Save Changes"
4. Render will auto-redeploy

---

## Render.yaml (Optional - Auto Configuration)

Create `render.yaml` in repository root for automatic setup:

```yaml
services:
  # Backend API
  - type: web
    name: winadeal-backend
    runtime: node
    region: oregon
    plan: free
    branch: main
    rootDir: backend
    buildCommand: npm install && npx prisma generate && npm run build
    startCommand: npm run start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: winadeal-db
          property: connectionString
      - key: JWT_SECRET
        generateValue: true
      - key: JWT_REFRESH_SECRET
        generateValue: true
      - key: CORS_ORIGIN
        value: "*"

  # Admin Panel
  - type: web
    name: winadeal-admin
    runtime: static
    region: oregon
    plan: free
    branch: main
    rootDir: admin-panel
    buildCommand: npm install && npm run build
    staticPublishPath: dist
    envVars:
      - key: VITE_API_URL
        value: https://winadeal-backend.onrender.com/api/v1

  # Vendor Panel
  - type: web
    name: winadeal-vendor
    runtime: static
    region: oregon
    plan: free
    branch: main
    rootDir: vendor-panel
    buildCommand: npm install && npm run build
    staticPublishPath: dist
    envVars:
      - key: VITE_API_URL
        value: https://winadeal-backend.onrender.com/api/v1

  # Customer Web
  - type: web
    name: winadeal-customer
    runtime: static
    region: oregon
    plan: free
    branch: main
    rootDir: customer-web
    buildCommand: npm install && npm run build
    staticPublishPath: dist
    envVars:
      - key: VITE_API_URL
        value: https://winadeal-backend.onrender.com/api/v1

  # Delivery Web
  - type: web
    name: winadeal-delivery
    runtime: static
    region: oregon
    plan: free
    branch: main
    rootDir: delivery-web
    buildCommand: npm install && npm run build
    staticPublishPath: dist
    envVars:
      - key: VITE_API_URL
        value: https://winadeal-backend.onrender.com/api/v1

databases:
  - name: winadeal-db
    plan: free
    region: oregon
```

---

## Important Notes

### Free Tier Limitations:

1. **Backend spins down after 15 minutes of inactivity**
   - First request after inactivity takes 30-60 seconds
   - Upgrade to Starter ($7/month) for always-on

2. **Database**:
   - Free tier: 90 days, then expires
   - Upgrade to Starter ($7/month) for permanent database

3. **Build Minutes**:
   - 500 build minutes/month on free tier
   - Usually enough for testing

### Upgrade Recommendations:

For production:
- **Backend**: Starter ($7/month) - Always on, faster
- **Database**: Starter ($7/month) - Permanent, backups
- **Frontends**: Keep free (static sites are always fast)

**Total Production Cost**: ~$14/month

---

## Post-Deployment Checklist

- [ ] PostgreSQL database created
- [ ] Backend deployed with correct root directory
- [ ] Database migration completed (`npx prisma db push`)
- [ ] All 4 frontend apps deployed
- [ ] Environment variables set correctly
- [ ] CORS updated with all frontend URLs
- [ ] Test admin login
- [ ] Test vendor registration
- [ ] Test customer browsing
- [ ] Test delivery partner login

---

## Testing Your Deployment

### 1. Test Backend:
```bash
curl https://winadeal-backend.onrender.com/api/v1/health
```
Should return: `{"status":"ok"}`

### 2. Test Admin Panel:
- URL: `https://winadeal-admin.onrender.com`
- Login: 9876543210 / 123456

### 3. Test Vendor Panel:
- URL: `https://winadeal-vendor.onrender.com`
- Register new vendor

### 4. Test Customer Web:
- URL: `https://winadeal-customer.onrender.com`
- Browse shops

### 5. Test Delivery Web:
- URL: `https://winadeal-delivery.onrender.com`
- Register delivery partner

---

## Troubleshooting

### Issue: "Build failed"
**Solution**: 
- Check build logs
- Ensure `Root Directory` is set correctly
- Verify `package.json` exists in root directory

### Issue: "Prisma Client not generated"
**Solution**: 
- Add `npx prisma generate` to build command
- Build command should be: `npm install && npx prisma generate && npm run build`

### Issue: "Database connection failed"
**Solution**:
- Use **Internal Database URL** (not External)
- Internal URL works within Render network (faster, free)

### Issue: "CORS error"
**Solution**:
- Update CORS_ORIGIN with all frontend URLs
- Separate with commas, no spaces

### Issue: "Backend is slow"
**Solution**:
- Free tier spins down after 15 min inactivity
- Upgrade to Starter ($7/month) for always-on

---

## Custom Domains (Optional)

1. Go to service → Settings → Custom Domain
2. Add your domain (e.g., `api.winadeal.com`)
3. Update DNS records:
   ```
   Type: CNAME
   Name: api
   Value: winadeal-backend.onrender.com
   ```
4. Render provisions SSL automatically (free)

---

## Monitoring

Render provides:
- **Logs**: Real-time logs for each service
- **Metrics**: CPU, Memory, Request count
- **Alerts**: Email notifications for failures
- **Deploy History**: Rollback to previous versions

---

## Auto-Deploy

Render automatically deploys when you push to GitHub:

1. Make changes locally
2. Commit and push to GitHub
3. Render detects changes
4. Auto-builds and deploys
5. Live in 2-5 minutes!

---

## Cost Comparison

### Free Tier (Testing):
- Backend: Free (spins down)
- Database: Free (90 days)
- 4 Frontends: Free
- **Total: FREE**

### Production (Recommended):
- Backend: $7/month (always-on)
- Database: $7/month (permanent)
- 4 Frontends: Free
- **Total: $14/month**

### vs Other Platforms:
- Railway: ~$8/month minimum
- DigitalOcean: ~$32/month
- Heroku: ~$25/month
- **Render: $0-14/month** ✅ Best value!

---

## Advantages of Render

✅ **Simplest Setup** - Just set root directory  
✅ **Free Tier** - Perfect for testing  
✅ **Auto-Deploy** - Push to deploy  
✅ **Free SSL** - HTTPS automatic  
✅ **Free PostgreSQL** - 90 days free  
✅ **No Credit Card** - For free tier  
✅ **Great Docs** - Easy to follow  

---

## Next Steps

1. ✅ Sign up at https://render.com
2. ✅ Create PostgreSQL database
3. ✅ Deploy backend (set root directory!)
4. ✅ Run database migration
5. ✅ Deploy 4 frontends
6. ✅ Update CORS
7. ✅ Test everything!

**Estimated Time**: 20-30 minutes 🚀

---

**Ready to deploy?** Render is the easiest platform for your monorepo! 🎉
