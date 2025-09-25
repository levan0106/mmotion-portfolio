# Simple Migration Verification Script (PowerShell)
# This script verifies the migration status and precision

param(
    [switch]$Help
)

if ($Help) {
    Write-Host "Usage: .\scripts\verify-migration-simple.ps1"
    Write-Host "This script verifies the migration status and precision"
    exit 0
}

# Functions
function Write-Log {
    param([string]$Message)
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message" -ForegroundColor Blue
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

# Check if Docker is running
function Test-Docker {
    try {
        docker ps | Out-Null
        Write-Success "Docker is running"
        return $true
    }
    catch {
        Write-Error "Docker is not running. Please start Docker first."
        return $false
    }
}

# Check if PostgreSQL container is running
function Test-PostgreSQL {
    $postgresRunning = docker ps | Select-String "portfolio_postgres"
    if ($postgresRunning) {
        Write-Success "PostgreSQL container is running"
        return $true
    }
    else {
        Write-Error "PostgreSQL container is not running. Please start it first."
        return $false
    }
}

# Check table existence
function Test-Tables {
    Write-Log "Checking table existence..."
    
    # Check fund_unit_transactions table
    $tableExists = docker exec portfolio_postgres psql -U postgres -d portfolio_db -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'fund_unit_transactions')" | ForEach-Object { $_.Trim() }
    
    if ($tableExists -eq "t") {
        Write-Success "fund_unit_transactions table exists"
    }
    else {
        Write-Error "fund_unit_transactions table does not exist"
    }
}

# Check precision for specific columns
function Test-Precision {
    Write-Log "Checking precision for key columns..."
    
    # Check investor_holdings precision
    $holdingPrecision = docker exec portfolio_postgres psql -U postgres -d portfolio_db -t -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'investor_holdings' AND column_name IN ('total_units', 'avg_cost_per_unit', 'total_investment', 'current_value', 'unrealized_pnl', 'realized_pnl') AND numeric_scale = 3" | ForEach-Object { $_.Trim() }
    
    if ($holdingPrecision -eq "6") {
        Write-Success "investor_holdings precision is correct (3 decimal places)"
    }
    else {
        Write-Error "investor_holdings precision is incorrect. Expected 6 columns with scale 3, found $holdingPrecision"
    }
    
    # Check fund_unit_transactions precision
    $fundPrecision = docker exec portfolio_postgres psql -U postgres -d portfolio_db -t -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'fund_unit_transactions' AND column_name IN ('units', 'nav_per_unit', 'amount') AND numeric_scale = 3" | ForEach-Object { $_.Trim() }
    
    if ($fundPrecision -eq "3") {
        Write-Success "fund_unit_transactions precision is correct (3 decimal places)"
    }
    else {
        Write-Error "fund_unit_transactions precision is incorrect. Expected 3 columns with scale 3, found $fundPrecision"
    }
}

# Check migration status
function Test-Migrations {
    Write-Log "Checking migration status..."
    
    # Get executed migrations
    $migrationsResult = docker exec portfolio_postgres psql -U postgres -d portfolio_db -t -c "SELECT COUNT(*) FROM migrations WHERE name LIKE '%Nav%' OR name LIKE '%Fund%' OR name LIKE '%Precision%'"
    $migrations = ($migrationsResult | ForEach-Object { $_.Trim() }) | Where-Object { $_ -ne "" } | Select-Object -First 1
    
    if ([int]$migrations -ge 6) {
        Write-Success "All required migrations have been executed ($migrations found)"
    }
    else {
        Write-Warning "Some migrations may be missing. Found $migrations migrations, expected at least 6"
    }
}

# Run detailed verification
function Invoke-DetailedVerification {
    Write-Log "Running detailed verification..."
    
    # Run the SQL verification script
    Get-Content "scripts/verify-database-precision.sql" | docker exec -i portfolio_postgres psql -U postgres -d portfolio_db
}

# Main function
function Main {
    Write-Log "Starting migration verification..."
    
    if (-not (Test-Docker)) { exit 1 }
    if (-not (Test-PostgreSQL)) { exit 1 }
    
    Test-Tables
    Test-Precision
    Test-Migrations
    
    Invoke-DetailedVerification
    
    Write-Success "Migration verification completed!"
    
    Write-Host ""
    Write-Log "Summary:"
    Write-Log "✅ Database precision verification completed"
    Write-Log "✅ Table structure verification completed"
    Write-Log "✅ Migration status verification completed"
    Write-Host ""
    Write-Log "If all checks passed, the system is ready for use with 3 decimal places precision."
}

# Run main function
Main
