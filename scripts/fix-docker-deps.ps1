# Fix Docker Dependencies Script
# This script helps resolve dependency issues in Docker containers

Write-Host "Fixing Docker Dependencies..." -ForegroundColor Green

# Stop and remove existing containers
Write-Host "Stopping and removing existing containers..." -ForegroundColor Yellow
docker-compose down

# Remove the app container specifically
Write-Host "Removing app container..." -ForegroundColor Yellow
docker rm -f portfolio_app 2>$null

# Remove the app image to force rebuild
Write-Host "Removing app image..." -ForegroundColor Yellow
docker rmi -f mmotion-portfolio_app 2>$null

# Clean up any dangling images
Write-Host "Cleaning up dangling images..." -ForegroundColor Yellow
docker image prune -f

# Rebuild the app container with no cache
Write-Host "Rebuilding app container with no cache..." -ForegroundColor Yellow
docker-compose build --no-cache app

# Start the services
Write-Host "Starting services..." -ForegroundColor Yellow
docker-compose up -d postgres redis

# Wait for services to be ready
Write-Host "Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Start the app container
Write-Host "Starting app container..." -ForegroundColor Yellow
docker-compose up app

Write-Host "Docker dependencies fix completed!" -ForegroundColor Green
Write-Host "If you still see errors, check the logs with: docker-compose logs app" -ForegroundColor Cyan