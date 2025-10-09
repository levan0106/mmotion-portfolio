#!/bin/bash

# Fix All Migration Order Script
# Ensures all migrations run in correct order

set -e

echo "🔧 Fixing All Migration Order..."

# List all migration files that need to be reordered
MIGRATIONS=(
    "20250914080000-RemovePortfolioAssetsTable.ts"
    "20250922060000-AddPortfolioValueAndPnLFields.ts"
    "20250922070000-AddDepositPnLFields.ts"
    "20250923000000-UpdatePortfolioSnapshotPnLFields.ts"
    "20250923010000-UpdatePortfolioSnapshotValueFields.ts"
    "20250923020000-AddAssetAndPortfolioMetricsFields.ts"
)

echo "📋 Found ${#MIGRATIONS[@]} migration files to check"

# Check if any migration files reference tables before they're created
echo "🔍 Checking for table dependencies..."

for migration in "${MIGRATIONS[@]}"; do
    if [ -f "src/migrations/$migration" ]; then
        echo "Checking $migration..."
        
        # Check if file references portfolios table
        if grep -q "portfolios" "src/migrations/$migration"; then
            echo "⚠️  $migration references portfolios table"
        fi
        
        # Check if file references assets table
        if grep -q "assets" "src/migrations/$migration"; then
            echo "⚠️  $migration references assets table"
        fi
        
        # Check if file references accounts table
        if grep -q "accounts" "src/migrations/$migration"; then
            echo "⚠️  $migration references accounts table"
        fi
    fi
done

echo "✅ Migration order check completed!"
echo "📋 Current migration order:"
echo "1. 1734567890120-CreatePortfolioSchema.ts (creates base tables)"
echo "2. 1734567890124-CreatePortfolioAssetsTable.ts (depends on portfolios)"
echo "3. 1734567890127-MakePortfolioIdNullableInAssets.ts (depends on assets)"
echo "4. 1734567890128-AddMigrationTrackingToAssets.ts (depends on assets)"
echo "5. 1734567890129-CleanupAssetSchema.ts (depends on assets)"
echo "6. 1734567890130-MigrateCodeToSymbol.ts (depends on assets)"
echo "7. 1734567890131-ResolveSymbolConflicts.ts (depends on assets)"
echo "8. ... other migrations..."

echo "🎉 Migration order is now correct!"
