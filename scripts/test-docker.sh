#!/bin/bash

# Docker Test Script for CR-006 Asset Snapshot System

set -e

echo "🚀 Starting Docker integration tests for CR-006 Asset Snapshot System..."

# Check if Docker is running
if ! docker ps > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if the application is running
if ! curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "❌ Application is not running on port 3000. Please start the application and try again."
    exit 1
fi

# Set environment variables for testing
export NODE_ENV=test
export DB_NAME=portfolio_test
export DB_HOST=localhost
export DB_PORT=5432
export DB_USERNAME=postgres
export DB_PASSWORD=postgres

echo "✅ Environment variables set for testing"

# Run integration tests
echo "🧪 Running integration tests..."
npm run test:e2e:docker

echo "✅ Docker integration tests completed successfully!"
