
# Sử dụng với auto-detect container
# .\scripts\restore-database-from-backup.ps1 -BackupFile ".\backups\20251029_170628\portfolio_full_backup_20251029_170628.sql.gz"

# Hoặc chỉ định container cụ thể
# .\scripts\restore-database-from-backup.ps1 -BackupFile ".\backups\backup.sql.gz" -ContainerName "portfolio_postgres"

# Với flag -Force để bỏ qua confirmation
# .\scripts\restore-database-from-backup.ps1 -BackupFile ".\backups\backup.sql.gz" -Force

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile,
    
    [string]$ContainerName = "",
    [string]$DbName = "portfolio_db",
    [string]$DbUser = "postgres",
    [switch]$Force = $false
)

Write-Host "=== Database Restore from Backup ===" -ForegroundColor Cyan

# Normalize backup file path - convert relative paths to absolute
if (![System.IO.Path]::IsPathRooted($BackupFile)) {
    # Try resolving relative to current working directory first
    $resolvedPath = (Resolve-Path -Path $BackupFile -ErrorAction SilentlyContinue).Path
    if ($null -ne $resolvedPath -and (Test-Path $resolvedPath)) {
        $BackupFile = $resolvedPath
    } else {
        # Try resolving from backend directory (where backups are typically located)
        $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
        $backendDir = Split-Path -Parent $scriptDir
        $possiblePath = Join-Path $backendDir $BackupFile
        if (Test-Path $possiblePath) {
            $BackupFile = (Resolve-Path -Path $possiblePath).Path
        } else {
            # Try with backups prefix if not already included
            if ($BackupFile -notlike "*backups*") {
                $possiblePath = Join-Path $backendDir "backups\$BackupFile"
                if (Test-Path $possiblePath) {
                    $BackupFile = (Resolve-Path -Path $possiblePath).Path
                }
            }
        }
    }
}

# Check if backup file exists
if ($null -eq $BackupFile -or !(Test-Path $BackupFile)) {
    Write-Host "Error: Backup file not found!" -ForegroundColor Red
    Write-Host "Attempted path: $BackupFile" -ForegroundColor Yellow
    Write-Host "Current working directory: $(Get-Location)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Tips:" -ForegroundColor Cyan
    Write-Host "  - Use absolute path, or" -ForegroundColor Yellow
    Write-Host "  - Use path relative to current directory, or" -ForegroundColor Yellow
    Write-Host "  - Use path relative to solution/backend directory" -ForegroundColor Yellow
    Write-Host "  - Example: .\backups\20251114_094650\portfolio_full_backup_20251114_094650.sql.gz" -ForegroundColor Gray
    exit 1
}

# Convert to absolute path for display
$BackupFile = (Resolve-Path -Path $BackupFile).Path

Write-Host "Backup file: $BackupFile"
Write-Host "Database: $DbName"
Write-Host ""

# Auto-detect container name if not provided
if ([string]::IsNullOrEmpty($ContainerName)) {
    Write-Host "=== Auto-detecting PostgreSQL container ===" -ForegroundColor Cyan
    $allContainers = docker ps --format "{{.Names}}" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to list Docker containers. Please ensure Docker is running." -ForegroundColor Red
        exit 1
    }
    
    $postgresContainers = $allContainers | Where-Object { $_ -match "postgres" }
    
    if ($null -eq $postgresContainers -or $postgresContainers.Count -eq 0) {
        Write-Host "Error: No PostgreSQL container found. Please specify ContainerName parameter." -ForegroundColor Red
        exit 1
    }
    
    # Prefer portfolio_postgres or portfolio-postgres, otherwise use first found
    $ContainerName = $postgresContainers | Where-Object { $_ -match "portfolio.*postgres" } | Select-Object -First 1
    if ([string]::IsNullOrEmpty($ContainerName)) {
        $ContainerName = $postgresContainers | Select-Object -First 1
    }
    
    Write-Host "Using container: $ContainerName" -ForegroundColor Green
}

Write-Host "Container: $ContainerName"
Write-Host ""

# Check if it's a compressed file
$IsCompressed = $BackupFile.EndsWith('.gz')
$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$RemoteBackupFile = "/tmp/backup_${timestamp}.sql.gz"
$RemoteExtractedFile = "/tmp/backup_${timestamp}.sql"

Write-Host "=== Preparing restore ===" -ForegroundColor Cyan

# Copy backup file to container
if ($IsCompressed) {
    Write-Host "Copying compressed backup file to container..." -ForegroundColor Yellow
    docker cp $BackupFile "${ContainerName}:${RemoteBackupFile}"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to copy backup file to container" -ForegroundColor Red
        exit 1
    }
    Write-Host "Backup file copied successfully" -ForegroundColor Green
    
    # Extract inside container (using gunzip which is available in PostgreSQL containers)
    Write-Host "Extracting compressed backup file inside container..." -ForegroundColor Yellow
    $extractResult = docker exec $ContainerName sh -c "gunzip -c $RemoteBackupFile > $RemoteExtractedFile" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to extract backup file. Error: $extractResult" -ForegroundColor Red
        Write-Host "Trying alternative extraction method..." -ForegroundColor Yellow
        # Try alternative: use zcat or gzip -dc
        docker exec $ContainerName sh -c "gzip -dc $RemoteBackupFile > $RemoteExtractedFile 2>&1 || zcat $RemoteBackupFile > $RemoteExtractedFile 2>&1" 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "All extraction methods failed. Please ensure the backup file is valid and container has gzip tools." -ForegroundColor Red
            docker exec $ContainerName sh -c "rm -f $RemoteBackupFile $RemoteExtractedFile" 2>&1 | Out-Null
            exit 1
        }
        Write-Host "Extracted using alternative method" -ForegroundColor Green
    }
    Write-Host "Backup extracted successfully" -ForegroundColor Green
    $RestoreFile = $RemoteExtractedFile
} else {
    Write-Host "Copying backup file to container..." -ForegroundColor Yellow
    docker cp $BackupFile "${ContainerName}:${RemoteExtractedFile}"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to copy backup file to container" -ForegroundColor Red
        exit 1
    }
    Write-Host "Backup file copied successfully" -ForegroundColor Green
    $RestoreFile = $RemoteExtractedFile
}

# Check if database exists and ask for confirmation
Write-Host "=== Checking database existence ===" -ForegroundColor Cyan
$dbExists = docker exec $ContainerName psql -U $DbUser -lqt 2>&1 | Select-String "\b$DbName\b"
if ($dbExists -and !$Force) {
    Write-Host "Database '$DbName' already exists!" -ForegroundColor Yellow
    $confirm = Read-Host "Do you want to drop and recreate it? (y/N)"
    if ($confirm -ne 'y' -and $confirm -ne 'Y') {
        Write-Host "Restore cancelled" -ForegroundColor Yellow
        $cleanupFiles = if ($IsCompressed) { "$RemoteBackupFile $RemoteExtractedFile" } else { $RemoteExtractedFile }
        docker exec $ContainerName sh -c "rm -f $cleanupFiles"
        exit 0
    }
}

# Drop and recreate database
Write-Host "=== Dropping and recreating database ===" -ForegroundColor Cyan
docker exec $ContainerName psql -U $DbUser -c "DROP DATABASE IF EXISTS $DbName;" | Out-Null
docker exec $ContainerName psql -U $DbUser -c "CREATE DATABASE $DbName;" | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to recreate database" -ForegroundColor Red
    $cleanupFiles = if ($IsCompressed) { "$RemoteBackupFile $RemoteExtractedFile" } else { $RemoteExtractedFile }
    docker exec $ContainerName sh -c "rm -f $cleanupFiles"
    exit 1
}
Write-Host "Database recreated successfully" -ForegroundColor Green

# Restore database
Write-Host "=== Restoring database ===" -ForegroundColor Cyan
docker exec $ContainerName psql -U $DbUser -d $DbName -f $RestoreFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "Database restored successfully!" -ForegroundColor Green
} else {
    Write-Host "Database restore failed!" -ForegroundColor Red
    $cleanupFiles = if ($IsCompressed) { "$RemoteBackupFile $RemoteExtractedFile" } else { $RemoteExtractedFile }
    docker exec $ContainerName sh -c "rm -f $cleanupFiles"
    exit 1
}

# Cleanup remote files
Write-Host "=== Cleaning up temporary files ===" -ForegroundColor Cyan
$cleanupFiles = if ($IsCompressed) { "$RemoteBackupFile $RemoteExtractedFile" } else { $RemoteExtractedFile }
docker exec $ContainerName sh -c "rm -f $cleanupFiles"
Write-Host "Cleanup completed" -ForegroundColor Green

# Show summary
Write-Host "=== Restore Summary ===" -ForegroundColor Cyan
Write-Host "Database: $DbName"
Write-Host "Container: $ContainerName"
Write-Host "Backup file: $BackupFile"
Write-Host "Status: Successfully restored"

Write-Host ""
Write-Host "Database restore completed successfully!" -ForegroundColor Green
Write-Host "You can now start your application with the restored database."
