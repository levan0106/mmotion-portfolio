#!/bin/bash

# Script to toggle cache on/off for development
# Usage: ./scripts/toggle-cache.sh [on|off]

CACHE_STATUS=${1:-off}

if [ "$CACHE_STATUS" = "on" ]; then
    echo "Enabling cache..."
    # Update .env file
    if [ -f .env ]; then
        sed -i 's/CACHE_ENABLED=.*/CACHE_ENABLED=true/' .env
    else
        echo "CACHE_ENABLED=true" >> .env
    fi
    
    # Update docker-compose.yml
    sed -i 's/CACHE_ENABLED=.*/CACHE_ENABLED=true/' docker-compose.yml
    
    echo "✅ Cache enabled"
    echo "Restart the application to apply changes:"
    echo "  docker-compose down && docker-compose up -d"
    
elif [ "$CACHE_STATUS" = "off" ]; then
    echo "Disabling cache..."
    # Update .env file
    if [ -f .env ]; then
        sed -i 's/CACHE_ENABLED=.*/CACHE_ENABLED=false/' .env
    else
        echo "CACHE_ENABLED=false" >> .env
    fi
    
    # Update docker-compose.yml
    sed -i 's/CACHE_ENABLED=.*/CACHE_ENABLED=false/' docker-compose.yml
    
    echo "✅ Cache disabled"
    echo "Restart the application to apply changes:"
    echo "  docker-compose down && docker-compose up -d"
    
else
    echo "Usage: $0 [on|off]"
    echo "Current cache status:"
    if [ -f .env ]; then
        grep CACHE_ENABLED .env || echo "CACHE_ENABLED not found in .env"
    else
        echo ".env file not found"
    fi
    grep CACHE_ENABLED docker-compose.yml || echo "CACHE_ENABLED not found in docker-compose.yml"
fi
