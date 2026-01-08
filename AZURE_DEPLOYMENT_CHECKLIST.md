# Azure Deployment Quick Checklist

## Before You Start

- [ ] Azure VM created (B1s free tier)
- [ ] Ubuntu 22.04 LTS installed
- [ ] Public IP address noted: `________________`
- [ ] SSH key or password ready
- [ ] Can connect via SSH: `ssh azureuser@YOUR_IP`

---

## Deployment Progress

### Phase 1: Server Setup (15 minutes)
- [ ] Connected to Azure VM via SSH
- [ ] System updated (`apt update && upgrade`)
- [ ] Node.js 20.x installed
- [ ] PostgreSQL installed and database created
- [ ] 2GB swap space added
- [ ] Application directory created (`/var/www/winadeal`)

### Phase 2: Application Setup (20 minutes)
- [ ] Code uploaded to VM (via SCP or Git)
- [ ] Backend `.env` file configured
- [ ] Database password changed from default
- [ ] JWT secrets generated and updated
- [ ] VM Public IP updated in `.env` and frontend
- [ ] Backend dependencies installed
- [ ] Prisma migrations run successfully

### Phase 3: Process Management (10 minutes)
- [ ] PM2 installed globally
- [ ] `ecosystem.config.js` created
- [ ] Backend started with PM2
- [ ] PM2 configured to start on boot
- [ ] Backend accessible on `http://localhost:5000`

### Phase 4: Frontend Build (15 minutes)
- [ ] Customer-web `.env` configured
- [ ] Frontend dependencies installed
- [ ] Frontend built successfully (`npm run build`)
- [ ] Build output exists in `dist` folder

### Phase 5: Web Server (10 minutes)
- [ ] Nginx installed
- [ ] Nginx config file created
- [ ] Site enabled and default disabled
- [ ] Nginx configuration tested (`nginx -t`)
- [ ] Nginx restarted

### Phase 6: Firewall & Security (10 minutes)
- [ ] Azure NSG: Port 80 opened
- [ ] Azure NSG: Port 443 opened (for future SSL)
- [ ] UFW firewall configured
- [ ] UFW enabled
- [ ] SSH access still working

### Phase 7: Testing (10 minutes)
- [ ] Backend health check: `curl http://localhost:5000/api/v1/health`
- [ ] PM2 status shows running
- [ ] Nginx status shows active
- [ ] Application accessible from browser: `http://YOUR_VM_IP`
- [ ] Can create account and login
- [ ] API calls working

### Phase 8: Monitoring & Backup (10 minutes)
- [ ] PM2 log rotation installed
- [ ] Backup script created
- [ ] Backup script tested
- [ ] Cron job for daily backups setup
- [ ] Memory usage checked (`free -h`)
- [ ] Disk usage checked (`df -h`)

---

## Important Information to Save

### VM Details
```
Public IP: ___________________
SSH Command: ssh azureuser@___________________
Resource Group: ___________________
VM Name: ___________________
```

### Database Credentials
```
Database: winadeal
Username: winadeal_user
Password: ___________________
Connection: postgresql://winadeal_user:PASSWORD@localhost:5432/winadeal
```

### Application URLs
```
Customer App: http://___________________
API Endpoint: http://___________________/api/v1
Admin Panel: (not deployed yet)
Vendor Panel: (not deployed yet)
Delivery App: (not deployed yet)
```

### Secrets (Store Securely!)
```
JWT_SECRET: ___________________
JWT_REFRESH_SECRET: ___________________
```

---

## Quick Commands Reference

### Check Status
```bash
# PM2 status
pm2 status
pm2 logs winadeal-backend --lines 50

# System resources
free -h
df -h

# Nginx status
sudo systemctl status nginx
```

### Restart Services
```bash
# Restart backend
pm2 restart winadeal-backend

# Restart Nginx
sudo systemctl restart nginx

# Restart all
pm2 restart all && sudo systemctl restart nginx
```

### View Logs
```bash
# Backend logs
pm2 logs winadeal-backend

# Nginx access log
sudo tail -f /var/log/nginx/access.log

# Nginx error log
sudo tail -f /var/log/nginx/error.log
```

### Update Application
```bash
cd /var/www/winadeal
git pull
cd backend && npm install && npx prisma migrate deploy
cd ../customer-web && npm install && npm run build
pm2 restart all
```

---

## Common Issues & Solutions

### ❌ Can't access application from browser

**Check:**
1. Azure NSG has port 80 open
2. UFW allows Nginx: `sudo ufw status`
3. Nginx is running: `sudo systemctl status nginx`
4. Backend is running: `pm2 status`

**Fix:**
```bash
# Open port in Azure Portal: VM → Networking → Add inbound rule
sudo ufw allow 'Nginx Full'
sudo systemctl restart nginx
pm2 restart all
```

---

### ❌ Backend keeps crashing (Out of Memory)

**Check:**
```bash
free -h
pm2 logs winadeal-backend
```

**Fix:**
```bash
# Restart with memory limit
pm2 restart winadeal-backend
# Clear cache
sync; echo 3 | sudo tee /proc/sys/vm/drop_caches
```

---

### ❌ Database connection failed

**Check:**
```bash
# Test PostgreSQL
sudo systemctl status postgresql
psql -U winadeal_user -d winadeal -h localhost

# Check .env
cat /var/www/winadeal/backend/.env | grep DATABASE_URL
```

**Fix:**
```bash
# Restart PostgreSQL
sudo systemctl restart postgresql
# Update DATABASE_URL in .env if needed
nano /var/www/winadeal/backend/.env
pm2 restart winadeal-backend
```

---

### ❌ 502 Bad Gateway

**Cause:** Backend not running or Nginx can't connect

**Fix:**
```bash
# Check backend
pm2 status
pm2 restart winadeal-backend

# Check Nginx config
sudo nginx -t
sudo systemctl restart nginx
```

---

## Performance Tips for 1GB RAM

1. **Monitor Memory Constantly**
   ```bash
   pm2 monit
   free -h
   ```

2. **Keep Only Essential Services Running**
   - Backend API (required)
   - PostgreSQL (required)
   - Nginx (required)
   - Don't run dev servers

3. **Use Swap Space**
   - Already configured (2GB)
   - Check: `swapon --show`

4. **Optimize PM2**
   - Use only 1 instance (already configured)
   - Set memory restart limit (already configured)

5. **Clean Up Regularly**
   ```bash
   # Clean old logs
   pm2 flush
   sudo journalctl --vacuum-time=3d
   
   # Clean package cache
   sudo apt clean
   ```

---

## When to Upgrade VM

Upgrade from B1s (1GB) to B2s (4GB) when:

- [ ] Memory usage consistently > 80%
- [ ] Backend crashes frequently
- [ ] Response times > 2 seconds
- [ ] Planning to deploy all 4 frontends
- [ ] Expecting > 50 concurrent users

**Upgrade Cost:** ~$30/month for B2s (2 vCPU, 4GB RAM)

---

## Next Steps After Deployment

### Immediate (Week 1)
- [ ] Test all features thoroughly
- [ ] Monitor memory and performance
- [ ] Setup error tracking (Sentry, etc.)
- [ ] Create admin account
- [ ] Add sample data

### Short Term (Month 1)
- [ ] Purchase domain name
- [ ] Configure DNS
- [ ] Install SSL certificate
- [ ] Deploy other frontends (admin, vendor, delivery)
- [ ] Setup CI/CD pipeline

### Long Term (Month 2+)
- [ ] Upgrade to B2s or B2ms VM
- [ ] Add Redis for caching
- [ ] Setup CDN for static assets
- [ ] Configure Azure Monitor
- [ ] Implement automated backups to Azure Blob Storage
- [ ] Load testing and optimization

---

## Support & Resources

- **Azure Deployment Guide:** `AZURE_DEPLOYMENT_GUIDE.md`
- **General VPS Guide:** `VPS_DEPLOYMENT_GUIDE.md`
- **Quick Start:** `QUICK_START.md`
- **Troubleshooting:** `TROUBLESHOOTING.md`

- **Azure Docs:** https://docs.microsoft.com/azure
- **PM2 Docs:** https://pm2.keymetrics.io
- **Nginx Docs:** https://nginx.org/en/docs

---

## Emergency Contacts

**Azure Support:** Available in Azure Portal

**VM Access Issues:**
- Reset password in Azure Portal
- Use Serial Console in Azure Portal

**Critical Failure:**
1. Take VM snapshot in Azure Portal
2. Restore from backup
3. Redeploy if necessary

---

**Last Updated:** January 2026

**Status:** ⬜ Not Started | 🟡 In Progress | ✅ Complete

**Overall Progress:** _____ / 100%
