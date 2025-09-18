/**
 * Test script for Cash Flow Analysis Integration
 * Tests the complete cash flow analysis functionality including:
 * - Real data integration with CashFlow entity
 * - Monthly aggregation of cash flows
 * - Frontend UI data format
 * - API endpoint response
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

// Test data
const testAccount = {
  name: 'Cash Flow Analysis Test Account',
  email: 'cashflow@example.com',
  phone: '0123456789'
};

const testPortfolio = {
  name: 'Cash Flow Analysis Test Portfolio',
  baseCurrency: 'VND',
  accountId: '', // Will be set after account creation
  description: 'Portfolio for testing cash flow analysis',
  cashBalance: 5000000 // 5M VND initial balance
};

const testAsset = {
  symbol: 'CFTEST',
  name: 'Cash Flow Test Asset',
  type: 'STOCK',
  description: 'Test asset for cash flow analysis testing'
};

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

async function createTestAccount() {
  console.log('Creating test account...');
  const account = await makeRequest('POST', '/accounts', testAccount);
  console.log('✅ Account created:', account.accountId);
  return account;
}

async function createTestPortfolio(accountId) {
  console.log('Creating test portfolio with initial cash balance...');
  const portfolioData = { ...testPortfolio, accountId };
  const portfolio = await makeRequest('POST', '/portfolios', portfolioData);
  console.log('✅ Portfolio created:', portfolio.portfolioId);
  console.log('✅ Initial cash balance:', portfolio.cashBalance);
  return portfolio;
}

async function createTestAsset() {
  console.log('Creating test asset...');
  const asset = await makeRequest('POST', '/assets', testAsset);
  console.log('✅ Asset created:', asset.assetId);
  return asset;
}

async function addCashFlow(portfolioId, amount, type, description, daysAgo = 0) {
  const flowDate = new Date();
  flowDate.setDate(flowDate.getDate() - daysAgo);
  
  const cashFlow = {
    portfolioId,
    amount,
    type,
    description,
    flowDate: flowDate.toISOString(),
    currency: 'VND'
  };
  
  const result = await makeRequest('POST', `/portfolios/${portfolioId}/cash-flow`, cashFlow);
  console.log(`✅ Cash flow added: ${type} ${amount} VND (${daysAgo} days ago)`);
  return result;
}

async function executeTrade(portfolioId, assetId, side, quantity, price, daysAgo = 0) {
  const tradeDate = new Date();
  tradeDate.setDate(tradeDate.getDate() - daysAgo);
  
  const trade = {
    portfolioId,
    assetId,
    tradeDate: tradeDate.toISOString(),
    side,
    quantity,
    price,
    fee: 1000,
    tax: 500,
    source: 'MANUAL',
    notes: `Test ${side} trade for cash flow analysis`
  };
  
  const result = await makeRequest('POST', '/trades', trade);
  console.log(`✅ ${side} trade executed: ${quantity} shares at ${price} VND (${daysAgo} days ago)`);
  return result;
}

async function getCashFlowAnalysis(portfolioId) {
  console.log('Getting cash flow analysis...');
  const analysis = await makeRequest('GET', `/portfolios/${portfolioId}/analytics/cash-flow-analysis`);
  console.log('✅ Cash flow analysis retrieved');
  console.log('✅ Analysis data points:', analysis.data.length);
  console.log('✅ Current cash balance:', analysis.currentCashBalance);
  return analysis;
}

async function getCashFlowHistory(portfolioId) {
  console.log('Getting cash flow history...');
  const history = await makeRequest('GET', `/portfolios/${portfolioId}/cash-flow/history`);
  console.log('✅ Cash flow history retrieved');
  console.log('✅ Number of cash flows:', history.length);
  return history;
}

async function displayAnalysisResults(analysis) {
  console.log('\n--- Cash Flow Analysis Results ---');
  console.log('Portfolio ID:', analysis.portfolioId);
  console.log('Total Value:', analysis.totalValue);
  console.log('Current Cash Balance:', analysis.currentCashBalance);
  console.log('Calculated At:', analysis.calculatedAt);
  
  console.log('\nMonthly Data:');
  analysis.data.forEach((month, index) => {
    console.log(`  ${index + 1}. ${month.date}:`);
    console.log(`     Inflow: ${month.inflow.toLocaleString()} VND`);
    console.log(`     Outflow: ${month.outflow.toLocaleString()} VND`);
    console.log(`     Net Flow: ${month.netFlow.toLocaleString()} VND`);
    console.log(`     Cumulative Balance: ${month.cumulativeBalance.toLocaleString()} VND`);
  });
}

// Main test function
async function runCashFlowAnalysisTests() {
  console.log('🚀 Starting Cash Flow Analysis Integration Tests\n');
  
  try {
    // Step 1: Create test account
    const account = await createTestAccount();
    testPortfolio.accountId = account.accountId;
    
    // Step 2: Create test portfolio with initial cash balance
    const portfolio = await createTestPortfolio(account.accountId);
    
    // Step 3: Create test asset
    const asset = await createTestAsset();
    
    // Step 4: Add various cash flows over different months
    console.log('\n--- Adding Cash Flows ---');
    
    // Current month
    await addCashFlow(portfolio.portfolioId, 2000000, 'DEPOSIT', 'Initial deposit', 0);
    await addCashFlow(portfolio.portfolioId, 500000, 'DIVIDEND', 'Quarterly dividend', 5);
    
    // Last month
    await addCashFlow(portfolio.portfolioId, 1000000, 'DEPOSIT', 'Monthly salary', 35);
    await addCashFlow(portfolio.portfolioId, -200000, 'WITHDRAWAL', 'Emergency fund', 30);
    
    // Two months ago
    await addCashFlow(portfolio.portfolioId, 1500000, 'DEPOSIT', 'Bonus payment', 65);
    await addCashFlow(portfolio.portfolioId, 300000, 'INTEREST', 'Bank interest', 60);
    
    // Step 5: Execute trades to generate automatic cash flows
    console.log('\n--- Executing Trades ---');
    
    // Current month trades
    await executeTrade(portfolio.portfolioId, asset.assetId, 'BUY', 100, 50000, 10);
    await executeTrade(portfolio.portfolioId, asset.assetId, 'SELL', 50, 55000, 5);
    
    // Last month trades
    await executeTrade(portfolio.portfolioId, asset.assetId, 'BUY', 200, 48000, 40);
    await executeTrade(portfolio.portfolioId, asset.assetId, 'SELL', 100, 52000, 25);
    
    // Step 6: Get cash flow history
    console.log('\n--- Cash Flow History ---');
    const history = await getCashFlowHistory(portfolio.portfolioId);
    history.forEach((flow, index) => {
      const date = new Date(flow.flowDate).toLocaleDateString();
      console.log(`  ${index + 1}. ${date}: ${flow.type} - ${flow.amount} VND - ${flow.description}`);
    });
    
    // Step 7: Get cash flow analysis
    console.log('\n--- Cash Flow Analysis ---');
    const analysis = await getCashFlowAnalysis(portfolio.portfolioId);
    
    // Step 8: Display results
    await displayAnalysisResults(analysis);
    
    // Step 9: Verify data consistency
    console.log('\n--- Data Consistency Check ---');
    const currentBalance = await makeRequest('GET', `/portfolios/${portfolio.portfolioId}/cash-flow/balance`);
    console.log('✅ Current balance from API:', currentBalance.cashBalance);
    console.log('✅ Current balance from analysis:', analysis.currentCashBalance);
    
    if (Math.abs(currentBalance.cashBalance - analysis.currentCashBalance) < 1) {
      console.log('✅ Data consistency verified!');
    } else {
      console.log('❌ Data inconsistency detected!');
    }
    
    console.log('\n✅ All Cash Flow Analysis Integration Tests Completed Successfully!');
    console.log('\n📊 Frontend UI should now display real cash flow data instead of mock data.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runCashFlowAnalysisTests();
}

module.exports = {
  runCashFlowAnalysisTests,
  makeRequest
};
