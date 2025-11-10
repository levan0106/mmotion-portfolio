param(
    [Parameter(Mandatory=$true)]
    [string]$TargetServer,
    
    [Parameter(Mandatory=$true)]
    [string]$TargetUser,
    
    [string]$KeyPath="F:\\code\\mmotion-portfolio\\mmo-portfolio-key.pem",
    [string]$ContainerName = "portfolio-postgres",
    [string]$DbName = "portfolio_db",
    [string]$DbUser = "postgres"
)

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupName = "portfolio_schema_backup_$Timestamp"
$LocalBackupDir = ".\backups\$Timestamp"

Write-Host "=== Production Schema-Only Backup ===" -ForegroundColor Cyan
Write-Host "Server: $TargetUser@$TargetServer"
Write-Host "Database: $DbName"
Write-Host "Container: $ContainerName"
Write-Host "Backup Name: $BackupName"
Write-Host ""

# Create local backup directory
if (!(Test-Path $LocalBackupDir)) {
    New-Item -ItemType Directory -Path $LocalBackupDir -Force | Out-Null
    Write-Host "Created backup directory: $LocalBackupDir" -ForegroundColor Green
}

# Test SSH connection
Write-Host "=== Testing SSH connection ===" -ForegroundColor Cyan
$sshTest = & ssh -i $KeyPath -o ConnectTimeout=10 -o BatchMode=yes "$TargetUser@$TargetServer" "echo 'SSH connection successful'" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "SSH connection failed: $sshTest" -ForegroundColor Red
    exit 1
}
Write-Host "SSH connection established" -ForegroundColor Green

# Create schema-only backup
Write-Host "=== Creating schema-only backup ===" -ForegroundColor Cyan
$backupCommand = "docker exec -e PGCLIENTENCODING=UTF8 -e LC_ALL=en_US.UTF-8 -e LANG=en_US.UTF-8 $ContainerName pg_dump -U $DbUser -d $DbName --schema-only --verbose --no-owner --no-privileges --encoding=UTF8 > /tmp/$BackupName.sql"
& ssh -i $KeyPath "$TargetUser@$TargetServer" $backupCommand

if ($LASTEXITCODE -ne 0) {
    Write-Host "Database backup failed" -ForegroundColor Red
    exit 1
}
Write-Host "Schema backup completed" -ForegroundColor Green

# Compress backup
Write-Host "=== Compressing backup file ===" -ForegroundColor Cyan
& ssh -i $KeyPath "$TargetUser@$TargetServer" "gzip /tmp/$BackupName.sql"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Compression failed" -ForegroundColor Red
    exit 1
}
Write-Host "Backup compressed successfully" -ForegroundColor Green

# Download backup file
Write-Host "=== Downloading backup file ===" -ForegroundColor Cyan
$LocalBackupFile = "$LocalBackupDir/$BackupName.sql.gz"
& scp -i $KeyPath "$TargetUser@$TargetServer`:/tmp/$BackupName.sql.gz" $LocalBackupFile

if ($LASTEXITCODE -eq 0) {
    $fileSize = (Get-Item $LocalBackupFile).Length / 1MB
    Write-Host "Backup downloaded successfully: $([math]::Round($fileSize,2)) MB" -ForegroundColor Green
} else {
    Write-Host "Download failed" -ForegroundColor Red
    exit 1
}

# Cleanup remote file
Write-Host "=== Cleaning up remote file ===" -ForegroundColor Cyan
& ssh -i $KeyPath "$TargetUser@$TargetServer" "rm /tmp/$BackupName.sql.gz"
Write-Host "Remote file cleaned up" -ForegroundColor Green

# Create restore script
$RestoreScript = @"
#!/bin/bash
# Schema-Only Database Restore Script
# Generated on $(Get-Date)

echo "=== Restoring Schema-Only Database ==="
echo "Database: $DbName"
echo "Container: $ContainerName"
echo "Backup file: $BackupName.sql.gz"
echo ""

# Check if backup file exists
if [ ! -f "$BackupName.sql.gz" ]; then
    echo "Error: Backup file $BackupName.sql.gz not found!"
    exit 1
fi

# Extract backup file
echo "Extracting backup file..."
gunzip -c $BackupName.sql.gz > $BackupName.sql

# Create database if not exists
echo "Creating database if not exists..."
docker exec $ContainerName psql -U $DbUser -c "CREATE DATABASE $DbName;" 2>/dev/null || echo "Database already exists"

# Restore schema
echo "Restoring schema..."
docker exec -i $ContainerName psql -U $DbUser -d $DbName -f $BackupName.sql

if [ `$? -eq 0 ]; then
    echo "Schema restored successfully!"
    echo "Cleaning up extracted file..."
    rm $BackupName.sql
    echo "Schema restore completed!"
else
    echo "Schema restore failed!"
    exit 1
fi
"@

$RestoreScript | Out-File -FilePath "$LocalBackupDir/restore_schema.sh" -Encoding UTF8

# Show summary
Write-Host "=== Backup Summary ===" -ForegroundColor Cyan
Write-Host "Server: $TargetUser@$TargetServer"
Write-Host "Database: $DbName"
Write-Host "Backup Type: Schema-Only"
Write-Host "Local backup: $LocalBackupDir"
Write-Host "Backup file: $BackupName.sql.gz"
Write-Host "Restore script: restore_schema.sh"
Write-Host "Timestamp: $Timestamp"

if (Test-Path $LocalBackupFile) {
    $fileSize = (Get-Item $LocalBackupFile).Length / 1MB
    Write-Host "File size: $([math]::Round($fileSize,2)) MB"
}

Write-Host ""
Write-Host "Schema backup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "To restore this schema:"
Write-Host "  1. Extract: gunzip $LocalBackupDir\$BackupName.sql.gz"
Write-Host "  2. Restore: docker exec -i $ContainerName psql -U $DbUser -d $DbName -f $LocalBackupDir\$BackupName.sql"
Write-Host "  3. Or use restore script: bash $LocalBackupDir\restore_schema.sh"
