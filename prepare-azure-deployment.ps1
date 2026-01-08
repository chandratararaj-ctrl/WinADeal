# Azure Deployment Preparation Script
# Run this on your local Windows machine before deploying to Azure

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "WinADeal Azure Deployment Prep" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Get Azure VM IP
$vmIP = Read-Host "Enter your Azure VM Public IP address"

if ([string]::IsNullOrWhiteSpace($vmIP)) {
  Write-Host "Error: VM IP is required!" -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "VM IP: $vmIP" -ForegroundColor Green
Write-Host ""

# Project root
$projectRoot = "e:\Project\webDevelop\WinADeal"
Set-Location $projectRoot

Write-Host "Step 1: Creating deployment package..." -ForegroundColor Yellow

# Create deployment directory
$deployDir = "$projectRoot\deploy-package"
if (Test-Path $deployDir) {
  Remove-Item -Recurse -Force $deployDir
}
New-Item -ItemType Directory -Path $deployDir | Out-Null

Write-Host "  [OK] Created deployment directory" -ForegroundColor Green

# Copy necessary files
Write-Host ""
Write-Host "Step 2: Copying project files..." -ForegroundColor Yellow

$itemsToCopy = @(
  "backend",
  "customer-web",
  "admin-panel",
  "vendor-panel",
  "delivery-web",
  "shared",
  "package.json",
  "README.md"
)

foreach ($item in $itemsToCopy) {
  $source = Join-Path $projectRoot $item
  if (Test-Path $source) {
    Copy-Item -Path $source -Destination $deployDir -Recurse -Force
    Write-Host "  [OK] Copied $item" -ForegroundColor Green
  }
  else {
    Write-Host "  [SKIP] $item (not found)" -ForegroundColor Yellow
  }
}

# Create backend .env template
Write-Host ""
Write-Host "Step 3: Creating backend .env template..." -ForegroundColor Yellow

$backendEnv = @"
NODE_ENV=production
PORT=5000

# Database - UPDATE THE PASSWORD!
DATABASE_URL="postgresql://winadeal_user:CHANGE_THIS_PASSWORD@localhost:5432/winadeal"

# JWT Secrets - GENERATE NEW SECRETS!
# Use: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=CHANGE_THIS_TO_RANDOM_32_CHAR_STRING
JWT_REFRESH_SECRET=CHANGE_THIS_TO_RANDOM_32_CHAR_STRING
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS - Your Azure VM IP
CORS_ORIGIN=http://$vmIP,http://$vmIP:3000

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# Optional: Add these later
# RAZORPAY_KEY_ID=
# RAZORPAY_KEY_SECRET=
# GOOGLE_MAPS_API_KEY=
# TWILIO_ACCOUNT_SID=
# TWILIO_AUTH_TOKEN=
# TWILIO_PHONE_NUMBER=
"@

$backendEnv | Out-File -FilePath "$deployDir\backend\.env.production" -Encoding UTF8
Write-Host "  [OK] Created backend/.env.production" -ForegroundColor Green

# Create customer-web .env
Write-Host ""
Write-Host "Step 4: Creating customer-web .env..." -ForegroundColor Yellow

$customerEnv = @"
VITE_API_URL=http://$vmIP/api/v1
VITE_APP_NAME=WinADeal
# VITE_GOOGLE_MAPS_API_KEY=
"@

$customerEnv | Out-File -FilePath "$deployDir\customer-web\.env" -Encoding UTF8
Write-Host "  [OK] Created customer-web/.env" -ForegroundColor Green

# Create admin-panel .env
$adminEnv = @"
VITE_API_URL=http://$vmIP/api/v1
VITE_APP_NAME=WinADeal Admin
"@

$adminEnv | Out-File -FilePath "$deployDir\admin-panel\.env" -Encoding UTF8
Write-Host "  [OK] Created admin-panel/.env" -ForegroundColor Green

# Create vendor-panel .env
$vendorEnv = @"
VITE_API_URL=http://$vmIP/api/v1
VITE_APP_NAME=WinADeal Vendor
"@

$vendorEnv | Out-File -FilePath "$deployDir\vendor-panel\.env" -Encoding UTF8
Write-Host "  [OK] Created vendor-panel/.env" -ForegroundColor Green

# Create delivery-web .env
$deliveryEnv = @"
VITE_API_URL=http://$vmIP/api/v1
VITE_APP_NAME=WinADeal Delivery
"@

$deliveryEnv | Out-File -FilePath "$deployDir\delivery-web\.env" -Encoding UTF8
Write-Host "  [OK] Created delivery-web/.env" -ForegroundColor Green

# Create ecosystem.config.js
Write-Host ""
Write-Host "Step 5: Creating PM2 ecosystem config..." -ForegroundColor Yellow

$ecosystemConfig = @"
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
      node_args: '--max-old-space-size=384',
      error_file: '/var/www/winadeal/logs/backend-error.log',
      out_file: '/var/www/winadeal/logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
"@

$ecosystemConfig | Out-File -FilePath "$deployDir\ecosystem.config.js" -Encoding UTF8
Write-Host "  [OK] Created ecosystem.config.js" -ForegroundColor Green

# Create deployment instructions
Write-Host ""
Write-Host "Step 6: Creating deployment instructions..." -ForegroundColor Yellow

$deployInstructions = @"
# WinADeal Azure Deployment Instructions

## Your Configuration
- Azure VM IP: $vmIP
- Deployment Package: $deployDir

## Next Steps

### 1. Upload to Azure VM

From PowerShell:
cd $deployDir
scp -r * Sanju@${vmIP}:/var/www/winadeal/

### 2. SSH into Azure VM

ssh Sanju@$vmIP

### 3. Setup Backend

cd /var/www/winadeal/backend

# Copy production env
cp .env.production .env

# IMPORTANT: Edit .env and update:
# 1. Database password
# 2. JWT secrets (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
nano .env

# Install dependencies
npm install --production

# Run migrations
npx prisma migrate deploy
npx prisma generate

### 4. Start Backend with PM2

cd /var/www/winadeal

# Install PM2
sudo npm install -g pm2

# Create logs directory
mkdir -p logs

# Start backend
pm2 start ecosystem.config.js

# Save PM2 config
pm2 save

# Setup PM2 startup
pm2 startup
# Run the command that PM2 outputs

### 5. Build Customer Frontend

cd /var/www/winadeal/customer-web

# Install and build
npm install
npm run build

### 6. Configure Nginx

See AZURE_DEPLOYMENT_GUIDE.md for Nginx configuration.

### 7. Test

Open browser: http://$vmIP

## Important Files Created

- backend/.env.production - Backend environment (EDIT THIS!)
- customer-web/.env - Frontend environment
- ecosystem.config.js - PM2 configuration

## Security Reminders

BEFORE DEPLOYING:
1. Change database password in backend/.env
2. Generate new JWT secrets
3. Review all environment variables
4. Never commit .env files to Git

## Support

See these files for detailed instructions:
- AZURE_DEPLOYMENT_GUIDE.md
- AZURE_DEPLOYMENT_CHECKLIST.md
- .agent/workflows/azure-deploy.md
"@

$deployInstructions | Out-File -FilePath "$deployDir\DEPLOY_INSTRUCTIONS.txt" -Encoding UTF8
Write-Host "  [OK] Created DEPLOY_INSTRUCTIONS.txt" -ForegroundColor Green

# Create quick upload script
Write-Host ""
Write-Host "Step 7: Creating upload script..." -ForegroundColor Yellow

$uploadScript = @"
# Quick Upload Script
`$vmIP = "$vmIP"

Write-Host "Uploading to Azure VM: `$vmIP" -ForegroundColor Cyan
Write-Host ""

# Upload files
scp -r * Sanju@`${vmIP}:/var/www/winadeal/

if (`$LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[OK] Upload complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next: SSH into your VM and follow DEPLOY_INSTRUCTIONS.txt" -ForegroundColor Yellow
    Write-Host "  ssh Sanju@`$vmIP" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "[ERROR] Upload failed!" -ForegroundColor Red
}
"@

$uploadScript | Out-File -FilePath "$deployDir\upload-to-azure.ps1" -Encoding UTF8
Write-Host "  [OK] Created upload-to-azure.ps1" -ForegroundColor Green

# Summary
Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Deployment Package Ready!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Location: $deployDir" -ForegroundColor Yellow
Write-Host ""
Write-Host "Files created:" -ForegroundColor White
Write-Host "  - backend/.env.production (EDIT BEFORE DEPLOYING!)" -ForegroundColor White
Write-Host "  - customer-web/.env" -ForegroundColor White
Write-Host "  - admin-panel/.env" -ForegroundColor White
Write-Host "  - vendor-panel/.env" -ForegroundColor White
Write-Host "  - delivery-web/.env" -ForegroundColor White
Write-Host "  - ecosystem.config.js" -ForegroundColor White
Write-Host "  - DEPLOY_INSTRUCTIONS.txt" -ForegroundColor White
Write-Host "  - upload-to-azure.ps1" -ForegroundColor White
Write-Host ""
Write-Host "IMPORTANT: Before uploading, edit backend/.env.production:" -ForegroundColor Red
Write-Host "   1. Change database password" -ForegroundColor Yellow
Write-Host "   2. Generate JWT secrets" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "  1. Review and edit: $deployDir\backend\.env.production" -ForegroundColor Cyan
Write-Host "  2. Run: cd $deployDir" -ForegroundColor Cyan
Write-Host "  3. Run: .\upload-to-azure.ps1" -ForegroundColor Cyan
Write-Host "  4. SSH to VM: ssh Sanju@$vmIP" -ForegroundColor Cyan
Write-Host "  5. Follow: DEPLOY_INSTRUCTIONS.txt" -ForegroundColor Cyan
Write-Host ""
Write-Host "Good luck with your deployment!" -ForegroundColor Green
Write-Host ""
