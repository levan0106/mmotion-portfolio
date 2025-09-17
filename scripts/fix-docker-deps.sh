#!/bin/bash

# Fix Docker Dependencies Script
# This script helps resolve dependency issues in Docker containers

echo "🔧 Fixing Docker Dependencies..."

# Stop and remove existing containers
echo "📦 Stopping and removing existing containers..."
docker-compose down

# Remove the app container specifically
echo "🗑️ Removing app container..."
docker rm -f portfolio_app 2>/dev/null || true

# Remove the app image to force rebuild
echo "🗑️ Removing app image..."
docker rmi -f mmotion-portfolio_app 2>/dev/null || true

# Clean up any dangling images
echo "🧹 Cleaning up dangling images..."
docker image prune -f

# Rebuild the app container with no cache
echo "🔨 Rebuilding app container with no cache..."
docker-compose build --no-cache app

# Start the services
echo "🚀 Starting services..."
docker-compose up -d postgres redis

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Start the app container
echo "🚀 Starting app container..."
docker-compose up app

echo "✅ Docker dependencies fix completed!"
echo "If you still see errors, check the logs with: docker-compose logs app"
