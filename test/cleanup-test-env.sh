#!/bin/bash

# Test Environment Cleanup Script for CR-006 Asset Snapshot System

set -e

echo "🧹 Cleaning up test environment for CR-006 Asset Snapshot System..."

# Stop test containers
echo "🔄 Stopping test containers..."
docker-compose -f test/docker-compose.test.yml down -v 2>/dev/null || true

# Remove test volumes
echo "🔄 Removing test volumes..."
docker volume prune -f 2>/dev/null || true

# Clean test directories
echo "🔄 Cleaning test directories..."
rm -rf test-results coverage test/reports

# Clean test data
echo "🔄 Cleaning test data..."
npx ts-node test/test-db-setup.ts --cleanup 2>/dev/null || true

# Clean Jest cache
echo "🔄 Cleaning Jest cache..."
npx jest --clearCache 2>/dev/null || true

# Clean npm cache
echo "🔄 Cleaning npm cache..."
npm cache clean --force 2>/dev/null || true

echo "✅ Test environment cleanup completed successfully!"
echo ""
echo "Test environment has been cleaned up. You can run setup again with:"
echo "  ./test/setup-test-env.sh"
