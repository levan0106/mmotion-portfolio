#!/bin/bash

# Migration Status Checker
# Quick check of database migration status

set -e

echo "🔍 Checking Migration Status..."

# Check if we're on the production server
if [ ! -f "docker-compose.backend.yml" ]; then
    echo "❌ Error: docker-compose.backend.yml not found. Please run from project root."
    exit 1
fi

# Check if backend container is running
if ! docker ps | grep -q "portfolio-backend"; then
    echo "❌ Error: Backend container is not running."
    exit 1
fi

echo "✅ Backend container is running"

# Check migrations table
echo "📋 Checking migrations table..."
MIGRATIONS_EXIST=$(docker exec portfolio-backend npm run typeorm -- query "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'migrations'" -d src/config/database.config.ts 2>/dev/null | grep -c "migrations" || echo "0")

if [ "$MIGRATIONS_EXIST" -eq 0 ]; then
    echo "❌ Migrations table not found - Fresh database"
    echo "💡 Run: ./scripts/smart-migration.sh"
    exit 1
fi

echo "✅ Migrations table exists"

# Check pending migrations
echo "🔍 Checking for pending migrations..."
PENDING_MIGRATIONS=$(docker exec portfolio-backend npm run typeorm:migration:run -- --dry-run 2>/dev/null | grep -c "pending" || echo "0")

if [ "$PENDING_MIGRATIONS" -gt 0 ]; then
    echo "⚠️  Found $PENDING_MIGRATIONS pending migrations"
    echo "💡 Run: ./scripts/smart-migration.sh"
else
    echo "✅ No pending migrations"
fi

# Check critical tables
echo "🔍 Checking critical tables..."
ACCOUNTS_EXIST=$(docker exec portfolio-backend npm run typeorm -- query "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'accounts'" -d src/config/database.config.ts 2>/dev/null | grep -c "accounts" || echo "0")

if [ "$ACCOUNTS_EXIST" -eq 0 ]; then
    echo "❌ Accounts table not found - Database issue!"
    echo "💡 Run: ./scripts/smart-migration.sh"
    exit 1
fi

echo "✅ Accounts table exists"

# Test API
echo "🧪 Testing API..."
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/v1/accounts || echo "000")

if [ "$API_RESPONSE" = "200" ]; then
    echo "✅ API is working correctly"
    echo "🎉 Database is healthy and up-to-date!"
elif [ "$API_RESPONSE" = "500" ]; then
    echo "❌ API returns 500 - Database issue!"
    echo "💡 Run: ./scripts/smart-migration.sh"
    exit 1
else
    echo "⚠️  API returned status: $API_RESPONSE"
fi

echo "🔗 API endpoint: http://34.228.198.131:3000/api/v1/accounts"
