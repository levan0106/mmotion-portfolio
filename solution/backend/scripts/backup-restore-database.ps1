param(
    [string]$BackupName = "portfolio_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')",
    [string]$TargetServer = "",
    [string]$TargetUser = "",
    [string]$TargetPath = "/home/ec2-user/mmotion-portfolio/backups/",
    [string]$KeyPath = "F:\\code\\mmotion-portfolio\\mmo-portfolio-key.pem",
    [string]$ContainerName = "portfolio_postgres",
    [string]$ContainerNameRestore = "portfolio-postgres",
    [string]$DbName = "portfolio_db",
    [string]$DbUser = "postgres",
    [ValidateSet("data-only", "full")]
    [string]$BackupType = "data-only"
)

# ================================
# CONFIGURATION
# ================================
# Set UTF-8 encoding for PowerShell
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupDir = "backups\$Timestamp"
# Update backup name based on backup type
if ($BackupType -eq "full" -and $BackupName -like "portfolio_backup_*") {
    $BackupName = $BackupName -replace "portfolio_backup_", "portfolio_full_backup_"
}
$BackupFile = "$BackupDir\$BackupName.sql"
$CompressedFile = "$BackupFile.gz"
New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null

Write-Host "=== Database Backup + Restore Process ===" -ForegroundColor Cyan
Write-Host "Database: $DbName" -ForegroundColor Yellow
Write-Host "Container: $ContainerName" -ForegroundColor Yellow
Write-Host "Backup Type: $BackupType" -ForegroundColor Yellow
Write-Host "Backup dir: $BackupDir" -ForegroundColor Yellow
Write-Host ""

# ================================
# STEP 1: BACKUP DATA
# ================================
if ($BackupType -eq "full") {
    Write-Host "Creating full backup (schema + data, UTF-8)..." -ForegroundColor Yellow
    # Set UTF-8 environment for the docker exec command (matching production backup script)
    $env:PGCLIENTENCODING = "UTF8"
    & docker exec -e PGCLIENTENCODING=UTF8 -e LC_ALL=en_US.UTF-8 -e LANG=en_US.UTF-8 $ContainerName pg_dump -U $DbUser -d $DbName --verbose --no-owner --no-privileges --encoding=UTF8 | `
    Out-File -FilePath $BackupFile -Encoding UTF8
} else {
    Write-Host "Creating data-only backup (UTF-8 inserts)..." -ForegroundColor Yellow
    # Set UTF-8 environment for the docker exec command
    $env:PGCLIENTENCODING = "UTF8"
    & docker exec -e PGCLIENTENCODING=UTF8 $ContainerName pg_dump -U $DbUser -d $DbName --data-only --inserts --no-owner --no-privileges --encoding=UTF8 | `
    Out-File -FilePath $BackupFile -Encoding UTF8
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "Backup failed." -ForegroundColor Red
    exit 1
}

# ================================
# STEP 2: COMPRESS BACKUP
# ================================
Write-Host "Compressing backup file..." -ForegroundColor Yellow
$inStream = [System.IO.File]::OpenRead($BackupFile)
$outStream = [System.IO.File]::Create($CompressedFile)
$gzip = New-Object System.IO.Compression.GzipStream($outStream, [System.IO.Compression.CompressionMode]::Compress)
$buffer = New-Object byte[] 65536
while (($read = $inStream.Read($buffer, 0, $buffer.Length)) -gt 0) {
    $gzip.Write($buffer, 0, $read)
}
$gzip.Close(); $inStream.Close(); $outStream.Close()
Remove-Item $BackupFile
$sizeMB = (Get-Item $CompressedFile).Length / 1MB
Write-Host "Backup compressed: $([math]::Round($sizeMB,2)) MB" -ForegroundColor Green

# ================================
# STEP 3: TRANSFER TO LINUX SERVER
# ================================
if ($TargetServer -and $TargetUser) {
    # Normalize TargetPath for consistency
    $NormalizedTargetPath = $TargetPath.Trim().TrimEnd('/')
    Write-Host "Transferring backup to $TargetServer ..." -ForegroundColor Yellow
    & ssh -i $KeyPath "$TargetUser@$TargetServer" "mkdir -p ${NormalizedTargetPath}"
    & scp -i $KeyPath $CompressedFile "${TargetUser}@${TargetServer}:${NormalizedTargetPath}/"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Backup transferred successfully." -ForegroundColor Green
    } else {
        Write-Host "Transfer failed." -ForegroundColor Red
        exit 1
    }
}

# ================================
# STEP 4: RESTORE PROCESS (OPTIONAL)
# ================================
if ($TargetServer -and $TargetUser) {
    Write-Host ""
    Write-Host "Do you want to RESTORE this backup now? (y/n): " -ForegroundColor Yellow -NoNewline
    $restoreNow = Read-Host
    if ($restoreNow -match '^[Yy]$') {
        $FileName = Split-Path $CompressedFile -Leaf
        $ExtractedName = $FileName -replace '\.gz$',''

        Write-Host "Starting restore process on Linux server..." -ForegroundColor Cyan

        # Dynamic restore script
        if ($BackupType -eq "full") {
            # Full backup restore script (drop and recreate database)
            $RemoteScript = @'
#!/bin/bash
set -e

# Set UTF-8 locale for proper character handling
export LC_ALL=en_US.UTF-8
export LANG=en_US.UTF-8
export PGCLIENTENCODING=UTF8

cd __TargetPath__
echo "Extracting backup..."
gunzip -f __FileName__

echo "Terminating active connections to database..."
docker exec __ContainerNameRestore__ psql -U __DbUser__ -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '__DbName__' AND pid <> pg_backend_pid();" || true

echo "Dropping and recreating database..."
docker exec __ContainerNameRestore__ psql -U __DbUser__ -d postgres -c "DROP DATABASE IF EXISTS __DbName__;" || true
docker exec __ContainerNameRestore__ psql -U __DbUser__ -d postgres -c "CREATE DATABASE __DbName__;"

echo "Restoring full database (schema + data, UTF-8)..."
# Restore with proper UTF-8 handling
# Note: pg_dump already includes encoding info in the SQL file
# We also set client_encoding via psql option and environment variable
cat __ExtractedName__ | docker exec -i -e PGCLIENTENCODING=UTF8 __ContainerNameRestore__ psql -U __DbUser__ -d __DbName__ --set client_encoding=UTF8 --set ON_ERROR_STOP=on

echo "Verifying database..."
docker exec -i __ContainerNameRestore__ psql -U __DbUser__ -d __DbName__ -c "\dt" || true

echo "Cleaning up extracted file..."
rm -f __ExtractedName__ || true

echo "Full database restore completed successfully."
'@
        } else {
            # Data-only restore script (truncate and insert)
            $RemoteScript = @'
#!/bin/bash
set -e

# Set UTF-8 locale for proper character handling
export LC_ALL=en_US.UTF-8
export LANG=en_US.UTF-8
export PGCLIENTENCODING=UTF8

cd __TargetPath__
echo "Extracting backup..."
gunzip -f __FileName__

echo "Detecting tables from backup file..."
TABLES=$(grep -oP "(?<=INSERT INTO )[^ ]+" __ExtractedName__ | sort -u | tr '\n' ',' | sed 's/,$//')

if [ -z "$TABLES" ]; then
  echo "No tables found in backup file. Exiting."
  exit 1
fi

echo "Truncating old data..."
docker exec -i __ContainerNameRestore__ psql -U __DbUser__ -d __DbName__ -c "TRUNCATE TABLE $TABLES RESTART IDENTITY CASCADE;"

echo "Restoring new data (UTF-8)..."
# Restore with proper UTF-8 handling
# Set encoding via psql option and environment variable (no need to modify SQL file)
cat __ExtractedName__ | docker exec -i -e PGCLIENTENCODING=UTF8 __ContainerNameRestore__ psql -U __DbUser__ -d __DbName__ --set client_encoding=UTF8 --set ON_ERROR_STOP=off

echo "Verifying data counts..."
for tbl in $(echo "$TABLES" | tr ',' ' '); do
  docker exec -i __ContainerNameRestore__ psql -U __DbUser__ -d __DbName__ -c "SELECT COUNT(*) AS count FROM $tbl;" || true
done

echo "Restore completed successfully."
'@
        }

        # Use normalized TargetPath (already normalized in STEP 3, but ensure it's set)
        if (-not $NormalizedTargetPath) {
            $NormalizedTargetPath = $TargetPath.Trim().TrimEnd('/')
        }
        
        # Replace placeholders with real variables
        $RemoteScript = $RemoteScript.Replace("__TargetPath__", $NormalizedTargetPath)
        $RemoteScript = $RemoteScript.Replace("__FileName__", $FileName)
        $RemoteScript = $RemoteScript.Replace("__ContainerNameRestore__", $ContainerNameRestore)
        $RemoteScript = $RemoteScript.Replace("__DbUser__", $DbUser)
        $RemoteScript = $RemoteScript.Replace("__DbName__", $DbName)
        $RemoteScript = $RemoteScript.Replace("__ExtractedName__", $ExtractedName)

        Write-Host "Uploading and executing restore script..." -ForegroundColor Yellow
        $TempScriptPath = "$BackupDir\restore_remote.sh"
        # Convert line endings to Unix format (LF only) and write file
        $RemoteScriptUnix = $RemoteScript -replace "`r`n", "`n" -replace "`r", "`n"
        $Utf8NoBom = New-Object System.Text.UTF8Encoding $false
        [System.IO.File]::WriteAllText($TempScriptPath, $RemoteScriptUnix, $Utf8NoBom)
        & scp -i $KeyPath $TempScriptPath "${TargetUser}@${TargetServer}:${NormalizedTargetPath}/"
        # Convert line endings on server and execute (defense in depth)
        & ssh -i $KeyPath "$TargetUser@$TargetServer" "sed -i 's/\r$//' ${NormalizedTargetPath}/restore_remote.sh && chmod +x ${NormalizedTargetPath}/restore_remote.sh && bash ${NormalizedTargetPath}/restore_remote.sh"

        if ($LASTEXITCODE -eq 0) {
            Write-Host "Data restored successfully." -ForegroundColor Green
        } else {
            Write-Host "Restore process failed." -ForegroundColor Red
        }
    }
}

# ================================
# STEP 5: FINAL INFO
# ================================
Write-Host ""
Write-Host "Backup summary:" -ForegroundColor Cyan
Write-Host "Backup Type: $BackupType" -ForegroundColor Yellow
Write-Host "Backup file: $CompressedFile"
if ($TargetServer -and $TargetUser) {
    Write-Host "Target: ${TargetUser}@${TargetServer}:${TargetPath}"
}
Write-Host "Database: $DbName"
Write-Host "Encoding: UTF-8 (Vietnamese supported)"
Write-Host "=============================================="
Write-Host "Process completed." -ForegroundColor Green
