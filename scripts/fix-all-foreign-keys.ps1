# PowerShell script for Windows
Write-Host "Fixing all foreign key references in migrations..." -ForegroundColor Green

# Find all migration files that reference portfolios(portfolio_id)
$migrationFiles = Get-ChildItem -Path "src/migrations/*.ts" | Where-Object { 
    (Get-Content $_.FullName -Raw) -match "REFERENCES portfolios" -and 
    $_.Name -notmatch "FixEntityNamingConvention" -and 
    $_.Name -notmatch "FixAllForeignKeyReferences"
}

Write-Host "Found migration files with foreign key references:" -ForegroundColor Yellow
$migrationFiles | ForEach-Object { Write-Host "  - $($_.Name)" }

# Fix each migration file
foreach ($file in $migrationFiles) {
    Write-Host "Fixing $($file.Name)..." -ForegroundColor Cyan
    
    # Replace portfolios(portfolio_id) with portfolios(portfolioId) for migrations that run BEFORE FixEntityNamingConvention
    if ($file.Name -match "1734567890") {
        $content = Get-Content $file.FullName -Raw
        $content = $content -replace "REFERENCES portfolios\(portfolio_id\)", "REFERENCES portfolios(portfolioId)"
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Updated $($file.Name) to use portfolioId (camelCase)" -ForegroundColor Green
    } else {
        Write-Host "$($file.Name) runs after FixEntityNamingConvention, keeping portfolio_id (snake_case)" -ForegroundColor Blue
    }
}

Write-Host "All foreign key references fixed!" -ForegroundColor Green
Write-Host "Migration order:" -ForegroundColor Yellow
Write-Host "   1. CreatePortfolioSchema (creates portfolios with portfolioId)"
Write-Host "   2. Other migrations (use portfolioId)"
Write-Host "   3. FixEntityNamingConvention (renames portfolioId to portfolio_id)"
Write-Host "   4. Later migrations (use portfolio_id)"
