# PowerShell script to seed production data
# This script will create the minimum required data for production system

param(
    [string]$DatabaseHost = "localhost",
    [string]$DatabasePort = "5432",
    [string]$DatabaseName = "portfolio_db",
    [string]$DatabaseUser = "postgres",
    [string]$DatabasePassword = "postgres"
)

Write-Host "🌱 Seeding production data..." -ForegroundColor Green

# Check if database is running
Write-Host "📊 Checking database connection..." -ForegroundColor Yellow
$dbCheck = docker exec portfolio_postgres psql -U $DatabaseUser -d $DatabaseName -c "SELECT 1;" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Database is not running. Please start it first:" -ForegroundColor Red
    Write-Host "   docker-compose up -d postgres" -ForegroundColor White
    exit 1
}

Write-Host "✅ Database is running" -ForegroundColor Green

# Run the seed script
Write-Host "🌱 Running production seed script..." -ForegroundColor Yellow
docker exec -i portfolio_postgres psql -U $DatabaseUser -d $DatabaseName < scripts/seed-production-data.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Production data seeded successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Created:" -ForegroundColor Cyan
    Write-Host "   • 1 Main Account (tung@example.com)" -ForegroundColor White
    Write-Host "   • 1 Default Portfolio" -ForegroundColor White
    Write-Host "   • 3 Global Assets (VCB, FPT, GOLD)" -ForegroundColor White
    Write-Host "   • 3 Assets" -ForegroundColor White
    Write-Host "   • 3 Asset Prices" -ForegroundColor White
    Write-Host "   • 2 Cash Flows" -ForegroundColor White
    Write-Host "   • 1 NAV Snapshot" -ForegroundColor White
    Write-Host ""
    Write-Host "🚀 Production system is now ready!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to seed production data. Please check the error above." -ForegroundColor Red
    exit 1
}
