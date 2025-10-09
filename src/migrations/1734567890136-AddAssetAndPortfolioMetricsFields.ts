import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAssetAndPortfolioMetricsFields1734567890136 implements MigrationInterface {
  name = 'AddAssetAndPortfolioMetricsFields1734567890136';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add Asset Performance Metrics (Assets Only)
    await queryRunner.query(`
      ALTER TABLE portfolio_snapshots
      ADD COLUMN asset_daily_return DECIMAL(8,4) NOT NULL DEFAULT 0,
      ADD COLUMN asset_weekly_return DECIMAL(8,4) NOT NULL DEFAULT 0,
      ADD COLUMN asset_monthly_return DECIMAL(8,4) NOT NULL DEFAULT 0,
      ADD COLUMN asset_ytd_return DECIMAL(8,4) NOT NULL DEFAULT 0;
    `);

    // Add Asset Risk Metrics (Assets Only)
    await queryRunner.query(`
      ALTER TABLE portfolio_snapshots
      ADD COLUMN asset_volatility DECIMAL(8,4) NOT NULL DEFAULT 0,
      ADD COLUMN asset_max_drawdown DECIMAL(8,4) NOT NULL DEFAULT 0;
    `);

    // Add Portfolio Performance Metrics (Assets + Deposits)
    await queryRunner.query(`
      ALTER TABLE portfolio_snapshots
      ADD COLUMN portfolio_daily_return DECIMAL(8,4) NOT NULL DEFAULT 0,
      ADD COLUMN portfolio_weekly_return DECIMAL(8,4) NOT NULL DEFAULT 0,
      ADD COLUMN portfolio_monthly_return DECIMAL(8,4) NOT NULL DEFAULT 0,
      ADD COLUMN portfolio_ytd_return DECIMAL(8,4) NOT NULL DEFAULT 0;
    `);

    // Add Portfolio Risk Metrics (Assets + Deposits)
    await queryRunner.query(`
      ALTER TABLE portfolio_snapshots
      ADD COLUMN portfolio_volatility DECIMAL(8,4) NOT NULL DEFAULT 0,
      ADD COLUMN portfolio_max_drawdown DECIMAL(8,4) NOT NULL DEFAULT 0;
    `);

    // Copy existing values to new asset fields (since current metrics are asset-only)
    await queryRunner.query(`
      UPDATE portfolio_snapshots
      SET
        asset_daily_return = daily_return,
        asset_weekly_return = weekly_return,
        asset_monthly_return = monthly_return,
        asset_ytd_return = ytd_return,
        asset_volatility = volatility,
        asset_max_drawdown = max_drawdown;
    `);

    // Initialize portfolio metrics with asset values (will be recalculated properly later)
    await queryRunner.query(`
      UPDATE portfolio_snapshots
      SET
        portfolio_daily_return = daily_return,
        portfolio_weekly_return = weekly_return,
        portfolio_monthly_return = monthly_return,
        portfolio_ytd_return = ytd_return,
        portfolio_volatility = volatility,
        portfolio_max_drawdown = max_drawdown;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop Asset Performance Metrics
    await queryRunner.query(`
      ALTER TABLE portfolio_snapshots
      DROP COLUMN asset_daily_return,
      DROP COLUMN asset_weekly_return,
      DROP COLUMN asset_monthly_return,
      DROP COLUMN asset_ytd_return;
    `);

    // Drop Asset Risk Metrics
    await queryRunner.query(`
      ALTER TABLE portfolio_snapshots
      DROP COLUMN asset_volatility,
      DROP COLUMN asset_max_drawdown;
    `);

    // Drop Portfolio Performance Metrics
    await queryRunner.query(`
      ALTER TABLE portfolio_snapshots
      DROP COLUMN portfolio_daily_return,
      DROP COLUMN portfolio_weekly_return,
      DROP COLUMN portfolio_monthly_return,
      DROP COLUMN portfolio_ytd_return;
    `);

    // Drop Portfolio Risk Metrics
    await queryRunner.query(`
      ALTER TABLE portfolio_snapshots
      DROP COLUMN portfolio_volatility,
      DROP COLUMN portfolio_max_drawdown;
    `);
  }
}
