# Calculation System - Quick Reference

## 🚀 Quick Start

### Basic Asset Value Calculation
```typescript
import { AssetValueCalculatorService } from './asset-value-calculator.service';

const calculator = new AssetValueCalculatorService();

// Basic calculation
const value = calculator.calculateCurrentValue(100, 1000); // 100000

// With tax and fee
const value = calculator.calculateCurrentValue(100, 1000, {
  tax: { type: 'percentage', value: 10 }, // 10%
  fee: { type: 'fixed', value: 500 }      // $500
}); // Result: 89500
```

### Portfolio Value Calculation
```typescript
import { PortfolioValueCalculatorService } from './portfolio-value-calculator.service';

const portfolioCalculator = new PortfolioValueCalculatorService();

// Calculate all values
const values = await portfolioCalculator.calculateAllValues(portfolioId);
// Returns: { totalValue, realizedPl, unrealizedPl, cashBalance }
```

## 📋 Common Patterns

### Tax/Fee Options
```typescript
// Percentage-based
const taxOption = { type: 'percentage', value: 10 }; // 10%

// Fixed-value
const feeOption = { type: 'fixed', value: 500 }; // $500

// Using helper methods
const taxOption = AssetValueCalculatorService.createPercentageOption(10);
const feeOption = AssetValueCalculatorService.createFixedOption(500);
```

### Service Integration
```typescript
// In your service
constructor(
  private readonly assetValueCalculator: AssetValueCalculatorService,
  private readonly portfolioValueCalculator: PortfolioValueCalculatorService
) {}

// Calculate asset value
const currentValue = this.assetValueCalculator.calculateCurrentValue(
  asset.currentQuantity,
  asset.currentPrice,
  options
);

// Calculate portfolio values
const portfolioValues = await this.portfolioValueCalculator.calculateAllValues(portfolioId);
```

## 🔧 Configuration

### Module Setup
```typescript
// In your module
@Module({
  imports: [AssetModule], // For AssetValueCalculatorService
  providers: [
    YourService,
    AssetValueCalculatorService,
    PortfolioValueCalculatorService
  ]
})
export class YourModule {}
```

### Caching Configuration
```typescript
// Cache configuration
const cacheConfig = {
  ttl: 5 * 60 * 1000, // 5 minutes
  max: 1000 // Maximum items
};
```

## 🧪 Testing

### Unit Test Example
```typescript
describe('YourCalculationService', () => {
  let service: YourCalculationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [YourCalculationService, AssetValueCalculatorService]
    }).compile();

    service = module.get<YourCalculationService>(YourCalculationService);
  });

  it('should calculate value correctly', () => {
    const result = service.calculateValue(100, 1000);
    expect(result).toBe(100000);
  });
});
```

### Integration Test Example
```typescript
it('/api/v1/calculate (POST)', () => {
  return request(app.getHttpServer())
    .post('/api/v1/calculate')
    .send({ quantity: 100, price: 1000 })
    .expect(200)
    .expect((res) => {
      expect(res.body.value).toBe(100000);
    });
});
```

## 📊 Real-world Examples

### Stock Trading
```typescript
const stockOptions = {
  commission: { type: 'percentage', value: 0.1 }, // 0.1% brokerage
  fee: { type: 'fixed', value: 1000 * 0.000119 }, // Regulatory fee per share
  tax: { type: 'percentage', value: 15 }          // 15% capital gains
};

const value = calculator.calculateCurrentValue(1000, 50, stockOptions);
```

### Bond Trading
```typescript
const bondOptions = {
  commission: { type: 'fixed', value: 500 },      // Fixed commission
  tax: { type: 'percentage', value: 5 },          // 5% tax
  fee: { type: 'percentage', value: 2 }           // 2% processing fee
};

const value = calculator.calculateCurrentValue(100, 1000, bondOptions);
```

### Mixed Options
```typescript
const mixedOptions = {
  tax: { type: 'percentage', value: 5 },     // 5% = 5000
  fee: { type: 'fixed', value: 2000 },       // 2000
  commission: { type: 'percentage', value: 2 } // 2% = 2000
};

const value = calculator.calculateCurrentValue(100, 1000, mixedOptions);
// Result: 100000 - 5000 - 2000 - 2000 = 91000
```

## 🚨 Error Handling

### Common Errors
```typescript
try {
  const result = await calculator.calculateValue(input);
  return result;
} catch (error) {
  if (error instanceof InvalidInputError) {
    // Handle invalid input
    throw new BadRequestException('Invalid input parameters');
  }
  
  if (error instanceof CalculationError) {
    // Handle calculation error
    throw new InternalServerErrorException('Calculation failed');
  }
  
  throw error;
}
```

### Validation
```typescript
// Validate inputs
if (quantity < 0 || quantity > 1000000) {
  throw new InvalidInputError('Quantity must be between 0 and 1,000,000');
}

if (currentPrice < 0 || currentPrice > 1000000) {
  throw new InvalidInputError('Price must be between 0 and 1,000,000');
}
```

## 📈 Performance Tips

### Caching
```typescript
// Use caching for expensive calculations
const cacheKey = `calculation:${assetId}:${JSON.stringify(options)}`;
const result = await this.cacheService.getOrCalculate(cacheKey, calculator, 5 * 60 * 1000);
```

### Batch Processing
```typescript
// Calculate multiple assets at once
const results = await Promise.all(
  assetIds.map(id => calculator.calculateValue(id, options))
);
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

## 🔍 Debugging

### Logging
```typescript
// Log calculation details
this.logger.debug('Starting calculation', { assetId, options });
this.logger.info('Calculation completed', { assetId, result, duration });
```

### Detailed Breakdown
```typescript
// Get detailed breakdown
const breakdown = calculator.calculateCurrentValueWithBreakdown(quantity, price, options);
console.log('Breakdown:', breakdown);
// Returns: { baseValue, taxAmount, feeAmount, totalDeductions, finalValue }
```

## 📚 Documentation Links

- [Calculation Rules](./calculation-rules.md) - Complete calculation rules
- [Architecture Patterns](./calculation-architecture.md) - System architecture
- [Implementation Guidelines](./implementation-guidelines.md) - Development guidelines
- [Coding Standards](./coding-standards.md) - Code standards
- [System Summary](./calculation-system-summary.md) - Complete overview

## 🆘 Troubleshooting

### Common Issues
1. **Calculation returns 0**: Check if quantity or price is 0
2. **Invalid input error**: Validate input parameters
3. **Calculation timeout**: Check for infinite loops or heavy computations
4. **Cache issues**: Clear cache or check cache configuration

### Debug Steps
1. Check input parameters
2. Verify service dependencies
3. Check database connections
4. Review error logs
5. Test with simple inputs

## 🎯 Best Practices

1. **Always use centralized services** - Don't duplicate calculation logic
2. **Validate inputs** - Check parameters before calculation
3. **Handle errors gracefully** - Provide meaningful error messages
4. **Use caching** - For performance optimization
5. **Log important events** - For debugging and monitoring
6. **Write tests** - For all calculation methods
7. **Document your code** - For future maintainability
