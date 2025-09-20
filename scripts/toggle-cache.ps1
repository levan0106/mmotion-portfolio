# Script to toggle cache on/off for development
# Usage: .\scripts\toggle-cache.ps1 [on|off]

param(
    [string]$Status = "off"
)

if ($Status -eq "on") {
    Write-Host "Enabling cache..." -ForegroundColor Green
    
    # Update .env file
    if (Test-Path .env) {
        $content = Get-Content .env
        $content = $content -replace 'CACHE_ENABLED=.*', 'CACHE_ENABLED=true'
        Set-Content .env $content
    } else {
        Add-Content .env "CACHE_ENABLED=true"
    }
    
    # Update docker-compose.yml
    $dockerContent = Get-Content docker-compose.yml
    $dockerContent = $dockerContent -replace 'CACHE_ENABLED=.*', 'CACHE_ENABLED=true'
    Set-Content docker-compose.yml $dockerContent
    
    Write-Host "✅ Cache enabled" -ForegroundColor Green
    Write-Host "Restart the application to apply changes:" -ForegroundColor Yellow
    Write-Host "  docker-compose down && docker-compose up -d" -ForegroundColor Cyan
    
} elseif ($Status -eq "off") {
    Write-Host "Disabling cache..." -ForegroundColor Red
    
    # Update .env file
    if (Test-Path .env) {
        $content = Get-Content .env
        $content = $content -replace 'CACHE_ENABLED=.*', 'CACHE_ENABLED=false'
        Set-Content .env $content
    } else {
        Add-Content .env "CACHE_ENABLED=false"
    }
    
    # Update docker-compose.yml
    $dockerContent = Get-Content docker-compose.yml
    $dockerContent = $dockerContent -replace 'CACHE_ENABLED=.*', 'CACHE_ENABLED=false'
    Set-Content docker-compose.yml $dockerContent
    
    Write-Host "✅ Cache disabled" -ForegroundColor Red
    Write-Host "Restart the application to apply changes:" -ForegroundColor Yellow
    Write-Host "  docker-compose down && docker-compose up -d" -ForegroundColor Cyan
    
} else {
    Write-Host "Usage: .\scripts\toggle-cache.ps1 [on|off]" -ForegroundColor Yellow
    Write-Host "Current cache status:" -ForegroundColor Cyan
    
    if (Test-Path .env) {
        $cacheLine = Get-Content .env | Where-Object { $_ -match 'CACHE_ENABLED' }
        if ($cacheLine) {
            Write-Host "  .env: $cacheLine" -ForegroundColor White
        } else {
            Write-Host "  .env: CACHE_ENABLED not found" -ForegroundColor Gray
        }
    } else {
        Write-Host "  .env file not found" -ForegroundColor Gray
    }
    
    $dockerCacheLine = Get-Content docker-compose.yml | Where-Object { $_ -match 'CACHE_ENABLED' }
    if ($dockerCacheLine) {
        Write-Host "  docker-compose.yml: $dockerCacheLine" -ForegroundColor White
    } else {
        Write-Host "  docker-compose.yml: CACHE_ENABLED not found" -ForegroundColor Gray
    }
}
