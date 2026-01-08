# Fix Analytics SQL Queries
$file = "e:\Project\webDevelop\WinADeal\backend\src\controllers\analytics.controller.ts"
$content = Get-Content $file -Raw

# Fix column names
$content = $content -replace 'total_amount', 'total'
$content = $content -replace 's\.vendor_id', 's.user_id'

# Fix table names
$content = $content -replace 'FROM orders', 'FROM "Order"'
$content = $content -replace 'FROM order_items', 'FROM "OrderItem"'
$content = $content -replace 'FROM products', 'FROM "Product"'
$content = $content -replace 'FROM users', 'FROM "User"'
$content = $content -replace 'FROM shops', 'FROM "Shop"'
$content = $content -replace 'JOIN orders', 'JOIN "Order"'
$content = $content -replace 'JOIN shops', 'JOIN "Shop"'
$content = $content -replace 'JOIN users', 'JOIN "User"'
$content = $content -replace 'JOIN products', 'JOIN "Product"'
$content = $content -replace 'JOIN order_items', 'JOIN "OrderItem"'

# Fix status
$content = $content -replace "status IN \('DELIVERED', 'COMPLETED'\)", "status = 'DELIVERED'"

# Save
$content | Set-Content $file -NoNewline

Write-Host "Fixed all SQL queries in analytics.controller.ts"
