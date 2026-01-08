# WinADeal Azure Deployment Guide

## Azure Free Tier Overview

Azure offers a **B1s VM** in the free tier with:
- **CPU**: 1 vCPU
- **RAM**: 1 GB
- **Storage**: 30 GB SSD (managed disk)
- **Bandwidth**: Limited
- **OS**: Ubuntu 22.04 LTS (recommended)
- **Duration**: 12 months free (750 hours/month)

⚠️ **Important**: The free tier is suitable for **development/testing only**. For production, you'll need to upgrade.

---

## Prerequisites

Before starting, ensure you have:
- [x] Azure account created
- [x] Azure VM (B1s) provisioned with Ubuntu 22.04
- [x] SSH access to your VM
- [x] Public IP address assigned to your VM
- [ ] Domain name (optional, can use IP initially)

---

## Quick Start - Azure VM Access

### 1. Connect to Your Azure VM

```bash
# From your local machine (PowerShell or CMD)
ssh azureuser@YOUR_VM_PUBLIC_IP

# If using SSH key
ssh -i path/to/your/private-key.pem azureuser@YOUR_VM_PUBLIC_IP
```

### 2. Initial VM Setup

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git build-essential
```

---

## Deployment Strategy for Azure Free Tier

Due to the **1GB RAM limitation**, we'll use a **lightweight deployment strategy**:

### Option 1: Backend + Single Frontend (Recommended for Free Tier)
- Run backend API
- Serve ONE frontend app (customer-web recommended)
- Use external database (Azure Database for PostgreSQL free tier)

### Option 2: Backend Only
- Deploy only the backend API
- Use for API testing and mobile app development
- Frontends can be deployed separately on Vercel/Netlify (free)

### Option 3: Full Stack with Swap (Slower but Complete)
- Add swap space to compensate for low RAM
- Deploy all services
- Expect slower performance

---

## Step-by-Step Deployment

### Step 1: Install Node.js

```bash
# Install Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### Step 2: Setup PostgreSQL

**Option A: Local PostgreSQL (Uses VM RAM)**
```bash
sudo apt install -y postgresql postgresql-contrib

# Create database
sudo -u postgres psql
CREATE DATABASE winadeal;
CREATE USER winadeal_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE winadeal TO winadeal_user;
\q
```

**Option B: Azure Database for PostgreSQL (Recommended)**
- Uses Azure's managed database service
- Doesn't consume VM RAM
- Free tier available: 32 GB storage, 1 vCore
- Setup through Azure Portal

### Step 3: Add Swap Space (Important for 1GB RAM)

```bash
# Create 2GB swap file
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make it permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Verify
free -h
```

### Step 4: Clone Your Repository

```bash
# Create application directory
sudo mkdir -p /var/www/winadeal
sudo chown $USER:$USER /var/www/winadeal
cd /var/www/winadeal

# Clone your repository
git clone https://github.com/YOUR_USERNAME/WinADeal.git .

# Or upload files via SCP from your local machine
# scp -r e:\Project\webDevelop\WinADeal azureuser@YOUR_VM_IP:/var/www/winadeal
```

### Step 5: Setup Backend

```bash
cd /var/www/winadeal/backend

# Install dependencies
npm install --production

# Create .env file
cp .env.example .env
nano .env
```

**Backend `.env` Configuration:**
```env
NODE_ENV=production
PORT=5000

# Database - Use your Azure PostgreSQL connection string
DATABASE_URL="postgresql://winadeal_user:password@YOUR_AZURE_DB_HOST:5432/winadeal?sslmode=require"

# Or local PostgreSQL
# DATABASE_URL="postgresql://winadeal_user:your_secure_password@localhost:5432/winadeal"

# JWT Secrets (generate strong random strings)
JWT_SECRET=your_very_long_random_secret_key_here_min_32_chars
JWT_REFRESH_SECRET=your_very_long_random_refresh_secret_key_here_min_32_chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS - Use your Azure VM public IP or domain
CORS_ORIGIN=http://YOUR_VM_PUBLIC_IP,http://YOUR_VM_PUBLIC_IP:3000

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# Optional Services (can be added later)
# RAZORPAY_KEY_ID=
# RAZORPAY_KEY_SECRET=
# GOOGLE_MAPS_API_KEY=
```

```bash
# Run Prisma migrations
npx prisma migrate deploy
npx prisma generate

# Optional: Seed database with initial data
npm run seed
```

### Step 6: Install PM2 Process Manager

```bash
# Install PM2 globally
sudo npm install -g pm2

# Create PM2 ecosystem file
cd /var/www/winadeal
nano ecosystem.config.js
```

**`ecosystem.config.js`:**
```javascript
module.exports = {
  apps: [
    {
      name: 'winadeal-backend',
      cwd: '/var/www/winadeal/backend',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      instances: 1, // Only 1 instance for 1GB RAM
      exec_mode: 'fork', // Use fork mode instead of cluster
      max_memory_restart: '400M', // Restart if exceeds 400MB
      error_file: '/var/www/winadeal/logs/backend-error.log',
      out_file: '/var/www/winadeal/logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
```

```bash
# Create logs directory
mkdir -p /var/www/winadeal/logs

# Start backend with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Run the command that PM2 outputs
```

### Step 7: Build Frontend (Customer Web)

```bash
cd /var/www/winadeal/customer-web

# Create .env file
nano .env
```

**Frontend `.env`:**
```env
VITE_API_URL=http://YOUR_VM_PUBLIC_IP:5000/api/v1
VITE_APP_NAME=WinADeal
# VITE_GOOGLE_MAPS_API_KEY=your_key_here
```

```bash
# Install dependencies and build
npm install
npm run build

# The build output will be in 'dist' folder
```

### Step 8: Install and Configure Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/winadeal
```

**Nginx Configuration:**
```nginx
# Backend API
server {
    listen 80;
    server_name YOUR_VM_PUBLIC_IP;

    # API routes
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeouts for slow connections
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Serve uploads
    location /uploads/ {
        alias /var/www/winadeal/backend/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Customer Web Frontend
    location / {
        root /var/www/winadeal/customer-web/dist;
        try_files $uri $uri/ /index.html;
        index index.html;
    }

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        root /var/www/winadeal/customer-web/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/winadeal /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### Step 9: Configure Azure Network Security Group (Firewall)

In **Azure Portal**:
1. Go to your VM → **Networking** → **Network Security Group**
2. Add **Inbound Port Rules**:
   - **HTTP**: Port 80, Priority 100
   - **HTTPS**: Port 443, Priority 110 (for future SSL)
   - **SSH**: Port 22, Priority 120 (restrict to your IP for security)

**Or via Azure CLI:**
```bash
# Allow HTTP
az vm open-port --resource-group YOUR_RESOURCE_GROUP --name YOUR_VM_NAME --port 80 --priority 100

# Allow HTTPS
az vm open-port --resource-group YOUR_RESOURCE_GROUP --name YOUR_VM_NAME --port 443 --priority 110
```

### Step 10: Setup UFW Firewall (VM Level)

```bash
# Configure UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## Testing Your Deployment

### 1. Test Backend API

```bash
# From your VM
curl http://localhost:5000/api/v1/health

# From your local machine
curl http://YOUR_VM_PUBLIC_IP/api/v1/health
```

### 2. Test Frontend

Open browser and navigate to:
```
http://YOUR_VM_PUBLIC_IP
```

### 3. Check PM2 Status

```bash
pm2 status
pm2 logs winadeal-backend
pm2 monit
```

---

## Memory Optimization for 1GB RAM

### 1. Optimize Node.js Memory

```bash
# Edit ecosystem.config.js
nano /var/www/winadeal/ecosystem.config.js
```

Add to backend app config:
```javascript
node_args: '--max-old-space-size=384' // Limit Node.js to 384MB
```

### 2. Monitor Memory Usage

```bash
# Check memory
free -h

# Monitor processes
htop  # Install with: sudo apt install htop

# PM2 monitoring
pm2 monit
```

### 3. Setup Automatic Restart on High Memory

PM2 will automatically restart if memory exceeds `max_memory_restart: '400M'`

---

## Domain Setup (Optional)

### If you have a domain:

1. **Add DNS A Record:**
   ```
   Type: A
   Name: @
   Value: YOUR_VM_PUBLIC_IP
   TTL: 3600
   ```

2. **Update Nginx config:**
   ```bash
   sudo nano /etc/nginx/sites-available/winadeal
   ```
   
   Change `server_name YOUR_VM_PUBLIC_IP;` to `server_name yourdomain.com;`

3. **Install SSL Certificate:**
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

---

## Backup Strategy

### 1. Database Backup Script

```bash
# Create backup script
nano /var/www/winadeal/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/winadeal"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
PGPASSWORD='your_secure_password' pg_dump -U winadeal_user -h localhost winadeal > $BACKUP_DIR/db_$DATE.sql

# Compress
gzip $BACKUP_DIR/db_$DATE.sql

# Keep only last 3 backups (to save space)
ls -t $BACKUP_DIR/db_*.sql.gz | tail -n +4 | xargs rm -f

echo "Backup completed: db_$DATE.sql.gz"
```

```bash
# Make executable
chmod +x /var/www/winadeal/backup.sh

# Setup cron job (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /var/www/winadeal/backup.sh
```

### 2. Code Backup

```bash
# Backup to Azure Blob Storage (optional)
# Or use Git to push changes regularly
cd /var/www/winadeal
git add .
git commit -m "Production backup"
git push origin main
```

---

## Monitoring & Maintenance

### 1. Setup Log Rotation

```bash
# PM2 log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 3  # Keep only 3 rotated logs
```

### 2. Monitor Disk Space

```bash
# Check disk usage
df -h

# Clean old logs
sudo journalctl --vacuum-time=3d
```

### 3. Regular Maintenance Commands

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs --lines 50

# Restart services
pm2 restart all

# Check Nginx status
sudo systemctl status nginx

# Check system resources
htop
free -h
df -h
```

---

## Troubleshooting

### Issue: Out of Memory

```bash
# Check memory usage
free -h

# Restart PM2 apps
pm2 restart all

# Clear cache
sync; echo 3 | sudo tee /proc/sys/vm/drop_caches
```

### Issue: Backend Not Responding

```bash
# Check PM2 logs
pm2 logs winadeal-backend --lines 100

# Restart backend
pm2 restart winadeal-backend

# Check if port 5000 is listening
sudo netstat -tlnp | grep 5000
```

### Issue: Nginx 502 Bad Gateway

```bash
# Check if backend is running
pm2 status

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

### Issue: Database Connection Failed

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -U winadeal_user -d winadeal -h localhost

# Check DATABASE_URL in .env
cat /var/www/winadeal/backend/.env | grep DATABASE_URL
```

---

## Upgrading from Free Tier

When you're ready to scale:

### Recommended Azure VM Sizes:

1. **B2s** (Development/Small Production)
   - 2 vCPUs, 4 GB RAM
   - ~$30/month
   - Can run all services

2. **B2ms** (Production)
   - 2 vCPUs, 8 GB RAM
   - ~$60/month
   - Comfortable for production

3. **B4ms** (High Traffic)
   - 4 vCPUs, 16 GB RAM
   - ~$120/month
   - Handles high traffic

### Upgrade Steps:
1. Stop VM in Azure Portal
2. Change VM size
3. Start VM
4. Update PM2 config to use more instances
5. Restart services

---

## Deployment Checklist

- [ ] Azure VM provisioned (B1s free tier)
- [ ] SSH access configured
- [ ] Swap space added (2GB)
- [ ] Node.js 20.x installed
- [ ] PostgreSQL setup (local or Azure managed)
- [ ] Repository cloned
- [ ] Backend .env configured
- [ ] Database migrations run
- [ ] PM2 installed and configured
- [ ] Backend running via PM2
- [ ] Frontend built
- [ ] Nginx installed and configured
- [ ] Azure NSG rules configured (ports 80, 443, 22)
- [ ] UFW firewall configured
- [ ] Application accessible via public IP
- [ ] Backup script created
- [ ] Monitoring setup

---

## Cost Breakdown

### Free Tier (12 months)
- **VM**: Free (B1s, 750 hours/month)
- **Storage**: 64 GB free
- **Bandwidth**: 15 GB outbound free/month
- **Public IP**: ~$3/month (not free)
- **Total**: ~$3/month

### After Free Tier Expires
- **B1s VM**: ~$10/month
- **Storage**: ~$5/month
- **Bandwidth**: Pay as you go
- **Public IP**: ~$3/month
- **Total**: ~$18-25/month

---

## Next Steps

1. **Deploy Additional Frontends** (when you upgrade VM):
   - Admin Panel
   - Vendor Panel
   - Delivery Web

2. **Add Domain & SSL**:
   - Purchase domain
   - Configure DNS
   - Install Let's Encrypt SSL

3. **Setup CI/CD**:
   - GitHub Actions
   - Automatic deployment on push

4. **Add Monitoring**:
   - Azure Monitor
   - Application Insights
   - PM2 Plus

5. **Optimize Performance**:
   - Add Redis caching
   - CDN for static assets
   - Database indexing

---

## Support Resources

- **Azure Documentation**: https://docs.microsoft.com/azure
- **Azure Free Tier**: https://azure.microsoft.com/free
- **PM2 Documentation**: https://pm2.keymetrics.io
- **Nginx Documentation**: https://nginx.org/en/docs

---

**Ready to deploy? Follow the steps above and your WinADeal platform will be live on Azure!** 🚀
