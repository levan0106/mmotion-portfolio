/**
 * Test script for Cash Flow Cleanup
 * Tests the cleanup of orphaned cash flows when trades are deleted
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';
const PORTFOLIO_ID = 'f9cf6de3-36ef-4581-8b29-1aa872ed9658';

// Helper functions
async function makeRequest(method, url, data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Error ${method} ${url}:`, error.response?.data || error.message);
    throw error;
  }
}

async function getCashFlowHistory(portfolioId) {
  console.log('Getting cash flow history...');
  const history = await makeRequest('GET', `/portfolios/${portfolioId}/cash-flow/history`);
  console.log('✅ Cash flow history retrieved');
  console.log('✅ Number of cash flows:', history.length);
  return history;
}

async function getCashFlowAnalysis(portfolioId) {
  console.log('Getting cash flow analysis...');
  const analysis = await makeRequest('GET', `/portfolios/${portfolioId}/analytics/cash-flow-analysis`);
  console.log('✅ Cash flow analysis retrieved');
  console.log('✅ Analysis data points:', analysis.data.length);
  return analysis;
}

async function cleanupOrphanedCashFlows(portfolioId) {
  console.log('Cleaning up orphaned cash flows...');
  const result = await makeRequest('POST', `/portfolios/${portfolioId}/cash-flow/cleanup-orphaned`);
  console.log('✅ Cleanup completed');
  console.log('✅ Removed count:', result.removedCount);
  console.log('✅ Message:', result.message);
  return result;
}

async function recalculateCashBalance(portfolioId) {
  console.log('Recalculating cash balance...');
  const result = await makeRequest('POST', `/portfolios/${portfolioId}/cash-flow/recalculate`);
  console.log('✅ Cash balance recalculated');
  console.log('✅ Recalculated balance:', result.recalculatedBalance);
  return result;
}

async function getCurrentCashBalance(portfolioId) {
  console.log('Getting current cash balance...');
  const result = await makeRequest('GET', `/portfolios/${portfolioId}/cash-flow/balance`);
  console.log('✅ Current cash balance:', result.cashBalance);
  return result;
}

// Main test function
async function runCashFlowCleanupTests() {
  console.log('🚀 Starting Cash Flow Cleanup Tests\n');
  console.log(`Testing portfolio: ${PORTFOLIO_ID}\n`);
  
  try {
    // Step 1: Check current state
    console.log('--- Step 1: Current State ---');
    const currentBalance = await getCurrentCashBalance(PORTFOLIO_ID);
    const history = await getCashFlowHistory(PORTFOLIO_ID);
    const analysis = await getCashFlowAnalysis(PORTFOLIO_ID);
    
    console.log('\nCurrent Cash Flow History:');
    history.forEach((flow, index) => {
      const date = new Date(flow.flowDate).toLocaleDateString();
      console.log(`  ${index + 1}. ${date}: ${flow.type} - ${flow.amount} VND - ${flow.description}`);
    });
    
    console.log('\nCurrent Cash Flow Analysis:');
    analysis.data.forEach((month, index) => {
      console.log(`  ${index + 1}. ${month.date}: Inflow=${month.inflow}, Outflow=${month.outflow}, Net=${month.netFlow}, Balance=${month.cumulativeBalance}`);
    });
    
    // Step 2: Clean up orphaned cash flows
    console.log('\n--- Step 2: Cleanup Orphaned Cash Flows ---');
    const cleanupResult = await cleanupOrphanedCashFlows(PORTFOLIO_ID);
    
    // Step 3: Check state after cleanup
    console.log('\n--- Step 3: State After Cleanup ---');
    const newHistory = await getCashFlowHistory(PORTFOLIO_ID);
    const newAnalysis = await getCashFlowAnalysis(PORTFOLIO_ID);
    const newBalance = await getCurrentCashBalance(PORTFOLIO_ID);
    
    console.log('\nCash Flow History After Cleanup:');
    newHistory.forEach((flow, index) => {
      const date = new Date(flow.flowDate).toLocaleDateString();
      console.log(`  ${index + 1}. ${date}: ${flow.type} - ${flow.amount} VND - ${flow.description}`);
    });
    
    console.log('\nCash Flow Analysis After Cleanup:');
    newAnalysis.data.forEach((month, index) => {
      console.log(`  ${index + 1}. ${month.date}: Inflow=${month.inflow}, Outflow=${month.outflow}, Net=${month.netFlow}, Balance=${month.cumulativeBalance}`);
    });
    
    // Step 4: Summary
    console.log('\n--- Step 4: Summary ---');
    console.log(`✅ Original cash flows: ${history.length}`);
    console.log(`✅ Cash flows after cleanup: ${newHistory.length}`);
    console.log(`✅ Removed orphaned cash flows: ${cleanupResult.removedCount}`);
    console.log(`✅ Original cash balance: ${currentBalance.cashBalance}`);
    console.log(`✅ New cash balance: ${newBalance.cashBalance}`);
    
    if (cleanupResult.removedCount > 0) {
      console.log('\n🎉 Successfully cleaned up orphaned cash flows!');
      console.log('📊 Cash flow analysis should now show correct data without deleted trades.');
    } else {
      console.log('\n✅ No orphaned cash flows found - system is clean!');
    }
    
    console.log('\n✅ All Cash Flow Cleanup Tests Completed Successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runCashFlowCleanupTests();
}

module.exports = {
  runCashFlowCleanupTests,
  makeRequest
};
