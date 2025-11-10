param(
    [Parameter(Mandatory=$true)]
    [string]$TargetServer,
    
    [Parameter(Mandatory=$true)]
    [string]$TargetUser,
    
    [string]$KeyPath="F:\\code\\mmotion-portfolio\\mmo-portfolio-key.pem",
    [string]$ContainerName = "portfolio-postgres",
    [string]$DbName = "portfolio_db",
    [string]$DbUser = "postgres",
    [string]$RemoteBackupDir = "/home/ec2-user/mmotion-portfolio/backups",
    [string]$LocalBackupDir = ".\backups"
)

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$LocalBackupPath = "$LocalBackupDir\$Timestamp"
$BackupName = "portfolio_backup_$Timestamp"

Write-Host "=== Remote Production Data Backup Process ===" -ForegroundColor Cyan
Write-Host "EC2 Server: $TargetUser@$TargetServer"
Write-Host "Database: $DbName"
Write-Host "Container: $ContainerName"
Write-Host "Local backup dir: $LocalBackupPath"
Write-Host ""

# Test SSH connection
Write-Host "=== Testing SSH connection ===" -ForegroundColor Cyan
$sshTest = & ssh -i $KeyPath -o ConnectTimeout=10 -o BatchMode=yes "$TargetUser@$TargetServer" "echo 'SSH connection successful'" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "SSH connection failed: $sshTest" -ForegroundColor Red
    exit 1
}
Write-Host "SSH connection established" -ForegroundColor Green

# Create local backup directory
Write-Host "=== Creating local backup directory ===" -ForegroundColor Cyan
if (!(Test-Path $LocalBackupDir)) {
    New-Item -ItemType Directory -Path $LocalBackupDir -Force | Out-Null
    Write-Host "Created backup directory: $LocalBackupDir" -ForegroundColor Green
}

if (!(Test-Path $LocalBackupPath)) {
    New-Item -ItemType Directory -Path $LocalBackupPath -Force | Out-Null
    Write-Host "Created timestamped backup directory: $LocalBackupPath" -ForegroundColor Green
}

# Create backup directory on remote server
Write-Host "=== Creating backup directory on remote server ===" -ForegroundColor Cyan
& ssh -i $KeyPath "$TargetUser@$TargetServer" "mkdir -p '$RemoteBackupDir/$Timestamp'"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to create backup directory" -ForegroundColor Red
    exit 1
}

# Create backup
Write-Host "=== Creating data-only backup (UTF-8 inserts) ===" -ForegroundColor Cyan
$backupCommand = "docker exec -e PGCLIENTENCODING=UTF8 -e LC_ALL=en_US.UTF-8 -e LANG=en_US.UTF-8 $ContainerName pg_dump -U $DbUser -d $DbName --data-only --inserts --no-owner --no-privileges --encoding=UTF8 --verbose > '$RemoteBackupDir/$Timestamp/$BackupName.sql'"
& ssh -i $KeyPath "$TargetUser@$TargetServer" $backupCommand

if ($LASTEXITCODE -ne 0) {
    Write-Host "Database backup failed" -ForegroundColor Red
    exit 1
}
Write-Host "Database backup completed" -ForegroundColor Green

# Compress backup
Write-Host "=== Compressing backup file ===" -ForegroundColor Cyan
& ssh -i $KeyPath "$TargetUser@$TargetServer" "gzip '$RemoteBackupDir/$Timestamp/$BackupName.sql'"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Compression failed" -ForegroundColor Red
    exit 1
}
Write-Host "Backup compressed successfully" -ForegroundColor Green

# Verify backup
Write-Host "=== Verifying backup integrity ===" -ForegroundColor Cyan
& ssh -i $KeyPath "$TargetUser@$TargetServer" "gzip -t '$RemoteBackupDir/$Timestamp/$BackupName.sql.gz'"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Backup file is corrupted" -ForegroundColor Red
    exit 1
}
Write-Host "Backup file is valid" -ForegroundColor Green

# Download backup file
Write-Host "=== Downloading backup file from remote server ===" -ForegroundColor Cyan
$RemoteBackupFile = "$RemoteBackupDir/$Timestamp/$BackupName.sql.gz"
$LocalBackupFile = "$LocalBackupPath/$BackupName.sql.gz"

Write-Host "Downloading: $TargetUser@$TargetServer`:$RemoteBackupFile"
Write-Host "To local: $LocalBackupFile"

& scp -i $KeyPath "$TargetUser@$TargetServer`:$RemoteBackupFile" $LocalBackupFile

if ($LASTEXITCODE -eq 0) {
    $fileSize = (Get-Item $LocalBackupFile).Length / 1MB
    Write-Host "Backup downloaded successfully: $([math]::Round($fileSize,2)) MB" -ForegroundColor Green
} else {
    Write-Host "Download failed" -ForegroundColor Red
    exit 1
}

# Cleanup remote files
Write-Host "=== Cleaning up remote backup files ===" -ForegroundColor Cyan
$cleanupCommand = "find '$RemoteBackupDir' -name '*.gz' -type f -mtime +7 -delete 2>/dev/null; true"
& ssh -i $KeyPath "$TargetUser@$TargetServer" $cleanupCommand

if ($LASTEXITCODE -eq 0) {
    Write-Host "Remote cleanup completed" -ForegroundColor Green
} else {
    Write-Host "Remote cleanup failed (non-critical)" -ForegroundColor Yellow
}

# Show summary
Write-Host "=== Backup Summary ===" -ForegroundColor Cyan
Write-Host "Remote server: $TargetUser@$TargetServer"
Write-Host "Database: $DbName"
Write-Host "Container: $ContainerName"
Write-Host "Local backup: $LocalBackupPath"
Write-Host "Backup file: $BackupName.sql.gz"
Write-Host "Encoding: UTF-8 (Vietnamese supported)"
Write-Host "Timestamp: $Timestamp"

if (Test-Path "$LocalBackupPath/$BackupName.sql.gz") {
    $fileSize = (Get-Item "$LocalBackupPath/$BackupName.sql.gz").Length / 1MB
    Write-Host "File size: $([math]::Round($fileSize,2)) MB"
}

Write-Host "Remote backup process completed successfully" -ForegroundColor Green
Write-Host ""
Write-Host "Backup file location: $LocalBackupPath\$BackupName.sql.gz"
Write-Host "To restore this backup:"
Write-Host "  1. Extract: gunzip $LocalBackupPath\$BackupName.sql.gz"
Write-Host "  2. Restore: docker exec -i $ContainerName psql -U $DbUser -d $DbName -f $LocalBackupPath\$BackupName.sql"
