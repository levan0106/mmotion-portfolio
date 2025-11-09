#!/bin/bash

# Debug Migrations Script
# Helps diagnose why TypeORM can't find migrations

set -e

echo "🔍 Debug Migrations Script"
echo "==========================="

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
    exit 1
fi

echo "✅ Backend container detected: $CONTAINER_NAME"

# Check config file
echo ""
echo "📋 Checking database config file..."
if docker exec $CONTAINER_NAME test -f /app/dist/config/database.config.js; then
    echo "✅ Config file exists: /app/dist/config/database.config.js"
else
    echo "❌ Config file NOT found at /app/dist/config/database.config.js"
    echo "💡 Looking for config files..."
    docker exec $CONTAINER_NAME find /app -name "database.config.js" -type f 2>/dev/null || echo "No config files found"
    exit 1
fi

# Check migrations directory
echo ""
echo "📋 Checking migrations directory..."
echo "Expected path: /app/dist/migrations"

if docker exec $CONTAINER_NAME test -d /app/dist/migrations; then
    echo "✅ Migrations directory exists: /app/dist/migrations"
    
    echo ""
    echo "📋 Listing migration files:"
    MIGRATION_COUNT=$(docker exec $CONTAINER_NAME sh -c "find /app/dist/migrations -name '*.js' -type f 2>/dev/null | wc -l" || echo "0")
    echo "Found $MIGRATION_COUNT migration files"
    
    if [ "$MIGRATION_COUNT" -gt 0 ]; then
        echo ""
        echo "Sample migration files:"
        docker exec $CONTAINER_NAME sh -c "find /app/dist/migrations -name '*.js' -type f 2>/dev/null | head -10" || echo "Could not list files"
        
        echo ""
        echo "First migration file content (first 20 lines):"
        FIRST_MIGRATION=$(docker exec $CONTAINER_NAME sh -c "find /app/dist/migrations -name '*.js' -type f 2>/dev/null | head -1")
        if [ -n "$FIRST_MIGRATION" ]; then
            docker exec $CONTAINER_NAME head -20 "$FIRST_MIGRATION" 2>/dev/null || echo "Could not read file"
        fi
    else
        echo "❌ No migration files found in /app/dist/migrations"
        echo "💡 This is the problem! Migrations are not being compiled/copied to dist/"
    fi
else
    echo "❌ Migrations directory NOT found: /app/dist/migrations"
    echo "💡 This is the problem! Migrations directory doesn't exist"
fi

# Check dist structure
echo ""
echo "📋 Checking dist directory structure:"
docker exec $CONTAINER_NAME sh -c "ls -la /app/dist/ 2>/dev/null | head -20" || echo "Could not list dist directory"

# Check what __dirname resolves to in config
echo ""
echo "📋 Checking config file to understand path resolution..."
echo "Config file location: /app/dist/config/database.config.js"
echo "Expected basePath: /app/dist (one level up from config)"
echo "Expected migrations path: /app/dist/migrations/*.js"

# Test path resolution
echo ""
echo "📋 Testing path resolution in Node.js..."
docker exec $CONTAINER_NAME sh -c "cd /app && node -e \"const path = require('path'); const basePath = path.join('/app/dist/config', '..'); console.log('basePath:', basePath); console.log('migrations path:', path.join(basePath, 'migrations', '*.js'));\"" 2>/dev/null || echo "Could not test path resolution"

# Check migrations table
echo ""
echo "📋 Checking migrations table in database:"
MIGRATIONS_TABLE=$(docker exec $CONTAINER_NAME sh -c "cd /app && npm run typeorm:prod -- query \"SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'migrations'\" -d dist/config/database.config.js" 2>/dev/null | grep -c "migrations" || echo "0")

if [ "$MIGRATIONS_TABLE" -eq 1 ]; then
    echo "✅ Migrations table exists"
    echo "Current migrations in database:"
    docker exec $CONTAINER_NAME sh -c "cd /app && npm run typeorm:prod -- query \"SELECT id, timestamp, name FROM migrations ORDER BY timestamp\" -d dist/config/database.config.js" 2>/dev/null || echo "Could not query migrations"
else
    echo "❌ Migrations table does not exist"
fi

# Try to show what TypeORM sees
echo ""
echo "📋 Testing TypeORM migration:show command..."
docker exec $CONTAINER_NAME sh -c "cd /app && npm run typeorm:prod -- migration:show -d dist/config/database.config.js" 2>&1 || echo "Could not run migration:show"

echo ""
echo "✅ Debug complete!"
echo ""
echo "💡 Common issues and solutions:"
echo "   1. If migrations directory doesn't exist: Check Dockerfile to ensure migrations are copied"
echo "   2. If migrations are empty: Check nest-cli.json and tsconfig.json build configuration"
echo "   3. If path is wrong: Check database.config.ts migrations path"
echo "   4. If TypeORM can't find files: Try using absolute paths in database.config.ts"

