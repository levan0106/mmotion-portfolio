# Backup Production Database Script (PowerShell)
# This script creates a full backup of the production database before migration

param(
    [string]$DB_HOST = "localhost",
    [int]$DB_PORT = 5432,
    [string]$DB_NAME = "portfolio_production",
    [string]$DB_USER = "postgres",
    [string]$BACKUP_DIR = ".\backups"
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Create timestamp
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_FILE = Join-Path $BACKUP_DIR "portfolio_production_backup_$TIMESTAMP.sql"

Write-Host "🚀 Starting Production Database Backup" -ForegroundColor Green
Write-Host "================================================"

try {
    # Create backup directory if it doesn't exist
    if (!(Test-Path $BACKUP_DIR)) {
        New-Item -ItemType Directory -Path $BACKUP_DIR -Force | Out-Null
        Write-Host "📁 Created backup directory: $BACKUP_DIR" -ForegroundColor Yellow
    }

    # Check if pg_dump is available
    try {
        $null = Get-Command pg_dump -ErrorAction Stop
        Write-Host "✅ pg_dump command found" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Error: pg_dump command not found. Please install PostgreSQL client tools." -ForegroundColor Red
        exit 1
    }

    # Check database connection
    Write-Host "🔍 Checking database connection..." -ForegroundColor Yellow
    $testQuery = "SELECT 1;"
    $testResult = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c $testQuery 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error: Cannot connect to database. Please check your connection parameters." -ForegroundColor Red
        Write-Host "Error details: $testResult" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Database connection successful" -ForegroundColor Green

    # Create full backup
    Write-Host "📦 Creating full database backup..." -ForegroundColor Yellow
    Write-Host "Backup file: $BACKUP_FILE"

    $pgDumpArgs = @(
        "--host=$DB_HOST"
        "--port=$DB_PORT"
        "--username=$DB_USER"
        "--dbname=$DB_NAME"
        "--verbose"
        "--clean"
        "--create"
        "--if-exists"
        "--format=plain"
        "--file=$BACKUP_FILE"
    )

    & pg_dump @pgDumpArgs

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database backup completed successfully" -ForegroundColor Green
        
        # Get backup file size
        $BACKUP_SIZE = (Get-Item $BACKUP_FILE).Length
        $BACKUP_SIZE_HR = [math]::Round($BACKUP_SIZE / 1MB, 2)
        Write-Host "Backup size: $BACKUP_SIZE_HR MB" -ForegroundColor Green
        Write-Host "Backup location: $BACKUP_FILE" -ForegroundColor Green
        
        # Create backup info file
        $INFO_FILE = Join-Path $BACKUP_DIR "backup_info_$TIMESTAMP.txt"
        $INFO_CONTENT = @"
Backup Information
==================
Date: $(Get-Date)
Database: $DB_NAME
Host: $DB_HOST:$DB_PORT
User: $DB_USER
Backup File: $BACKUP_FILE
Backup Size: $BACKUP_SIZE_HR MB
Purpose: Pre-migration backup for Asset Management Improvements (CR-003)

Migration Details:
- Task: 1.4 - Backup Production Database
- Migration: Code to Symbol field standardization
- Risk Level: Medium (data transformation)

Restore Command:
psql --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" --dbname="postgres" --file="$BACKUP_FILE"
"@
        
        $INFO_CONTENT | Out-File -FilePath $INFO_FILE -Encoding UTF8
        Write-Host "📋 Backup info saved to: $INFO_FILE" -ForegroundColor Green
        
    } else {
        Write-Host "❌ Database backup failed" -ForegroundColor Red
        exit 1
    }

    # Test backup integrity (basic check)
    Write-Host "🔍 Testing backup integrity..." -ForegroundColor Yellow
    if (Test-Path $BACKUP_FILE) {
        $fileSize = (Get-Item $BACKUP_FILE).Length
        if ($fileSize -gt 0) {
            Write-Host "✅ Backup file exists and has content" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Warning: Backup file is empty" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Error: Backup file was not created" -ForegroundColor Red
        exit 1
    }

    Write-Host "🎉 Production database backup completed successfully!" -ForegroundColor Green
    Write-Host "================================================"
    Write-Host "Next steps:"
    Write-Host "1. Verify backup file: $BACKUP_FILE"
    Write-Host "2. Test restore on development environment"
    Write-Host "3. Proceed with migration when ready"
    Write-Host "4. Keep backup file safe until migration is confirmed successful"

} catch {
    Write-Host "❌ Script failed with error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Stack trace: $($_.ScriptStackTrace)" -ForegroundColor Red
    exit 1
}
