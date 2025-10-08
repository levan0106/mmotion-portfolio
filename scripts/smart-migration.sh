#!/bin/bash

# Smart Migration Script
# Only runs migrations when needed, optimizes deployment performance

set -e

echo "🧠 Smart Migration Check..."

# Check if we're on the production server
if [ ! -f "docker-compose.backend.yml" ]; then
    echo "❌ Error: docker-compose.backend.yml not found. Please run from project root."
    exit 1
fi

# Detect backend container (Linux production server)
echo "🔍 Detecting backend container..."
CONTAINER_NAME=$(docker ps --format "{{.Names}}" | grep -E "(portfolio.*backend|portfolio.*app)" | head -1)

if [ -z "$CONTAINER_NAME" ]; then
    echo "❌ Error: No backend container found"
    echo "Available containers:"
    docker ps --format "table {{.Names}}\t{{.Status}}"
    exit 1
fi

echo "✅ Backend container detected: $CONTAINER_NAME"

# Check if migrations table exists
echo "🔍 Checking migrations table..."
MIGRATIONS_EXIST=$(docker exec $CONTAINER_NAME npm run typeorm -- query "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'migrations'" -d src/config/database.config.ts 2>/dev/null | grep -c "migrations" || echo "0")

if [ "$MIGRATIONS_EXIST" -eq 0 ]; then
    echo "📋 Migrations table not found. This is a fresh database."
    echo "🔄 Running all migrations..."
    docker exec $CONTAINER_NAME npm run typeorm:migration:run
    echo "✅ Fresh database migration completed"
else
    echo "📋 Migrations table exists. Checking for pending migrations..."
    
    # Check if there are pending migrations
    PENDING_MIGRATIONS=$(docker exec $CONTAINER_NAME npm run typeorm:migration:run -- --dry-run 2>/dev/null | grep -c "pending" || echo "0")
    
    if [ "$PENDING_MIGRATIONS" -gt 0 ]; then
        echo "🔄 Found pending migrations. Running migrations..."
        docker exec $CONTAINER_NAME npm run typeorm:migration:run
        echo "✅ Pending migrations completed"
    else
        echo "✅ No pending migrations. Skipping migration step."
        echo "⚡ Performance optimized: No unnecessary migration run"
    fi
fi

# Verify accounts table exists (critical check)
echo "🔍 Verifying critical tables..."
ACCOUNTS_EXIST=$(docker exec $CONTAINER_NAME npm run typeorm -- query "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'accounts'" -d src/config/database.config.ts 2>/dev/null | grep -c "accounts" || echo "0")

if [ "$ACCOUNTS_EXIST" -eq 0 ]; then
    echo "❌ Error: Accounts table not found! Running emergency migration..."
    docker exec $CONTAINER_NAME npm run typeorm:migration:run
    echo "✅ Emergency migration completed"
fi

echo "✅ Critical tables verified"

# Quick API test
echo "🧪 Quick API test..."
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/v1/accounts || echo "000")

if [ "$API_RESPONSE" = "200" ]; then
    echo "✅ API is working correctly"
    echo "🎉 Smart migration completed successfully!"
elif [ "$API_RESPONSE" = "500" ]; then
    echo "❌ API still returns 500. Running full migration..."
    docker exec $CONTAINER_NAME npm run typeorm:migration:run
    echo "✅ Full migration completed"
else
    echo "⚠️  API returned status: $API_RESPONSE"
fi

echo "🔗 API endpoint: http://34.228.198.131:3000/api/v1/accounts"
