---
description: Troubleshoot Mobile Device Access Issues
---

# Troubleshoot "No Available Server" Error on Mobile

This workflow helps you diagnose and fix the "no available server" error when accessing your Azure-deployed WinADeal application from a mobile device.

## Problem Summary
After allowing HTTPS in Azure, mobile devices show "no available server" when accessing `42.10.sslip.io`

---

## Step 1: Verify Azure Network Security Group (NSG) Rules

**In Azure Portal:**

1. Go to your VM → **Networking** → **Network Security Group**
2. Check if these inbound rules exist:

   **HTTP Rule:**
   - Port: 80
   - Protocol: TCP
   - Action: Allow
   - Priority: 100

   **HTTPS Rule:**
   - Port: 443
   - Protocol: TCP
   - Action: Allow
   - Priority: 110

3. If any are missing, click **Add inbound port rule** and create them

---

## Step 2: Check Backend Service Status

```bash
# SSH into your Azure VM
ssh azureuser@42.10.xxx.xxx

# Check if backend is running
pm2 status

# If not running, start it
pm2 start ecosystem.config.js

# Check logs for errors
pm2 logs --lines 50
```

---

## Step 3: Check Nginx Status and Configuration

```bash
# Check if Nginx is running
sudo systemctl status nginx

# If not running, start it
sudo systemctl start nginx
sudo systemctl enable nginx

# Test Nginx configuration
sudo nginx -t

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

---

## Step 4: Verify Firewall Settings (UFW)

```bash
# Check UFW status
sudo ufw status

# Ensure ports 80 and 443 are allowed
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 'Nginx Full'

# Reload UFW
sudo ufw reload
```

---

## Step 5: Test Backend API Locally

```bash
# Test if backend API responds
curl http://localhost:5000/api/v1/health

# Test if Nginx can proxy to backend
curl http://localhost/api/v1/health

# Test from public IP
curl http://42.10.xxx.xxx/api/v1/health
```

---

## Step 6: Check SSL/HTTPS Configuration

If you've set up HTTPS, verify the SSL certificate:

```bash
# Check if Certbot/Let's Encrypt is configured
sudo certbot certificates

# If SSL is configured, check Nginx HTTPS config
sudo nano /etc/nginx/sites-available/winadeal

# Make sure it has:
# - listen 443 ssl;
# - ssl_certificate paths
# - Redirect from HTTP to HTTPS
```

---

## Step 7: Verify Coolify Deployment Status

If using Coolify:

```bash
# Check Coolify logs
docker ps

# Check if WinADeal containers are running
docker ps | grep winadeal

# Check container logs
docker logs <container_name>

# Restart Coolify services
cd /data/coolify
docker-compose restart
```

---

## Step 8: Check DNS Resolution

From your mobile device or another computer:

```bash
# Ping the sslip.io domain (from your mobile device's browser)
# Open: http://42.10.sslip.io

# Or use online tools:
# https://www.whatsmydns.net/
# Enter: 42.10.sslip.io
```

**Note:** sslip.io automatically resolves to the IP in the subdomain, so `42.10.sslip.io` should point to `42.10.x.x`

---

## Step 9: Test with Direct IP Access

From your mobile device:

1. Try accessing directly via IP: `http://YOUR_AZURE_PUBLIC_IP`
2. If this works but sslip.io doesn't, the issue is with DNS
3. If neither works, the issue is with your Azure NSG or backend

---

## Step 10: Common Fixes

### Fix 1: Backend Not Running
```bash
# Restart PM2 services
pm2 restart all

# Check if backend started successfully
pm2 logs winadeal-backend --lines 20
```

### Fix 2: Nginx Not Configured for HTTPS
```bash
# Edit Nginx config
sudo nano /etc/nginx/sites-available/winadeal

# Add HTTPS server block:
server {
    listen 443 ssl;
    server_name 42.10.sslip.io YOUR_AZURE_PUBLIC_IP;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # Rest of your config...
}

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

### Fix 3: CORS Issues
```bash
# Check backend CORS settings
cd /var/www/winadeal/backend
cat .env | grep CORS

# Update CORS_ORIGIN to include your sslip.io domain
nano .env

# Add:
CORS_ORIGIN=http://YOUR_IP,https://YOUR_IP,http://42.10.sslip.io,https://42.10.sslip.io

# Restart backend
pm2 restart winadeal-backend
```

### Fix 4: Azure NSG Not Updated
1. **Azure Portal** → Your VM → **Networking**
2. Double-check **all** inbound rules
3. Ensure **Source: Any** and **Destination: Any**
4. Wait 2-3 minutes for changes to propagate

---

## Step 11: Generate Self-Signed SSL Certificate (Quick Fix)

If you need HTTPS immediately without a domain:

```bash
# Generate self-signed certificate
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/nginx-selfsigned.key \
  -out /etc/ssl/certs/nginx-selfsigned.crt

# Update Nginx config
sudo nano /etc/nginx/sites-available/winadeal

# Add SSL configuration:
server {
    listen 443 ssl;
    server_name YOUR_IP 42.10.sslip.io;
    
    ssl_certificate /etc/ssl/certs/nginx-selfsigned.crt;
    ssl_certificate_key /etc/ssl/private/nginx-selfsigned.key;
    
    # ... rest of your existing config
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name YOUR_IP 42.10.sslip.io;
    return 301 https://$server_name$request_uri;
}

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

**Note:** Browsers will show a security warning for self-signed certificates. You'll need to manually accept it.

---

## Step 12: Get Real SSL Certificate (Recommended)

For production, use Let's Encrypt:

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d 42.10.sslip.io

# Auto-renewal
sudo certbot renew --dry-run
```

---

## Verification Checklist

After applying fixes, verify:

- [ ] Backend API responds: `curl http://localhost:5000/api/v1/health`
- [ ] Nginx proxies correctly: `curl http://localhost/api/v1/health`
- [ ] Public IP works: `curl http://YOUR_PUBLIC_IP/api/v1/health`
- [ ] Azure NSG has ports 80 and 443 open
- [ ] UFW allows Nginx Full
- [ ] PM2 shows backend as "online"
- [ ] Mobile device can access via IP: `http://YOUR_PUBLIC_IP`
- [ ] Mobile device can access via domain: `http://42.10.sslip.io`

---

## Still Not Working?

If none of the above works, gather diagnostic information:

```bash
# Collect all logs
echo "=== PM2 Status ===" > /tmp/debug.log
pm2 status >> /tmp/debug.log
echo "\n=== PM2 Logs ===" >> /tmp/debug.log
pm2 logs --lines 50 --nostream >> /tmp/debug.log
echo "\n=== Nginx Status ===" >> /tmp/debug.log
sudo systemctl status nginx >> /tmp/debug.log
echo "\n=== Nginx Error Log ===" >> /tmp/debug.log
sudo tail -50 /var/log/nginx/error.log >> /tmp/debug.log
echo "\n=== UFW Status ===" >> /tmp/debug.log
sudo ufw status verbose >> /tmp/debug.log
echo "\n=== Docker Containers ===" >> /tmp/debug.log
docker ps -a >> /tmp/debug.log

# View the debug log
cat /tmp/debug.log
```

Share this log for further diagnosis.

---

**Most Common Issue:** The backend service is not running or crashed. Always check `pm2 status` and `pm2 logs` first!
