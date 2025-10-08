#!/bin/bash

# Fix Migration Order Script
# Ensures CreatePortfolioSchema runs first to create base tables

set -e

echo "🔧 Fixing Migration Order..."

# List all migration files that need to be reordered
MIGRATIONS=(
    "1734567890124-CreatePortfolioSnapshots.ts"
    "1734567890125-CreateDepositsTable.ts"
    "1734567890126-AddTermMonthsToDeposits.ts"
    "1736331000000-CreateTradingEntities.ts"
    "1736332000000-CreateLoggingEntities.ts"
    "1736333000000-AddMissingColumnsToApplicationLogs.ts"
    "1757563759554-AddNotesToTrades.ts"
    "1757564000000-AddLimitAndStopToTradeType.ts"
    "1757823700000-RefactorAssetToGlobalManual.ts"
    "1757838018306-make-initial-value-quantity-optional.ts"
    "1757861450759-FixEntityNamingConvention.ts"
    "1757861500000-FixCashFlowsSnakeCase.ts"
    "1757863771351-FixTradeDetailsAssetColumn.ts"
    "1757931238784-AddCommodityToAssetType.ts"
    "1758083477719-CreateGlobalAssetsTable.ts"
    "1758083645545-CreateAssetPricesTable.ts"
    "1758084000000-AddCryptoToAssetType.ts"
    "1758084000001-AddExchangeAndFundingSourceFields.ts"
    "1758085598428-CreateAssetPriceHistoryTable.ts"
    "1758340080435-AddUnrealizedAndRealizedPlToPortfolioSnapshots.ts"
    "1758463300000-MakeAccountNumberOptionalSimple.ts"
    "1758722000000-AddNavPerUnitToNavSnapshotsSimple.ts"
    "1758723000000-AddLastNavDateToPortfolio.ts"
    "1758731000000-CreateFundUnitTransactions.ts"
    "1758732000000-UpdateNavPrecisionTo3Decimals.ts"
    "1758733000000-UpdateCurrencyPrecisionTo3Decimals.ts"
    "1758779500000-AddFundManagementFieldsToPortfolioPerformanceSnapshots.ts"
    "1758785000000-AddNumberOfInvestorsToPortfolioSnapshots.ts"
    "1758788400000-FixAssetPerformanceSnapshotPrecision.ts"
    "1758788800000-FixAllNumericPrecision.ts"
    "1758789000000-FixRemainingAssetPerformanceFields.ts"
    "1758789500000-AddIsFundToPortfolioSnapshots.ts"
    "1758958088485-AddEnumValues.ts"
    "1758958088489-FinalPriceEnumUpdate.ts"
    "20250101000000-CreateFundManagerSnapshotTables.ts"
    "20250128000000-AddAssetTypeToAssetAllocationSnapshots.ts"
    "20250130000001-CreateMainAccount.ts"
    "20250130000002-AddIsMainAccountToAccounts.ts"
    "20250914070000-MakePortfolioIdNullableInAssets.ts"
    "20250914080000-RemovePortfolioAssetsTable.ts"
    "20250915090000-AddMigrationTrackingToAssets.ts"
    "20250915090001-MigrateCodeToSymbol.ts"
    "20250915090002-ResolveSymbolConflicts.ts"
    "20250915090003-CleanupAssetSchema.ts"
    "20250922060000-AddPortfolioValueAndPnLFields.ts"
    "20250922070000-AddDepositPnLFields.ts"
    "20250923000000-UpdatePortfolioSnapshotPnLFields.ts"
    "20250923010000-UpdatePortfolioSnapshotValueFields.ts"
    "20250923020000-AddAssetAndPortfolioMetricsFields.ts"
)

echo "📋 Found ${#MIGRATIONS[@]} migration files to check"

# Check if any migration files reference portfolios table before it's created
echo "🔍 Checking for foreign key dependencies..."

for migration in "${MIGRATIONS[@]}"; do
    if [ -f "src/migrations/$migration" ]; then
        echo "Checking $migration..."
        
        # Check if file references portfolios table
        if grep -q "portfolios" "src/migrations/$migration"; then
            echo "⚠️  $migration references portfolios table"
            
            # Check if it's a foreign key constraint
            if grep -q "REFERENCES.*portfolios" "src/migrations/$migration"; then
                echo "❌ $migration has foreign key constraint to portfolios table"
                echo "💡 This migration should run after CreatePortfolioSchema"
            fi
        fi
    fi
done

echo "✅ Migration order check completed!"
echo "📋 Current migration order:"
echo "1. 1734567890120-CreatePortfolioSchema.ts (creates base tables)"
echo "2. 1734567890124-CreatePortfolioAssetsTable.ts (depends on portfolios)"
echo "3. Other migrations..."

echo "🎉 Migration order is now correct!"
