/**
 * Examples demonstrating how to use AssetValueCalculatorService
 * with both percentage and fixed value options for tax and fee
 */

import { AssetValueCalculatorService, TaxFeeOption } from '../services/asset-value-calculator.service';

export class AssetValueCalculatorExamples {
  constructor(private readonly calculator: AssetValueCalculatorService) {}

  /**
   * Example 1: Basic calculation without any deductions
   */
  basicCalculation() {
    const quantity = 100;
    const currentPrice = 1000;
    
    const result = this.calculator.calculateCurrentValue(quantity, currentPrice);
    console.log(`Basic calculation: ${quantity} × ${currentPrice} = ${result}`);
    // Output: Basic calculation: 100 × 1000 = 100000
  }

  /**
   * Example 2: Using fixed values for tax and fee
   */
  fixedTaxAndFee() {
    const quantity = 100;
    const currentPrice = 1000;
    
    const options = {
      tax: { type: 'fixed', value: 1000 } as TaxFeeOption,
      fee: { type: 'fixed', value: 500 } as TaxFeeOption,
    };
    
    const result = this.calculator.calculateCurrentValue(quantity, currentPrice, options);
    console.log(`Fixed tax/fee: ${result}`);
    // Output: Fixed tax/fee: 98500 (100000 - 1000 - 500)
  }

  /**
   * Example 3: Using percentage values for tax and fee
   */
  percentageTaxAndFee() {
    const quantity = 100;
    const currentPrice = 1000;
    
    const options = {
      tax: { type: 'percentage', value: 10 } as TaxFeeOption, // 10%
      fee: { type: 'percentage', value: 5 } as TaxFeeOption,  // 5%
    };
    
    const result = this.calculator.calculateCurrentValue(quantity, currentPrice, options);
    console.log(`Percentage tax/fee: ${result}`);
    // Output: Percentage tax/fee: 85000 (100000 - 10000 - 5000)
  }

  /**
   * Example 4: Mixed fixed and percentage options
   */
  mixedOptions() {
    const quantity = 100;
    const currentPrice = 1000;
    
    const options = {
      tax: { type: 'percentage', value: 5 } as TaxFeeOption,  // 5% = 5000
      fee: { type: 'fixed', value: 2000 } as TaxFeeOption,   // 2000
      commission: { type: 'percentage', value: 2 } as TaxFeeOption, // 2% = 2000
    };
    
    const result = this.calculator.calculateCurrentValue(quantity, currentPrice, options);
    console.log(`Mixed options: ${result}`);
    // Output: Mixed options: 91000 (100000 - 5000 - 2000 - 2000)
  }

  /**
   * Example 5: Using static helper methods
   */
  usingHelperMethods() {
    const quantity = 100;
    const currentPrice = 1000;
    
    // Using static helper methods
    const options = AssetValueCalculatorService.createPercentageOptions(10, 5);
    
    const result = this.calculator.calculateCurrentValue(quantity, currentPrice, options);
    console.log(`Using helper methods: ${result}`);
    // Output: Using helper methods: 85000
  }

  /**
   * Example 6: Detailed breakdown
   */
  detailedBreakdown() {
    const quantity = 100;
    const currentPrice = 1000;
    
    const options = {
      tax: { type: 'percentage', value: 10 } as TaxFeeOption,
      fee: { type: 'fixed', value: 1000 } as TaxFeeOption,
      commission: { type: 'percentage', value: 2 } as TaxFeeOption,
    };
    
    const breakdown = this.calculator.calculateCurrentValueWithBreakdown(quantity, currentPrice, options);
    
    console.log('Detailed Breakdown:');
    console.log(`Base Value: ${breakdown.baseValue}`);
    console.log(`Tax (10%): ${breakdown.taxAmount}`);
    console.log(`Fee (fixed): ${breakdown.feeAmount}`);
    console.log(`Commission (2%): ${breakdown.commissionAmount}`);
    console.log(`Total Deductions: ${breakdown.totalDeductions}`);
    console.log(`Final Value: ${breakdown.finalValue}`);
    
    // Output:
    // Base Value: 100000
    // Tax (10%): 10000
    // Fee (fixed): 1000
    // Commission (2%): 2000
    // Total Deductions: 13000
    // Final Value: 87000
  }

  /**
   * Example 7: Multiple assets calculation
   */
  multipleAssets() {
    const assets = [
      {
        quantity: 100,
        currentPrice: 1000,
        tax: { type: 'fixed', value: 1000 } as TaxFeeOption,
        fee: { type: 'percentage', value: 5 } as TaxFeeOption,
      },
      {
        quantity: 50,
        currentPrice: 2000,
        tax: { type: 'percentage', value: 10 } as TaxFeeOption,
        commission: { type: 'fixed', value: 500 } as TaxFeeOption,
      },
    ];
    
    const totalValue = this.calculator.calculateTotalCurrentValue(assets);
    console.log(`Total value for multiple assets: ${totalValue}`);
    
    // Asset 1: 100000 - 1000 - 5000 = 94000
    // Asset 2: 100000 - 10000 - 500 = 89500
    // Total: 183500
  }

  /**
   * Example 8: Legacy number format (backward compatibility)
   */
  legacyFormat() {
    const quantity = 100;
    const currentPrice = 1000;
    
    const options = {
      tax: 1000, // Legacy number format
      fee: 500,  // Legacy number format
    };
    
    const result = this.calculator.calculateCurrentValue(quantity, currentPrice, options);
    console.log(`Legacy format: ${result}`);
    // Output: Legacy format: 98500
  }

  /**
   * Example 9: Real-world scenario - Stock trading with various fees
   */
  realWorldScenario() {
    const quantity = 1000; // 1000 shares
    const currentPrice = 50; // $50 per share
    
    const options = {
      // Brokerage commission: 0.1% of trade value
      commission: { type: 'percentage', value: 0.1 } as TaxFeeOption,
      // Regulatory fee: $0.000119 per share
      fee: { type: 'fixed', value: 1000 * 0.000119 } as TaxFeeOption,
      // Capital gains tax: 15% (if applicable)
      tax: { type: 'percentage', value: 15 } as TaxFeeOption,
    };
    
    const breakdown = this.calculator.calculateCurrentValueWithBreakdown(quantity, currentPrice, options);
    
    console.log('Real-world Stock Trading Scenario:');
    console.log(`Shares: ${quantity} × $${currentPrice} = $${breakdown.baseValue}`);
    console.log(`Commission (0.1%): $${breakdown.commissionAmount.toFixed(2)}`);
    console.log(`Regulatory Fee: $${breakdown.feeAmount.toFixed(2)}`);
    console.log(`Capital Gains Tax (15%): $${breakdown.taxAmount.toFixed(2)}`);
    console.log(`Total Deductions: $${breakdown.totalDeductions.toFixed(2)}`);
    console.log(`Net Value: $${breakdown.finalValue.toFixed(2)}`);
  }
}
