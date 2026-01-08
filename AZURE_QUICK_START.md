# 🚀 Azure VPS Deployment - Quick Start

## What We've Prepared for You

I've created a complete deployment package for your Azure free tier VPS. Here's what you have:

### 📁 Documentation Files

1. **AZURE_DEPLOYMENT_GUIDE.md** - Comprehensive guide with all details
2. **AZURE_DEPLOYMENT_CHECKLIST.md** - Step-by-step checklist to track progress
3. **.agent/workflows/azure-deploy.md** - Automated workflow (use `/azure-deploy`)
4. **prepare-azure-deployment.ps1** - Script to prepare files for upload

---

## 🎯 Your Azure Free Tier Setup

**What you have:**
- **VM Size:** B1s (1 vCPU, 1GB RAM)
- **Storage:** 30GB SSD
- **OS:** Ubuntu 22.04 LTS (recommended)
- **Cost:** FREE for 12 months (then ~$10/month)

**What we'll deploy:**
- ✅ Backend API (Node.js + Express)
- ✅ Customer Web App (React/Vite)
- ✅ PostgreSQL Database
- ✅ Nginx Web Server
- ✅ PM2 Process Manager

**What we'll skip for now (due to 1GB RAM limit):**
- ⏸️ Admin Panel (deploy later when you upgrade)
- ⏸️ Vendor Panel (deploy later when you upgrade)
- ⏸️ Delivery Web (deploy later when you upgrade)
- ⏸️ Redis (optional, add when you upgrade)

---

## 🚀 Quick Deployment Steps

### Step 1: Prepare Your Local Files (5 minutes)

```powershell
# Run the preparation script
cd e:\Project\webDevelop\WinADeal
.\prepare-azure-deployment.ps1
```

**What it does:**
- Creates a `deploy-package` folder
- Copies all necessary files
- Creates environment files with your VM IP
- Generates PM2 configuration
- Creates upload script

### Step 2: Edit Environment Files (5 minutes)

**IMPORTANT:** Before uploading, edit these files:

1. **Backend Environment:**
   ```powershell
   notepad deploy-package\backend\.env.production
   ```
   
   Update:
   - Database password (change from default)
   - JWT secrets (generate random strings)

2. **Generate JWT Secrets:**
   ```powershell
   # Run this to generate secrets
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Copy the output and paste into `.env.production`

### Step 3: Upload to Azure VM (10 minutes)

```powershell
cd deploy-package
.\upload-to-azure.ps1
```

**Or manually:**
```powershell
scp -r * azureuser@YOUR_VM_IP:/var/www/winadeal/
```

### Step 4: SSH into Azure VM

```bash
ssh azureuser@YOUR_VM_IP
```

### Step 5: Follow the Automated Workflow (60 minutes)

Once connected to your Azure VM, follow the workflow in `.agent/workflows/azure-deploy.md`

**Or manually follow these steps:**

1. **Install Node.js, PostgreSQL, Nginx**
2. **Setup database**
3. **Add swap space** (critical for 1GB RAM!)
4. **Install backend dependencies**
5. **Run database migrations**
6. **Start backend with PM2**
7. **Build customer frontend**
8. **Configure Nginx**
9. **Setup firewall**
10. **Test deployment**

---

## 📋 Deployment Checklist

Use `AZURE_DEPLOYMENT_CHECKLIST.md` to track your progress:

- [ ] VM created and accessible
- [ ] Preparation script run
- [ ] Environment files edited
- [ ] Files uploaded to VM
- [ ] Server software installed
- [ ] Database setup
- [ ] Backend running
- [ ] Frontend built
- [ ] Nginx configured
- [ ] Firewall configured
- [ ] Application accessible
- [ ] Backups configured

---

## ⚙️ Key Configuration Details

### Azure Network Security Group (Firewall)

**Must open these ports:**
- Port 80 (HTTP) - For web access
- Port 443 (HTTPS) - For SSL (future)
- Port 22 (SSH) - For remote access

**How to open:**
1. Azure Portal → Your VM → Networking
2. Add inbound port rule
3. Allow port 80, priority 100

### Memory Management (Critical!)

With only 1GB RAM, we need to:
1. ✅ Add 2GB swap space
2. ✅ Run only 1 PM2 instance
3. ✅ Set memory restart limit (400MB)
4. ✅ Use fork mode (not cluster)
5. ✅ Monitor memory constantly

### Database Options

**Option A: Local PostgreSQL** (Uses VM RAM)
- Pros: Simple, no extra cost
- Cons: Uses precious RAM
- Recommended for: Testing only

**Option B: Azure Database for PostgreSQL** (Recommended)
- Pros: Doesn't use VM RAM, managed service
- Cons: Slightly more complex setup
- Free tier: 32GB storage, 1 vCore
- Recommended for: Production

---

## 🔧 Important Commands

### On Your Local Machine (Windows)

```powershell
# Prepare deployment
.\prepare-azure-deployment.ps1

# Upload files
cd deploy-package
.\upload-to-azure.ps1

# Connect to VM
ssh azureuser@YOUR_VM_IP
```

### On Azure VM (Linux)

```bash
# Check PM2 status
pm2 status
pm2 logs winadeal-backend

# Check memory
free -h

# Check disk space
df -h

# Restart services
pm2 restart all
sudo systemctl restart nginx

# View logs
pm2 logs
sudo tail -f /var/log/nginx/error.log
```

---

## 🎯 What to Expect

### Deployment Time
- **Preparation:** 10 minutes
- **Upload:** 5-10 minutes (depending on internet)
- **Server setup:** 60-90 minutes (first time)
- **Total:** ~2 hours

### Performance (1GB RAM)
- **Concurrent users:** 10-50
- **Response time:** 200-500ms
- **Suitable for:** Development, testing, small demos

### When to Upgrade
Upgrade to B2s (4GB RAM, ~$30/month) when:
- Memory usage > 80% consistently
- Need to run all 4 frontends
- Expecting > 50 concurrent users
- Backend crashes frequently

---

## 🆘 Troubleshooting

### Can't connect to VM?
```bash
# Check VM is running in Azure Portal
# Check SSH port 22 is open in NSG
# Try password instead of SSH key
```

### Upload fails?
```powershell
# Make sure VM is running
# Check your internet connection
# Try uploading smaller chunks
```

### Out of memory?
```bash
# Check swap is enabled
swapon --show
free -h

# Restart services
pm2 restart all

# Clear cache
sync; echo 3 | sudo tee /proc/sys/vm/drop_caches
```

### Backend won't start?
```bash
# Check logs
pm2 logs winadeal-backend

# Check .env file
cat /var/www/winadeal/backend/.env

# Check database connection
sudo systemctl status postgresql
```

### Can't access from browser?
```bash
# Check Azure NSG (port 80 open?)
# Check UFW firewall
sudo ufw status

# Check Nginx
sudo systemctl status nginx

# Check backend
pm2 status
```

---

## 📚 Reference Documents

1. **AZURE_DEPLOYMENT_GUIDE.md** - Full deployment guide
2. **AZURE_DEPLOYMENT_CHECKLIST.md** - Progress tracker
3. **VPS_DEPLOYMENT_GUIDE.md** - General VPS guide
4. **QUICK_START.md** - Local development guide
5. **.agent/workflows/azure-deploy.md** - Automated workflow

---

## 🎉 After Successful Deployment

### Immediate Tasks
1. ✅ Test all features
2. ✅ Create admin account
3. ✅ Add sample data
4. ✅ Monitor memory usage
5. ✅ Setup backups

### Next Steps
1. 🔒 Purchase domain name
2. 🔒 Configure DNS
3. 🔒 Install SSL certificate (Let's Encrypt)
4. 📊 Setup monitoring (Azure Monitor)
5. 🚀 Plan upgrade to B2s when ready

### Future Enhancements
1. Deploy remaining frontends (admin, vendor, delivery)
2. Add Redis for caching
3. Setup CI/CD pipeline
4. Configure CDN for static assets
5. Implement automated backups to Azure Blob Storage

---

## 💰 Cost Breakdown

### Free Tier (12 months)
- VM (B1s): **FREE** (750 hours/month)
- Storage (64GB): **FREE**
- Bandwidth (15GB): **FREE**
- Public IP: **~$3/month** ⚠️ (not free)
- **Total: ~$3/month**

### After Free Tier
- VM (B1s): ~$10/month
- Storage: ~$5/month
- Public IP: ~$3/month
- **Total: ~$18-25/month**

### Recommended Production (B2s)
- VM (B2s): ~$30/month
- Storage: ~$5/month
- Public IP: ~$3/month
- **Total: ~$38-45/month**

---

## 🎓 Learning Resources

- **Azure Docs:** https://docs.microsoft.com/azure
- **Azure Free Tier:** https://azure.microsoft.com/free
- **PM2 Docs:** https://pm2.keymetrics.io
- **Nginx Docs:** https://nginx.org/en/docs
- **PostgreSQL Docs:** https://www.postgresql.org/docs

---

## ✅ Ready to Deploy?

### Pre-flight Checklist
- [ ] Azure VM created and running
- [ ] VM public IP noted
- [ ] Can SSH into VM
- [ ] Preparation script ready
- [ ] Have 2-3 hours available
- [ ] Read through deployment guide

### Start Here
```powershell
# 1. Prepare files
cd e:\Project\webDevelop\WinADeal
.\prepare-azure-deployment.ps1

# 2. Edit environment files
notepad deploy-package\backend\.env.production

# 3. Upload
cd deploy-package
.\upload-to-azure.ps1

# 4. SSH and deploy
ssh azureuser@YOUR_VM_IP
```

---

## 🤝 Need Help?

If you encounter issues:

1. **Check the troubleshooting section** in AZURE_DEPLOYMENT_GUIDE.md
2. **Review logs:**
   - PM2: `pm2 logs`
   - Nginx: `sudo tail -f /var/log/nginx/error.log`
3. **Check system resources:**
   - Memory: `free -h`
   - Disk: `df -h`
   - Processes: `htop`

---

**Good luck with your deployment! Your WinADeal platform will be live soon! 🚀**

---

*Last Updated: January 2026*
*For: WinADeal Platform - Azure Free Tier Deployment*
