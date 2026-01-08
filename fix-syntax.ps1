# Fix Typescript Syntax Errors
$file = "e:\Project\webDevelop\WinADeal\backend\src\controllers\analytics.controller.ts"
$content = Get-Content $file -Raw

# Fix object property access
$content = $content -replace '\?\."userId"', '?.userId'
$content = $content -replace '\."userId"', '.userId'
$content = $content -replace '\?\."shopId"', '?.shopId'
$content = $content -replace '\."shopId"', '.shopId'

# Fix variable declarations
$content = $content -replace 'const "userId"', 'const userId'
$content = $content -replace 'const "shopId"', 'const shopId'
$content = $content -replace 'const "deliveryPartnerId"', 'const deliveryPartnerId'

# Fix object keys in Prisma calls (optional but cleaner)
# This matches "key": value pattern
$content = $content -replace '"userId":', 'userId:'
$content = $content -replace '"shopId":', 'shopId:'
$content = $content -replace '"createdAt":', 'createdAt:'
$content = $content -replace '"avg":', 'avg:'
$content = $content -replace '"sum":', 'sum:'
$content = $content -replace '"deliveryFee":', 'deliveryFee:'
$content = $content -replace '"total":', 'total:'

# However, we MUST preserve the quotes inside the SQL strings!
# The SQL strings are like `SELECT ... "createdAt" ...`
# My regex above for object keys `replace '"userId":', 'userId:'` matches `"userId":` which assumes a colon follows.
# In SQL: `SELECT "userId" ...` does not have a colon immediately after.
# So the object key replacement is safe-ish.

# But wait, `DATE("createdAt")` -> `DATE(createdAt)` ? No, `(` precedes it.
# `start` variable being passed in SQL? No those are `${start}`.

# What about `totalRevenue` assignment?
# `totalRevenue: revenueData._sum?."total" || 0` -> `totalRevenue: revenueData._sum?.total || 0`
$content = $content -replace '\?\."total"', '?.total'
$content = $content -replace '\?\."deliveryFee"', '?.deliveryFee'

# Save
$content | Set-Content $file -NoNewline

Write-Host "Fixed TypeScript syntax errors"
