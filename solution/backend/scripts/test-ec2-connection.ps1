# PowerShell script to test EC2 database connection
# Usage: .\test-ec2-connection.ps1 -TargetServer <EC2_IP> -TargetUser <USER> -DatabaseName <DB_NAME>

param(
    [Parameter(Mandatory=$true)]
    [string]$TargetServer,
    
    [Parameter(Mandatory=$true)]
    [string]$TargetUser,
    
    [Parameter(Mandatory=$false)]
    [string]$DatabaseName = "portfolio_db",
    
    [Parameter(Mandatory=$false)]
    [string]$DatabaseUser = "postgres",
    
    [Parameter(Mandatory=$false)]
    [string]$DatabasePassword = "postgres",
    
    [Parameter(Mandatory=$false)]
    [int]$DatabasePort = 5432
)

Write-Host "🔍 Testing EC2 database connection..." -ForegroundColor Green
Write-Host "📊 Target Server: $TargetServer" -ForegroundColor Cyan
Write-Host "🗄️  Database: $DatabaseName" -ForegroundColor Cyan
Write-Host "👤 User: $TargetUser" -ForegroundColor Cyan

# Test 1: Network connectivity
Write-Host "`n🌐 Testing network connectivity..." -ForegroundColor Yellow
try {
    $pingResult = Test-Connection -ComputerName $TargetServer -Count 1 -Quiet
    if ($pingResult) {
        Write-Host "✅ Network connectivity: OK" -ForegroundColor Green
    } else {
        Write-Host "❌ Network connectivity: FAILED" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Network connectivity: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Port connectivity
Write-Host "`n🔌 Testing port connectivity..." -ForegroundColor Yellow
try {
    $portTest = Test-NetConnection -ComputerName $TargetServer -Port $DatabasePort -WarningAction SilentlyContinue
    if ($portTest.TcpTestSucceeded) {
        Write-Host "✅ Port $DatabasePort connectivity: OK" -ForegroundColor Green
    } else {
        Write-Host "❌ Port $DatabasePort connectivity: FAILED" -ForegroundColor Red
        Write-Host "💡 Check if PostgreSQL is running and security group allows port $DatabasePort" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ Port connectivity: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 3: Database connection (if psql is available)
Write-Host "`n🗄️  Testing database connection..." -ForegroundColor Yellow
try {
    # Check if psql is available
    $psqlPath = Get-Command psql -ErrorAction SilentlyContinue
    if ($psqlPath) {
        $env:PGPASSWORD = $DatabasePassword
        $connectionString = "postgresql://$DatabaseUser@$TargetServer`:$DatabasePort/$DatabaseName"
        
        $dbTest = psql $connectionString -c "SELECT version();" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Database connection: OK" -ForegroundColor Green
            Write-Host "📊 PostgreSQL version: $($dbTest[1])" -ForegroundColor Cyan
        } else {
            Write-Host "❌ Database connection: FAILED" -ForegroundColor Red
            Write-Host "💡 Check database credentials and permissions" -ForegroundColor Yellow
            exit 1
        }
    } else {
        Write-Host "⚠️  psql not found, skipping database connection test" -ForegroundColor Yellow
        Write-Host "💡 Install PostgreSQL client tools for full testing" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Database connection: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 4: SSH connectivity (if SSH is available)
Write-Host "`n🔐 Testing SSH connectivity..." -ForegroundColor Yellow
try {
    $sshPath = Get-Command ssh -ErrorAction SilentlyContinue
    if ($sshPath) {
        $sshTest = ssh -o ConnectTimeout=10 -o BatchMode=yes $TargetUser@$TargetServer "echo 'SSH connection successful'" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ SSH connection: OK" -ForegroundColor Green
        } else {
            Write-Host "⚠️  SSH connection: FAILED (may require key authentication)" -ForegroundColor Yellow
            Write-Host "💡 SSH may require key-based authentication" -ForegroundColor Cyan
        }
    } else {
        Write-Host "⚠️  SSH not found, skipping SSH test" -ForegroundColor Yellow
        Write-Host "💡 Install OpenSSH or Git for Windows for SSH testing" -ForegroundColor Cyan
    }
} catch {
    Write-Host "⚠️  SSH connection: FAILED - $($_.Exception.Message)" -ForegroundColor Yellow
}

# Test 5: Node.js and npm
Write-Host "`n📦 Testing Node.js environment..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    $npmVersion = npm --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
    Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js/npm: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 6: Project build
Write-Host "`n🔨 Testing project build..." -ForegroundColor Yellow
try {
    Write-Host "Building project..." -ForegroundColor Gray
    npm run build
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Project build: OK" -ForegroundColor Green
    } else {
        Write-Host "❌ Project build: FAILED" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Project build: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n🎉 All tests completed successfully!" -ForegroundColor Green
Write-Host "🚀 Ready to run migrations to EC2 instance" -ForegroundColor Cyan
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Run migration: npm run migrate:ec2" -ForegroundColor White
Write-Host "2. Or with SSH tunnel: npm run migrate:ec2:ssh" -ForegroundColor White
Write-Host "3. Or with batch script: npm run migrate:ec2:batch" -ForegroundColor White
