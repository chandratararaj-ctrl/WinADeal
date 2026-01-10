---
description: Fix Coolify Deployment "No Available Server" Error
---

# Troubleshoot Coolify Deployment Issues

This guide helps fix the "no available server" error when accessing WinADeal deployed via Coolify on Azure.

## Problem
Mobile devices show "no available server" error when accessing `42.10.sslip.io` even though Azure NSG ports 80 and 443 are open.

---

## Step 1: SSH into Azure VM

```bash
# Replace with your actual Azure public IP
ssh azureuser@42.10.xxx.xxx
```

---

## Step 2: Run Status Check Script

```bash
# Download and run the status checker
curl -o check-status.sh https://raw.githubusercontent.com/YOUR_USERNAME/WinADeal/main/check-coolify-status.sh
chmod +x check-status.sh
./check-status.sh
```

**Or manually check:**

```bash
# Check all Docker containers
docker ps -a

# Check specifically for WinADeal containers
docker ps -a | grep winadeal
```

---

## Step 3: Identify Container Status

Look for your WinADeal containers. They should show **STATUS: Up** ✅

If you see:
- ❌ **Exited** - Container crashed
- ❌ **Restarting** - Container keeps crashing
- ❌ **Not found** - Deployment failed

---

## Step 4: Check Container Logs

```bash
# List all containers to find the name/ID
docker ps -a

# View logs of your backend container (replace CONTAINER_NAME)
docker logs CONTAINER_NAME --tail 50

# Follow logs in real-time
docker logs CONTAINER_NAME -f
```

**Common errors to look for:**
- Database connection errors
- Port already in use
- Missing environment variables
- Build failures

---

## Step 5: Check Coolify Proxy (Traefik/Nginx)

```bash
# Check if Coolify proxy is running
docker ps | grep coolify-proxy

# Check proxy logs
docker logs coolify-proxy --tail 50

# Restart Coolify proxy if needed
docker restart coolify-proxy
```

---

## Step 6: Access Coolify Dashboard

1. Open browser: `http://YOUR_AZURE_IP:8000` or your Coolify domain
2. Login to Coolify
3. Go to **Projects** → **WinADeal**
4. Check deployment status

**In Coolify Dashboard, check:**
- ✅ Deployments are "Running"
- ✅ Health checks are passing
- ✅ Domains/URLs are correctly configured
- ✅ Environment variables are set

---

## Step 7: Redeploy in Coolify (If Containers Stopped)

**In Coolify Dashboard:**

1. Go to your WinADeal project
2. Click on the **Backend** service
3. Click **Deploy** or **Redeploy**
4. Wait for build to complete
5. Check logs for any errors

**Repeat for all services:**
- Backend API
- Customer Web
- Admin Panel
- Vendor Panel
- Delivery Panel

---

## Step 8: Verify Environment Variables in Coolify

**Critical Variables to Check:**

### Backend Service
```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:password@postgres:5432/winadeal
JWT_SECRET=your_secret_here
CORS_ORIGIN=https://42.10.sslip.io,http://42.10.sslip.io
```

### Frontend Services (Vite apps)
```env
VITE_API_URL=https://42.10.sslip.io/api/v1
```

**Fix if needed:**
1. In Coolify → Service → **Environment**
2. Update variables
3. Click **Save**
4. Redeploy the service

---

## Step 9: Check Database Connection

```bash
# Check if PostgreSQL container is running
docker ps | grep postgres

# Test database connection
docker exec -it $(docker ps -q -f name=postgres) psql -U winadeal_user -d winadeal -c "SELECT 1;"

# View database logs
docker logs $(docker ps -q -f name=postgres) --tail 30
```

---

## Step 10: Verify Domain Configuration in Coolify

**In Coolify Dashboard:**

1. Go to your service (e.g., Backend)
2. Check **Domains** section
3. Should have entries like:
   - `42.10.sslip.io` (or your sslip.io domain)
   - `https://42.10.sslip.io` for HTTPS

**Enable HTTPS:**
1. In service settings → **Domains**
2. Enable **Generate SSL Certificate**
3. Wait for certificate generation
4. Redeploy

---

## Step 11: Restart All Services

**Option A: Via Coolify Dashboard**
1. Go to each service
2. Click **Restart**
3. Wait for "Running" status

**Option B: Via Docker**
```bash
# Restart all WinADeal containers
docker restart $(docker ps -q -f name=winadeal)

# Restart Coolify proxy
docker restart coolify-proxy

# Verify all are running
docker ps | grep -E "winadeal|coolify"
```

---

## Step 12: Test API Endpoint

```bash
# Test from inside the VM
curl http://localhost:5000/api/v1/health

# Test via Coolify proxy
curl http://localhost/api/v1/health

# Test from public IP
curl http://42.10.xxx.xxx/api/v1/health

# Test HTTPS (if configured)
curl https://42.10.sslip.io/api/v1/health
```

**Expected response:**
```json
{"status":"ok","message":"Server is running"}
```

---

## Step 13: Check Port Mappings

```bash
# Check which ports are exposed
docker ps --format "table {{.Names}}\t{{.Ports}}"

# Check if Coolify proxy is listening on 80/443
netstat -tlnp | grep -E ":80|:443"
```

**You should see:**
- Coolify proxy on port 80 (HTTP)
- Coolify proxy on port 443 (HTTPS)
- Backend container on internal port 5000

---

## Step 14: Common Coolify Issues & Fixes

### Issue 1: Container Keeps Restarting
**Cause:** Build errors, missing dependencies, wrong start command

**Fix:**
```bash
# Check container logs
docker logs CONTAINER_NAME --tail 100

# Common fixes in Coolify:
# - Update build pack to nixpacks or dockerfile
# - Set correct start command: "npm start" or "node dist/main.js"
# - Install all dependencies in Dockerfile
```

### Issue 2: CORS Errors
**Cause:** Backend not configured for frontend domain

**Fix in Coolify:**
1. Backend service → Environment
2. Update: `CORS_ORIGIN=https://42.10.sslip.io,http://42.10.sslip.io`
3. Redeploy

### Issue 3: Database Connection Failed
**Cause:** Wrong DATABASE_URL or PostgreSQL not running

**Fix:**
```bash
# Check PostgreSQL status
docker ps | grep postgres

# Get correct database URL from Coolify
# Format: postgresql://user:pass@postgres_container_name:5432/dbname

# Update in Coolify → Backend → Environment
DATABASE_URL=postgresql://winadeal:password@postgresql:5432/winadeal
```

### Issue 4: 502 Bad Gateway
**Cause:** Backend crashed or not responding

**Fix:**
```bash
# Restart backend container
docker restart $(docker ps -q -f name=winadeal-backend)

# Check if it stays running
watch -n 2 'docker ps | grep winadeal'
```

### Issue 5: SSL Certificate Issues
**Cause:** Let's Encrypt rate limit or configuration error

**Fix in Coolify:**
1. Service → Domains
2. Disable SSL temporarily
3. Test with HTTP first
4. Re-enable SSL after HTTP works

---

## Step 15: Enable Coolify Logs

**In Coolify Dashboard:**
1. Go to **Settings** → **Configuration**
2. Enable **Debug mode**
3. This shows more detailed logs

**Or via Docker:**
```bash
# View Coolify application logs
docker logs $(docker ps -q -f name=coolify) -f
```

---

## Step 16: Check Memory & Resources

```bash
# Check memory usage
free -h

# Check disk space
df -h

# Check Docker resource usage
docker stats --no-stream

# Clear unused Docker resources
docker system prune -a --volumes
```

**If out of memory:**
```bash
# Restart Docker daemon
sudo systemctl restart docker

# Or restart the entire VM
sudo reboot
```

---

## Step 17: Update Coolify Domain URLs

If your frontend can't reach the backend:

**In Coolify → Frontend Services:**
1. Update environment: `VITE_API_URL=https://42.10.sslip.io/api/v1`
2. Redeploy frontend
3. Clear browser cache
4. Test again

---

## Verification Checklist

After troubleshooting, verify:

- [ ] All containers show "Up" status: `docker ps`
- [ ] Coolify proxy is running
- [ ] PostgreSQL is running
- [ ] Backend responds: `curl http://localhost:5000/api/v1/health`
- [ ] Can access via public IP: `http://YOUR_IP`
- [ ] Can access via sslip.io: `http://42.10.sslip.io`
- [ ] HTTPS works (if configured): `https://42.10.sslip.io`
- [ ] Mobile device can access the app

---

## Quick Recovery Commands

```bash
# Complete restart
docker restart $(docker ps -aq)
docker restart coolify-proxy

# Force redeploy in Coolify
# (Use Coolify dashboard - click "Redeploy" on each service)

# Check everything is running
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# View all logs
docker logs $(docker ps -q -f name=winadeal-backend) --tail 50
```

---

## Still Not Working?

**Collect diagnostic information:**

```bash
echo "=== Docker Containers ===" > /tmp/coolify-debug.log
docker ps -a >> /tmp/coolify-debug.log
echo "\n=== Backend Logs ===" >> /tmp/coolify-debug.log
docker logs $(docker ps -q -f name=winadeal-backend) --tail 100 >> /tmp/coolify-debug.log
echo "\n=== Coolify Proxy Logs ===" >> /tmp/coolify-debug.log
docker logs coolify-proxy --tail 50 >> /tmp/coolify-debug.log
echo "\n=== Network Ports ===" >> /tmp/coolify-debug.log
netstat -tlnp >> /tmp/coolify-debug.log
echo "\n=== System Resources ===" >> /tmp/coolify-debug.log
free -h >> /tmp/coolify-debug.log
df -h >> /tmp/coolify-debug.log

# View the debug log
cat /tmp/coolify-debug.log
```

---

## Useful Coolify Commands

```bash
# View all Coolify containers
docker ps -a | grep coolify

# Restart Coolify itself
docker restart $(docker ps -q -f name=coolify)

# Update Coolify
cd /data/coolify
docker compose pull
docker compose up -d --force-recreate

# View Coolify configuration
cat /data/coolify/.env
```

---

**Pro Tip:** The most common issue is containers being in "Exited" state. Always check `docker ps -a` first and restart stopped containers!
