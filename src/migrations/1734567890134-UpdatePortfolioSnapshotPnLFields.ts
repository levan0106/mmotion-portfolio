import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdatePortfolioSnapshotPnLFields1734567890134 implements MigrationInterface {
  name = 'UpdatePortfolioSnapshotPnLFields1734567890134';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if columns exist before renaming
    const table = await queryRunner.getTable('portfolio_snapshots');
    if (!table) {
      throw new Error('portfolio_snapshots table does not exist');
    }

    // Rename existing columns to asset-specific names (only if they exist)
    if (table.columns.find(col => col.name === 'total_pl')) {
      await queryRunner.query(`
        ALTER TABLE portfolio_snapshots
        RENAME COLUMN total_pl TO total_asset_pl;
      `);
    }

    if (table.columns.find(col => col.name === 'unrealized_pl')) {
      await queryRunner.query(`
        ALTER TABLE portfolio_snapshots
        RENAME COLUMN unrealized_pl TO unrealized_asset_pl;
      `);
    }

    if (table.columns.find(col => col.name === 'realized_pl')) {
      await queryRunner.query(`
        ALTER TABLE portfolio_snapshots
        RENAME COLUMN realized_pl TO realized_asset_pl;
      `);
    }

    // Add new portfolio P&L columns (Assets + Deposits)
    await queryRunner.query(`
      ALTER TABLE portfolio_snapshots
      ADD COLUMN total_portfolio_pl DECIMAL(20,8) NOT NULL DEFAULT 0,
      ADD COLUMN unrealized_portfolio_pl DECIMAL(20,8) NOT NULL DEFAULT 0,
      ADD COLUMN realized_portfolio_pl DECIMAL(20,8) NOT NULL DEFAULT 0;
    `);

    // Update existing records to calculate portfolio P&L
    await queryRunner.query(`
      UPDATE portfolio_snapshots 
      SET 
        total_portfolio_pl = total_asset_pl + total_deposit_interest,
        unrealized_portfolio_pl = unrealized_asset_pl + unrealized_deposit_pnl,
        realized_portfolio_pl = realized_asset_pl + realized_deposit_pnl;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop new portfolio P&L columns
    await queryRunner.query(`
      ALTER TABLE portfolio_snapshots
      DROP COLUMN total_portfolio_pl,
      DROP COLUMN unrealized_portfolio_pl,
      DROP COLUMN realized_portfolio_pl;
    `);

    // Rename columns back to original names
    await queryRunner.query(`
      ALTER TABLE portfolio_snapshots
      RENAME COLUMN total_asset_pl TO total_pl;
    `);

    await queryRunner.query(`
      ALTER TABLE portfolio_snapshots
      RENAME COLUMN unrealized_asset_pl TO unrealized_pl;
    `);

    await queryRunner.query(`
      ALTER TABLE portfolio_snapshots
      RENAME COLUMN realized_asset_pl TO realized_pl;
    `);
  }
}
