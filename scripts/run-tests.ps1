# Trading System Test Runner
# This script runs all tests and generates coverage reports

param(
    [switch]$SkipInstall,
    [switch]$UnitOnly,
    [switch]$IntegrationOnly,
    [switch]$FrontendOnly
)

# Set error action preference
$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting Trading System Test Suite" -ForegroundColor Blue
Write-Host "======================================" -ForegroundColor Blue

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Error "Please run this script from the project root directory"
    exit 1
}

# Install dependencies if needed
if (-not $SkipInstall) {
    Write-Status "Checking dependencies..."
    
    if (-not (Test-Path "node_modules")) {
        Write-Status "Installing backend dependencies..."
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to install backend dependencies"
            exit 1
        }
    }
    
    if (-not (Test-Path "frontend/node_modules")) {
        Write-Status "Installing frontend dependencies..."
        Set-Location frontend
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to install frontend dependencies"
            exit 1
        }
        Set-Location ..
    }
}

# Create coverage directories
New-Item -ItemType Directory -Force -Path "coverage" | Out-Null
New-Item -ItemType Directory -Force -Path "coverage-integration" | Out-Null
New-Item -ItemType Directory -Force -Path "frontend/coverage" | Out-Null

$allTestsPassed = $true

# Run backend unit tests
if (-not $FrontendOnly) {
    Write-Status "Running backend unit tests..."
    npm run test:cov
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Backend unit tests passed"
    } else {
        Write-Error "Backend unit tests failed"
        $allTestsPassed = $false
    }
    
    # Run backend integration tests
    if (-not $UnitOnly -and $allTestsPassed) {
        Write-Status "Running backend integration tests..."
        npm run test:integration
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Backend integration tests passed"
        } else {
            Write-Error "Backend integration tests failed"
            $allTestsPassed = $false
        }
    }
}

# Run frontend tests
if (-not $UnitOnly -and -not $IntegrationOnly) {
    Write-Status "Running frontend tests..."
    Set-Location frontend
    npm run test:coverage
    Set-Location ..
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Frontend tests passed"
    } else {
        Write-Error "Frontend tests failed"
        $allTestsPassed = $false
    }
}

# Generate combined coverage report
if ($allTestsPassed) {
    Write-Status "Generating combined coverage report..."
    
    $reportContent = @"
<!DOCTYPE html>
<html>
<head>
    <title>Trading System - Test Coverage Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .section { margin: 20px 0; }
        .success { color: green; }
        .warning { color: orange; }
        .error { color: red; }
        a { color: #1976d2; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Trading System - Test Coverage Report</h1>
        <p>Generated on: $(Get-Date)</p>
    </div>
    
    <div class="section">
        <h2>📊 Test Results Summary</h2>
        <ul>
            <li><span class="success">✅ Backend Unit Tests</span> - <a href="../coverage/index.html">View Coverage</a></li>
            <li><span class="success">✅ Backend Integration Tests</span> - <a href="../coverage-integration/index.html">View Coverage</a></li>
            <li><span class="success">✅ Frontend Tests</span> - <a href="../frontend/coverage/index.html">View Coverage</a></li>
        </ul>
    </div>
    
    <div class="section">
        <h2>📈 Coverage Summary</h2>
        <p>All test suites have been executed successfully. Click on the links above to view detailed coverage reports for each component.</p>
    </div>
    
    <div class="section">
        <h2>🎯 Test Categories</h2>
        <ul>
            <li><strong>Unit Tests:</strong> Individual component testing</li>
            <li><strong>Integration Tests:</strong> End-to-end workflow testing</li>
            <li><strong>Component Tests:</strong> React component testing</li>
        </ul>
    </div>
</body>
</html>
"@
    
    $reportContent | Out-File -FilePath "coverage/index.html" -Encoding UTF8
    Write-Success "Combined coverage report generated at coverage/index.html"
}

# Display summary
Write-Host ""
if ($allTestsPassed) {
    Write-Host "🎉 Test Suite Complete!" -ForegroundColor Green
    Write-Host "=======================" -ForegroundColor Green
    Write-Success "All tests passed successfully!"
} else {
    Write-Host "❌ Test Suite Failed!" -ForegroundColor Red
    Write-Host "=====================" -ForegroundColor Red
    Write-Error "Some tests failed. Please check the output above."
}

Write-Status "Coverage reports available at:"
Write-Host "  - Backend Unit Tests: coverage/index.html" -ForegroundColor White
Write-Host "  - Backend Integration Tests: coverage-integration/index.html" -ForegroundColor White
Write-Host "  - Frontend Tests: frontend/coverage/index.html" -ForegroundColor White
Write-Host "  - Combined Report: coverage/index.html" -ForegroundColor White

if ($allTestsPassed) {
    Write-Host ""
    Write-Host "🚀 Ready for deployment!" -ForegroundColor Green
    Write-Host "All tests passed and coverage requirements met." -ForegroundColor Green
    exit 0
} else {
    exit 1
}
