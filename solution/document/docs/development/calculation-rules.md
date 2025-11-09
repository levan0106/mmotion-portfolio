# Portfolio Management System - Calculation Rules

## Overview
This document defines the standardized calculation rules and patterns used throughout the Portfolio Management System. All calculations must follow these rules to ensure consistency, accuracy, and maintainability.

## Table of Contents
1. [Asset Value Calculations](#asset-value-calculations)
2. [Portfolio Value Calculations](#portfolio-value-calculations)
3. [Tax and Fee Calculations](#tax-and-fee-calculations)
4. [Performance Metrics](#performance-metrics)
5. [Implementation Guidelines](#implementation-guidelines)
6. [Testing Requirements](#testing-requirements)

## Asset Value Calculations

### Current Value Calculation
**Formula**: `currentValue = currentQuantity × currentPrice - deductions`

**Implementation**:
- Use `AssetValueCalculatorService.calculateCurrentValue()`
- Always calculate real-time, never store in database
- Support both percentage and fixed value deductions

**Example**:
```typescript
const currentValue = assetValueCalculator.calculateCurrentValue(
  quantity: 100,
  currentPrice: 1000,
  options: {
    tax: { type: 'percentage', value: 10 }, // 10%
    fee: { type: 'fixed', value: 500 }      // $500
  }
);
// Result: (100 × 1000) - 10000 - 500 = 89500
```

### Current Price Source Priority
1. **Global Assets** (Primary): `global_assets.asset_prices.current_price`
2. **Market Data Service** (Fallback): External API or mock data
3. **Latest Trade Price** (Last Resort): Most recent trade price

**Implementation**:
```typescript
// Priority order for currentPrice
const currentPrice = await getCurrentPriceFromGlobalAsset(symbol) ||
                    await marketDataService.getCurrentPrice(symbol) ||
                    latestTrade.price;
```

## Portfolio Value Calculations

### Total Portfolio Value
**Formula**: `totalValue = cashBalance + totalAssetValue`

**Implementation**:
- Use `PortfolioValueCalculatorService.calculateTotalValue()`
- Calculate real-time, never store in database
- Include all asset positions with current prices

### Realized P&L
**Formula**: `realizedPl = SUM(trade_details.pnl WHERE side = 'SELL')`

**Implementation**:
```sql
SELECT COALESCE(SUM(td.pnl), 0) as totalRealizedPl
FROM trade_details td
INNER JOIN trades t ON td.sell_trade_id = t.trade_id
WHERE t.portfolio_id = ? AND t.side = 'SELL'
```

### Unrealized P&L
**Formula**: `unrealizedPl = currentValue - costBasis`

**Implementation**:
```typescript
const unrealizedPl = currentValue - (quantity × avgCost);
```

## Tax and Fee Calculations

### Supported Options
1. **Percentage-based**: `{ type: 'percentage', value: 10 }` for 10%
2. **Fixed-value**: `{ type: 'fixed', value: 1000 }` for $1000
3. **Legacy support**: Simple numbers for backward compatibility

### Calculation Order
1. Calculate base value: `quantity × currentPrice`
2. Apply tax (percentage or fixed)
3. Apply fee (percentage or fixed)
4. Apply commission (percentage or fixed)
5. Apply other deductions (percentage or fixed)
6. Apply discount (always percentage-based)
7. Ensure non-negative result

### Example Scenarios

#### Stock Trading
```typescript
const options = {
  commission: { type: 'percentage', value: 0.1 }, // 0.1% brokerage
  fee: { type: 'fixed', value: 1000 * 0.000119 }, // Regulatory fee per share
  tax: { type: 'percentage', value: 15 }          // 15% capital gains
};
```

#### Bond Trading
```typescript
const options = {
  commission: { type: 'fixed', value: 500 },      // Fixed commission
  tax: { type: 'percentage', value: 5 },          // 5% tax
  fee: { type: 'percentage', value: 2 }           // 2% processing fee
};
```

## Performance Metrics

### Return Percentage
**Formula**: `returnPercentage = ((currentValue - costBasis) / costBasis) × 100`

### Win Rate
**Formula**: `winRate = (profitableTrades / totalTrades) × 100`

### Sharpe Ratio
**Formula**: `sharpeRatio = (averageReturn - riskFreeRate) / standardDeviation`

## Implementation Guidelines

### Service Layer Architecture
1. **AssetValueCalculatorService**: Centralized asset value calculations
2. **PortfolioValueCalculatorService**: Centralized portfolio value calculations
3. **Legacy Services**: Use calculators for consistency

### Database Strategy
- **Never store calculated values** in database
- **Always calculate real-time** when needed
- **Use caching** for performance optimization
- **Implement fallbacks** for data availability

### Error Handling
```typescript
try {
  const calculatedValues = await portfolioValueCalculator.calculateAllValues(portfolioId);
  // Use calculated values
} catch (error) {
  console.error(`Error calculating values:`, error);
  // Fallback to old calculation method
  await this.calculatePortfolioValue(portfolio);
}
```

### Caching Strategy
- **Cache calculated values** for 5 minutes
- **Invalidate cache** when trades or prices change
- **Use Redis** for distributed caching
- **Implement cache warming** for frequently accessed data

## Testing Requirements

### Unit Tests
- Test all calculation methods with various inputs
- Test edge cases (zero values, negative values, large numbers)
- Test both percentage and fixed value options
- Test error handling and fallback scenarios

### Integration Tests
- Test end-to-end calculation flows
- Test with real database data
- Test performance with large datasets
- Test cache invalidation scenarios

### Test Data
```typescript
// Test scenarios
const testScenarios = [
  { quantity: 100, price: 1000, expected: 100000 },
  { quantity: 0, price: 1000, expected: 0 },
  { quantity: 100, price: 0, expected: 0 },
  { quantity: 100, price: 1000, tax: 10, expected: 90000 },
  { quantity: 100, price: 1000, fee: 1000, expected: 99000 }
];
```

## Code Examples

### Using AssetValueCalculatorService
```typescript
// Basic calculation
const currentValue = this.assetValueCalculator.calculateCurrentValue(
  asset.currentQuantity,
  asset.currentPrice
);

// With tax and fee
const currentValue = this.assetValueCalculator.calculateCurrentValue(
  asset.currentQuantity,
  asset.currentPrice,
  {
    tax: AssetValueCalculatorService.createPercentageOption(10),
    fee: AssetValueCalculatorService.createFixedOption(500)
  }
);

// Detailed breakdown
const breakdown = this.assetValueCalculator.calculateCurrentValueWithBreakdown(
  asset.currentQuantity,
  asset.currentPrice,
  options
);
```

### Using PortfolioValueCalculatorService
```typescript
// Calculate all values at once
const values = await this.portfolioValueCalculator.calculateAllValues(portfolioId);

// Individual calculations
const totalValue = await this.portfolioValueCalculator.calculateTotalValue(portfolioId);
const realizedPl = await this.portfolioValueCalculator.calculateRealizedPL(portfolioId);
const unrealizedPl = await this.portfolioValueCalculator.calculateUnrealizedPL(portfolioId);
```

## Migration Guidelines

### From Old Calculation Methods
1. **Replace direct calculations** with service calls
2. **Update database queries** to use global assets
3. **Remove stored calculated values** from database
4. **Implement real-time calculations** everywhere
5. **Add proper error handling** and fallbacks

### Database Schema Changes
```sql
-- Remove calculated value columns
ALTER TABLE assets DROP COLUMN current_value;
ALTER TABLE portfolios DROP COLUMN total_value;
ALTER TABLE portfolios DROP COLUMN realized_pl;
ALTER TABLE portfolios DROP COLUMN unrealized_pl;
```

## Performance Considerations

### Optimization Strategies
1. **Batch calculations** for multiple assets
2. **Use database joins** instead of multiple queries
3. **Implement caching** for frequently accessed data
4. **Use indexes** on frequently queried columns
5. **Consider materialized views** for complex calculations

### Monitoring
- **Track calculation performance** with metrics
- **Monitor cache hit rates** and effectiveness
- **Alert on calculation errors** or timeouts
- **Log calculation details** for debugging

## Future Enhancements

### Planned Features
1. **Tiered tax rates** based on income brackets
2. **Currency-specific calculations** with exchange rates
3. **Time-based fee calculations** (e.g., overnight fees)
4. **Integration with external tax services**
5. **Advanced performance metrics** (VaR, Sharpe ratio, etc.)

### Extension Points
- **Custom calculation plugins** for specific asset types
- **Configurable calculation rules** per user/portfolio
- **Real-time market data integration** for live calculations
- **Machine learning models** for price predictions

## Conclusion

These calculation rules ensure consistency, accuracy, and maintainability across the entire Portfolio Management System. All developers must follow these guidelines when implementing new features or modifying existing calculations.

For questions or clarifications, refer to:
- `AssetValueCalculatorService` implementation
- `PortfolioValueCalculatorService` implementation
- Test files for examples
- API documentation for usage patterns
