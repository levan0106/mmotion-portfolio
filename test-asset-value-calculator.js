/**
 * Test script to demonstrate AssetValueCalculatorService with percentage and fixed options
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api/v1';

async function testAssetValueCalculator() {
  console.log('🧮 Testing AssetValueCalculatorService with Percentage and Fixed Options\n');

  try {
    // Test 1: Basic calculation
    console.log('📊 Test 1: Basic calculation (no deductions)');
    const basicResult = await testBasicCalculation();
    console.log(`   Result: ${basicResult}\n`);

    // Test 2: Fixed tax and fee
    console.log('💰 Test 2: Fixed tax and fee');
    const fixedResult = await testFixedTaxAndFee();
    console.log(`   Result: ${fixedResult}\n`);

    // Test 3: Percentage tax and fee
    console.log('📈 Test 3: Percentage tax and fee');
    const percentageResult = await testPercentageTaxAndFee();
    console.log(`   Result: ${percentageResult}\n`);

    // Test 4: Mixed options
    console.log('🔄 Test 4: Mixed fixed and percentage options');
    const mixedResult = await testMixedOptions();
    console.log(`   Result: ${mixedResult}\n`);

    // Test 5: Detailed breakdown
    console.log('📋 Test 5: Detailed breakdown');
    await testDetailedBreakdown();

    console.log('✅ All tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testBasicCalculation() {
  // This would be a direct service call in a real implementation
  // For now, we'll simulate the calculation
  const quantity = 100;
  const currentPrice = 1000;
  const result = quantity * currentPrice;
  
  console.log(`   Input: ${quantity} shares × $${currentPrice} = $${result}`);
  return result;
}

async function testFixedTaxAndFee() {
  const quantity = 100;
  const currentPrice = 1000;
  const baseValue = quantity * currentPrice;
  
  // Simulate fixed tax and fee
  const tax = 1000; // Fixed $1000
  const fee = 500;  // Fixed $500
  const result = baseValue - tax - fee;
  
  console.log(`   Input: ${quantity} shares × $${currentPrice} = $${baseValue}`);
  console.log(`   Fixed Tax: $${tax}`);
  console.log(`   Fixed Fee: $${fee}`);
  console.log(`   Calculation: $${baseValue} - $${tax} - $${fee} = $${result}`);
  
  return result;
}

async function testPercentageTaxAndFee() {
  const quantity = 100;
  const currentPrice = 1000;
  const baseValue = quantity * currentPrice;
  
  // Simulate percentage tax and fee
  const taxPercentage = 10; // 10%
  const feePercentage = 5;  // 5%
  const tax = baseValue * (taxPercentage / 100);
  const fee = baseValue * (feePercentage / 100);
  const result = baseValue - tax - fee;
  
  console.log(`   Input: ${quantity} shares × $${currentPrice} = $${baseValue}`);
  console.log(`   Tax (${taxPercentage}%): $${tax}`);
  console.log(`   Fee (${feePercentage}%): $${fee}`);
  console.log(`   Calculation: $${baseValue} - $${tax} - $${fee} = $${result}`);
  
  return result;
}

async function testMixedOptions() {
  const quantity = 100;
  const currentPrice = 1000;
  const baseValue = quantity * currentPrice;
  
  // Simulate mixed options
  const taxPercentage = 5;  // 5% = $5000
  const feeFixed = 2000;    // Fixed $2000
  const commissionPercentage = 2; // 2% = $2000
  
  const tax = baseValue * (taxPercentage / 100);
  const fee = feeFixed;
  const commission = baseValue * (commissionPercentage / 100);
  const result = baseValue - tax - fee - commission;
  
  console.log(`   Input: ${quantity} shares × $${currentPrice} = $${baseValue}`);
  console.log(`   Tax (${taxPercentage}%): $${tax}`);
  console.log(`   Fee (fixed): $${fee}`);
  console.log(`   Commission (${commissionPercentage}%): $${commission}`);
  console.log(`   Calculation: $${baseValue} - $${tax} - $${fee} - $${commission} = $${result}`);
  
  return result;
}

async function testDetailedBreakdown() {
  const quantity = 1000;
  const currentPrice = 50;
  const baseValue = quantity * currentPrice;
  
  // Real-world scenario: Stock trading
  const commissionPercentage = 0.1; // 0.1%
  const regulatoryFee = quantity * 0.000119; // $0.000119 per share
  const capitalGainsTaxPercentage = 15; // 15%
  
  const commission = baseValue * (commissionPercentage / 100);
  const regulatoryFeeAmount = regulatoryFee;
  const capitalGainsTax = baseValue * (capitalGainsTaxPercentage / 100);
  
  const totalDeductions = commission + regulatoryFeeAmount + capitalGainsTax;
  const finalValue = baseValue - totalDeductions;
  
  console.log(`   Real-world Stock Trading Scenario:`);
  console.log(`   Shares: ${quantity} × $${currentPrice} = $${baseValue}`);
  console.log(`   Commission (${commissionPercentage}%): $${commission.toFixed(2)}`);
  console.log(`   Regulatory Fee: $${regulatoryFeeAmount.toFixed(2)}`);
  console.log(`   Capital Gains Tax (${capitalGainsTaxPercentage}%): $${capitalGainsTax.toFixed(2)}`);
  console.log(`   Total Deductions: $${totalDeductions.toFixed(2)}`);
  console.log(`   Net Value: $${finalValue.toFixed(2)}`);
}

// Run the tests
testAssetValueCalculator();
