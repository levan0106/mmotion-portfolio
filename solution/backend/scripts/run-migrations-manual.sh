#!/bin/bash

# Manual Migration Runner
# Run this script from EC2 to manually execute migrations

set -e

echo "🔧 Manual Migration Runner"
echo "============================"

# Check if we're in the backend root directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml not found. Please run from backend root directory."
    exit 1
fi

# Detect backend container
echo "🔍 Detecting backend container..."
CONTAINER_NAME=$(docker ps --format "{{.Names}}" | grep -E "(mmotion.*backend|portfolio.*backend|portfolio.*app)" | head -1)

if [ -z "$CONTAINER_NAME" ]; then
    echo "❌ Error: No backend container found"
    echo "Available containers:"
    docker ps --format "table {{.Names}}\t{{.Status}}"
    exit 1
fi

echo "✅ Backend container detected: $CONTAINER_NAME"

# Verify config file exists
echo "🔍 Verifying database config file..."
if ! docker exec $CONTAINER_NAME test -f /app/dist/config/database.config.js; then
    echo "❌ Error: database.config.js not found at /app/dist/config/database.config.js"
    echo "💡 Checking dist structure..."
    docker exec $CONTAINER_NAME sh -c "find /app/dist -name '*.config.js' -type f 2>/dev/null || echo 'No config files found'"
    echo "💡 Listing dist directory..."
    docker exec $CONTAINER_NAME sh -c "ls -la /app/dist/ 2>/dev/null || echo 'Directory does not exist'"
    exit 1
fi
echo "✅ Database config file found"

# Check current migrations status
echo "📋 Checking current migrations status..."
MIGRATIONS_TABLE=$(docker exec $CONTAINER_NAME sh -c "cd /app && npm run typeorm:prod -- query \"SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'migrations'\" -d dist/config/database.config.js" 2>/dev/null | grep -c "migrations" || echo "0")

if [ "$MIGRATIONS_TABLE" -eq 0 ]; then
    echo "📋 Migrations table does not exist. This is a fresh database."
else
    echo "📋 Migrations table exists. Checking executed migrations..."
    docker exec $CONTAINER_NAME sh -c "cd /app && npm run typeorm:prod -- query \"SELECT * FROM migrations ORDER BY timestamp DESC LIMIT 10\" -d dist/config/database.config.js" 2>/dev/null || echo "Could not query migrations"
fi

# Check for critical tables
echo "🔍 Checking for critical tables..."
USERS_TABLE=$(docker exec $CONTAINER_NAME sh -c "cd /app && npm run typeorm:prod -- query \"SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users'\" -d dist/config/database.config.js" 2>/dev/null | grep -c "users" || echo "0")
ACCOUNTS_TABLE=$(docker exec $CONTAINER_NAME sh -c "cd /app && npm run typeorm:prod -- query \"SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'accounts'\" -d dist/config/database.config.js" 2>/dev/null | grep -c "accounts" || echo "0")
APPLICATION_LOGS_TABLE=$(docker exec $CONTAINER_NAME sh -c "cd /app && npm run typeorm:prod -- query \"SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'application_logs'\" -d dist/config/database.config.js" 2>/dev/null | grep -c "application_logs" || echo "0")

echo "📊 Current tables status:"
echo "  - users: $([ "$USERS_TABLE" -eq 1 ] && echo "✅ exists" || echo "❌ missing")"
echo "  - accounts: $([ "$ACCOUNTS_TABLE" -eq 1 ] && echo "✅ exists" || echo "❌ missing")"
echo "  - application_logs: $([ "$APPLICATION_LOGS_TABLE" -eq 1 ] && echo "✅ exists" || echo "❌ missing")"

# Run migrations
echo ""
echo "🔄 Running migrations..."
echo "============================"

MIGRATION_SUCCESS=false

# Try different approaches
echo "Attempt 1: Using typeorm:migration:run:prod..."
if docker exec $CONTAINER_NAME sh -c "cd /app && npm run typeorm:migration:run:prod"; then
    echo "✅ Migration successful!"
    MIGRATION_SUCCESS=true
else
    echo "❌ Attempt 1 failed"
    
    echo ""
    echo "Attempt 2: Using explicit config path..."
    if docker exec $CONTAINER_NAME sh -c "cd /app && npm run typeorm:migration:run:prod -d dist/config/database.config.js"; then
        echo "✅ Migration successful!"
        MIGRATION_SUCCESS=true
    else
        echo "❌ Attempt 2 failed"
        
        echo ""
        echo "Attempt 3: Using typeorm directly..."
        if docker exec $CONTAINER_NAME sh -c "cd /app && npx typeorm migration:run -d dist/config/database.config.js"; then
            echo "✅ Migration successful!"
            MIGRATION_SUCCESS=true
        else
            echo "❌ Attempt 3 failed"
        fi
    fi
fi

if [ "$MIGRATION_SUCCESS" = false ]; then
    echo ""
    echo "❌ All migration attempts failed!"
    echo "💡 Debugging information:"
    echo "  - Container status:"
    docker ps -a | grep $CONTAINER_NAME || echo "Container not found"
    echo "  - Container logs (last 50 lines):"
    docker logs --tail 50 $CONTAINER_NAME
    echo "  - Config file check:"
    docker exec $CONTAINER_NAME ls -la /app/dist/config/ 2>/dev/null || echo "Config directory not found"
    echo "  - Package.json scripts:"
    docker exec $CONTAINER_NAME cat /app/package.json | grep -A 5 "typeorm" || echo "Could not read package.json"
    exit 1
fi

# Verify migration results
echo ""
echo "🔍 Verifying migration results..."
sleep 3

USERS_TABLE_AFTER=$(docker exec $CONTAINER_NAME sh -c "cd /app && npm run typeorm:prod -- query \"SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users'\" -d dist/config/database.config.js" 2>/dev/null | grep -c "users" || echo "0")
ACCOUNTS_TABLE_AFTER=$(docker exec $CONTAINER_NAME sh -c "cd /app && npm run typeorm:prod -- query \"SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'accounts'\" -d dist/config/database.config.js" 2>/dev/null | grep -c "accounts" || echo "0")
APPLICATION_LOGS_TABLE_AFTER=$(docker exec $CONTAINER_NAME sh -c "cd /app && npm run typeorm:prod -- query \"SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'application_logs'\" -d dist/config/database.config.js" 2>/dev/null | grep -c "application_logs" || echo "0")

echo "📊 Tables status after migration:"
echo "  - users: $([ "$USERS_TABLE_AFTER" -eq 1 ] && echo "✅ exists" || echo "❌ missing")"
echo "  - accounts: $([ "$ACCOUNTS_TABLE_AFTER" -eq 1 ] && echo "✅ exists" || echo "❌ missing")"
echo "  - application_logs: $([ "$APPLICATION_LOGS_TABLE_AFTER" -eq 1 ] && echo "✅ exists" || echo "❌ missing")"

if [ "$USERS_TABLE_AFTER" -eq 0 ] || [ "$ACCOUNTS_TABLE_AFTER" -eq 0 ]; then
    echo ""
    echo "❌ Error: Critical tables still missing after migration!"
    echo "💡 This indicates migrations did not run successfully or migrations are incomplete."
    exit 1
fi

echo ""
echo "✅ Migration completed successfully!"
echo "📋 Executed migrations:"
docker exec $CONTAINER_NAME sh -c "cd /app && npm run typeorm:prod -- query \"SELECT * FROM migrations ORDER BY timestamp DESC LIMIT 10\" -d dist/config/database.config.js" 2>/dev/null || echo "Could not query migrations"

