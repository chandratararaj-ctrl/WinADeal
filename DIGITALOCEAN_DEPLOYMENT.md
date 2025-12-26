# DigitalOcean App Platform Deployment Guide

## Issue: "No components detected"

**Cause**: Your project is a monorepo with multiple apps. DigitalOcean needs to know which directory contains each app.

**Solution**: Configure each app separately with its source directory.

---

## Deployment Architecture

```
DigitalOcean App: WinADeal
├── Backend API (Node.js) - /backend
├── PostgreSQL Database (Managed)
├── Admin Panel (Static) - /admin-panel
├── Vendor Panel (Static) - /vendor-panel
├── Customer Web (Static) - /customer-web
└── Delivery Web (Static) - /delivery-web
```

---

## Step-by-Step Deployment

### 1. Create DigitalOcean Account

1. Go to: https://www.digitalocean.com
2. Sign up (get $200 credit for 60 days with referral)
3. Verify your account

### 2. Create PostgreSQL Database

1. Click "Create" → "Databases"
2. Choose:
   - **Engine**: PostgreSQL 15
   - **Plan**: Basic ($15/month)
   - **Datacenter**: Choose closest to your users
3. Click "Create Database Cluster"
4. Wait for provisioning (2-3 minutes)
5. **Copy connection details** (you'll need these)

### 3. Deploy Backend API

#### A. Create App from GitHub

1. Go to: https://cloud.digitalocean.com/apps
2. Click "Create App"
3. Choose "GitHub" as source
4. Select repository: `tararajc-gif/winadeal`
5. Click "Next"

#### B. Configure Backend Component

**IMPORTANT**: Set the source directory!

```yaml
Name: winadeal-backend
Type: Web Service
Source Directory: backend  # ← THIS IS CRITICAL!
Build Command: npm install && npx prisma generate && npm run build
Run Command: npm run start
HTTP Port: 5000
Instance Size: Basic ($5/month)
```

#### C. Add Environment Variables

Click "Edit" on the backend component → Environment Variables:

```env
NODE_ENV=production
PORT=5000

# Database (from your PostgreSQL cluster)
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# JWT Secrets (generate secure random strings)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# OTP
OTP_EXPIRES_IN=10

# CORS (will update after frontend deployment)
CORS_ORIGIN=*
```

**To get DATABASE_URL**:
1. Go to your PostgreSQL database
2. Click "Connection Details"
3. Copy "Connection String"
4. Add `?sslmode=require` at the end

#### D. Add Build Command

In backend component settings:
- **Build Command**: `npm install && npx prisma generate && npm run build`
- **Run Command**: `npm run start`

### 4. Deploy Frontend Apps

For each frontend (Admin, Vendor, Customer, Delivery):

#### A. Add Component

1. In your app, click "Create" → "Component"
2. Choose "Static Site"
3. Configure:

**Admin Panel:**
```yaml
Name: admin-panel
Type: Static Site
Source Directory: admin-panel  # ← CRITICAL!
Build Command: npm install && npm run build
Output Directory: dist
```

**Vendor Panel:**
```yaml
Name: vendor-panel
Type: Static Site
Source Directory: vendor-panel  # ← CRITICAL!
Build Command: npm install && npm run build
Output Directory: dist
```

**Customer Web:**
```yaml
Name: customer-web
Type: Static Site
Source Directory: customer-web  # ← CRITICAL!
Build Command: npm install && npm run build
Output Directory: dist
```

**Delivery Web:**
```yaml
Name: delivery-web
Type: Static Site
Source Directory: delivery-web  # ← CRITICAL!
Build Command: npm install && npm run build
Output Directory: dist
```

#### B. Add Environment Variables for Each Frontend

For each frontend component, add:

```env
VITE_API_URL=https://winadeal-backend-xxxxx.ondigitalocean.app/api/v1
```

**Replace `xxxxx` with your actual backend URL** (you'll get this after backend deploys)

### 5. Update CORS in Backend

After all frontends are deployed:

1. Go to backend component → Settings → Environment Variables
2. Update `CORS_ORIGIN`:
   ```env
   CORS_ORIGIN=https://admin-panel-xxxxx.ondigitalocean.app,https://vendor-panel-xxxxx.ondigitalocean.app,https://customer-web-xxxxx.ondigitalocean.app,https://delivery-web-xxxxx.ondigitalocean.app
   ```

### 6. Run Database Migration

After backend is deployed:

1. Go to backend component → Console
2. Run:
   ```bash
   npx prisma db push
   ```

---

## Alternative: Use App Spec YAML

Create a file `.do/app.yaml` in your repository root:

```yaml
name: winadeal
region: nyc

databases:
  - name: winadeal-db
    engine: PG
    version: "15"
    size: basic-xs

services:
  # Backend API
  - name: backend
    source_dir: backend
    github:
      repo: tararajc-gif/winadeal
      branch: main
    build_command: npm install && npx prisma generate && npm run build
    run_command: npm run start
    http_port: 5000
    instance_count: 1
    instance_size_slug: basic-xxs
    envs:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        value: ${winadeal-db.DATABASE_URL}
      - key: JWT_SECRET
        value: your-secret-here
      - key: JWT_REFRESH_SECRET
        value: your-refresh-secret-here
      - key: CORS_ORIGIN
        value: "*"

  # Admin Panel
  - name: admin-panel
    source_dir: admin-panel
    github:
      repo: tararajc-gif/winadeal
      branch: main
    build_command: npm install && npm run build
    output_dir: dist
    static_sites:
      - name: admin
    envs:
      - key: VITE_API_URL
        value: ${backend.PUBLIC_URL}/api/v1

  # Vendor Panel
  - name: vendor-panel
    source_dir: vendor-panel
    github:
      repo: tararajc-gif/winadeal
      branch: main
    build_command: npm install && npm run build
    output_dir: dist
    static_sites:
      - name: vendor
    envs:
      - key: VITE_API_URL
        value: ${backend.PUBLIC_URL}/api/v1

  # Customer Web
  - name: customer-web
    source_dir: customer-web
    github:
      repo: tararajc-gif/winadeal
      branch: main
    build_command: npm install && npm run build
    output_dir: dist
    static_sites:
      - name: customer
    envs:
      - key: VITE_API_URL
        value: ${backend.PUBLIC_URL}/api/v1

  # Delivery Web
  - name: delivery-web
    source_dir: delivery-web
    github:
      repo: tararajc-gif/winadeal
      branch: main
    build_command: npm install && npm run build
    output_dir: dist
    static_sites:
      - name: delivery
    envs:
      - key: VITE_API_URL
        value: ${backend.PUBLIC_URL}/api/v1
```

---

## Troubleshooting

### Error: "No components detected"
**Solution**: Set the **Source Directory** for each component!
- Backend: `backend`
- Admin: `admin-panel`
- Vendor: `vendor-panel`
- Customer: `customer-web`
- Delivery: `delivery-web`

### Error: "Build failed"
**Solution**: Check build logs and ensure:
- `package.json` exists in source directory
- All dependencies are listed
- Build command is correct

### Error: "Prisma Client not generated"
**Solution**: Add to build command:
```bash
npm install && npx prisma generate && npm run build
```

### Error: "Database connection failed"
**Solution**: 
- Ensure DATABASE_URL ends with `?sslmode=require`
- Check database is in same region as app

---

## Cost Estimation

### DigitalOcean Pricing:
- **PostgreSQL Database**: $15/month (Basic)
- **Backend API**: $5/month (Basic)
- **Admin Panel**: $3/month (Static)
- **Vendor Panel**: $3/month (Static)
- **Customer Web**: $3/month (Static)
- **Delivery Web**: $3/month (Static)
- **Total**: ~$32/month

### Free Trial:
- $200 credit for 60 days
- Enough for 6+ months of testing

---

## Post-Deployment Checklist

- [ ] PostgreSQL database created
- [ ] Backend API deployed with correct source directory
- [ ] Database migrations completed
- [ ] All 4 frontend apps deployed
- [ ] Environment variables set correctly
- [ ] CORS configured with all frontend URLs
- [ ] Custom domains configured (optional)
- [ ] SSL certificates enabled (automatic)
- [ ] Test admin login
- [ ] Test vendor registration
- [ ] Test customer browsing

---

## Custom Domains (Optional)

1. Go to app → Settings → Domains
2. Add custom domain
3. Update DNS records:
   ```
   Type: CNAME
   Name: api (or www)
   Value: your-app.ondigitalocean.app
   ```
4. DigitalOcean will provision SSL automatically

---

## Monitoring & Logs

DigitalOcean provides:
- **Real-time logs** for each component
- **Metrics**: CPU, Memory, Bandwidth
- **Alerts**: Set up email/Slack notifications
- **Deployment history**: Rollback if needed

---

## Backup Strategy

1. **Database Backups**:
   - DigitalOcean auto-backups daily
   - Retention: 7 days (Basic plan)
   - Manual backups available

2. **Code Backups**:
   - Already on GitHub ✅
   - DigitalOcean deploys from GitHub

---

## Next Steps

1. ✅ Create DigitalOcean account
2. ✅ Create PostgreSQL database
3. ✅ Deploy backend (set source directory!)
4. ✅ Deploy 4 frontends (set source directories!)
5. ✅ Configure environment variables
6. ✅ Run database migrations
7. ✅ Test deployment

---

**Ready to deploy?** The key is setting the **Source Directory** for each component! 🚀
