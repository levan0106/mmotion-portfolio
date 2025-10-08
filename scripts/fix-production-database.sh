#!/bin/bash

# Fix Production Database Script
# Simple script to fix production database immediately

set -e

echo "🚀 Fixing Production Database..."

# Detect backend container
echo "🔍 Detecting backend container..."
CONTAINER_NAME=$(docker ps --format "{{.Names}}" | grep -E "(portfolio.*backend|portfolio.*app)" | head -1)

if [ -z "$CONTAINER_NAME" ]; then
    echo "❌ Error: No backend container found"
    echo "Available containers:"
    docker ps --format "table {{.Names}}\t{{.Status}}"
    exit 1
fi

echo "✅ Backend container detected: $CONTAINER_NAME"

# Check if database is accessible
echo "🔍 Checking database connection..."
if ! docker exec $CONTAINER_NAME npm run typeorm -- query "SELECT version()" -d /app/dist/src/config/database.config.js > /dev/null 2>&1; then
    echo "❌ Error: Cannot connect to database"
    echo "💡 Check if database container is running"
    exit 1
fi

echo "✅ Database connection successful"

# Try to run migrations with different approaches
echo "🗄️ Running database migrations..."

# First, find the correct config file path (look for .js file in production)
CONFIG_PATH=$(docker exec $CONTAINER_NAME find /app -name "database.config.js" -type f 2>/dev/null | head -1)

if [ -n "$CONFIG_PATH" ]; then
    echo "🔍 Found config file at: $CONFIG_PATH"
    if docker exec $CONTAINER_NAME npm run typeorm:migration:run -d "$CONFIG_PATH"; then
        echo "✅ Migration successful with found config path"
    elif docker exec $CONTAINER_NAME sh -c "cd /app && npm run typeorm:migration:run"; then
        echo "✅ Migration successful from container root"
    elif docker exec $CONTAINER_NAME npm run typeorm:migration:run; then
        echo "✅ Migration successful without config file"
    else
        echo "❌ All migration approaches failed"
        echo "💡 Check container logs: docker logs $CONTAINER_NAME"
        exit 1
    fi
else
    echo "⚠️  Config file not found, trying alternative approaches..."
    if docker exec $CONTAINER_NAME sh -c "cd /app && npm run typeorm:migration:run"; then
        echo "✅ Migration successful from container root"
    elif docker exec $CONTAINER_NAME npm run typeorm:migration:run; then
        echo "✅ Migration successful without config file"
    else
        echo "❌ All migration approaches failed"
        echo "💡 Check container logs: docker logs $CONTAINER_NAME"
        exit 1
    fi
fi

echo "✅ Migrations completed successfully"

# Verify accounts table
echo "🔍 Verifying accounts table..."
ACCOUNTS_EXIST=$(docker exec $CONTAINER_NAME npm run typeorm -- query "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'accounts'" -d /app/dist/src/config/database.config.js 2>/dev/null | grep -c "accounts" || echo "0")

if [ "$ACCOUNTS_EXIST" -eq 0 ]; then
    echo "❌ Error: Accounts table not found after migration!"
    exit 1
fi

echo "✅ Accounts table exists"

# Check accounts data
echo "🔍 Checking accounts data..."
ACCOUNTS_COUNT=$(docker exec $CONTAINER_NAME npm run typeorm -- query "SELECT COUNT(*) as count FROM accounts" -d /app/dist/src/config/database.config.js 2>/dev/null | grep -o '"count":[0-9]*' | cut -d':' -f2 || echo "0")

if [ "$ACCOUNTS_COUNT" -eq 0 ]; then
    echo "⚠️  Warning: No accounts found in database"
    echo "💡 You may need to seed the database"
else
    echo "✅ Found $ACCOUNTS_COUNT accounts in database"
fi

# Test API
echo "🧪 Testing API..."
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/v1/accounts || echo "000")

if [ "$API_RESPONSE" = "200" ]; then
    echo "✅ API is working correctly"
    echo "🎉 Production database has been fixed successfully!"
    echo "🔗 API endpoint: http://34.228.198.131:3000/api/v1/accounts"
elif [ "$API_RESPONSE" = "500" ]; then
    echo "❌ API still returns 500 error"
    echo "💡 Check backend logs: docker logs $CONTAINER_NAME"
    exit 1
else
    echo "⚠️  API returned status: $API_RESPONSE"
fi

echo "🎉 Production database fix completed!"
