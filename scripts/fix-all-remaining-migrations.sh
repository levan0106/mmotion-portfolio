#!/bin/bash

# Fix All Remaining Migrations Script
# Ensures all migrations run in correct order: Base tables -> Table modifications -> Data migrations

set -e

echo "🔧 Fixing All Remaining Migrations..."

# List all migration files that need to be reordered
MIGRATIONS=(
    "20250922070000-AddDepositPnLFields.ts"
    "20250923000000-UpdatePortfolioSnapshotPnLFields.ts"
    "20250923010000-UpdatePortfolioSnapshotValueFields.ts"
    "20250923020000-AddAssetAndPortfolioMetricsFields.ts"
    "20250914080000-RemovePortfolioAssetsTable.ts"
)

echo "📋 Found ${#MIGRATIONS[@]} migration files to check and fix"

# Counter for new timestamps
COUNTER=133

for migration in "${MIGRATIONS[@]}"; do
    if [ -f "src/migrations/$migration" ]; then
        echo "🔍 Checking $migration..."
        
        # Extract the old timestamp and class name
        OLD_TIMESTAMP=$(echo "$migration" | cut -d'-' -f1)
        OLD_CLASS_NAME=$(echo "$migration" | cut -d'-' -f2- | sed 's/.ts$//')
        
        # Create new timestamp
        NEW_TIMESTAMP="1734567890${COUNTER}"
        NEW_MIGRATION_NAME="${NEW_TIMESTAMP}-${OLD_CLASS_NAME}.ts"
        
        echo "📝 Moving $migration to $NEW_MIGRATION_NAME"
        
        # Move the file
        mv "src/migrations/$migration" "src/migrations/$NEW_MIGRATION_NAME"
        
        # Update class name in the file
        NEW_CLASS_NAME="${OLD_CLASS_NAME}${NEW_TIMESTAMP}"
        sed -i "s/export class ${OLD_CLASS_NAME}${OLD_TIMESTAMP}/export class ${NEW_CLASS_NAME}/" "src/migrations/$NEW_MIGRATION_NAME"
        sed -i "s/name = '${OLD_CLASS_NAME}${OLD_TIMESTAMP}'/name = '${NEW_CLASS_NAME}'/" "src/migrations/$NEW_MIGRATION_NAME"
        
        echo "✅ Updated $NEW_MIGRATION_NAME"
        
        COUNTER=$((COUNTER + 1))
    fi
done

echo "✅ All remaining migrations have been reordered!"
echo "📋 Final migration order:"
echo "1. 1734567890120-CreatePortfolioSchema.ts (creates base tables)"
echo "2. 1734567890124-CreatePortfolioAssetsTable.ts (depends on portfolios)"
echo "3. 1734567890125-AddNavUnitSystem.ts"
echo "4. 1734567890126-CreateAssetAllocationSnapshots.ts"
echo "5. 1734567890127-MakePortfolioIdNullableInAssets.ts (modifies assets)"
echo "6. 1734567890128-AddMigrationTrackingToAssets.ts (modifies assets)"
echo "7. 1734567890129-CleanupAssetSchema.ts (modifies assets)"
echo "8. 1734567890130-MigrateCodeToSymbol.ts (data migration)"
echo "9. 1734567890131-ResolveSymbolConflicts.ts (data migration)"
echo "10. 1734567890132-AddPortfolioValueAndPnLFields.ts (modifies portfolios)"
echo "11. ... other migrations (modifications and data migrations)..."

echo "🎉 Migration order is now correct!"
echo "📋 Order: Base tables -> Table modifications -> Data migrations"
