import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Load environment variables
config();

async function createPerformanceSnapshotTestData() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'portfolio_management',
    entities: [],
    synchronize: false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('Database connection established');

    // Test portfolio ID (use existing portfolio)
    const testPortfolioId = 'f9cf6de3-36ef-4581-8b29-1aa872ed9658';
    
    // Check if portfolio exists
    const portfolioCheck = await dataSource.query(
      'SELECT portfolio_id FROM portfolios WHERE portfolio_id = $1',
      [testPortfolioId]
    );

    if (portfolioCheck.length === 0) {
      console.log('Portfolio not found, creating test portfolio...');
      await dataSource.query(`
        INSERT INTO portfolios (portfolio_id, name, description, created_by, is_active)
        VALUES ($1, $2, $3, $4, $5)
      `, [testPortfolioId, 'Test Portfolio', 'Test Portfolio for Performance Snapshots', 'test-user', true]);
    }

    // Create test data for the last 30 days
    const now = new Date();
    const snapshots = [];

    for (let i = 0; i < 30; i++) {
      const snapshotDate = new Date(now);
      snapshotDate.setDate(now.getDate() - i);
      
      // Portfolio Performance Snapshot
      const portfolioSnapshot = {
        id: `portfolio-perf-${i + 1}`,
        portfolio_id: testPortfolioId,
        snapshot_date: snapshotDate.toISOString().split('T')[0],
        granularity: 'DAILY',
        portfolio_twr_1d: (Math.random() - 0.5) * 0.1, // -5% to +5%
        portfolio_twr_1w: (Math.random() - 0.5) * 0.2, // -10% to +10%
        portfolio_twr_1m: (Math.random() - 0.5) * 0.3, // -15% to +15%
        portfolio_twr_3m: (Math.random() - 0.5) * 0.4, // -20% to +20%
        portfolio_twr_6m: (Math.random() - 0.5) * 0.5, // -25% to +25%
        portfolio_twr_1y: (Math.random() - 0.5) * 0.6, // -30% to +30%
        portfolio_twr_ytd: (Math.random() - 0.5) * 0.4, // -20% to +20%
        portfolio_mwr_1m: (Math.random() - 0.5) * 0.25,
        portfolio_mwr_3m: (Math.random() - 0.5) * 0.35,
        portfolio_mwr_6m: (Math.random() - 0.5) * 0.45,
        portfolio_mwr_1y: (Math.random() - 0.5) * 0.55,
        portfolio_mwr_ytd: (Math.random() - 0.5) * 0.35,
        portfolio_irr_1m: (Math.random() - 0.5) * 0.25,
        portfolio_irr_3m: (Math.random() - 0.5) * 0.35,
        portfolio_irr_6m: (Math.random() - 0.5) * 0.45,
        portfolio_irr_1y: (Math.random() - 0.5) * 0.55,
        portfolio_irr_ytd: (Math.random() - 0.5) * 0.35,
        portfolio_alpha_1m: (Math.random() - 0.5) * 0.15,
        portfolio_alpha_3m: (Math.random() - 0.5) * 0.2,
        portfolio_alpha_6m: (Math.random() - 0.5) * 0.25,
        portfolio_alpha_1y: (Math.random() - 0.5) * 0.3,
        portfolio_alpha_ytd: (Math.random() - 0.5) * 0.2,
        portfolio_beta_1m: 0.8 + Math.random() * 0.4, // 0.8 to 1.2
        portfolio_beta_3m: 0.8 + Math.random() * 0.4,
        portfolio_beta_6m: 0.8 + Math.random() * 0.4,
        portfolio_beta_1y: 0.8 + Math.random() * 0.4,
        portfolio_beta_ytd: 0.8 + Math.random() * 0.4,
        portfolio_information_ratio_1m: (Math.random() - 0.5) * 2,
        portfolio_information_ratio_3m: (Math.random() - 0.5) * 2,
        portfolio_information_ratio_1y: (Math.random() - 0.5) * 2,
        portfolio_tracking_error_1m: Math.random() * 0.1, // 0 to 10%
        portfolio_tracking_error_3m: Math.random() * 0.1,
        portfolio_tracking_error_1y: Math.random() * 0.1,
        total_cash_inflows: Math.random() * 100000,
        total_cash_outflows: Math.random() * 50000,
        net_cash_flow: Math.random() * 50000,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      snapshots.push(portfolioSnapshot);
    }

    // Insert portfolio performance snapshots
    console.log('Inserting portfolio performance snapshots...');
    for (const snapshot of snapshots) {
      await dataSource.query(`
        INSERT INTO portfolio_performance_snapshots (
          id, portfolio_id, snapshot_date, granularity,
          portfolio_twr_1d, portfolio_twr_1w, portfolio_twr_1m, portfolio_twr_3m, portfolio_twr_6m, portfolio_twr_1y, portfolio_twr_ytd,
          portfolio_mwr_1m, portfolio_mwr_3m, portfolio_mwr_6m, portfolio_mwr_1y, portfolio_mwr_ytd,
          portfolio_irr_1m, portfolio_irr_3m, portfolio_irr_6m, portfolio_irr_1y, portfolio_irr_ytd,
          portfolio_alpha_1m, portfolio_alpha_3m, portfolio_alpha_6m, portfolio_alpha_1y, portfolio_alpha_ytd,
          portfolio_beta_1m, portfolio_beta_3m, portfolio_beta_6m, portfolio_beta_1y, portfolio_beta_ytd,
          portfolio_information_ratio_1m, portfolio_information_ratio_3m, portfolio_information_ratio_1y,
          portfolio_tracking_error_1m, portfolio_tracking_error_3m, portfolio_tracking_error_1y,
          total_cash_inflows, total_cash_outflows, net_cash_flow,
          is_active, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39
        )
      `, [
        snapshot.id, snapshot.portfolio_id, snapshot.snapshot_date, snapshot.granularity,
        snapshot.portfolio_twr_1d, snapshot.portfolio_twr_1w, snapshot.portfolio_twr_1m, snapshot.portfolio_twr_3m, snapshot.portfolio_twr_6m, snapshot.portfolio_twr_1y, snapshot.portfolio_twr_ytd,
        snapshot.portfolio_mwr_1m, snapshot.portfolio_mwr_3m, snapshot.portfolio_mwr_6m, snapshot.portfolio_mwr_1y, snapshot.portfolio_mwr_ytd,
        snapshot.portfolio_irr_1m, snapshot.portfolio_irr_3m, snapshot.portfolio_irr_6m, snapshot.portfolio_irr_1y, snapshot.portfolio_irr_ytd,
        snapshot.portfolio_alpha_1m, snapshot.portfolio_alpha_3m, snapshot.portfolio_alpha_6m, snapshot.portfolio_alpha_1y, snapshot.portfolio_alpha_ytd,
        snapshot.portfolio_beta_1m, snapshot.portfolio_beta_3m, snapshot.portfolio_beta_6m, snapshot.portfolio_beta_1y, snapshot.portfolio_beta_ytd,
        snapshot.portfolio_information_ratio_1m, snapshot.portfolio_information_ratio_3m, snapshot.portfolio_information_ratio_1y,
        snapshot.portfolio_tracking_error_1m, snapshot.portfolio_tracking_error_3m, snapshot.portfolio_tracking_error_1y,
        snapshot.total_cash_inflows, snapshot.total_cash_outflows, snapshot.net_cash_flow,
        snapshot.is_active, snapshot.created_at, snapshot.updated_at
      ]);
    }

    // Create Asset Group Performance Snapshots
    console.log('Creating asset group performance snapshots...');
    const assetGroups = ['Stocks', 'Bonds', 'Crypto', 'Commodities'];
    
    for (let i = 0; i < 30; i++) {
      const snapshotDate = new Date(now);
      snapshotDate.setDate(now.getDate() - i);
      
      for (const groupName of assetGroups) {
        await dataSource.query(`
          INSERT INTO asset_group_performance_snapshots (
            id, portfolio_id, group_name, snapshot_date, granularity,
            group_twr_1d, group_twr_1w, group_twr_1m, group_twr_3m, group_twr_6m, group_twr_1y, group_twr_ytd,
            group_mwr_1m, group_mwr_3m, group_mwr_6m, group_mwr_1y, group_mwr_ytd,
            group_irr_1m, group_irr_3m, group_irr_6m, group_irr_1y, group_irr_ytd,
            group_alpha_1m, group_alpha_3m, group_alpha_6m, group_alpha_1y, group_alpha_ytd,
            group_beta_1m, group_beta_3m, group_beta_6m, group_beta_1y, group_beta_ytd,
            group_sharpe_ratio_1m, group_sharpe_ratio_3m, group_sharpe_ratio_1y,
            group_volatility_1m, group_volatility_3m, group_volatility_1y,
            group_max_drawdown_1m, group_max_drawdown_3m, group_max_drawdown_1y,
            group_risk_adjusted_return_1m, group_risk_adjusted_return_3m, group_risk_adjusted_return_1y,
            is_active, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43
          )
        `, [
          `group-perf-${i + 1}-${groupName.toLowerCase()}`, testPortfolioId, groupName, snapshotDate.toISOString().split('T')[0], 'DAILY',
          (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.25, (Math.random() - 0.5) * 0.35, (Math.random() - 0.5) * 0.45, (Math.random() - 0.5) * 0.55, (Math.random() - 0.5) * 0.35,
          (Math.random() - 0.5) * 0.25, (Math.random() - 0.5) * 0.35, (Math.random() - 0.5) * 0.45, (Math.random() - 0.5) * 0.55, (Math.random() - 0.5) * 0.35,
          (Math.random() - 0.5) * 0.15, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.25, (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.2,
          0.8 + Math.random() * 0.4, 0.8 + Math.random() * 0.4, 0.8 + Math.random() * 0.4, 0.8 + Math.random() * 0.4, 0.8 + Math.random() * 0.4,
          (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2,
          Math.random() * 0.1, Math.random() * 0.1, Math.random() * 0.1,
          Math.random() * 0.15, Math.random() * 0.15, Math.random() * 0.15,
          (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2,
          true, new Date(), new Date()
        ]);
      }
    }

    // Create Asset Performance Snapshots
    console.log('Creating asset performance snapshots...');
    const assets = [
      { symbol: 'AAPL', name: 'Apple Inc.' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.' },
      { symbol: 'MSFT', name: 'Microsoft Corporation' },
      { symbol: 'TSLA', name: 'Tesla Inc.' },
      { symbol: 'AMZN', name: 'Amazon.com Inc.' }
    ];
    
    for (let i = 0; i < 30; i++) {
      const snapshotDate = new Date(now);
      snapshotDate.setDate(now.getDate() - i);
      
      for (const asset of assets) {
        await dataSource.query(`
          INSERT INTO asset_performance_snapshots (
            id, portfolio_id, asset_symbol, asset_name, snapshot_date, granularity,
            absolute_return, simple_return,
            asset_twr_1d, asset_twr_1w, asset_twr_1m, asset_twr_3m, asset_twr_6m, asset_twr_1y, asset_twr_ytd,
            asset_mwr_1m, asset_mwr_3m, asset_mwr_6m, asset_mwr_1y, asset_mwr_ytd,
            asset_irr_1m, asset_irr_3m, asset_irr_6m, asset_irr_1y, asset_irr_ytd,
            asset_alpha_1m, asset_alpha_3m, asset_alpha_6m, asset_alpha_1y, asset_alpha_ytd,
            asset_beta_1m, asset_beta_3m, asset_beta_6m, asset_beta_1y, asset_beta_ytd,
            asset_sharpe_ratio_1m, asset_sharpe_ratio_3m, asset_sharpe_ratio_1y,
            asset_volatility_1m, asset_volatility_3m, asset_volatility_1y,
            asset_max_drawdown_1m, asset_max_drawdown_3m, asset_max_drawdown_1y,
            asset_risk_adjusted_return_1m, asset_risk_adjusted_return_3m, asset_risk_adjusted_return_1y,
            is_active, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46, $47, $48, $49, $50, $51
          )
        `, [
          `asset-perf-${i + 1}-${asset.symbol.toLowerCase()}`, testPortfolioId, asset.symbol, asset.name, snapshotDate.toISOString().split('T')[0], 'DAILY',
          Math.random() * 10000, (Math.random() - 0.5) * 0.1,
          (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.25, (Math.random() - 0.5) * 0.35, (Math.random() - 0.5) * 0.45, (Math.random() - 0.5) * 0.55, (Math.random() - 0.5) * 0.35,
          (Math.random() - 0.5) * 0.25, (Math.random() - 0.5) * 0.35, (Math.random() - 0.5) * 0.45, (Math.random() - 0.5) * 0.55, (Math.random() - 0.5) * 0.35,
          (Math.random() - 0.5) * 0.15, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.25, (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.2,
          0.8 + Math.random() * 0.4, 0.8 + Math.random() * 0.4, 0.8 + Math.random() * 0.4, 0.8 + Math.random() * 0.4, 0.8 + Math.random() * 0.4,
          (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2,
          Math.random() * 0.1, Math.random() * 0.1, Math.random() * 0.1,
          Math.random() * 0.15, Math.random() * 0.15, Math.random() * 0.15,
          (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2,
          true, new Date(), new Date()
        ]);
      }
    }

    console.log('✅ Performance snapshot test data created successfully!');
    console.log(`📊 Created ${snapshots.length} portfolio performance snapshots`);
    console.log(`📊 Created ${snapshots.length * assetGroups.length} asset group performance snapshots`);
    console.log(`📊 Created ${snapshots.length * assets.length} asset performance snapshots`);

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    await dataSource.destroy();
  }
}

// Run the script
createPerformanceSnapshotTestData();
