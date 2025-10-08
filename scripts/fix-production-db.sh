#!/bin/bash

# Fix Production Database - Immediate Fix
# This script fixes the production database by running migrations

set -e

echo "🚀 Fixing Production Database..."

# Check if we're on the production server
if [ ! -f "docker-compose.backend.yml" ]; then
    echo "❌ Error: docker-compose.backend.yml not found. Please run from project root."
    exit 1
fi

# Check if backend container is running
echo "🔍 Checking if backend container is running..."
if ! docker ps | grep -q "portfolio-backend"; then
    echo "❌ Error: Backend container is not running. Please start the backend first."
    echo "💡 Run: docker-compose -f docker-compose.backend.yml up -d"
    exit 1
fi

echo "✅ Backend container is running"

# Check current database status
echo "🔍 Checking current database status..."
docker exec portfolio-backend npm run typeorm -- query "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'" -d src/config/database.config.ts || echo "Could not connect to database"

# Run migrations
echo "🗄️ Running database migrations..."
docker exec portfolio-backend npm run typeorm:migration:run

if [ $? -ne 0 ]; then
    echo "❌ Error: Migration failed!"
    exit 1
fi

echo "✅ Migrations completed successfully"

# Verify accounts table exists
echo "🔍 Verifying accounts table..."
ACCOUNTS_EXIST=$(docker exec portfolio-backend npm run typeorm -- query "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'accounts'" -d src/config/database.config.ts 2>/dev/null | grep -c "accounts" || echo "0")

if [ "$ACCOUNTS_EXIST" -eq 0 ]; then
    echo "❌ Error: Accounts table not found after migration!"
    exit 1
fi

echo "✅ Accounts table exists"

# Check if we have any accounts data
echo "🔍 Checking accounts data..."
ACCOUNTS_COUNT=$(docker exec portfolio-backend npm run typeorm -- query "SELECT COUNT(*) as count FROM accounts" -d src/config/database.config.ts 2>/dev/null | grep -o '"count":[0-9]*' | cut -d':' -f2 || echo "0")

if [ "$ACCOUNTS_COUNT" -eq 0 ]; then
    echo "⚠️  Warning: No accounts found in database. Seeding database..."
    docker exec portfolio-backend npm run seed:dev || echo "Seeding failed, but continuing..."
else
    echo "✅ Found $ACCOUNTS_COUNT accounts in database"
fi

# Test API endpoint
echo "🧪 Testing API endpoint..."
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/v1/accounts || echo "000")

if [ "$API_RESPONSE" = "200" ]; then
    echo "✅ API endpoint is working correctly"
    echo "🎉 Production database has been fixed successfully!"
    echo "🔗 You can now test the API: http://34.228.198.131:3000/api/v1/accounts"
elif [ "$API_RESPONSE" = "500" ]; then
    echo "❌ API endpoint still returns 500 error - database issue persists"
    echo "🔍 Checking for other issues..."
    docker exec portfolio-backend npm run typeorm -- query "SELECT * FROM accounts LIMIT 1" -d src/config/database.config.ts || echo "Could not query accounts table"
    exit 1
else
    echo "⚠️  API endpoint returned status code: $API_RESPONSE"
fi
