param(
    [Parameter(Mandatory=$true)]
    [string]$TargetServer,
    
    [Parameter(Mandatory=$true)]
    [string]$TargetUser,
    
    [string]$KeyPath="mmo-portfolio-key.pem",
    [string]$BackupType="data-only"  # data-only, schema-only, full
)

Write-Host "=== Production Database Backup Tool ===" -ForegroundColor Cyan
Write-Host "Server: $TargetUser@$TargetServer"
Write-Host "Backup Type: $BackupType"
Write-Host ""

switch ($BackupType.ToLower()) {
    "data-only" {
        Write-Host "Running data-only backup..." -ForegroundColor Yellow
        & .\scripts\backup-production-data-only.ps1 -TargetServer $TargetServer -TargetUser $TargetUser -KeyPath $KeyPath
    }
    "schema-only" {
        Write-Host "Running schema-only backup..." -ForegroundColor Yellow
        & .\scripts\backup-production-schema-only.ps1 -TargetServer $TargetServer -TargetUser $TargetUser -KeyPath $KeyPath
    }
    "full" {
        Write-Host "Running full backup (schema + data)..." -ForegroundColor Yellow
        & .\scripts\backup-production-full-database.ps1 -TargetServer $TargetServer -TargetUser $TargetUser -KeyPath $KeyPath
    }
    default {
        Write-Host "Invalid backup type. Use: data-only, schema-only, or full" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Backup process completed!" -ForegroundColor Green
