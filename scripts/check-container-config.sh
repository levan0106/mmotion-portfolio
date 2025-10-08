#!/bin/bash

# Check Container Config Script
# Checks what config files are available in the container

set -e

echo "🔍 Checking Container Config Files..."

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

# Check container working directory
echo "🔍 Checking container working directory..."
docker exec $CONTAINER_NAME pwd

# Check if /app directory exists
echo "🔍 Checking /app directory..."
docker exec $CONTAINER_NAME ls -la /app

# Look for TypeScript files
echo "🔍 Looking for TypeScript files..."
docker exec $CONTAINER_NAME find /app -name "*.ts" -type f 2>/dev/null | head -10 || echo "No TypeScript files found"

# Look for JavaScript files
echo "🔍 Looking for JavaScript files..."
docker exec $CONTAINER_NAME find /app -name "*.js" -type f 2>/dev/null | head -10 || echo "No JavaScript files found"

# Look for database config files
echo "🔍 Looking for database config files..."
docker exec $CONTAINER_NAME find /app -name "*database*" -type f 2>/dev/null || echo "No database config files found"

# Check dist directory
echo "🔍 Checking dist directory..."
docker exec $CONTAINER_NAME ls -la /app/dist/ 2>/dev/null || echo "No dist directory found"

# Check dist/src/config directory
echo "🔍 Checking dist/src/config directory..."
docker exec $CONTAINER_NAME ls -la /app/dist/src/config/ 2>/dev/null || echo "No dist/src/config directory found"

# Test TypeORM command
echo "🔍 Testing TypeORM command..."
docker exec $CONTAINER_NAME npm run typeorm -- --help 2>/dev/null || echo "TypeORM command not available"

echo "🎉 Container config check completed!"
