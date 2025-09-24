# Last NAV Date Implementation

## Overview

This document describes the implementation of the `lastNavDate` field in the Portfolio entity to provide a more explicit and accurate way to track when NAV per unit was last calculated and updated.

## Problem Statement

Previously, the system used `portfolio.updatedAt` to determine if NAV per unit data was stale. However, this approach had limitations:

1. **Imprecise**: `updatedAt` tracks any portfolio changes, not specifically NAV per unit updates
2. **Unclear**: It's not obvious that this field is used for NAV staleness checks
3. **Inflexible**: Cannot distinguish between NAV updates and other portfolio modifications

## Solution

### 1. Database Schema Changes

Added a new field `last_nav_date` to the `portfolios` table:

```sql
ALTER TABLE "portfolios" ADD "last_nav_date" TIMESTAMP;
```

### 2. Entity Updates

Updated `Portfolio` entity to include the new field:

```typescript
/**
 * Timestamp when NAV per unit was last calculated and updated
 */
@Column({ type: 'timestamp', nullable: true, name: 'last_nav_date' })
lastNavDate: Date;
```

### 3. Staleness Check Logic

Updated the `isNavPerUnitStale` method to use `lastNavDate` instead of `updatedAt`:

```typescript
private isNavPerUnitStale(lastNavDate: Date): boolean {
  if (!lastNavDate) {
    return true; // Consider stale if no NAV date
  }
  
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000)); // 24 hours ago
  
  return lastNavDate <= oneDayAgo; // Use <= to include exactly 1 day ago
}
```

### 4. Update Triggers

The `lastNavDate` is updated in the following scenarios:

#### A. Portfolio to Fund Conversion
```typescript
// In InvestorHoldingService.convertPortfolioToFund
portfolio.lastNavDate = new Date(); // Set current timestamp as last NAV date
```

#### B. Daily Snapshots
```typescript
// In PortfolioAnalyticsService.generateNavSnapshot
await this.portfolioRepository.update(portfolioId, {
  navPerUnit: navPerUnit,
  lastNavDate: navDate // Use snapshot date as last NAV date
});
```

#### C. Manual Refresh
```typescript
// In InvestorHoldingService.refreshNavPerUnit
await this.portfolioRepository.update(portfolioId, {
  navPerUnit: navPerUnit,
  lastNavDate: new Date() // Update last NAV date
});
```

### 5. Fallback Logic

The system now uses a DB-first approach with intelligent fallback:

```typescript
// Check if DB value is valid and not stale
const isNavPerUnitValid = portfolio.navPerUnit > 0;
const isNavPerUnitStale = this.isNavPerUnitStale(portfolio.lastNavDate);

if (isNavPerUnitValid && !isNavPerUnitStale) {
  // Use DB value (already set)
  this.logger.debug(`Using DB navPerUnit: ${portfolio.navPerUnit} for portfolio ${portfolioId} (lastNavDate: ${portfolio.lastNavDate})`);
} else {
  // Fallback to real-time calculation
  portfolio.navPerUnit = newFields.totalAllValue / outstandingUnits;
  const reason = !isNavPerUnitValid ? 'DB value is zero' : 'DB value is stale';
  this.logger.debug(`Calculated real-time navPerUnit: ${portfolio.navPerUnit} for portfolio ${portfolioId} (reason: ${reason}, lastNavDate: ${portfolio.lastNavDate})`);
}
```

## Benefits

1. **Explicit Tracking**: Clear indication of when NAV per unit was last calculated
2. **Accurate Staleness Detection**: Only considers NAV-specific updates, not general portfolio changes
3. **Better Performance**: Reduces unnecessary real-time calculations when data is fresh
4. **Improved Debugging**: Clear logging shows why fallback calculation was triggered
5. **Flexible Configuration**: Easy to adjust staleness threshold (currently 1 day)

## Migration

The implementation includes a migration script:

```typescript
export class AddLastNavDateToPortfolio1758723000000 implements MigrationInterface {
    name = 'AddLastNavDateToPortfolio1758723000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "portfolios" ADD "last_nav_date" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "portfolios" DROP COLUMN "last_nav_date"`);
    }
}
```

## Testing

### Database Test
```javascript
// Check if last_nav_date column exists and has correct data
const columnCheck = await client.query(`
  SELECT column_name, data_type, is_nullable 
  FROM information_schema.columns 
  WHERE table_name = 'portfolios' AND column_name = 'last_nav_date'
`);
```

### Logic Test
```javascript
// Test staleness detection logic
function isNavPerUnitStale(lastNavDate) {
  if (!lastNavDate) return true;
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
  return lastNavDate <= oneDayAgo;
}
```

## Current Status

✅ **Completed**:
- Database migration executed successfully
- Portfolio entity updated with `lastNavDate` field
- Staleness check logic updated in both `PortfolioService` and `InvestorHoldingService`
- Update triggers implemented for conversion, snapshots, and manual refresh
- Fallback logic implemented with proper logging

✅ **Tested**:
- Database schema changes verified
- Staleness detection logic tested with various scenarios
- Portfolio data shows `lastNavDate: null` (will trigger fallback calculation)

## Next Steps

1. **API Testing**: Test the complete flow with actual API calls
2. **Performance Monitoring**: Monitor the impact on API response times
3. **Configuration**: Consider making the staleness threshold configurable
4. **Documentation**: Update API documentation to reflect the new field

## Related Files

- `src/modules/portfolio/entities/portfolio.entity.ts`
- `src/modules/portfolio/services/portfolio.service.ts`
- `src/modules/portfolio/services/investor-holding.service.ts`
- `src/modules/portfolio/services/portfolio-analytics.service.ts`
- `src/migrations/1758723000000-AddLastNavDateToPortfolio.ts`
