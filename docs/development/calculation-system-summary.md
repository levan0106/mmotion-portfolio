# Calculation System Summary

## Overview
This document provides a comprehensive summary of the calculation system implemented in the Portfolio Management System, including all services, patterns, and guidelines.

## System Architecture

### Core Services
1. **AssetValueCalculatorService** - Centralized asset value calculations
2. **PortfolioValueCalculatorService** - Centralized portfolio value calculations
3. **AssetGlobalSyncService** - Synchronization between user assets and global assets
4. **MarketDataService** - Market data integration and price updates

### Key Features
- **Real-time Calculations**: All values calculated on-demand, never stored in database
- **Flexible Tax/Fee Options**: Support for both percentage and fixed value calculations
- **Centralized Logic**: Single source of truth for all calculation patterns
- **Comprehensive Testing**: Full test coverage with examples and edge cases
- **Performance Optimization**: Caching and batch processing for large datasets
- **Error Handling**: Robust error handling with fallback mechanisms

## Calculation Patterns

### Asset Value Calculation
```typescript
// Basic calculation
const currentValue = assetValueCalculator.calculateCurrentValue(quantity, currentPrice);

// With tax and fee options
const currentValue = assetValueCalculator.calculateCurrentValue(quantity, currentPrice, {
  tax: { type: 'percentage', value: 10 }, // 10%
  fee: { type: 'fixed', value: 500 }      // $500
});

// Detailed breakdown
const breakdown = assetValueCalculator.calculateCurrentValueWithBreakdown(quantity, currentPrice, options);
```

### Portfolio Value Calculation
```typescript
// Calculate all values at once
const values = await portfolioValueCalculator.calculateAllValues(portfolioId);

// Individual calculations
const totalValue = await portfolioValueCalculator.calculateTotalValue(portfolioId);
const realizedPl = await portfolioValueCalculator.calculateRealizedPL(portfolioId);
const unrealizedPl = await portfolioValueCalculator.calculateUnrealizedPL(portfolioId);
```

## Tax/Fee Options

### Supported Formats
1. **Percentage-based**: `{ type: 'percentage', value: 10 }` for 10%
2. **Fixed-value**: `{ type: 'fixed', value: 1000 }` for $1000
3. **Legacy support**: Simple numbers for backward compatibility

### Helper Methods
```typescript
// Create percentage option
const taxOption = AssetValueCalculatorService.createPercentageOption(10);

// Create fixed option
const feeOption = AssetValueCalculatorService.createFixedOption(500);

// Create percentage options
const options = AssetValueCalculatorService.createPercentageOptions(10, 5);

// Create fixed options
const options = AssetValueCalculatorService.createFixedOptions(1000, 500);
```

## Database Strategy

### Real-time Calculations
- **Never store calculated values** in database
- **Always calculate on-demand** when needed
- **Use caching** for performance optimization
- **Implement fallbacks** for data availability

### Schema Changes
```sql
-- Remove calculated value columns
ALTER TABLE assets DROP COLUMN current_value;
ALTER TABLE portfolios DROP COLUMN total_value;
ALTER TABLE portfolios DROP COLUMN realized_pl;
ALTER TABLE portfolios DROP COLUMN unrealized_pl;
```

## API Integration

### Service Integration
```typescript
// PortfolioService integration
async getPortfolioDetails(portfolioId: string): Promise<Portfolio> {
  const calculatedValues = await this.portfolioValueCalculator.calculateAllValues(portfolioId);
  
  portfolio.totalValue = calculatedValues.totalValue;
  portfolio.realizedPl = calculatedValues.realizedPl;
  portfolio.unrealizedPl = calculatedValues.unrealizedPl;
  
  return portfolio;
}

// AssetService integration
async calculateCurrentValue(assetId: string, options?: CalculationOptions): Promise<number> {
  const asset = await this.assetRepository.findById(assetId);
  const currentPrice = await this.getCurrentPriceFromGlobalAsset(asset.symbol);
  
  return this.assetValueCalculator.calculateCurrentValue(
    asset.currentQuantity,
    currentPrice,
    options
  );
}
```

## Frontend Integration

### Hook Usage
```typescript
// Asset value calculation hook
const { data: assetValue } = useAssetValueCalculation(assetId, options);

// Portfolio value calculation hook
const { data: portfolioValues } = usePortfolioValueCalculation(portfolioId);
```

### Component Integration
```typescript
// Asset value calculator component
<AssetValueCalculator
  assetId={asset.id}
  options={calculationOptions}
  onValueChange={handleValueChange}
/>

// Portfolio value display component
<PortfolioValueDisplay
  portfolioId={portfolio.id}
  showBreakdown={true}
/>
```

## Testing Strategy

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

### Test Examples
```typescript
// Unit test example
it('should calculate with mixed options', () => {
  const options = {
    tax: { type: 'percentage', value: 5 },     // 5% = 5000
    fee: { type: 'fixed', value: 2000 },       // 2000
    commission: { type: 'percentage', value: 2 } // 2% = 2000
  };
  
  const result = service.calculateCurrentValue(100, 1000, options);
  expect(result).toBe(91000); // 100000 - 5000 - 2000 - 2000
});
```

## Performance Optimization

### Caching Strategy
```typescript
// Cache calculated values for 5 minutes
const cacheKey = `calculation:${assetId}:${JSON.stringify(options)}`;
const result = await this.cacheService.getOrCalculate(cacheKey, calculator, 5 * 60 * 1000);
```

### Batch Processing
```typescript
// Calculate multiple assets at once
const results = await this.calculateMultipleAssets(assetIds, options);
```

### Database Optimization
```typescript
// Use joins instead of multiple queries
const query = `
  SELECT 
    a.id,
    a.current_quantity,
    COALESCE(ap.current_price, 0) as current_price
  FROM assets a
  LEFT JOIN global_assets ga ON a.symbol = ga.symbol
  LEFT JOIN asset_prices ap ON ga.id = ap.asset_id
  WHERE a.portfolio_id = ?
`;
```

## Error Handling

### Error Types
1. **InvalidInputError** - Invalid input parameters
2. **CalculationError** - Calculation failure
3. **DataUnavailableError** - Required data not available
4. **CalculationTimeoutError** - Calculation timeout

### Fallback Strategy
```typescript
try {
  const result = await this.primaryCalculation(assetId);
  return result;
} catch (error) {
  if (error instanceof DataUnavailableError) {
    return await this.fallbackCalculation(assetId);
  }
  throw error;
}
```

## Monitoring and Observability

### Metrics Collection
```typescript
// Track calculation performance
this.calculationCounter.inc({ type: 'asset_value', status: 'success' });
this.calculationDuration.observe({ type: 'asset_value' }, duration);
```

### Logging Strategy
```typescript
// Log calculation details
this.logger.debug('Starting calculation', { assetId, options });
this.logger.info('Calculation completed', { assetId, result, duration });
```

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

## Documentation

### Key Documents
1. **Calculation Rules** (`docs/development/calculation-rules.md`)
2. **Architecture Patterns** (`docs/architecture/calculation-architecture.md`)
3. **Implementation Guidelines** (`docs/development/implementation-guidelines.md`)
4. **Coding Standards** (`docs/development/coding-standards.md`)
5. **Tax/Fee Options Enhancement** (`memory-bank/enhancements/tax-fee-percentage-fixed-options.md`)

### Code Examples
- **Service Implementation** (`src/modules/asset/services/asset-value-calculator.service.ts`)
- **Test Examples** (`src/modules/asset/services/asset-value-calculator.service.spec.ts`)
- **Usage Examples** (`src/modules/asset/examples/asset-value-calculator-examples.ts`)
- **Demo Script** (`test-asset-value-calculator.js`)

## Conclusion

The calculation system provides a robust, scalable, and maintainable foundation for all value calculations in the Portfolio Management System. It ensures consistency, accuracy, and reliability while being flexible enough to accommodate future requirements.

### Key Benefits
- **Consistency**: All calculations follow the same patterns
- **Performance**: Optimized for real-time calculations
- **Maintainability**: Clear separation of concerns
- **Testability**: Comprehensive testing strategies
- **Scalability**: Designed for growth and expansion
- **Flexibility**: Easy to add new calculation types
- **Transparency**: Detailed breakdowns for all calculations

### Next Steps
1. **Monitor Performance**: Track calculation performance and optimize as needed
2. **Add New Features**: Implement planned enhancements based on user feedback
3. **Expand Testing**: Add more comprehensive test coverage
4. **Documentation Updates**: Keep documentation current with new features
5. **User Training**: Provide training materials for new calculation features
