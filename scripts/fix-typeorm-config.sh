#!/bin/bash

# Fix TypeORM Config Script
# Fixes TypeORM configuration issues on production

set -e

echo "🔧 Fixing TypeORM Configuration..."

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

# Check current working directory in container
echo "🔍 Checking container working directory..."
docker exec $CONTAINER_NAME pwd

# Check if config file exists
echo "🔍 Checking config file location..."
docker exec $CONTAINER_NAME find /app -name "database.config.ts" -type f 2>/dev/null || echo "Config file not found"

# Check if we're in the right directory
echo "🔍 Checking if we're in the right directory..."
docker exec $CONTAINER_NAME ls -la /app/src/config/ 2>/dev/null || echo "Config directory not found"

# Try to run migration with absolute path
echo "🔧 Trying migration with absolute path..."
docker exec $CONTAINER_NAME npm run typeorm:migration:run -d /app/src/config/database.config.ts

if [ $? -eq 0 ]; then
    echo "✅ Migration successful with absolute path"
else
    echo "❌ Migration failed with absolute path"
    
    # Try alternative approach - run from container root
    echo "🔧 Trying migration from container root..."
    docker exec $CONTAINER_NAME sh -c "cd /app && npm run typeorm:migration:run"
    
    if [ $? -eq 0 ]; then
        echo "✅ Migration successful from container root"
    else
        echo "❌ Migration failed from container root"
        
        # Try to run migration without config file
        echo "🔧 Trying migration without config file..."
        docker exec $CONTAINER_NAME npm run typeorm:migration:run
        
        if [ $? -eq 0 ]; then
            echo "✅ Migration successful without config file"
        else
            echo "❌ All migration attempts failed"
            echo "💡 Check container logs: docker logs $CONTAINER_NAME"
            exit 1
        fi
    fi
fi

echo "🎉 TypeORM configuration fix completed!"
