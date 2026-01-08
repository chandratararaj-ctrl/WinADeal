# WinADeal VPS Deployment Guide

## Recommended VPS Configuration

### Minimum Requirements (Development/Testing)
- **CPU**: 2 vCPUs
- **RAM**: 4 GB
- **Storage**: 40 GB SSD
- **Bandwidth**: 2 TB/month
- **OS**: Ubuntu 22.04 LTS or Ubuntu 20.04 LTS

**Estimated Cost**: $10-15/month
**Providers**: DigitalOcean, Linode, Vultr, AWS Lightsail

---

### Recommended (Production - Small Scale)
- **CPU**: 4 vCPUs
- **RAM**: 8 GB
- **Storage**: 80 GB SSD
- **Bandwidth**: 4 TB/month
- **OS**: Ubuntu 22.04 LTS

**Estimated Cost**: $40-60/month
**Suitable for**: 100-500 concurrent users

---

### Production (Medium Scale)
- **CPU**: 8 vCPUs
- **RAM**: 16 GB
- **Storage**: 160 GB SSD
- **Bandwidth**: 6 TB/month
- **OS**: Ubuntu 22.04 LTS

**Estimated Cost**: $80-120/month
**Suitable for**: 500-2000 concurrent users

---

## Software Stack Requirements

### 1. Node.js
- **Version**: 18.x or 20.x LTS
- **Purpose**: Run backend API and build frontend apps

### 2. PostgreSQL
- **Version**: 14.x or 15.x
- **Purpose**: Main database
- **Recommended**: 2-4 GB RAM allocated

### 3. Redis (Optional but Recommended)
- **Version**: 7.x
- **Purpose**: Caching, session storage, real-time features
- **RAM**: 512 MB - 1 GB

### 4. Nginx
- **Version**: Latest stable
- **Purpose**: Reverse proxy, SSL termination, static file serving

### 5. PM2
- **Version**: Latest
- **Purpose**: Process management for Node.js apps

---

## Architecture Overview

```
Internet
    ↓
[Nginx - Port 80/443]
    ↓
    ├─→ [Backend API - Port 5000]
    ├─→ [Admin Panel - Port 3001 or static files]
    ├─→ [Vendor Panel - Port 3002 or static files]
    ├─→ [Customer Web - Port 3003 or static files]
    └─→ [Delivery Web - Port 3004 or static files]
    
[PostgreSQL - Port 5432]
[Redis - Port 6379]
```

---

## Deployment Steps

### 1. Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Redis
sudo apt install -y redis-server

# Install Nginx
sudo apt install -y nginx

# Install PM2 globally
sudo npm install -g pm2

# Install build tools
sudo apt install -y build-essential git
```

### 2. Setup PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE winadeal;
CREATE USER winadeal_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE winadeal TO winadeal_user;
\q
```

### 3. Clone and Setup Application

```bash
# Create app directory
sudo mkdir -p /var/www/winadeal
sudo chown $USER:$USER /var/www/winadeal
cd /var/www/winadeal

# Clone repository
git clone <your-repo-url> .

# Setup backend
cd backend
npm install
cp .env.example .env
# Edit .env with production values
nano .env

# Run Prisma migrations
npx prisma migrate deploy
npx prisma generate

# Build frontend apps
cd ../admin-panel
npm install
npm run build

cd ../vendor-panel
npm install
npm run build

cd ../customer-web
npm install
npm run build

cd ../delivery-web
npm install
npm run build
```

### 4. Environment Variables

**Backend `.env`:**
```env
NODE_ENV=production
PORT=5000

# Database
DATABASE_URL="postgresql://winadeal_user:your_secure_password@localhost:5432/winadeal"

# JWT Secrets (generate strong random strings)
JWT_SECRET=your_very_long_random_secret_key_here
JWT_REFRESH_SECRET=your_very_long_random_refresh_secret_key_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Redis (if using)
REDIS_URL=redis://localhost:6379

# CORS Origins (your domain)
CORS_ORIGIN=https://yourdomain.com,https://admin.yourdomain.com,https://vendor.yourdomain.com,https://delivery.yourdomain.com

# File Upload
MAX_FILE_SIZE=10485760

# Razorpay (for payments)
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Google Maps API
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# SMS/OTP (Twilio or similar)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number
```

**Frontend `.env` (for each app):**
```env
VITE_API_URL=https://api.yourdomain.com/api/v1
VITE_APP_NAME=WinADeal
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 5. PM2 Process Management

**Create `ecosystem.config.js` in project root:**

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
      instances: 2,
      exec_mode: 'cluster',
      max_memory_restart: '500M'
    }
  ]
};
```

**Start applications:**
```bash
cd /var/www/winadeal
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 6. Nginx Configuration

**Create `/etc/nginx/sites-available/winadeal`:**

```nginx
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

# Admin Panel
server {
    listen 80;
    server_name admin.yourdomain.com;
    root /var/www/winadeal/admin-panel/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Vendor Panel
server {
    listen 80;
    server_name vendor.yourdomain.com;
    root /var/www/winadeal/vendor-panel/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Customer Web
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    root /var/www/winadeal/customer-web/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Delivery Web
server {
    listen 80;
    server_name delivery.yourdomain.com;
    root /var/www/winadeal/delivery-web/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Enable site:**
```bash
sudo ln -s /etc/nginx/sites-available/winadeal /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificates for all domains
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
sudo certbot --nginx -d api.yourdomain.com
sudo certbot --nginx -d admin.yourdomain.com
sudo certbot --nginx -d vendor.yourdomain.com
sudo certbot --nginx -d delivery.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

## Domain Configuration

### DNS Records (A Records)

```
Type    Name        Value               TTL
A       @           YOUR_VPS_IP         3600
A       www         YOUR_VPS_IP         3600
A       api         YOUR_VPS_IP         3600
A       admin       YOUR_VPS_IP         3600
A       vendor      YOUR_VPS_IP         3600
A       delivery    YOUR_VPS_IP         3600
```

---

## Security Hardening

### 1. Firewall (UFW)

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 2. Fail2Ban

```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3. PostgreSQL Security

```bash
# Edit PostgreSQL config
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Change to only allow local connections
# local   all             all                                     md5
# host    all             all             127.0.0.1/32            md5
```

### 4. Regular Updates

```bash
# Setup automatic security updates
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

---

## Monitoring & Maintenance

### 1. PM2 Monitoring

```bash
# View logs
pm2 logs

# Monitor processes
pm2 monit

# Check status
pm2 status
```

### 2. Database Backups

**Create backup script `/var/www/winadeal/backup.sh`:**

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/winadeal"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U winadeal_user winadeal > $BACKUP_DIR/db_$DATE.sql

# Compress
gzip $BACKUP_DIR/db_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +7 -delete

echo "Backup completed: db_$DATE.sql.gz"
```

**Setup cron job:**
```bash
chmod +x /var/www/winadeal/backup.sh
crontab -e

# Add this line (daily backup at 2 AM)
0 2 * * * /var/www/winadeal/backup.sh
```

### 3. Log Rotation

```bash
# PM2 logs are auto-rotated
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## Performance Optimization

### 1. Nginx Caching

Add to nginx config:
```nginx
# Cache static assets
location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 2. PostgreSQL Tuning

```bash
sudo nano /etc/postgresql/14/main/postgresql.conf

# Adjust based on your RAM (example for 8GB RAM)
shared_buffers = 2GB
effective_cache_size = 6GB
maintenance_work_mem = 512MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 10MB
min_wal_size = 1GB
max_wal_size = 4GB
```

### 3. Redis Configuration

```bash
sudo nano /etc/redis/redis.conf

# Set max memory
maxmemory 512mb
maxmemory-policy allkeys-lru
```

---

## Estimated Costs Breakdown

### Small Production Setup ($50-70/month)
- VPS (4 vCPU, 8GB RAM): $40-50
- Domain: $10-15/year
- SSL: Free (Let's Encrypt)
- Backups: $5-10 (if using provider's backup service)

### Medium Production Setup ($100-150/month)
- VPS (8 vCPU, 16GB RAM): $80-100
- Domain: $10-15/year
- SSL: Free (Let's Encrypt)
- Backups: $10-20
- CDN (optional): $10-30

---

## Deployment Checklist

- [ ] VPS provisioned with Ubuntu 22.04
- [ ] Domain purchased and DNS configured
- [ ] Node.js, PostgreSQL, Redis, Nginx installed
- [ ] Application code deployed
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Frontend apps built
- [ ] PM2 processes started
- [ ] Nginx configured and tested
- [ ] SSL certificates installed
- [ ] Firewall configured
- [ ] Backups automated
- [ ] Monitoring setup
- [ ] Test all applications
- [ ] Load testing performed

---

## Recommended VPS Providers

1. **DigitalOcean** - Easy to use, good documentation
   - 4 vCPU, 8GB RAM: $48/month
   - 8 vCPU, 16GB RAM: $96/month

2. **Linode (Akamai)** - Reliable, good performance
   - 4 vCPU, 8GB RAM: $48/month
   - 8 vCPU, 16GB RAM: $96/month

3. **Vultr** - Competitive pricing
   - 4 vCPU, 8GB RAM: $48/month
   - 8 vCPU, 16GB RAM: $96/month

4. **AWS Lightsail** - Good for AWS ecosystem
   - 2 vCPU, 8GB RAM: $40/month
   - 4 vCPU, 16GB RAM: $80/month

5. **Hetzner** - Best value for money (Europe)
   - 4 vCPU, 8GB RAM: €9.50/month (~$10)
   - 8 vCPU, 16GB RAM: €19/month (~$20)

---

## Support & Maintenance

### Regular Tasks
- **Daily**: Check PM2 status, review logs
- **Weekly**: Review error logs, check disk space
- **Monthly**: Update packages, review performance metrics
- **Quarterly**: Security audit, load testing

### Emergency Contacts
- Keep VPS provider support handy
- Document all passwords in secure password manager
- Have rollback plan ready

---

**For production deployment, start with the Small Production setup and scale up based on actual usage!**
