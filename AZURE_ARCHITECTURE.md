# WinADeal Azure Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         INTERNET / USERS                         │
│                    (Browser, Mobile Apps)                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP/HTTPS
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    AZURE VM (B1s Free Tier)                      │
│                    Ubuntu 22.04 LTS                              │
│                    1 vCPU, 1GB RAM, 30GB SSD                     │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              NGINX WEB SERVER (Port 80/443)             │   │
│  │                                                          │   │
│  │  • Reverse Proxy                                        │   │
│  │  • SSL Termination (Future)                             │   │
│  │  • Static File Serving                                  │   │
│  │  • Load Balancing                                       │   │
│  └──────────┬──────────────────────────┬───────────────────┘   │
│             │                           │                        │
│             │ /api/*                    │ /*                     │
│             │                           │                        │
│  ┌──────────▼──────────┐    ┌──────────▼──────────────────┐    │
│  │   PM2 MANAGER       │    │   STATIC FILES              │    │
│  │                     │    │                              │    │
│  │  ┌──────────────┐  │    │  • customer-web/dist/       │    │
│  │  │   Backend    │  │    │  • index.html                │    │
│  │  │   API        │  │    │  • CSS, JS, Images           │    │
│  │  │              │  │    │                              │    │
│  │  │  Node.js     │  │    └──────────────────────────────┘    │
│  │  │  Express     │  │                                         │
│  │  │  Port 5000   │  │                                         │
│  │  │              │  │                                         │
│  │  │  Features:   │  │                                         │
│  │  │  • Auth      │  │                                         │
│  │  │  • Orders    │  │                                         │
│  │  │  • Products  │  │                                         │
│  │  │  • Users     │  │                                         │
│  │  │  • WebSocket │  │                                         │
│  │  └──────┬───────┘  │                                         │
│  │         │          │                                         │
│  │         │ Prisma   │                                         │
│  │         │ ORM      │                                         │
│  └─────────┼──────────┘                                         │
│            │                                                     │
│  ┌─────────▼──────────────────────────────────────────────┐    │
│  │          POSTGRESQL DATABASE (Port 5432)               │    │
│  │                                                         │    │
│  │  Database: winadeal                                    │    │
│  │  User: winadeal_user                                   │    │
│  │                                                         │    │
│  │  Tables:                                               │    │
│  │  • Users, Shops, Products                              │    │
│  │  • Orders, OrderItems                                  │    │
│  │  • DeliveryPartners, Reviews                           │    │
│  │  • Cities, Coupons, Payouts                            │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              SWAP SPACE (2GB)                          │    │
│  │  Critical for 1GB RAM - Prevents OOM crashes           │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                             │
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                   AZURE NETWORK SECURITY GROUP                   │
│                                                                   │
│  Inbound Rules:                                                  │
│  • Port 22  (SSH)   - Your IP only                              │
│  • Port 80  (HTTP)  - 0.0.0.0/0                                 │
│  • Port 443 (HTTPS) - 0.0.0.0/0                                 │
└───────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════
                        DATA FLOW DIAGRAM
═══════════════════════════════════════════════════════════════════

1. USER REQUEST
   ↓
2. AZURE NSG (Firewall Check)
   ↓
3. NGINX (Port 80)
   ↓
   ├─→ API Request (/api/*)
   │   ↓
   │   4. Proxy to Backend (localhost:5000)
   │      ↓
   │      5. PM2 → Node.js Backend
   │         ↓
   │         6. Prisma ORM
   │            ↓
   │            7. PostgreSQL Database
   │               ↓
   │            8. Return Data
   │         ↓
   │      9. JSON Response
   │   ↓
   │   10. Return to User
   │
   └─→ Static File Request (/*)
       ↓
       4. Serve from /customer-web/dist/
          ↓
       5. Return HTML/CSS/JS


═══════════════════════════════════════════════════════════════════
                     MEMORY ALLOCATION (1GB RAM)
═══════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│  Total RAM: 1024 MB                                              │
├─────────────────────────────────────────────────────────────────┤
│  System & OS:           ~200 MB  ████████                       │
│  PostgreSQL:            ~150 MB  ██████                          │
│  Node.js Backend:       ~300 MB  ████████████                   │
│  Nginx:                  ~50 MB  ██                              │
│  PM2:                    ~30 MB  █                               │
│  Other Processes:        ~50 MB  ██                              │
│  Buffer/Cache:          ~244 MB  █████████                      │
├─────────────────────────────────────────────────────────────────┤
│  SWAP (when needed):   2048 MB  (on disk)                       │
└─────────────────────────────────────────────────────────────────┘

⚠️  This is why we:
    • Add 2GB swap space
    • Run only 1 PM2 instance
    • Set max_memory_restart to 400MB
    • Monitor memory constantly


═══════════════════════════════════════════════════════════════════
                        DEPLOYMENT STAGES
═══════════════════════════════════════════════════════════════════

STAGE 1: CURRENT (Free Tier - 1GB RAM)
┌─────────────────────────────────────────────────────────────────┐
│  ✅ Backend API                                                  │
│  ✅ Customer Web                                                 │
│  ✅ PostgreSQL                                                   │
│  ✅ Nginx                                                        │
│  ✅ PM2                                                          │
│                                                                   │
│  Capacity: 10-50 concurrent users                               │
│  Use Case: Development, Testing, Demo                           │
└─────────────────────────────────────────────────────────────────┘

STAGE 2: UPGRADED (B2s - 4GB RAM) - ~$30/month
┌─────────────────────────────────────────────────────────────────┐
│  ✅ Backend API (2 instances)                                    │
│  ✅ Customer Web                                                 │
│  ✅ Admin Panel                                                  │
│  ✅ Vendor Panel                                                 │
│  ✅ Delivery Web                                                 │
│  ✅ PostgreSQL                                                   │
│  ✅ Redis (Caching)                                              │
│  ✅ Nginx                                                        │
│  ✅ PM2                                                          │
│                                                                   │
│  Capacity: 100-500 concurrent users                             │
│  Use Case: Small Production                                     │
└─────────────────────────────────────────────────────────────────┘

STAGE 3: PRODUCTION (B4ms - 16GB RAM) - ~$120/month
┌─────────────────────────────────────────────────────────────────┐
│  ✅ All services from Stage 2                                    │
│  ✅ Backend API (4 instances)                                    │
│  ✅ Redis Cluster                                                │
│  ✅ CDN Integration                                              │
│  ✅ Azure Monitor                                                │
│  ✅ Automated Backups                                            │
│                                                                   │
│  Capacity: 500-2000 concurrent users                            │
│  Use Case: Full Production                                      │
└─────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════
                      SECURITY LAYERS
═══════════════════════════════════════════════════════════════════

Layer 1: Azure Network Security Group (NSG)
  • Cloud-level firewall
  • Controls inbound/outbound traffic
  • Rule-based access control

Layer 2: UFW (Uncomplicated Firewall)
  • VM-level firewall
  • Additional security layer
  • Deny all incoming by default

Layer 3: Nginx
  • Rate limiting
  • Request filtering
  • DDoS protection

Layer 4: Application (Backend)
  • JWT authentication
  • Role-based access control
  • Input validation
  • SQL injection prevention (Prisma)

Layer 5: Database
  • Password authentication
  • Local-only connections
  • Encrypted connections (SSL)


═══════════════════════════════════════════════════════════════════
                    MONITORING & LOGGING
═══════════════════════════════════════════════════════════════════

Application Logs:
  • PM2 Logs: /var/www/winadeal/logs/
  • Backend: backend-error.log, backend-out.log
  • View: pm2 logs winadeal-backend

Web Server Logs:
  • Nginx Access: /var/log/nginx/access.log
  • Nginx Error: /var/log/nginx/error.log
  • View: sudo tail -f /var/log/nginx/error.log

System Logs:
  • System: journalctl
  • PostgreSQL: /var/log/postgresql/
  • View: sudo journalctl -u postgresql

Monitoring Tools:
  • PM2: pm2 monit (real-time)
  • System: htop (install: sudo apt install htop)
  • Memory: free -h
  • Disk: df -h
  • Network: netstat -tlnp


═══════════════════════════════════════════════════════════════════
                      BACKUP STRATEGY
═══════════════════════════════════════════════════════════════════

Database Backups:
  • Frequency: Daily at 2 AM
  • Location: /var/backups/winadeal/
  • Retention: Last 3 backups
  • Format: Compressed SQL (.sql.gz)
  • Script: /var/www/winadeal/backup.sh

Code Backups:
  • Method: Git repository
  • Frequency: On every deployment
  • Location: GitHub/GitLab

VM Snapshots (Azure):
  • Frequency: Weekly (manual)
  • Location: Azure Portal
  • Use: Disaster recovery


═══════════════════════════════════════════════════════════════════
                    PERFORMANCE OPTIMIZATION
═══════════════════════════════════════════════════════════════════

Current (1GB RAM):
  ✅ Swap space enabled
  ✅ Single PM2 instance
  ✅ Memory restart limit
  ✅ Nginx caching for static files
  ✅ Gzip compression

Future Optimizations:
  ⏸️ Redis caching (when upgraded)
  ⏸️ Database connection pooling
  ⏸️ CDN for static assets
  ⏸️ Image optimization
  ⏸️ Code splitting
  ⏸️ Lazy loading


═══════════════════════════════════════════════════════════════════
                        URL STRUCTURE
═══════════════════════════════════════════════════════════════════

Current (Using IP):
  • Customer App:  http://YOUR_VM_IP/
  • API:           http://YOUR_VM_IP/api/v1/
  • Uploads:       http://YOUR_VM_IP/uploads/

Future (With Domain):
  • Customer App:  https://yourdomain.com/
  • Admin Panel:   https://admin.yourdomain.com/
  • Vendor Panel:  https://vendor.yourdomain.com/
  • Delivery App:  https://delivery.yourdomain.com/
  • API:           https://api.yourdomain.com/api/v1/


═══════════════════════════════════════════════════════════════════
                      COST PROJECTION
═══════════════════════════════════════════════════════════════════

Month 1-12 (Free Tier):
  • VM (B1s):              $0.00
  • Storage (30GB):        $0.00
  • Bandwidth (15GB):      $0.00
  • Public IP:             $3.00
  ─────────────────────────────────
  Total:                   $3.00/month

Month 13+ (Paid B1s):
  • VM (B1s):             $10.00
  • Storage (30GB):        $5.00
  • Bandwidth:             $2.00
  • Public IP:             $3.00
  ─────────────────────────────────
  Total:                  $20.00/month

Recommended (B2s):
  • VM (B2s):             $30.00
  • Storage (60GB):        $8.00
  • Bandwidth:             $5.00
  • Public IP:             $3.00
  ─────────────────────────────────
  Total:                  $46.00/month


═══════════════════════════════════════════════════════════════════

This architecture is designed to:
  ✅ Maximize free tier benefits
  ✅ Handle development and testing workloads
  ✅ Scale easily when upgraded
  ✅ Maintain security best practices
  ✅ Provide reliable performance within constraints

Ready to deploy? Follow AZURE_QUICK_START.md!

═══════════════════════════════════════════════════════════════════
