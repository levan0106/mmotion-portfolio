/**
 * Test script for Cash Balance Integration
 * Tests the complete cash balance functionality including:
 * - Portfolio creation with initial cash balance
 * - Trade execution and automatic cash balance updates
 * - Manual cash flow operations
 * - Cash balance recalculation
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

// Test data
const testAccount = {
  name: 'Test Account',
  email: 'test@example.com',
  phone: '0123456789'
};

const testPortfolio = {
  name: 'Cash Balance Test Portfolio',
  baseCurrency: 'VND',
  accountId: '', // Will be set after account creation
  description: 'Portfolio for testing cash balance functionality',
  cashBalance: 10000000 // 10M VND initial balance
};

const testAsset = {
  symbol: 'TEST',
  name: 'Test Asset',
  type: 'STOCK',
  description: 'Test asset for cash balance testing'
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

async function executeBuyTrade(portfolioId, assetId) {
  console.log('Executing BUY trade...');
  const buyTrade = {
    portfolioId,
    assetId,
    tradeDate: new Date().toISOString(),
    side: 'BUY',
    quantity: 100,
    price: 50000, // 50,000 VND per share
    fee: 1000,   // 1,000 VND fee
    tax: 500,    // 500 VND tax
    source: 'MANUAL',
    notes: 'Test buy trade for cash balance testing'
  };
  
  const trade = await makeRequest('POST', '/trades', buyTrade);
  console.log('✅ BUY trade executed:', trade.tradeId);
  console.log('✅ Trade total cost:', trade.totalCost);
  return trade;
}

async function executeSellTrade(portfolioId, assetId) {
  console.log('Executing SELL trade...');
  const sellTrade = {
    portfolioId,
    assetId,
    tradeDate: new Date().toISOString(),
    side: 'SELL',
    quantity: 50, // Sell half
    price: 55000, // 55,000 VND per share
    fee: 1000,    // 1,000 VND fee
    tax: 500,     // 500 VND tax
    source: 'MANUAL',
    notes: 'Test sell trade for cash balance testing'
  };
  
  const trade = await makeRequest('POST', '/trades', sellTrade);
  console.log('✅ SELL trade executed:', trade.tradeId);
  console.log('✅ Trade total cost:', trade.totalCost);
  return trade;
}

async function addManualCashFlow(portfolioId) {
  console.log('Adding manual cash flow (deposit)...');
  const cashFlow = {
    portfolioId,
    amount: 2000000, // 2M VND deposit
    type: 'DEPOSIT',
    description: 'Manual deposit for testing',
    currency: 'VND'
  };
  
  const result = await makeRequest('POST', `/portfolios/${portfolioId}/cash-flow`, cashFlow);
  console.log('✅ Manual cash flow added');
  console.log('✅ Old balance:', result.oldCashBalance);
  console.log('✅ New balance:', result.newCashBalance);
  return result;
}

async function getPortfolioDetails(portfolioId) {
  console.log('Getting portfolio details...');
  const portfolio = await makeRequest('GET', `/portfolios/${portfolioId}`);
  console.log('✅ Portfolio details retrieved');
  console.log('✅ Current cash balance:', portfolio.cashBalance);
  console.log('✅ Total value:', portfolio.totalValue);
  return portfolio;
}

async function getCashFlowHistory(portfolioId) {
  console.log('Getting cash flow history...');
  const history = await makeRequest('GET', `/portfolios/${portfolioId}/cash-flow/history`);
  console.log('✅ Cash flow history retrieved');
  console.log('✅ Number of cash flows:', history.length);
  history.forEach((flow, index) => {
    console.log(`  ${index + 1}. ${flow.type}: ${flow.amount} VND - ${flow.description}`);
  });
  return history;
}

async function recalculateCashBalance(portfolioId) {
  console.log('Recalculating cash balance...');
  const result = await makeRequest('POST', `/portfolios/${portfolioId}/cash-flow/recalculate`);
  console.log('✅ Cash balance recalculated');
  console.log('✅ Recalculated balance:', result.recalculatedBalance);
  return result;
}

async function updateCashBalance(portfolioId) {
  console.log('Updating cash balance directly...');
  const update = {
    cashBalance: 15000000, // Set to 15M VND
    reason: 'Manual balance adjustment for testing'
  };
  
  const result = await makeRequest('PUT', `/portfolios/${portfolioId}/cash-flow/balance`, update);
  console.log('✅ Cash balance updated directly');
  console.log('✅ Old balance:', result.oldCashBalance);
  console.log('✅ New balance:', result.newCashBalance);
  return result;
}

// Main test function
async function runCashBalanceTests() {
  console.log('🚀 Starting Cash Balance Integration Tests\n');
  
  try {
    // Step 1: Create test account
    const account = await createTestAccount();
    testPortfolio.accountId = account.accountId;
    
    // Step 2: Create test portfolio with initial cash balance
    const portfolio = await createTestPortfolio(account.accountId);
    
    // Step 3: Create test asset
    const asset = await createTestAsset();
    
    // Step 4: Get initial portfolio state
    console.log('\n--- Initial Portfolio State ---');
    await getPortfolioDetails(portfolio.portfolioId);
    
    // Step 5: Execute BUY trade (should reduce cash balance)
    console.log('\n--- Executing BUY Trade ---');
    await executeBuyTrade(portfolio.portfolioId, asset.assetId);
    await getPortfolioDetails(portfolio.portfolioId);
    
    // Step 6: Execute SELL trade (should increase cash balance)
    console.log('\n--- Executing SELL Trade ---');
    await executeSellTrade(portfolio.portfolioId, asset.assetId);
    await getPortfolioDetails(portfolio.portfolioId);
    
    // Step 7: Add manual cash flow
    console.log('\n--- Adding Manual Cash Flow ---');
    await addManualCashFlow(portfolio.portfolioId);
    await getPortfolioDetails(portfolio.portfolioId);
    
    // Step 8: Get cash flow history
    console.log('\n--- Cash Flow History ---');
    await getCashFlowHistory(portfolio.portfolioId);
    
    // Step 9: Update cash balance directly
    console.log('\n--- Direct Cash Balance Update ---');
    await updateCashBalance(portfolio.portfolioId);
    await getPortfolioDetails(portfolio.portfolioId);
    
    // Step 10: Recalculate cash balance
    console.log('\n--- Cash Balance Recalculation ---');
    await recalculateCashBalance(portfolio.portfolioId);
    await getPortfolioDetails(portfolio.portfolioId);
    
    // Step 11: Final cash flow history
    console.log('\n--- Final Cash Flow History ---');
    await getCashFlowHistory(portfolio.portfolioId);
    
    console.log('\n✅ All Cash Balance Integration Tests Completed Successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runCashBalanceTests();
}

module.exports = {
  runCashBalanceTests,
  makeRequest
};
