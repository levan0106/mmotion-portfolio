#!/bin/bash

# Bash script to seed production data
# This script will create the minimum required data for production system

# Default values
DATABASE_HOST=${DATABASE_HOST:-"localhost"}
DATABASE_PORT=${DATABASE_PORT:-"5432"}
DATABASE_NAME=${DATABASE_NAME:-"portfolio_db"}
DATABASE_USER=${DATABASE_USER:-"postgres"}
DATABASE_PASSWORD=${DATABASE_PASSWORD:-"postgres"}

echo "🌱 Seeding production data..."

# Check if database is running
echo "📊 Checking database connection..."
if ! docker exec portfolio_postgres psql -U $DATABASE_USER -d $DATABASE_NAME -c "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ Database is not running. Please start it first:"
    echo "   docker-compose up -d postgres"
    exit 1
fi

echo "✅ Database is running"

# Run the seed script
echo "🌱 Running production seed script..."
# Get the script directory to handle paths correctly
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
docker exec -i portfolio_postgres psql -U $DATABASE_USER -d $DATABASE_NAME < "$SCRIPT_DIR/seed-production-data.sql"

if [ $? -eq 0 ]; then
    echo "✅ Production data seeded successfully!"
    echo ""
    echo "📊 Created:"
    echo "   • 1 Main Account (tung@example.com)"
    echo "   • 1 Default Portfolio"
    echo "   • 3 Global Assets (VCB, FPT, GOLD)"
    echo "   • 3 Assets"
    echo "   • 3 Asset Prices"
    echo "   • 2 Cash Flows"
    echo "   • 1 NAV Snapshot"
    echo ""
    echo "🚀 Production system is now ready!"
else
    echo "❌ Failed to seed production data. Please check the error above."
    exit 1
fi
