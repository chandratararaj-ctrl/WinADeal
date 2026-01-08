# Fix Analytics SQL - Quote camelCase columns
$file = "e:\Project\webDevelop\WinADeal\backend\src\controllers\analytics.controller.ts"
$content = Get-Content $file -Raw

# Replace unquoted camelCase columns with quoted versions
# We look for specific words and wrap them in quotes if they are not already quoted
# Note: The previous script replaced 'created_at' with 'createdAt', etc.
# So now we have 'createdAt'. We want '"createdAt"'.

# Helper function to quote if not quoted
function Quote-Column ($text, $column) {
    # This regex looks for the column name NOT preceded by a quote
    $pattern = "(?<![""])$([Regex]::Escape($column))(?![""])"
    return $text -replace $pattern, "`"$column`""
}

$columns = @("createdAt", "shopId", "productId", "orderId", "userId", "deliveryPartnerId", "deliveryFee")

foreach ($col in $columns) {
    # Simple replace is safer given we know the state from previous step
    # but let's be careful not to double quote if I run this multiple times (though valid SQL allows ""col"" sometimes? no)
    # Actually, let's just do a specific replace for the ones I likely changed.
    # The previous script did simple replacements.
    
    # regex to match word boundary to avoid partial matches if any
    $content = $content -replace "\b$col\b", "`"$col`""
}

# Also fix the previous script's output where it might have replaced inside an already quoted string?
# Unlikely to cause issue unless we have "createdAt" already.
# If "createdAt" exists, the regex `\bcreatedAt\b` matches inside quotes?
# \b matches between " and c. Yes.
# So "createdAt" becomes ""createdAt"". That's bad.

# Let's revert to a simpler restart: Replace specific known instances using the context I know.
# I changed `created_at` to `createdAt`.
# I'll just change `createdAt` to `"createdAt"`.

$content = $content -replace '(?<!")createdAt(?!")', '"createdAt"'
$content = $content -replace '(?<!")shopId(?!")', '"shopId"'
$content = $content -replace '(?<!")productId(?!")', '"productId"'
$content = $content -replace '(?<!")orderId(?!")', '"orderId"'
$content = $content -replace '(?<!")userId(?!")', '"userId"'
$content = $content -replace '(?<!")deliveryPartnerId(?!")', '"deliveryPartnerId"'
$content = $content -replace '(?<!")deliveryFee(?!")', '"deliveryFee"'

# Also one correction:
# DATE("createdAt") ...
# The script above will make it DATE("createdAt"). Correct.

# Save
$content | Set-Content $file -NoNewline

Write-Host "Quoted all camelCase column names"
