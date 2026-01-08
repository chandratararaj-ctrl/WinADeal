---
description: Deploy WinADeal to Azure VPS
---

# Deploy to Azure VPS Workflow

This workflow guides you through deploying WinADeal to your Azure free tier VPS.

## Prerequisites

1. Azure VM created (B1s free tier with Ubuntu 22.04)
2. SSH access to your VM
3. Public IP address of your VM
4. Your local WinADeal project ready

---

## Step 1: Connect to Azure VM

```bash
# Replace YOUR_VM_PUBLIC_IP with your actual Azure VM IP
ssh azureuser@YOUR_VM_PUBLIC_IP
```

---

## Step 2: Initial Server Setup

// turbo-all

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git build-essential
```

---

## Step 3: Install Node.js 20.x

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version
npm --version
```

---

## Step 4: Setup PostgreSQL

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql -c "CREATE DATABASE winadeal;"
sudo -u postgres psql -c "CREATE USER winadeal_user WITH PASSWORD 'ChangeThisPassword123!';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE winadeal TO winadeal_user;"
```

**⚠️ Important**: Change the password 'ChangeThisPassword123!' to a secure password!

---

## Step 5: Add Swap Space (Critical for 1GB RAM)

```bash
# Create 2GB swap file
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Verify
free -h
```

---

## Step 6: Create Application Directory

```bash
# Create directory
sudo mkdir -p /var/www/winadeal
sudo chown $USER:$USER /var/www/winadeal
```

---

## Step 7: Upload Your Code

**Option A: From your local machine (Windows PowerShell)**

```powershell
# Navigate to your project directory
cd e:\Project\webDevelop\WinADeal

# Upload to Azure VM (replace YOUR_VM_PUBLIC_IP)
scp -r * azureuser@YOUR_VM_PUBLIC_IP:/var/www/winadeal/
```

**Option B: Using Git**

```bash
# On Azure VM
cd /var/www/winadeal
git clone https://github.com/YOUR_USERNAME/WinADeal.git .
```

---

## Step 8: Configure Backend Environment

```bash
# On Azure VM
cd /var/www/winadeal/backend

# Create .env file
cat > .env << 'EOF'
NODE_ENV=production
PORT=5000

# Database
DATABASE_URL="postgresql://winadeal_user:ChangeThisPassword123!@localhost:5432/winadeal"

# JWT Secrets (CHANGE THESE!)
JWT_SECRET=your_very_long_random_secret_key_here_min_32_chars_change_this
JWT_REFRESH_SECRET=your_very_long_random_refresh_secret_key_here_min_32_chars_change_this
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS - Replace YOUR_VM_PUBLIC_IP with your actual IP
CORS_ORIGIN=http://YOUR_VM_PUBLIC_IP,http://YOUR_VM_PUBLIC_IP:3000

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
EOF

# Edit the .env file to update YOUR_VM_PUBLIC_IP and secrets
nano .env
```

---

## Step 9: Install Backend Dependencies

```bash
cd /var/www/winadeal/backend

# Install dependencies
npm install --production

# Run database migrations
npx prisma migrate deploy
npx prisma generate
```

---

## Step 10: Install PM2 and Start Backend

```bash
# Install PM2 globally
sudo npm install -g pm2

# Create ecosystem config
cd /var/www/winadeal
cat > ecosystem.config.js << 'EOF'
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
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '400M',
      error_file: '/var/www/winadeal/logs/backend-error.log',
      out_file: '/var/www/winadeal/logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
EOF

# Create logs directory
mkdir -p /var/www/winadeal/logs

# Start backend
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

**Note**: Run the command that PM2 outputs after `pm2 startup`

---

## Step 11: Build Customer Frontend

```bash
cd /var/www/winadeal/customer-web

# Create .env file (replace YOUR_VM_PUBLIC_IP)
cat > .env << 'EOF'
VITE_API_URL=http://YOUR_VM_PUBLIC_IP/api/v1
VITE_APP_NAME=WinADeal
EOF

# Edit to update YOUR_VM_PUBLIC_IP
nano .env

# Install and build
npm install
npm run build
```

---

## Step 12: Install and Configure Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/winadeal
```

**Paste this configuration (replace YOUR_VM_PUBLIC_IP):**

```nginx
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
    }

    # WebSocket
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Uploads
    location /uploads/ {
        alias /var/www/winadeal/backend/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Frontend
    location / {
        root /var/www/winadeal/customer-web/dist;
        try_files $uri $uri/ /index.html;
        index index.html;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/winadeal /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test and restart
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## Step 13: Configure Azure Firewall (Network Security Group)

**In Azure Portal:**

1. Go to your VM → **Networking** → **Network Security Group**
2. Click **Add inbound port rule**
3. Add these rules:

   **HTTP Rule:**
   - Source: Any
   - Source port ranges: *
   - Destination: Any
   - Service: HTTP
   - Destination port ranges: 80
   - Protocol: TCP
   - Action: Allow
   - Priority: 100
   - Name: Allow-HTTP

   **HTTPS Rule (for future):**
   - Same as above but port 443, priority 110

---

## Step 14: Configure VM Firewall (UFW)

```bash
# Setup UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Check status
sudo ufw status
```

---

## Step 15: Test Your Deployment

```bash
# Test backend API
curl http://localhost:5000/api/v1/health

# Check PM2 status
pm2 status
pm2 logs winadeal-backend --lines 20

# Check memory
free -h
```

**From your local machine:**

Open browser and go to: `http://YOUR_VM_PUBLIC_IP`

---

## Step 16: Setup Monitoring

```bash
# Install PM2 log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 3

# Monitor in real-time
pm2 monit
```

---

## Step 17: Create Backup Script

```bash
# Create backup script
cat > /var/www/winadeal/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/winadeal"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database (update password)
PGPASSWORD='ChangeThisPassword123!' pg_dump -U winadeal_user -h localhost winadeal > $BACKUP_DIR/db_$DATE.sql

# Compress
gzip $BACKUP_DIR/db_$DATE.sql

# Keep only last 3 backups
ls -t $BACKUP_DIR/db_*.sql.gz | tail -n +4 | xargs rm -f

echo "Backup completed: db_$DATE.sql.gz"
EOF

# Make executable
chmod +x /var/www/winadeal/backup.sh

# Test backup
/var/www/winadeal/backup.sh

# Setup daily backup at 2 AM
(crontab -l 2>/dev/null; echo "0 2 * * * /var/www/winadeal/backup.sh") | crontab -
```

---

## Useful Commands

### Check Application Status
```bash
pm2 status
pm2 logs
pm2 monit
```

### Restart Services
```bash
pm2 restart all
sudo systemctl restart nginx
```

### Check Resources
```bash
free -h          # Memory usage
df -h            # Disk usage
htop             # Process monitor (install: sudo apt install htop)
```

### View Logs
```bash
pm2 logs winadeal-backend --lines 50
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Update Application
```bash
cd /var/www/winadeal
git pull origin main
cd backend && npm install && npx prisma migrate deploy
cd ../customer-web && npm install && npm run build
pm2 restart all
```

---

## Troubleshooting

### Backend not starting?
```bash
pm2 logs winadeal-backend
# Check .env file
cat /var/www/winadeal/backend/.env
```

### Out of memory?
```bash
free -h
pm2 restart all
# Clear cache
sync; echo 3 | sudo tee /proc/sys/vm/drop_caches
```

### Can't access from browser?
```bash
# Check if Nginx is running
sudo systemctl status nginx

# Check Azure NSG rules in portal
# Make sure port 80 is open

# Check UFW
sudo ufw status
```

---

## Next Steps

1. ✅ **Test all features** of your application
2. 🔒 **Add domain and SSL** (when ready)
3. 📊 **Setup monitoring** (Azure Monitor, PM2 Plus)
4. 🚀 **Upgrade VM** when traffic increases
5. 🔄 **Setup CI/CD** for automatic deployments

---

**Deployment Complete! Your WinADeal platform is now live on Azure!** 🎉

Access your application at: `http://YOUR_VM_PUBLIC_IP`
