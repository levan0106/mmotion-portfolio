param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile,
    
    [string]$ContainerName = "portfolio-postgres",
    [string]$DbName = "portfolio_db",
    [string]$DbUser = "postgres",
    [switch]$Force = $false
)

Write-Host "=== Database Restore from Backup ===" -ForegroundColor Cyan
Write-Host "Backup file: $BackupFile"
Write-Host "Database: $DbName"
Write-Host "Container: $ContainerName"
Write-Host ""

# Check if backup file exists
if (!(Test-Path $BackupFile)) {
    Write-Host "Error: Backup file not found: $BackupFile" -ForegroundColor Red
    exit 1
}

# Check if it's a compressed file
$IsCompressed = $BackupFile.EndsWith('.gz')
$ExtractedFile = if ($IsCompressed) { $BackupFile -replace '\.gz$', '' } else { $BackupFile }

Write-Host "=== Preparing restore ===" -ForegroundColor Cyan

# Extract if compressed
if ($IsCompressed) {
    Write-Host "Extracting compressed backup file..." -ForegroundColor Yellow
    & gunzip -c $BackupFile > $ExtractedFile
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to extract backup file" -ForegroundColor Red
        exit 1
    }
    Write-Host "Backup extracted successfully" -ForegroundColor Green
}

# Check if database exists and ask for confirmation
$dbExists = docker-compose exec postgres psql -U $DbUser -lqt | Select-String "\b$DbName\b"
if ($dbExists -and !$Force) {
    Write-Host "Database '$DbName' already exists!" -ForegroundColor Yellow
    $confirm = Read-Host "Do you want to drop and recreate it? (y/N)"
    if ($confirm -ne 'y' -and $confirm -ne 'Y') {
        Write-Host "Restore cancelled" -ForegroundColor Yellow
        if ($IsCompressed) { Remove-Item $ExtractedFile -Force }
        exit 0
    }
}

# Drop and recreate database
Write-Host "=== Dropping and recreating database ===" -ForegroundColor Cyan
docker-compose exec postgres psql -U $DbUser -c "DROP DATABASE IF EXISTS $DbName;"
docker-compose exec postgres psql -U $DbUser -c "CREATE DATABASE $DbName;"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to recreate database" -ForegroundColor Red
    if ($IsCompressed) { Remove-Item $ExtractedFile -Force }
    exit 1
}
Write-Host "Database recreated successfully" -ForegroundColor Green

# Restore database
Write-Host "=== Restoring database ===" -ForegroundColor Cyan
Get-Content $ExtractedFile | docker-compose exec -T postgres psql -U $DbUser -d $DbName

if ($LASTEXITCODE -eq 0) {
    Write-Host "Database restored successfully!" -ForegroundColor Green
} else {
    Write-Host "Database restore failed!" -ForegroundColor Red
    if ($IsCompressed) { Remove-Item $ExtractedFile -Force }
    exit 1
}

# Cleanup extracted file
if ($IsCompressed) {
    Remove-Item $ExtractedFile -Force
    Write-Host "Cleaned up extracted file" -ForegroundColor Green
}

# Show summary
Write-Host "=== Restore Summary ===" -ForegroundColor Cyan
Write-Host "Database: $DbName"
Write-Host "Container: $ContainerName"
Write-Host "Backup file: $BackupFile"
Write-Host "Status: Successfully restored"

Write-Host ""
Write-Host "Database restore completed successfully!" -ForegroundColor Green
Write-Host "You can now start your application with the restored database."
