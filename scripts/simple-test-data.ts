import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Load environment variables
config();

async function createSimpleTestData() {
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

    // Create simple test data - just a few records
    console.log('Creating simple test data...');
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);

    // Insert 3 portfolio performance snapshots
    const snapshots = [
      {
        id: 'test-portfolio-perf-1',
        portfolio_id: testPortfolioId,
        snapshot_date: today.toISOString().split('T')[0],
        granularity: 'DAILY',
        portfolio_twr_1d: 0.02,
        portfolio_twr_1w: 0.05,
        portfolio_twr_1m: 0.08,
        portfolio_twr_3m: 0.12,
        portfolio_twr_6m: 0.15,
        portfolio_twr_1y: 0.20,
        portfolio_twr_ytd: 0.18,
        portfolio_mwr_1m: 0.07,
        portfolio_mwr_3m: 0.11,
        portfolio_mwr_6m: 0.14,
        portfolio_mwr_1y: 0.19,
        portfolio_mwr_ytd: 0.17,
        portfolio_irr_1m: 0.07,
        portfolio_irr_3m: 0.11,
        portfolio_irr_6m: 0.14,
        portfolio_irr_1y: 0.19,
        portfolio_irr_ytd: 0.17,
        portfolio_alpha_1m: 0.01,
        portfolio_alpha_3m: 0.02,
        portfolio_alpha_6m: 0.03,
        portfolio_alpha_1y: 0.04,
        portfolio_alpha_ytd: 0.03,
        portfolio_beta_1m: 1.1,
        portfolio_beta_3m: 1.05,
        portfolio_beta_6m: 1.0,
        portfolio_beta_1y: 0.95,
        portfolio_beta_ytd: 0.98,
        portfolio_information_ratio_1m: 0.5,
        portfolio_information_ratio_3m: 0.6,
        portfolio_information_ratio_1y: 0.7,
        portfolio_tracking_error_1m: 0.05,
        portfolio_tracking_error_3m: 0.06,
        portfolio_tracking_error_1y: 0.07,
        total_cash_inflows: 10000,
        total_cash_outflows: 5000,
        net_cash_flow: 5000,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'test-portfolio-perf-2',
        portfolio_id: testPortfolioId,
        snapshot_date: yesterday.toISOString().split('T')[0],
        granularity: 'DAILY',
        portfolio_twr_1d: 0.01,
        portfolio_twr_1w: 0.04,
        portfolio_twr_1m: 0.07,
        portfolio_twr_3m: 0.11,
        portfolio_twr_6m: 0.14,
        portfolio_twr_1y: 0.19,
        portfolio_twr_ytd: 0.17,
        portfolio_mwr_1m: 0.06,
        portfolio_mwr_3m: 0.10,
        portfolio_mwr_6m: 0.13,
        portfolio_mwr_1y: 0.18,
        portfolio_mwr_ytd: 0.16,
        portfolio_irr_1m: 0.06,
        portfolio_irr_3m: 0.10,
        portfolio_irr_6m: 0.13,
        portfolio_irr_1y: 0.18,
        portfolio_irr_ytd: 0.16,
        portfolio_alpha_1m: 0.005,
        portfolio_alpha_3m: 0.015,
        portfolio_alpha_6m: 0.025,
        portfolio_alpha_1y: 0.035,
        portfolio_alpha_ytd: 0.025,
        portfolio_beta_1m: 1.05,
        portfolio_beta_3m: 1.0,
        portfolio_beta_6m: 0.95,
        portfolio_beta_1y: 0.90,
        portfolio_beta_ytd: 0.93,
        portfolio_information_ratio_1m: 0.4,
        portfolio_information_ratio_3m: 0.5,
        portfolio_information_ratio_1y: 0.6,
        portfolio_tracking_error_1m: 0.04,
        portfolio_tracking_error_3m: 0.05,
        portfolio_tracking_error_1y: 0.06,
        total_cash_inflows: 8000,
        total_cash_outflows: 4000,
        net_cash_flow: 4000,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'test-portfolio-perf-3',
        portfolio_id: testPortfolioId,
        snapshot_date: twoDaysAgo.toISOString().split('T')[0],
        granularity: 'DAILY',
        portfolio_twr_1d: -0.01,
        portfolio_twr_1w: 0.03,
        portfolio_twr_1m: 0.06,
        portfolio_twr_3m: 0.10,
        portfolio_twr_6m: 0.13,
        portfolio_twr_1y: 0.18,
        portfolio_twr_ytd: 0.16,
        portfolio_mwr_1m: 0.05,
        portfolio_mwr_3m: 0.09,
        portfolio_mwr_6m: 0.12,
        portfolio_mwr_1y: 0.17,
        portfolio_mwr_ytd: 0.15,
        portfolio_irr_1m: 0.05,
        portfolio_irr_3m: 0.09,
        portfolio_irr_6m: 0.12,
        portfolio_irr_1y: 0.17,
        portfolio_irr_ytd: 0.15,
        portfolio_alpha_1m: 0.0,
        portfolio_alpha_3m: 0.01,
        portfolio_alpha_6m: 0.02,
        portfolio_alpha_1y: 0.03,
        portfolio_alpha_ytd: 0.02,
        portfolio_beta_1m: 1.0,
        portfolio_beta_3m: 0.95,
        portfolio_beta_6m: 0.90,
        portfolio_beta_1y: 0.85,
        portfolio_beta_ytd: 0.88,
        portfolio_information_ratio_1m: 0.3,
        portfolio_information_ratio_3m: 0.4,
        portfolio_information_ratio_1y: 0.5,
        portfolio_tracking_error_1m: 0.03,
        portfolio_tracking_error_3m: 0.04,
        portfolio_tracking_error_1y: 0.05,
        total_cash_inflows: 6000,
        total_cash_outflows: 3000,
        net_cash_flow: 3000,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    // Insert each snapshot individually
    for (const snapshot of snapshots) {
      try {
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
        console.log(`✅ Inserted snapshot: ${snapshot.id}`);
      } catch (error) {
        console.error(`❌ Error inserting snapshot ${snapshot.id}:`, error.message);
      }
    }

    console.log('✅ Simple test data created successfully!');

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    await dataSource.destroy();
  }
}

// Run the script
createSimpleTestData();
