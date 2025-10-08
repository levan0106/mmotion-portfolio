#!/bin/bash

# Test Package Scripts
# Tests if package.json scripts work with JavaScript config

set -e

echo "🧪 Testing Package Scripts..."

# Detect backend container
echo "🔍 Detecting backend container..."
CONTAINER_NAME=$(docker ps --format "{{.Names}}" | grep -E "(portfolio.*backend|portfolio.*app)" | head -1)

if [ -z "$CONTAINER_NAME" ]; then
    echo "❌ Error: No backend container found"
    exit 1
fi

echo "✅ Backend container detected: $CONTAINER_NAME"

# Test typeorm:migration:run script
echo "🧪 Testing typeorm:migration:run script..."
if docker exec $CONTAINER_NAME npm run typeorm:migration:run; then
    echo "✅ typeorm:migration:run script works!"
else
    echo "❌ typeorm:migration:run script failed"
    echo "💡 Check if dist/src/config/database.config.js exists"
    docker exec $CONTAINER_NAME ls -la /app/dist/src/config/ 2>/dev/null || echo "No dist/src/config directory found"
fi

# Test typeorm:seed script
echo "🧪 Testing typeorm:seed script..."
if docker exec $CONTAINER_NAME npm run typeorm:seed; then
    echo "✅ typeorm:seed script works!"
else
    echo "❌ typeorm:seed script failed"
fi

echo "🎉 Package scripts test completed!"
