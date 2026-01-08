# Fix Analytics SQL - Column Names to camelCase
$file = "e:\Project\webDevelop\WinADeal\backend\src\controllers\analytics.controller.ts"
$content = Get-Content $file -Raw

# Fix column names to camelCase (Prisma convention)
$content = $content -replace 'created_at', 'createdAt'
$content = $content -replace 'shop_id', 'shopId'
$content = $content -replace 'product_id', 'productId'
$content = $content -replace 'order_id', 'orderId'
$content = $content -replace 'user_id', 'userId'
$content = $content -replace 'delivery_partner_id', 'deliveryPartnerId'
$content = $content -replace 'delivery_fee', 'deliveryFee'

# Save
$content | Set-Content $file -NoNewline

Write-Host "Fixed all column names to camelCase"
