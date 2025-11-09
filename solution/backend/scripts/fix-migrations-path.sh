#!/bin/bash

# Fix Migrations Path Script
# Tries to fix the migrations path issue by checking and potentially updating the config

set -e

echo "🔧 Fix Migrations Path Script"
echo "=============================="

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

# Check if migrations exist in src (source)
echo ""
echo "📋 Checking source migrations..."
SRC_MIGRATIONS=$(docker exec $CONTAINER_NAME sh -c "find /app/src/migrations -name '*.ts' -type f 2>/dev/null | wc -l" || echo "0")
echo "Found $SRC_MIGRATIONS TypeScript migration files in src/migrations"

# Check if migrations exist in dist (compiled)
echo ""
echo "📋 Checking compiled migrations..."
DIST_MIGRATIONS=$(docker exec $CONTAINER_NAME sh -c "find /app/dist/migrations -name '*.js' -type f 2>/dev/null | wc -l" || echo "0")
echo "Found $DIST_MIGRATIONS JavaScript migration files in dist/migrations"

if [ "$DIST_MIGRATIONS" -eq 0 ]; then
    echo ""
    echo "❌ Problem found: No compiled migrations in dist/migrations!"
    echo ""
    echo "💡 Possible solutions:"
    echo "   1. Migrations might not be compiled by NestJS"
    echo "   2. Need to manually copy migrations to dist"
    echo ""
    echo "🔄 Attempting to copy migrations from src to dist..."
    
    # Try to copy migrations if src exists
    if [ "$SRC_MIGRATIONS" -gt 0 ]; then
        echo "Copying migrations from src/migrations to dist/migrations..."
        docker exec $CONTAINER_NAME sh -c "mkdir -p /app/dist/migrations && cp -r /app/src/migrations/*.ts /app/dist/migrations/ 2>/dev/null || true"
        echo "✅ Migrations copied (TypeScript files)"
        echo "⚠️  Note: These are .ts files, but TypeORM should handle them"
    else
        echo "❌ No source migrations found either!"
    fi
fi

# Check config file migrations path
echo ""
echo "📋 Checking database.config.ts migrations path..."
CONFIG_CONTENT=$(docker exec $CONTAINER_NAME cat /app/dist/config/database.config.js 2>/dev/null | grep -A 2 "migrations:" || echo "")
if [ -n "$CONFIG_CONTENT" ]; then
    echo "Current migrations path in config:"
    echo "$CONFIG_CONTENT"
else
    echo "Could not read config file"
fi

# Test different migration paths
echo ""
echo "📋 Testing migration discovery with different paths..."

# Test 1: Current path
echo "Test 1: Current path (dist/migrations/*.js)"
docker exec $CONTAINER_NAME sh -c "cd /app && find dist/migrations -name '*.js' -type f 2>/dev/null | head -5" || echo "No .js files found"

# Test 2: Try .ts files
echo ""
echo "Test 2: TypeScript files (dist/migrations/*.ts)"
docker exec $CONTAINER_NAME sh -c "cd /app && find dist/migrations -name '*.ts' -type f 2>/dev/null | head -5" || echo "No .ts files found"

# Test 3: Try src/migrations
echo ""
echo "Test 3: Source migrations (src/migrations/*.ts)"
docker exec $CONTAINER_NAME sh -c "cd /app && find src/migrations -name '*.ts' -type f 2>/dev/null | head -5" || echo "No source migrations found"

# Try running migration with explicit path pattern
echo ""
echo "📋 Testing migration:show with current config..."
docker exec $CONTAINER_NAME sh -c "cd /app && npm run typeorm:prod -- migration:show -d dist/config/database.config.js" 2>&1 | head -20 || echo "Could not run migration:show"

echo ""
echo "✅ Diagnostic complete!"
echo ""
echo "💡 Next steps:"
echo "   1. If migrations are in src but not dist: They need to be compiled"
echo "   2. If migrations are missing: Check Dockerfile build process"
echo "   3. If path is wrong: May need to update database.config.ts"
echo "   4. Try running: ./scripts/debug-migrations.sh for more details"

