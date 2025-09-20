@echo off
REM Docker Test Script for CR-006 Asset Snapshot System (Windows)

echo 🚀 Starting Docker integration tests for CR-006 Asset Snapshot System...

REM Check if Docker is running
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker and try again.
    exit /b 1
)

REM Check if the application is running
curl -f http://localhost:3000/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Application is not running on port 3000. Please start the application and try again.
    exit /b 1
)

REM Set environment variables for testing
set NODE_ENV=test
set DB_NAME=portfolio_test
set DB_HOST=localhost
set DB_PORT=5432
set DB_USERNAME=postgres
set DB_PASSWORD=postgres

echo ✅ Environment variables set for testing

REM Run integration tests
echo 🧪 Running integration tests...
npm run test:e2e:docker

echo ✅ Docker integration tests completed successfully!
