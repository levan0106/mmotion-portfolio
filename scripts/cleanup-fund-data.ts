#!/usr/bin/env npx ts-node

/**
 * Fund Data Cleanup Script
 * 
 * This script cleans up fund data for testing purposes:
 * - Deletes all fund unit transactions
 * - Deletes all investor holdings  
 * - Resets portfolio to non-fund status
 * 
 * Usage:
 *   npm run cleanup:fund-data                    # Clean all funds
 *   npm run cleanup:fund-data -- <portfolioId>  # Clean specific portfolio
 * 
 * Examples:
 *   npm run cleanup:fund-data
 *   npm run cleanup:fund-data -- 1ec02079-71ac-42f3-b62d-5e1de1d1d750
 */

import { Client } from 'pg';

interface CleanupResult {
  portfolioId: string;
  portfolioName: string;
  fundUnitTransactionsDeleted: number;
  investorHoldingsDeleted: number;
  cashFlowsDeleted: number;
  portfolioReset: boolean;
}

async function cleanupFundData(portfolioId?: string): Promise<void> {
  console.log('🧹 Starting Fund Data Cleanup...\n');

  // Database connection
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'portfolio_db',
    user: 'postgres',
    password: 'postgres'
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Get portfolios to clean up
    let portfolios: any[];
    if (portfolioId) {
      const result = await client.query(
        'SELECT portfolio_id, name, is_fund, total_outstanding_units, nav_per_unit FROM portfolios WHERE portfolio_id = $1',
        [portfolioId]
      );
      if (result.rows.length === 0) {
        console.error(`❌ Portfolio ${portfolioId} not found`);
        return;
      }
      portfolios = result.rows;
    } else {
      // Get all funds
      const result = await client.query(
        'SELECT portfolio_id, name, is_fund, total_outstanding_units, nav_per_unit FROM portfolios WHERE is_fund = true'
      );
      portfolios = result.rows;
    }

    if (portfolios.length === 0) {
      console.log('ℹ️  No funds found to clean up');
      return;
    }

    const results: CleanupResult[] = [];

    for (const portfolio of portfolios) {
      console.log(`📊 Processing portfolio: ${portfolio.name} (${portfolio.portfolio_id})`);
      
      console.log(`   📈 Before cleanup:`);
      console.log(`      - Is Fund: ${portfolio.is_fund}`);
      console.log(`      - Total Outstanding Units: ${portfolio.total_outstanding_units}`);
      console.log(`      - NAV per Unit: ${portfolio.nav_per_unit}`);
      console.log(`      - Cash Balance: ${portfolio.cash_balance || 0}`);

      // Count existing data
      const transactionCountResult = await client.query(
        'SELECT COUNT(*) as count FROM fund_unit_transactions fut JOIN investor_holdings ih ON fut.holding_id = ih.holding_id WHERE ih.portfolio_id = $1',
        [portfolio.portfolio_id]
      );
      const transactionCount = parseInt(transactionCountResult.rows[0].count);

      const holdingCountResult = await client.query(
        'SELECT COUNT(*) as count FROM investor_holdings WHERE portfolio_id = $1',
        [portfolio.portfolio_id]
      );
      const holdingCount = parseInt(holdingCountResult.rows[0].count);

      // Count cash flows related to fund unit transactions for this portfolio
      const cashFlowCountResult = await client.query(
        'SELECT COUNT(DISTINCT cf.cash_flow_id) as count FROM cash_flows cf JOIN fund_unit_transactions fut ON cf.cash_flow_id = fut.cash_flow_id JOIN investor_holdings ih ON fut.holding_id = ih.holding_id WHERE ih.portfolio_id = $1',
        [portfolio.portfolio_id]
      );
      const cashFlowCount = parseInt(cashFlowCountResult.rows[0].count);

      console.log(`      - Fund Unit Transactions: ${transactionCount}`);
      console.log(`      - Investor Holdings: ${holdingCount}`);
      console.log(`      - Cash Flows: ${cashFlowCount}`);

      // First, delete cash flows related to fund unit transactions for this portfolio
      const deleteCashFlowsResult = await client.query(
        'DELETE FROM cash_flows WHERE cash_flow_id IN (SELECT DISTINCT cf.cash_flow_id FROM cash_flows cf JOIN fund_unit_transactions fut ON cf.cash_flow_id = fut.cash_flow_id JOIN investor_holdings ih ON fut.holding_id = ih.holding_id WHERE ih.portfolio_id = $1)',
        [portfolio.portfolio_id]
      );

      // Then delete fund unit transactions
      const deleteTransactionsResult = await client.query(
        'DELETE FROM fund_unit_transactions WHERE holding_id IN (SELECT holding_id FROM investor_holdings WHERE portfolio_id = $1)',
        [portfolio.portfolio_id]
      );

      // Finally delete investor holdings
      const deleteHoldingsResult = await client.query(
        'DELETE FROM investor_holdings WHERE portfolio_id = $1',
        [portfolio.portfolio_id]
      );

      // Recalculate cash balance from remaining cash flows
      // Match entity logic: inflow types vs outflow types
      const remainingCashFlowsResult = await client.query(
        'SELECT SUM(CASE WHEN type IN (\'DEPOSIT\', \'DIVIDEND\', \'INTEREST\', \'SELL_TRADE\', \'DEPOSIT_SETTLEMENT\') THEN amount ELSE -amount END) as total_cash_balance FROM cash_flows WHERE portfolio_id = $1',
        [portfolio.portfolio_id]
      );
      const newCashBalance = remainingCashFlowsResult.rows[0].total_cash_balance || 0;

      // Reset portfolio to non-fund status and update cash balance
      await client.query(
        'UPDATE portfolios SET is_fund = false, total_outstanding_units = 0, nav_per_unit = 0, last_nav_date = NULL, cash_balance = $2 WHERE portfolio_id = $1',
        [portfolio.portfolio_id, newCashBalance]
      );

      console.log(`   ✅ After cleanup:`);
      console.log(`      - Fund Unit Transactions: 0 (deleted ${deleteTransactionsResult.rowCount || 0})`);
      console.log(`      - Investor Holdings: 0 (deleted ${deleteHoldingsResult.rowCount || 0})`);
      console.log(`      - Cash Flows: 0 (deleted ${deleteCashFlowsResult.rowCount || 0})`);
      console.log(`      - Is Fund: false`);
      console.log(`      - Total Outstanding Units: 0`);
      console.log(`      - NAV per Unit: 0`);
      console.log(`      - Cash Balance: ${newCashBalance} (recalculated from remaining cash flows)`);

      results.push({
        portfolioId: portfolio.portfolio_id,
        portfolioName: portfolio.name,
        fundUnitTransactionsDeleted: deleteTransactionsResult.rowCount || 0,
        investorHoldingsDeleted: deleteHoldingsResult.rowCount || 0,
        cashFlowsDeleted: deleteCashFlowsResult.rowCount || 0,
        portfolioReset: true
      });

      console.log(`   🎉 Portfolio ${portfolio.name} cleaned successfully!\n`);
    }

    // Print summary
    console.log('📋 CLEANUP SUMMARY');
    console.log('==================');
    console.log(`Total portfolios processed: ${results.length}`);
    console.log(`Total fund unit transactions deleted: ${results.reduce((sum, r) => sum + r.fundUnitTransactionsDeleted, 0)}`);
    console.log(`Total investor holdings deleted: ${results.reduce((sum, r) => sum + r.investorHoldingsDeleted, 0)}`);
    console.log(`Total cash flows deleted: ${results.reduce((sum, r) => sum + r.cashFlowsDeleted, 0)}`);
    console.log(`Total portfolios reset: ${results.filter(r => r.portfolioReset).length}`);
    
    console.log('\n📊 Detailed Results:');
    results.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.portfolioName} (${result.portfolioId})`);
      console.log(`   - Fund Unit Transactions: ${result.fundUnitTransactionsDeleted} deleted`);
      console.log(`   - Investor Holdings: ${result.investorHoldingsDeleted} deleted`);
      console.log(`   - Cash Flows: ${result.cashFlowsDeleted} deleted`);
      console.log(`   - Portfolio Reset: ${result.portfolioReset ? '✅' : '❌'}`);
    });

    console.log('\n🎯 Next Steps:');
    console.log('1. Convert portfolio to fund: POST /api/v1/portfolios/{portfolioId}/convert-to-fund');
    console.log('2. Test subscription: POST /api/v1/investor-holdings/subscribe');
    console.log('3. Test redemption: POST /api/v1/investor-holdings/redeem');
    console.log('4. Check holding details: GET /api/v1/investor-holdings/{holdingId}/detail');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const portfolioId = args[0]; // Optional portfolio ID

  try {
    await cleanupFundData(portfolioId);
    console.log('\n✅ Fund data cleanup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fund data cleanup failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { cleanupFundData };
