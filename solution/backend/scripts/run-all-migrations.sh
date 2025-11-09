#!/bin/bash
set -e

echo "Running All Migrations"
echo "======================"
echo ""

CONTAINER_NAME="mmotion-backend"

echo "Step 1: Dropping migrations table..."
docker exec $CONTAINER_NAME sh -c 'cd /app && npm run typeorm:prod -- query "DROP TABLE IF EXISTS migrations" -d dist/config/database.config.js' || echo "Table does not exist"

echo ""
echo "Step 2: Running all migrations..."
docker exec $CONTAINER_NAME sh -c 'cd /app && npm run typeorm:migration:run:prod' 2>&1

echo ""
echo "Step 3: Verifying critical tables..."
docker exec $CONTAINER_NAME sh -c 'cd /app && npm run typeorm:prod -- query "SELECT table_name FROM information_schema.tables WHERE table_schema = '\''public'\'' AND table_name IN ('\''users'\'', '\''accounts'\'', '\''application_logs'\'')" -d dist/config/database.config.js' || echo "Query failed"

echo ""
echo "Done!"

