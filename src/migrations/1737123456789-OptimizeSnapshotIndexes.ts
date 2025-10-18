import { MigrationInterface, QueryRunner } from 'typeorm';

export class OptimizeSnapshotIndexes1737123456789 implements MigrationInterface {
  name = 'OptimizeSnapshotIndexes1737123456789';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🚀 Starting snapshot performance index optimizations...');

    // Check if tables exist before creating indexes
    const assetSnapshotsExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'asset_allocation_snapshots'
      )
    `);

    const tradesExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'trades'
      )
    `);

    const priceHistoryExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'asset_price_history'
      )
    `);

    if (!assetSnapshotsExists[0].exists) {
      console.log('⚠️ asset_allocation_snapshots table does not exist, skipping snapshot indexes');
      return;
    }

    if (!tradesExists[0].exists) {
      console.log('⚠️ trades table does not exist, skipping trade indexes');
      return;
    }

    if (!priceHistoryExists[0].exists) {
      console.log('⚠️ asset_price_history table does not exist, skipping price history indexes');
      return;
    }

    // 1. HIGHEST PRIORITY - Return Calculations
    console.log('📊 Creating return calculation index...');
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_asset_snapshots_return_calc 
      ON asset_allocation_snapshots (portfolio_id, asset_id, granularity, snapshot_date DESC)
    `);

    // 2. HIGH PRIORITY - Trade Queries
    console.log('📊 Creating trade query index...');
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_trades_portfolio_asset_date 
      ON trades (portfolio_id, asset_id, trade_date)
    `);

    // 3. HIGH PRIORITY - Price History Lookup
    console.log('📊 Creating price history index...');
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_price_history_asset_date 
      ON asset_price_history (asset_id, created_at DESC)
    `);

    // 4. MEDIUM PRIORITY - Cleanup Operations
    console.log('📊 Creating cleanup index...');
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_asset_snapshots_cleanup 
      ON asset_allocation_snapshots (portfolio_id, granularity, snapshot_date)
    `);

    // 5. MEDIUM PRIORITY - Latest Trade Price
    console.log('📊 Creating latest trade price index...');
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_trades_asset_date_desc 
      ON trades (asset_id, trade_date DESC)
    `);

    // 6. OPTIONAL - Analytics Queries
    console.log('📊 Creating analytics index...');
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_asset_snapshots_analytics 
      ON asset_allocation_snapshots (portfolio_id, snapshot_date, granularity, asset_symbol)
    `);

    // 7. OPTIONAL - External Price History
    console.log('📊 Creating external price history index...');
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_price_history_external 
      ON asset_price_history (asset_id, created_at DESC) 
      WHERE price_source = 'EXTERNAL_API'
    `);

    // 8. OPTIONAL - Trade Date Range Queries
    console.log('📊 Creating trade date range index...');
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_trades_date_range 
      ON trades (trade_date, portfolio_id, asset_id)
    `);

    // Update table statistics
    console.log('📊 Updating table statistics...');
    await queryRunner.query('ANALYZE asset_allocation_snapshots');
    await queryRunner.query('ANALYZE trades');
    await queryRunner.query('ANALYZE asset_price_history');

    console.log('✅ Snapshot performance indexes created successfully!');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('🔄 Rolling back snapshot performance indexes...');

    // Drop indexes in reverse order
    await queryRunner.query('DROP INDEX IF EXISTS idx_trades_date_range');
    await queryRunner.query('DROP INDEX IF EXISTS idx_price_history_external');
    await queryRunner.query('DROP INDEX IF EXISTS idx_asset_snapshots_analytics');
    await queryRunner.query('DROP INDEX IF EXISTS idx_trades_asset_date_desc');
    await queryRunner.query('DROP INDEX IF EXISTS idx_asset_snapshots_cleanup');
    await queryRunner.query('DROP INDEX IF EXISTS idx_price_history_asset_date');
    await queryRunner.query('DROP INDEX IF EXISTS idx_trades_portfolio_asset_date');
    await queryRunner.query('DROP INDEX IF EXISTS idx_asset_snapshots_return_calc');

    console.log('✅ Snapshot performance indexes rolled back successfully!');
  }
}
