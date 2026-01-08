# Quick Upload Script
$vmIP = "20.197.4.187"

Write-Host "Uploading to Azure VM: $vmIP" -ForegroundColor Cyan
Write-Host ""

# Upload files
scp -r * Sanju@${vmIP}:/var/www/winadeal/

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[OK] Upload complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next: SSH into your VM and follow DEPLOY_INSTRUCTIONS.txt" -ForegroundColor Yellow
    Write-Host "  ssh Sanju@$vmIP" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "[ERROR] Upload failed!" -ForegroundColor Red
}
