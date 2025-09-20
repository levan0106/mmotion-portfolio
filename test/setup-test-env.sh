#!/bin/bash

# Test Environment Setup Script for CR-006 Asset Snapshot System

set -e

echo "🚀 Setting up test environment for CR-006 Asset Snapshot System..."

# Check if Docker is running
if ! docker ps > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if application is running
if ! curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "❌ Application is not running on port 3000. Please start the application and try again."
    exit 1
fi

# Set environment variables
export NODE_ENV=test
export DB_HOST=localhost
export DB_PORT=5432
export DB_USERNAME=postgres
export DB_PASSWORD=postgres
export DB_NAME=portfolio_test
export REDIS_HOST=localhost
export REDIS_PORT=6379

echo "✅ Environment variables set"

# Create test directories
mkdir -p test-results coverage test/reports

echo "✅ Test directories created"

# Install test dependencies
if [ -f "test/package.json" ]; then
    cd test
    npm install
    cd ..
    echo "✅ Test dependencies installed"
fi

# Run database migrations
echo "🔄 Running database migrations..."
npm run typeorm:migration:run

echo "✅ Database migrations completed"

# Setup test data
echo "🔄 Setting up test data..."
npx ts-node test/test-db-setup.ts

echo "✅ Test data setup completed"

# Run health check
echo "🔄 Running health check..."
npx ts-node test/test-health-check.ts

echo "✅ Health check completed"

echo "🎉 Test environment setup completed successfully!"
echo ""
echo "You can now run tests using:"
echo "  npm run test:e2e:docker"
echo "  npm run test:integration"
echo "  npm run test:performance"
echo "  npm run test:error-handling"
