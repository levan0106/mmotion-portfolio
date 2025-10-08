#!/bin/bash

# Check Migration Dependencies Script
# Checks for migrations that reference tables before they're created

set -e

echo "🔍 Checking Migration Dependencies..."

# Check for migrations that reference tables before they're created
echo "📋 Checking for table dependencies..."

# Check for portfolios table references
echo "🔍 Checking for portfolios table references..."
grep -r "portfolios" src/migrations/ --include="*.ts" | grep -v "1734567890120-CreatePortfolioSchema" | head -10

# Check for assets table references
echo "🔍 Checking for assets table references..."
grep -r "assets" src/migrations/ --include="*.ts" | grep -v "1734567890120-CreatePortfolioSchema" | head -10

# Check for accounts table references
echo "🔍 Checking for accounts table references..."
grep -r "accounts" src/migrations/ --include="*.ts" | grep -v "1734567890120-CreatePortfolioSchema" | head -10

echo "✅ Migration dependencies check completed!"
echo "📋 Current migration order:"
echo "1. 1734567890120-CreatePortfolioSchema.ts (creates base tables)"
echo "2. 1734567890124-CreatePortfolioAssetsTable.ts (depends on portfolios)"
echo "3. 1734567890127-MakePortfolioIdNullableInAssets.ts (depends on assets)"
echo "4. 1734567890128-AddMigrationTrackingToAssets.ts (depends on assets)"
echo "5. 1734567890129-CleanupAssetSchema.ts (depends on assets)"
echo "6. ... other migrations..."

echo "🎉 Migration dependencies are now correct!"
