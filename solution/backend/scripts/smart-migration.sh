#!/bin/bash

# Smart Migration Script
# Only runs migrations when needed, optimizes deployment performance

set -e

echo "🧠 Smart Migration Check..."

# Check if we're in the backend root directory
# This script should be run from the backend root (where docker-compose.yml exists)
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml not found. Please run from backend root directory."
    exit 1
fi

# Detect backend container (Linux production server)
echo "🔍 Detecting backend container..."
CONTAINER_NAME=$(docker ps --format "{{.Names}}" | grep -E "(mmotion.*backend|portfolio.*backend|portfolio.*app)" | head -1)

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

# Verify config file exists before proceeding
echo "🔍 Verifying database config file exists..."
if ! docker exec $CONTAINER_NAME test -f /app/dist/config/database.config.js; then
    echo "❌ Error: database.config.js not found at /app/dist/config/database.config.js"
    echo "💡 Checking dist structure..."
    docker exec $CONTAINER_NAME sh -c "find /app/dist -name '*.config.js' -type f 2>/dev/null || echo 'No config files found'"
    echo "💡 Listing dist/config directory..."
    docker exec $CONTAINER_NAME sh -c "ls -la /app/dist/config/ 2>/dev/null || echo 'Directory does not exist'"
    exit 1
fi
echo "✅ Database config file found"

# Check if migrations table exists
echo "🔍 Checking migrations table..."
MIGRATIONS_EXIST=$(docker exec $CONTAINER_NAME sh -c "cd /app && npm run typeorm:prod -- query \"SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'migrations'\" -d dist/config/database.config.js" 2>/dev/null | grep -c "migrations" || echo "0")

# Ensure MIGRATIONS_EXIST is a number
MIGRATIONS_EXIST=${MIGRATIONS_EXIST:-0}
MIGRATIONS_EXIST=$((MIGRATIONS_EXIST + 0))  # Convert to integer

if [ "$MIGRATIONS_EXIST" -eq 0 ]; then
    echo "📋 Migrations table not found. This is a fresh database."
    echo "🔄 Running all migrations..."
    
    # Try different approaches to run migration
    # First try with production command (for compiled JS)
    if docker exec $CONTAINER_NAME sh -c "cd /app && npm run typeorm:migration:run:prod"; then
        echo "✅ Migration successful with production command"
    elif docker exec $CONTAINER_NAME sh -c "cd /app && npm run typeorm:migration:run:prod -d dist/config/database.config.js"; then
        echo "✅ Migration successful with explicit config path"
    elif docker exec $CONTAINER_NAME sh -c "cd /app && npm run typeorm:migration:run"; then
        echo "✅ Migration successful from container root"
    elif docker exec $CONTAINER_NAME npm run typeorm:migration:run; then
        echo "✅ Migration successful without config file"
    else
        echo "❌ Migration failed with all approaches"
        echo "💡 Check container logs: docker logs $CONTAINER_NAME"
        echo "💡 Verify config file exists: docker exec $CONTAINER_NAME ls -la /app/dist/config/"
        exit 1
    fi
    
    # Verify migration actually ran by checking for critical tables
    echo "🔍 Verifying migration results..."
    sleep 2
    USERS_TABLE=$(docker exec $CONTAINER_NAME sh -c "cd /app && npm run typeorm:prod -- query \"SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users'\" -d dist/config/database.config.js" 2>/dev/null | grep -c "users" || echo "0")
    if [ "$USERS_TABLE" -eq 0 ]; then
        echo "⚠️ Warning: users table not found after migration. Running migration again..."
        docker exec $CONTAINER_NAME sh -c "cd /app && npm run typeorm:migration:run:prod" || {
            echo "❌ Migration retry failed"
            exit 1
        }
    fi
    echo "✅ Fresh database migration completed and verified"
else
    echo "📋 Migrations table exists. Running migrations to ensure all are applied..."
    
    # Always run migration to ensure all migrations are applied
    MIGRATION_SUCCESS=false
    
    # Try different approaches to run migration
    if docker exec $CONTAINER_NAME sh -c "cd /app && npm run typeorm:migration:run:prod"; then
        echo "✅ Migration successful with production command"
        MIGRATION_SUCCESS=true
    elif docker exec $CONTAINER_NAME sh -c "cd /app && npm run typeorm:migration:run:prod -d dist/config/database.config.js"; then
        echo "✅ Migration successful with explicit config path"
        MIGRATION_SUCCESS=true
    # Fallback: try to find the config file
    elif CONFIG_PATH=$(docker exec $CONTAINER_NAME find /app -name "database.config.js" -type f 2>/dev/null | head -1) && [ -n "$CONFIG_PATH" ]; then
        echo "🔍 Found config file at: $CONFIG_PATH"
        if docker exec $CONTAINER_NAME sh -c "cd /app && npm run typeorm:migration:run:prod -d $CONFIG_PATH"; then
            echo "✅ Migration successful with found config path"
            MIGRATION_SUCCESS=true
        elif docker exec $CONTAINER_NAME sh -c "cd /app && npm run typeorm:migration:run"; then
            echo "✅ Migration successful from container root"
            MIGRATION_SUCCESS=true
        fi
    else
        echo "⚠️  Config file not found, trying alternative approaches..."
        if docker exec $CONTAINER_NAME sh -c "cd /app && npm run typeorm:migration:run"; then
            echo "✅ Migration successful from container root"
            MIGRATION_SUCCESS=true
        fi
    fi
    
    if [ "$MIGRATION_SUCCESS" = false ]; then
        echo "❌ Migration failed with all approaches"
        echo "💡 Check container logs: docker logs $CONTAINER_NAME"
        echo "💡 Verify config file exists: docker exec $CONTAINER_NAME ls -la /app/dist/config/"
        echo "💡 Checking container status:"
        docker ps -a | grep $CONTAINER_NAME || echo "Container not found"
        echo "💡 Try running manual migration script: ./scripts/run-migrations-manual.sh"
        exit 1
    fi
    
    # Verify migration results
    echo "🔍 Verifying migration results..."
    sleep 2
    USERS_TABLE=$(docker exec $CONTAINER_NAME sh -c "cd /app && npm run typeorm:prod -- query \"SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users'\" -d dist/config/database.config.js" 2>/dev/null | grep -c "users" || echo "0")
    if [ "$USERS_TABLE" -eq 0 ]; then
        echo "❌ Error: users table not found after migration!"
        echo "💡 This indicates migrations did not run successfully"
        echo "💡 Checking migrations table:"
        docker exec $CONTAINER_NAME sh -c "cd /app && npm run typeorm:prod -- query \"SELECT * FROM migrations ORDER BY timestamp DESC LIMIT 5\" -d dist/config/database.config.js" 2>/dev/null || echo "Could not query migrations table"
        exit 1
    fi
    echo "✅ Migrations completed and verified"
fi

# Verify accounts table exists (critical check)
echo "🔍 Verifying critical tables..."
ACCOUNTS_EXIST=$(docker exec $CONTAINER_NAME sh -c "cd /app && npm run typeorm:prod -- query \"SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'accounts'\" -d dist/config/database.config.js" 2>/dev/null | grep -c "accounts" || echo "0")

# Ensure ACCOUNTS_EXIST is a number
ACCOUNTS_EXIST=${ACCOUNTS_EXIST:-0}
ACCOUNTS_EXIST=$((ACCOUNTS_EXIST + 0))  # Convert to integer

if [ "$ACCOUNTS_EXIST" -eq 0 ]; then
    echo "❌ Error: Accounts table not found! Running emergency migration..."
    docker exec $CONTAINER_NAME sh -c "cd /app && npm run typeorm:migration:run:prod"
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
    docker exec $CONTAINER_NAME sh -c "cd /app && npm run typeorm:migration:run:prod"
    echo "✅ Full migration completed"
else
    echo "⚠️  API returned status: $API_RESPONSE"
fi

echo "🔗 API endpoint: http://34.228.198.131:3000/api/v1/accounts"
