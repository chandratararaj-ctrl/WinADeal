# Fix API prefix in customer-web service files
# Run this from the customer-web directory

Write-Host "Fixing API prefixes in service files..." -ForegroundColor Cyan

$files = @(
    "src\services\auth.service.ts",
    "src\services\coupon.service.ts",
    "src\services\order.service.ts",
    "src\services\review.service.ts"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Processing $file..." -ForegroundColor Yellow
        
        $content = Get-Content $file -Raw
        
        # Replace all API calls
        $content = $content -replace "api\.get\('/api/v1/", "api.get('/"
        $content = $content -replace "api\.post\('/api/v1/", "api.post('/"
        $content = $content -replace "api\.put\('/api/v1/", "api.put('/"
        $content = $content -replace "api\.delete\('/api/v1/", "api.delete('/"
        $content = $content -replace "api\.patch\('/api/v1/", "api.patch('/"
        
        # Also fix template literals
        $content = $content -replace 'api\.get\(`/api/v1/', 'api.get(`/'
        $content = $content -replace 'api\.post\(`/api/v1/', 'api.post(`/'
        $content = $content -replace 'api\.put\(`/api/v1/', 'api.put(`/'
        $content = $content -replace 'api\.delete\(`/api/v1/', 'api.delete(`/'
        $content = $content -replace 'api\.patch\(`/api/v1/', 'api.patch(`/'
        
        Set-Content $file $content -NoNewline
        
        Write-Host "  ✓ Fixed $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ File not found: $file" -ForegroundColor Red
    }
}

Write-Host "`nAll service files fixed!" -ForegroundColor Green
Write-Host "Please restart the customer-web server (npm run dev)" -ForegroundColor Cyan
