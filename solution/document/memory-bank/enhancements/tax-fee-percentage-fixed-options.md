# Tax and Fee Options Enhancement

## Overview
Enhanced `AssetValueCalculatorService` to support both percentage and fixed value options for tax, fee, commission, and other deductions.

## Key Features

### 1. Flexible Tax/Fee Options
- **Percentage-based**: `{ type: 'percentage', value: 10 }` for 10%
- **Fixed-value**: `{ type: 'fixed', value: 1000 }` for $1000
- **Legacy support**: Backward compatible with simple numbers

### 2. New Interfaces
```typescript
export interface TaxFeeOption {
  type: 'percentage' | 'fixed';
  value: number;
}

export interface AssetValueCalculationOptions {
  tax?: TaxFeeOption | number; // Support both formats
  fee?: TaxFeeOption | number;
  discount?: TaxFeeOption | number;
  commission?: TaxFeeOption | number;
  otherDeductions?: TaxFeeOption | number;
}
```

### 3. Static Helper Methods
```typescript
// Create percentage option
AssetValueCalculatorService.createPercentageOption(10) // 10%

// Create fixed option
AssetValueCalculatorService.createFixedOption(1000) // $1000

// Create percentage options
AssetValueCalculatorService.createPercentageOptions(10, 5) // 10% tax, 5% fee

// Create fixed options
AssetValueCalculatorService.createFixedOptions(1000, 500) // $1000 tax, $500 fee
```

### 4. Detailed Breakdown Method
```typescript
const breakdown = calculator.calculateCurrentValueWithBreakdown(quantity, price, options);
// Returns: { baseValue, taxAmount, feeAmount, commissionAmount, totalDeductions, finalValue }
```

## Usage Examples

### Basic Usage
```typescript
// Fixed tax and fee
const options = {
  tax: { type: 'fixed', value: 1000 },
  fee: { type: 'fixed', value: 500 }
};

// Percentage tax and fee
const options = {
  tax: { type: 'percentage', value: 10 }, // 10%
  fee: { type: 'percentage', value: 5 }   // 5%
};

// Mixed options
const options = {
  tax: { type: 'percentage', value: 5 },     // 5%
  fee: { type: 'fixed', value: 2000 },       // $2000
  commission: { type: 'percentage', value: 2 } // 2%
};
```

### Real-world Scenarios
```typescript
// Stock trading with various fees
const options = {
  commission: { type: 'percentage', value: 0.1 }, // 0.1% brokerage
  fee: { type: 'fixed', value: 1000 * 0.000119 }, // Regulatory fee per share
  tax: { type: 'percentage', value: 15 }          // 15% capital gains
};
```

## Benefits

1. **Flexibility**: Support both percentage and fixed calculations
2. **Backward Compatibility**: Legacy number format still works
3. **Real-world Ready**: Handles complex trading scenarios
4. **Detailed Reporting**: Breakdown shows each deduction
5. **Easy to Use**: Static helper methods for common patterns
6. **Type Safe**: Full TypeScript support

## Files Modified

- `src/modules/asset/services/asset-value-calculator.service.ts` - Enhanced with new options
- `src/modules/asset/services/asset-value-calculator.service.spec.ts` - Comprehensive tests
- `src/modules/asset/examples/asset-value-calculator-examples.ts` - Usage examples
- `test-asset-value-calculator.js` - Demo script

## Test Results

All tests pass successfully:
- ✅ Basic calculation
- ✅ Fixed tax and fee
- ✅ Percentage tax and fee  
- ✅ Mixed options
- ✅ Detailed breakdown
- ✅ Real-world scenarios

## Future Enhancements

- Support for tiered tax rates
- Currency-specific calculations
- Time-based fee calculations
- Integration with external tax services
