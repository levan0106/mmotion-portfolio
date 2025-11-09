#!/bin/bash
set -e

echo "Checking and Running Migrations"
echo "================================"
echo ""

CONTAINER_NAME="mmotion-backend"

echo "Step 1: Checking migration file content..."
echo "-------------------------------------------"
docker exec $CONTAINER_NAME sh -c 'head -25 /app/dist/migrations/1734567890123-optimize-allocation-timeline-performance.js' || echo "File not found or error"

echo ""
echo "Step 2: Dropping migrations table..."
echo "-------------------------------------"
docker exec $CONTAINER_NAME sh -c 'cd /app && npm run typeorm:prod -- query "DROP TABLE IF EXISTS migrations" -d dist/config/database.config.js' || echo "Table does not exist"

echo ""
echo "Step 3: Running all migrations..."
echo "----------------------------------"
docker exec $CONTAINER_NAME sh -c 'cd /app && npm run typeorm:migration:run:prod' 2>&1 | tail -50

echo ""
echo "Step 4: Checking migration status..."
echo "-------------------------------------"
docker exec $CONTAINER_NAME sh -c 'cd /app && npm run typeorm:prod -- migration:show -d dist/config/database.config.js' 2>&1 | head -30

echo ""
echo "Step 5: Verifying critical tables..."
echo "-------------------------------------"
docker exec $CONTAINER_NAME sh -c 'cd /app && npm run typeorm:prod -- query "SELECT table_name FROM information_schema.tables WHERE table_schema = '\''public'\'' AND table_name IN ('\''users'\'', '\''accounts'\'', '\''application_logs'\'', '\''asset_allocation_snapshots'\'') ORDER BY table_name" -d dist/config/database.config.js' || echo "Query failed"

echo ""
echo "Done!"

