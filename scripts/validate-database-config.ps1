# Database Configuration Validation Script
# Validates all database configurations across the project

Write-Host "🔍 Validating Database Configuration..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Function to check if file exists
function Test-File {
    param($FilePath)
    if (Test-Path $FilePath) {
        Write-Host "✅ Found: $FilePath" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ Missing: $FilePath" -ForegroundColor Red
        return $false
    }
}

# Function to validate database config in file
function Test-DatabaseConfig {
    param($FilePath, $EnvironmentName)
    
    Write-Host "📋 Validating $EnvironmentName configuration in $FilePath..." -ForegroundColor Yellow
    
    if (-not (Test-Path $FilePath)) {
        Write-Host "❌ File not found: $FilePath" -ForegroundColor Red
        return 1
    }
    
    $errors = 0
    $content = Get-Content $FilePath -Raw
    
    # Check for required variables
    if ($content -match "DB_HOST") {
        Write-Host "  ✅ DB_HOST found" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  DB_HOST not found" -ForegroundColor Yellow
        $errors++
    }
    
    if ($content -match "DB_PORT") {
        Write-Host "  ✅ DB_PORT found" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  DB_PORT not found" -ForegroundColor Yellow
        $errors++
    }
    
    if ($content -match "DB_USERNAME") {
        Write-Host "  ✅ DB_USERNAME found" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  DB_USERNAME not found" -ForegroundColor Yellow
        $errors++
    }
    
    if ($content -match "DB_PASSWORD") {
        Write-Host "  ✅ DB_PASSWORD found" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  DB_PASSWORD not found" -ForegroundColor Yellow
        $errors++
    }
    
    if ($content -match "DB_DATABASE") {
        Write-Host "  ✅ DB_DATABASE found" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  DB_DATABASE not found" -ForegroundColor Yellow
        $errors++
    }
    
    # Check for DATABASE_URL
    if ($content -match "DATABASE_URL") {
        Write-Host "  ✅ DATABASE_URL found" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  DATABASE_URL not found" -ForegroundColor Yellow
        $errors++
    }
    
    # Check for insecure passwords
    if ($content -match "password" -and $content -notmatch "secure_password") {
        Write-Host "  ❌ Insecure password detected" -ForegroundColor Red
        $errors++
    }
    
    if ($errors -eq 0) {
        Write-Host "  ✅ $EnvironmentName configuration is valid" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $EnvironmentName configuration has $errors issues" -ForegroundColor Red
    }
    
    return $errors
}

# Function to validate Docker Compose config
function Test-DockerComposeConfig {
    param($FilePath, $EnvironmentName)
    
    Write-Host "📋 Validating $EnvironmentName Docker Compose configuration in $FilePath..." -ForegroundColor Yellow
    
    if (-not (Test-Path $FilePath)) {
        Write-Host "❌ File not found: $FilePath" -ForegroundColor Red
        return 1
    }
    
    $errors = 0
    $content = Get-Content $FilePath -Raw
    
    # Check for POSTGRES_USER
    if ($content -match "POSTGRES_USER") {
        Write-Host "  ✅ POSTGRES_USER found" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  POSTGRES_USER not found" -ForegroundColor Yellow
        $errors++
    }
    
    # Check for POSTGRES_PASSWORD
    if ($content -match "POSTGRES_PASSWORD") {
        Write-Host "  ✅ POSTGRES_PASSWORD found" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  POSTGRES_PASSWORD not found" -ForegroundColor Yellow
        $errors++
    }
    
    # Check for POSTGRES_DB
    if ($content -match "POSTGRES_DB") {
        Write-Host "  ✅ POSTGRES_DB found" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  POSTGRES_DB not found" -ForegroundColor Yellow
        $errors++
    }
    
    if ($errors -eq 0) {
        Write-Host "  ✅ $EnvironmentName Docker Compose configuration is valid" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $EnvironmentName Docker Compose configuration has $errors issues" -ForegroundColor Red
    }
    
    return $errors
}

# Function to validate deployment scripts
function Test-DeploymentScript {
    param($FilePath, $ScriptName)
    
    Write-Host "📋 Validating $ScriptName deployment script..." -ForegroundColor Yellow
    
    if (-not (Test-Path $FilePath)) {
        Write-Host "❌ File not found: $FilePath" -ForegroundColor Red
        return 1
    }
    
    $errors = 0
    $content = Get-Content $FilePath -Raw
    
    # Check for DATABASE_URL construction
    if ($content -match "DATABASE_URL.*postgresql://") {
        Write-Host "  ✅ DATABASE_URL construction found" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  DATABASE_URL construction not found" -ForegroundColor Yellow
        $errors++
    }
    
    # Check for secure password
    if ($content -match "secure_password") {
        Write-Host "  ✅ Secure password found" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Insecure password detected" -ForegroundColor Red
        $errors++
    }
    
    # Check for AWS Secrets Manager
    if ($content -match "secretsmanager") {
        Write-Host "  ✅ AWS Secrets Manager integration found" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  AWS Secrets Manager integration not found" -ForegroundColor Yellow
        $errors++
    }
    
    if ($errors -eq 0) {
        Write-Host "  ✅ $ScriptName deployment script is valid" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $ScriptName deployment script has $errors issues" -ForegroundColor Red
    }
    
    return $errors
}

# Main validation
Write-Host "🔍 Starting database configuration validation..." -ForegroundColor Green
Write-Host ""

$totalErrors = 0

# Check required files
Write-Host "📁 Checking required files..." -ForegroundColor Yellow
Test-File "env.example"
Test-File "docker-compose.yml"
Test-File "infrastructure/production.env"
Test-File "scripts/deploy-to-aws.sh"
Test-File "scripts/deploy-to-aws.ps1"
Write-Host ""

# Validate environment configurations
Write-Host "🔧 Validating environment configurations..." -ForegroundColor Yellow
$totalErrors += Test-DatabaseConfig "env.example" "Example Environment"
$totalErrors += Test-DatabaseConfig "infrastructure/production.env" "Production Environment"
Write-Host ""

# Validate Docker Compose configurations
Write-Host "🐳 Validating Docker Compose configurations..." -ForegroundColor Yellow
$totalErrors += Test-DockerComposeConfig "docker-compose.yml" "Local Development"

if (Test-Path "test/docker-compose.test.yml") {
    $totalErrors += Test-DockerComposeConfig "test/docker-compose.test.yml" "Test Environment"
}
Write-Host ""

# Validate deployment scripts
Write-Host "🚀 Validating deployment scripts..." -ForegroundColor Yellow
$totalErrors += Test-DeploymentScript "scripts/deploy-to-aws.sh" "Bash Deployment Script"
$totalErrors += Test-DeploymentScript "scripts/deploy-to-aws.ps1" "PowerShell Deployment Script"
Write-Host ""

# Validate application configuration
Write-Host "📱 Validating application configuration..." -ForegroundColor Yellow
if (Test-Path "src/app.module.ts") {
    Write-Host "📋 Validating app.module.ts..." -ForegroundColor Yellow
    $content = Get-Content "src/app.module.ts" -Raw
    
    if ($content -match "process.env.DB_HOST") {
        Write-Host "  ✅ DB_HOST environment variable usage found" -ForegroundColor Green
    } else {
        Write-Host "  ❌ DB_HOST environment variable usage not found" -ForegroundColor Red
        $totalErrors++
    }
    
    if ($content -match "process.env.DB_USERNAME") {
        Write-Host "  ✅ DB_USERNAME environment variable usage found" -ForegroundColor Green
    } else {
        Write-Host "  ❌ DB_USERNAME environment variable usage not found" -ForegroundColor Red
        $totalErrors++
    }
    
    if ($content -match "process.env.DB_PASSWORD") {
        Write-Host "  ✅ DB_PASSWORD environment variable usage found" -ForegroundColor Green
    } else {
        Write-Host "  ❌ DB_PASSWORD environment variable usage not found" -ForegroundColor Red
        $totalErrors++
    }
    
    if ($content -match "process.env.DB_DATABASE") {
        Write-Host "  ✅ DB_DATABASE environment variable usage found" -ForegroundColor Green
    } else {
        Write-Host "  ❌ DB_DATABASE environment variable usage not found" -ForegroundColor Red
        $totalErrors++
    }
} else {
    Write-Host "❌ src/app.module.ts not found" -ForegroundColor Red
    $totalErrors++
}
Write-Host ""

# Summary
Write-Host "📊 Validation Summary" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
if ($totalErrors -eq 0) {
    Write-Host "✅ All database configurations are valid!" -ForegroundColor Green
    Write-Host "🎉 No issues found." -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ Found $totalErrors issues in database configuration" -ForegroundColor Red
    Write-Host "⚠️  Please review and fix the issues above." -ForegroundColor Yellow
    exit 1
}
