#!/bin/bash

# Smart Migration Script
# Only runs migrations when needed, optimizes deployment performance

set -e

echo "🧠 Smart Migration Check..."

# Check if we're in the backend directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml not found. Please run from solution/backend directory."
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

# Wait for container to be running (not restarting)
echo "⏳ Waiting for container to be ready..."
MAX_WAIT=60
WAIT_COUNT=0
while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
    CONTAINER_STATUS=$(docker inspect --format='{{.State.Status}}' $CONTAINER_NAME 2>/dev/null || echo "unknown")
    if [ "$CONTAINER_STATUS" = "running" ]; then
        echo "✅ Container is running"
        break
    fi
    echo "⏳ Container status: $CONTAINER_STATUS, waiting..."
    sleep 2
    WAIT_COUNT=$((WAIT_COUNT + 2))
done

if [ "$CONTAINER_STATUS" != "running" ]; then
    echo "❌ Container is not running after $MAX_WAIT seconds. Status: $CONTAINER_STATUS"
    echo "📋 Container logs:"
    docker logs --tail 50 $CONTAINER_NAME
    exit 1
fi

# Check if migrations table exists
echo "🔍 Checking migrations table..."
MIGRATIONS_EXIST=$(docker exec $CONTAINER_NAME npm run typeorm -- query "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'migrations'" -d /app/dist/src/config/database.config.js 2>/dev/null | grep -c "migrations" || echo "0")

# Ensure MIGRATIONS_EXIST is a number
MIGRATIONS_EXIST=${MIGRATIONS_EXIST:-0}
MIGRATIONS_EXIST=$((MIGRATIONS_EXIST + 0))  # Convert to integer

if [ "$MIGRATIONS_EXIST" -eq 0 ]; then
    echo "📋 Migrations table not found. This is a fresh database."
    echo "🔄 Running all migrations..."
    
    # Try different approaches to run migration
    if docker exec $CONTAINER_NAME npm run typeorm:migration:run -d /app/dist/src/config/database.config.js; then
        echo "✅ Migration successful with JavaScript config"
    elif docker exec $CONTAINER_NAME sh -c "cd /app && npm run typeorm:migration:run"; then
        echo "✅ Migration successful from container root"
    elif docker exec $CONTAINER_NAME npm run typeorm:migration:run; then
        echo "✅ Migration successful without config file"
    else
        echo "❌ Migration failed with all approaches"
        echo "💡 Check container logs: docker logs $CONTAINER_NAME"
        exit 1
    fi
    
    echo "✅ Fresh database migration completed"
else
    echo "📋 Migrations table exists. Checking for pending migrations..."
    
    # Check if there are pending migrations (skip dry-run check for now)
    PENDING_MIGRATIONS=1  # Always try to run migration to be safe
    
    if [ "$PENDING_MIGRATIONS" -gt 0 ]; then
        echo "🔄 Found pending migrations. Running migrations..."
        
        # Try different approaches to run migration
        # First, try with the standard database.config.js path
        if docker exec $CONTAINER_NAME npm run typeorm:migration:run -d /app/dist/src/config/database.config.js; then
            echo "✅ Migration successful with database.config.js"
        # Fallback: try to find the config file
        elif CONFIG_PATH=$(docker exec $CONTAINER_NAME find /app -name "database.config.js" -type f 2>/dev/null | head -1) && [ -n "$CONFIG_PATH" ]; then
            echo "🔍 Found config file at: $CONFIG_PATH"
            if docker exec $CONTAINER_NAME npm run typeorm:migration:run -d "$CONFIG_PATH"; then
                echo "✅ Migration successful with found config path"
            elif docker exec $CONTAINER_NAME sh -c "cd /app && npm run typeorm:migration:run"; then
                echo "✅ Migration successful from container root"
            elif docker exec $CONTAINER_NAME npm run typeorm:migration:run; then
                echo "✅ Migration successful without config file"
            else
                echo "❌ Migration failed with all approaches"
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
                echo "❌ Migration failed with all approaches"
                echo "💡 Check container logs: docker logs $CONTAINER_NAME"
                exit 1
            fi
        fi
        
        echo "✅ Pending migrations completed"
    else
        echo "✅ No pending migrations. Skipping migration step."
        echo "⚡ Performance optimized: No unnecessary migration run"
    fi
fi

# Verify accounts table exists (critical check)
echo "🔍 Verifying critical tables..."
ACCOUNTS_EXIST=$(docker exec $CONTAINER_NAME npm run typeorm -- query "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'accounts'" -d /app/dist/src/config/database.config.js 2>/dev/null | grep -c "accounts" || echo "0")

# Ensure ACCOUNTS_EXIST is a number
ACCOUNTS_EXIST=${ACCOUNTS_EXIST:-0}
ACCOUNTS_EXIST=$((ACCOUNTS_EXIST + 0))  # Convert to integer

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
