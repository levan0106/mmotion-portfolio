import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAssetTypeToAssetAllocationSnapshots20250128000000 implements MigrationInterface {
  name = 'AddAssetTypeToAssetAllocationSnapshots20250128000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if the table exists first
    const tableExists = await queryRunner.hasTable('asset_allocation_snapshots');
    
    if (tableExists) {
      // Check if the column already exists
      const columnExists = await queryRunner.hasColumn('asset_allocation_snapshots', 'asset_type');
      
      if (!columnExists) {
        // Add the asset_type column
        await queryRunner.query(`
          ALTER TABLE asset_allocation_snapshots 
          ADD COLUMN asset_type VARCHAR(50) DEFAULT 'UNKNOWN'
        `);
        
        // Update existing records with asset type based on asset_symbol
        await queryRunner.query(`
          UPDATE asset_allocation_snapshots 
          SET asset_type = CASE 
            WHEN asset_symbol LIKE '%GOLD%' OR asset_symbol LIKE '%AU%' OR asset_symbol = 'DOJI' THEN 'GOLD'
            WHEN asset_symbol LIKE '%BOND%' OR asset_symbol LIKE '%TP%' OR asset_symbol = 'SSIBF' THEN 'BOND'
            WHEN asset_symbol LIKE '%CASH%' OR asset_symbol LIKE '%VND%' THEN 'CASH'
            WHEN asset_symbol LIKE '%DEPOSIT%' OR asset_symbol LIKE '%TG%' THEN 'DEPOSIT'
            ELSE 'STOCK'
          END
        `);
      }
    } else {
      // If table doesn't exist, create it with all columns including asset_type
      await queryRunner.query(`
        CREATE TABLE asset_allocation_snapshots (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          portfolio_id UUID NOT NULL,
          asset_id UUID NOT NULL,
          asset_symbol VARCHAR(50) NOT NULL,
          asset_type VARCHAR(50) NOT NULL DEFAULT 'UNKNOWN',
          snapshot_date DATE NOT NULL,
          granularity VARCHAR(20) NOT NULL DEFAULT 'DAILY',
          quantity DECIMAL(15,6) NOT NULL DEFAULT 0,
          current_price DECIMAL(15,6) NOT NULL DEFAULT 0,
          current_value DECIMAL(15,6) NOT NULL DEFAULT 0,
          cost_basis DECIMAL(15,6) NOT NULL DEFAULT 0,
          avg_cost DECIMAL(15,6) NOT NULL DEFAULT 0,
          realized_pl DECIMAL(15,6) NOT NULL DEFAULT 0,
          unrealized_pl DECIMAL(15,6) NOT NULL DEFAULT 0,
          total_pl DECIMAL(15,6) NOT NULL DEFAULT 0,
          allocation_percentage DECIMAL(8,4) NOT NULL DEFAULT 0,
          portfolio_total_value DECIMAL(15,6) NOT NULL DEFAULT 0,
          return_percentage DECIMAL(8,4) NOT NULL DEFAULT 0,
          daily_return DECIMAL(8,4) NOT NULL DEFAULT 0,
          cumulative_return DECIMAL(8,4) NOT NULL DEFAULT 0,
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_by VARCHAR(255),
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create indexes
      await queryRunner.query(`
        CREATE INDEX idx_asset_allocation_snapshots_portfolio_date_granularity 
        ON asset_allocation_snapshots (portfolio_id, snapshot_date, granularity)
      `);
      
      await queryRunner.query(`
        CREATE INDEX idx_asset_allocation_snapshots_portfolio_asset_date 
        ON asset_allocation_snapshots (portfolio_id, asset_id, snapshot_date)
      `);
      
      await queryRunner.query(`
        CREATE INDEX idx_asset_allocation_snapshots_date_granularity 
        ON asset_allocation_snapshots (snapshot_date, granularity)
      `);
      
      await queryRunner.query(`
        CREATE INDEX idx_asset_allocation_snapshots_asset_symbol_date 
        ON asset_allocation_snapshots (asset_symbol, snapshot_date)
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Check if the table exists
    const tableExists = await queryRunner.hasTable('asset_allocation_snapshots');
    
    if (tableExists) {
      // Check if the column exists
      const columnExists = await queryRunner.hasColumn('asset_allocation_snapshots', 'asset_type');
      
      if (columnExists) {
        // Remove the asset_type column
        await queryRunner.query(`
          ALTER TABLE asset_allocation_snapshots 
          DROP COLUMN asset_type
        `);
      }
    }
  }
}
