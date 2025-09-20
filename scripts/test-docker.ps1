# Docker Test Script for CR-006 Asset Snapshot System (PowerShell)

Write-Host "🚀 Starting Docker integration tests for CR-006 Asset Snapshot System..." -ForegroundColor Green

# Check if Docker is running
try {
    docker ps | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Docker is not running"
    }
} catch {
    Write-Host "❌ Docker is not running. Please start Docker and try again." -ForegroundColor Red
    exit 1
}

# Check if the application is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -ne 200) {
        throw "Application not responding"
    }
} catch {
    Write-Host "❌ Application is not running on port 3000. Please start the application and try again." -ForegroundColor Red
    exit 1
}

# Set environment variables for testing
$env:NODE_ENV = "test"
$env:DB_NAME = "portfolio_test"
$env:DB_HOST = "localhost"
$env:DB_PORT = "5432"
$env:DB_USERNAME = "postgres"
$env:DB_PASSWORD = "postgres"

Write-Host "✅ Environment variables set for testing" -ForegroundColor Green

# Run integration tests
Write-Host "🧪 Running integration tests..." -ForegroundColor Yellow
npm run test:e2e:docker

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Docker integration tests completed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Docker integration tests failed!" -ForegroundColor Red
    exit 1
}
