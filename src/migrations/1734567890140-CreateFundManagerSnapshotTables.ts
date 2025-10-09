import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFundManagerSnapshotTables1734567890140 implements MigrationInterface {
  name = 'CreateFundManagerSnapshotTables1734567890140';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create Portfolio Performance Snapshots Table
    await queryRunner.query(`
      CREATE TABLE portfolio_performance_snapshots (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        portfolio_id UUID NOT NULL,
        snapshot_date DATE NOT NULL,
        granularity VARCHAR(20) NOT NULL DEFAULT 'DAILY',
        
        -- Portfolio TWR Metrics (Time-Weighted Returns)
        portfolio_twr_1d DECIMAL(8,4) DEFAULT 0,
        portfolio_twr_1w DECIMAL(8,4) DEFAULT 0,
        portfolio_twr_1m DECIMAL(8,4) DEFAULT 0,
        portfolio_twr_3m DECIMAL(8,4) DEFAULT 0,
        portfolio_twr_6m DECIMAL(8,4) DEFAULT 0,
        portfolio_twr_1y DECIMAL(8,4) DEFAULT 0,
        portfolio_twr_ytd DECIMAL(8,4) DEFAULT 0,
        
        -- Portfolio MWR/IRR Metrics (Money-Weighted Returns)
        portfolio_mwr_1m DECIMAL(8,4) DEFAULT 0,
        portfolio_mwr_3m DECIMAL(8,4) DEFAULT 0,
        portfolio_mwr_6m DECIMAL(8,4) DEFAULT 0,
        portfolio_mwr_1y DECIMAL(8,4) DEFAULT 0,
        portfolio_mwr_ytd DECIMAL(8,4) DEFAULT 0,
        portfolio_irr_1m DECIMAL(8,4) DEFAULT 0,
        portfolio_irr_3m DECIMAL(8,4) DEFAULT 0,
        portfolio_irr_6m DECIMAL(8,4) DEFAULT 0,
        portfolio_irr_1y DECIMAL(8,4) DEFAULT 0,
        portfolio_irr_ytd DECIMAL(8,4) DEFAULT 0,
        
        -- Portfolio Alpha Metrics (vs Benchmark)
        portfolio_alpha_1m DECIMAL(8,4) DEFAULT 0,
        portfolio_alpha_3m DECIMAL(8,4) DEFAULT 0,
        portfolio_alpha_6m DECIMAL(8,4) DEFAULT 0,
        portfolio_alpha_1y DECIMAL(8,4) DEFAULT 0,
        portfolio_alpha_ytd DECIMAL(8,4) DEFAULT 0,
        
        -- Portfolio Beta Metrics (vs Benchmark)
        portfolio_beta_1m DECIMAL(8,4) DEFAULT 0,
        portfolio_beta_3m DECIMAL(8,4) DEFAULT 0,
        portfolio_beta_6m DECIMAL(8,4) DEFAULT 0,
        portfolio_beta_1y DECIMAL(8,4) DEFAULT 0,
        portfolio_beta_ytd DECIMAL(8,4) DEFAULT 0,
        
        -- Portfolio Information Ratio
        portfolio_information_ratio_1m DECIMAL(8,4) DEFAULT 0,
        portfolio_information_ratio_3m DECIMAL(8,4) DEFAULT 0,
        portfolio_information_ratio_1y DECIMAL(8,4) DEFAULT 0,
        
        -- Portfolio Tracking Error
        portfolio_tracking_error_1m DECIMAL(8,4) DEFAULT 0,
        portfolio_tracking_error_3m DECIMAL(8,4) DEFAULT 0,
        portfolio_tracking_error_1y DECIMAL(8,4) DEFAULT 0,
        
        -- Cash Flow Tracking
        total_cash_inflows DECIMAL(20,8) DEFAULT 0,
        total_cash_outflows DECIMAL(20,8) DEFAULT 0,
        net_cash_flow DECIMAL(20,8) DEFAULT 0,
        
        -- Benchmark Comparison Data (JSON)
        benchmark_data JSONB,
        
        -- Metadata
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Asset Performance Snapshots Table
    await queryRunner.query(`
      CREATE TABLE asset_performance_snapshots (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        portfolio_id UUID NOT NULL,
        asset_id UUID NOT NULL,
        asset_symbol VARCHAR(50) NOT NULL,
        snapshot_date DATE NOT NULL,
        granularity VARCHAR(20) NOT NULL DEFAULT 'DAILY',
        
        -- Asset Performance Metrics
        asset_twr_1d DECIMAL(8,4) DEFAULT 0,
        asset_twr_1w DECIMAL(8,4) DEFAULT 0,
        asset_twr_1m DECIMAL(8,4) DEFAULT 0,
        asset_twr_3m DECIMAL(8,4) DEFAULT 0,
        asset_twr_6m DECIMAL(8,4) DEFAULT 0,
        asset_twr_1y DECIMAL(8,4) DEFAULT 0,
        asset_twr_ytd DECIMAL(8,4) DEFAULT 0,
        
        -- Asset Risk Metrics
        asset_volatility_1m DECIMAL(8,4) DEFAULT 0,
        asset_volatility_3m DECIMAL(8,4) DEFAULT 0,
        asset_volatility_1y DECIMAL(8,4) DEFAULT 0,
        asset_sharpe_ratio_1m DECIMAL(8,4) DEFAULT 0,
        asset_sharpe_ratio_3m DECIMAL(8,4) DEFAULT 0,
        asset_sharpe_ratio_1y DECIMAL(8,4) DEFAULT 0,
        asset_max_drawdown_1m DECIMAL(8,4) DEFAULT 0,
        asset_max_drawdown_3m DECIMAL(8,4) DEFAULT 0,
        asset_max_drawdown_1y DECIMAL(8,4) DEFAULT 0,
        
        -- Asset Risk-Adjusted Returns
        asset_risk_adjusted_return_1m DECIMAL(8,4) DEFAULT 0,
        asset_risk_adjusted_return_3m DECIMAL(8,4) DEFAULT 0,
        asset_risk_adjusted_return_1y DECIMAL(8,4) DEFAULT 0,
        
        -- Metadata
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Asset Group Performance Snapshots Table
    await queryRunner.query(`
      CREATE TABLE asset_group_performance_snapshots (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        portfolio_id UUID NOT NULL,
        asset_type VARCHAR(50) NOT NULL,
        snapshot_date DATE NOT NULL,
        granularity VARCHAR(20) NOT NULL DEFAULT 'DAILY',
        
        -- Group Performance Metrics
        group_twr_1d DECIMAL(8,4) DEFAULT 0,
        group_twr_1w DECIMAL(8,4) DEFAULT 0,
        group_twr_1m DECIMAL(8,4) DEFAULT 0,
        group_twr_3m DECIMAL(8,4) DEFAULT 0,
        group_twr_6m DECIMAL(8,4) DEFAULT 0,
        group_twr_1y DECIMAL(8,4) DEFAULT 0,
        group_twr_ytd DECIMAL(8,4) DEFAULT 0,
        
        -- Group Risk Metrics
        group_sharpe_ratio_1m DECIMAL(8,4) DEFAULT 0,
        group_sharpe_ratio_3m DECIMAL(8,4) DEFAULT 0,
        group_sharpe_ratio_1y DECIMAL(8,4) DEFAULT 0,
        group_volatility_1m DECIMAL(8,4) DEFAULT 0,
        group_volatility_3m DECIMAL(8,4) DEFAULT 0,
        group_volatility_1y DECIMAL(8,4) DEFAULT 0,
        group_max_drawdown_1m DECIMAL(8,4) DEFAULT 0,
        group_max_drawdown_3m DECIMAL(8,4) DEFAULT 0,
        group_max_drawdown_1y DECIMAL(8,4) DEFAULT 0,
        
        -- Group Risk-Adjusted Returns
        group_risk_adjusted_return_1m DECIMAL(8,4) DEFAULT 0,
        group_risk_adjusted_return_3m DECIMAL(8,4) DEFAULT 0,
        group_risk_adjusted_return_1y DECIMAL(8,4) DEFAULT 0,
        
        -- Group Statistics
        asset_count INT DEFAULT 0,
        active_asset_count INT DEFAULT 0,
        allocation_percentage DECIMAL(8,4) DEFAULT 0,
        
        -- Metadata
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Benchmark Data Table
    await queryRunner.query(`
      CREATE TABLE benchmark_data (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        benchmark_id UUID NOT NULL,
        benchmark_name VARCHAR(255) NOT NULL,
        benchmark_type VARCHAR(50) NOT NULL,
        snapshot_date DATE NOT NULL,
        granularity VARCHAR(20) NOT NULL DEFAULT 'DAILY',
        
        -- Benchmark Performance
        benchmark_value DECIMAL(20,8) DEFAULT 0,
        benchmark_return_1d DECIMAL(8,4) DEFAULT 0,
        benchmark_return_1w DECIMAL(8,4) DEFAULT 0,
        benchmark_return_1m DECIMAL(8,4) DEFAULT 0,
        benchmark_return_3m DECIMAL(8,4) DEFAULT 0,
        benchmark_return_6m DECIMAL(8,4) DEFAULT 0,
        benchmark_return_1y DECIMAL(8,4) DEFAULT 0,
        benchmark_return_ytd DECIMAL(8,4) DEFAULT 0,
        
        -- Benchmark Risk Metrics
        benchmark_volatility_1m DECIMAL(8,4) DEFAULT 0,
        benchmark_volatility_3m DECIMAL(8,4) DEFAULT 0,
        benchmark_volatility_1y DECIMAL(8,4) DEFAULT 0,
        benchmark_max_drawdown_1m DECIMAL(8,4) DEFAULT 0,
        benchmark_max_drawdown_3m DECIMAL(8,4) DEFAULT 0,
        benchmark_max_drawdown_1y DECIMAL(8,4) DEFAULT 0,
        
        -- Metadata
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Indexes for Portfolio Performance Snapshots
    await queryRunner.query(`
      CREATE INDEX idx_portfolio_performance_portfolio_date 
      ON portfolio_performance_snapshots (portfolio_id, snapshot_date, granularity)
    `);
    
    await queryRunner.query(`
      CREATE INDEX idx_portfolio_performance_date 
      ON portfolio_performance_snapshots (snapshot_date, granularity)
    `);

    // Create Indexes for Asset Performance Snapshots
    await queryRunner.query(`
      CREATE INDEX idx_asset_performance_portfolio_asset_date 
      ON asset_performance_snapshots (portfolio_id, asset_id, snapshot_date, granularity)
    `);
    
    await queryRunner.query(`
      CREATE INDEX idx_asset_performance_portfolio_date 
      ON asset_performance_snapshots (portfolio_id, snapshot_date, granularity)
    `);
    
    await queryRunner.query(`
      CREATE INDEX idx_asset_performance_date 
      ON asset_performance_snapshots (snapshot_date, granularity)
    `);

    // Create Indexes for Asset Group Performance Snapshots
    await queryRunner.query(`
      CREATE INDEX idx_asset_group_performance_portfolio_type_date 
      ON asset_group_performance_snapshots (portfolio_id, asset_type, snapshot_date, granularity)
    `);
    
    await queryRunner.query(`
      CREATE INDEX idx_asset_group_performance_portfolio_date 
      ON asset_group_performance_snapshots (portfolio_id, snapshot_date, granularity)
    `);
    
    await queryRunner.query(`
      CREATE INDEX idx_asset_group_performance_date 
      ON asset_group_performance_snapshots (snapshot_date, granularity)
    `);

    // Create Indexes for Benchmark Data
    await queryRunner.query(`
      CREATE INDEX idx_benchmark_data_benchmark_date 
      ON benchmark_data (benchmark_id, snapshot_date, granularity)
    `);
    
    await queryRunner.query(`
      CREATE INDEX idx_benchmark_data_date 
      ON benchmark_data (snapshot_date, granularity)
    `);

    // Add Foreign Key Constraints
    await queryRunner.query(`
      ALTER TABLE portfolio_performance_snapshots 
      ADD CONSTRAINT fk_portfolio_performance_portfolio 
      FOREIGN KEY (portfolio_id) REFERENCES portfolios(portfolio_id) ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE asset_performance_snapshots 
      ADD CONSTRAINT fk_asset_performance_portfolio 
      FOREIGN KEY (portfolio_id) REFERENCES portfolios(portfolio_id) ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE asset_performance_snapshots 
      ADD CONSTRAINT fk_asset_performance_asset 
      FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE asset_group_performance_snapshots 
      ADD CONSTRAINT fk_asset_group_performance_portfolio 
      FOREIGN KEY (portfolio_id) REFERENCES portfolios(portfolio_id) ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop Foreign Key Constraints
    await queryRunner.query(`ALTER TABLE asset_group_performance_snapshots DROP CONSTRAINT fk_asset_group_performance_portfolio`);
    await queryRunner.query(`ALTER TABLE asset_performance_snapshots DROP CONSTRAINT fk_asset_performance_asset`);
    await queryRunner.query(`ALTER TABLE asset_performance_snapshots DROP CONSTRAINT fk_asset_performance_portfolio`);
    await queryRunner.query(`ALTER TABLE portfolio_performance_snapshots DROP CONSTRAINT fk_portfolio_performance_portfolio`);

    // Drop Indexes
    await queryRunner.query(`DROP INDEX idx_benchmark_data_date`);
    await queryRunner.query(`DROP INDEX idx_benchmark_data_benchmark_date`);
    await queryRunner.query(`DROP INDEX idx_asset_group_performance_date`);
    await queryRunner.query(`DROP INDEX idx_asset_group_performance_portfolio_date`);
    await queryRunner.query(`DROP INDEX idx_asset_group_performance_portfolio_type_date`);
    await queryRunner.query(`DROP INDEX idx_asset_performance_date`);
    await queryRunner.query(`DROP INDEX idx_asset_performance_portfolio_date`);
    await queryRunner.query(`DROP INDEX idx_asset_performance_portfolio_asset_date`);
    await queryRunner.query(`DROP INDEX idx_portfolio_performance_date`);
    await queryRunner.query(`DROP INDEX idx_portfolio_performance_portfolio_date`);

    // Drop Tables
    await queryRunner.query(`DROP TABLE benchmark_data`);
    await queryRunner.query(`DROP TABLE asset_group_performance_snapshots`);
    await queryRunner.query(`DROP TABLE asset_performance_snapshots`);
    await queryRunner.query(`DROP TABLE portfolio_performance_snapshots`);
  }
}
