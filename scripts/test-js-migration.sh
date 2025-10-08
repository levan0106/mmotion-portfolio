#!/bin/bash

# Test JavaScript Migration Script
# Tests migration with compiled JavaScript config file

set -e

echo "🧪 Testing JavaScript Migration..."

# Detect backend container
echo "🔍 Detecting backend container..."
CONTAINER_NAME=$(docker ps --format "{{.Names}}" | grep -E "(portfolio.*backend|portfolio.*app)" | head -1)

if [ -z "$CONTAINER_NAME" ]; then
    echo "❌ Error: No backend container found"
    exit 1
fi

echo "✅ Backend container detected: $CONTAINER_NAME"

# Find JavaScript config file
echo "🔍 Looking for JavaScript config file..."
CONFIG_PATH=$(docker exec $CONTAINER_NAME find /app -name "database.config.js" -type f 2>/dev/null | head -1)

if [ -n "$CONFIG_PATH" ]; then
    echo "✅ Found config file at: $CONFIG_PATH"
    
    # Test migration with JavaScript config
    echo "🧪 Testing migration with JavaScript config..."
    if docker exec $CONTAINER_NAME npm run typeorm:migration:run -d "$CONFIG_PATH"; then
        echo "✅ Migration successful with JavaScript config!"
    else
        echo "❌ Migration failed with JavaScript config"
    fi
else
    echo "❌ JavaScript config file not found"
    echo "Available files:"
    docker exec $CONTAINER_NAME find /app -name "*database*" -type f 2>/dev/null || echo "No database files found"
fi

echo "🎉 JavaScript migration test completed!"
