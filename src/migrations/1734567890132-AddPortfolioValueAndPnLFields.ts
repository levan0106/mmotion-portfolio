import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPortfolioValueAndPnLFields1734567890132 implements MigrationInterface {
  name = 'AddPortfolioValueAndPnLFields1734567890132';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new value fields
    await queryRunner.query(`
      ALTER TABLE portfolios 
      ADD COLUMN total_asset_value DECIMAL(15,2) DEFAULT 0,
      ADD COLUMN total_invest_value DECIMAL(15,2) DEFAULT 0,
      ADD COLUMN total_all_value DECIMAL(15,2) DEFAULT 0
    `);

    // Add new realized P&L fields
    await queryRunner.query(`
      ALTER TABLE portfolios 
      ADD COLUMN realized_asset_pnl DECIMAL(15,2) DEFAULT 0,
      ADD COLUMN realized_invest_pnl DECIMAL(15,2) DEFAULT 0,
      ADD COLUMN realized_all_pnl DECIMAL(15,2) DEFAULT 0
    `);

    // Add new unrealized P&L fields
    await queryRunner.query(`
      ALTER TABLE portfolios 
      ADD COLUMN unrealized_asset_pnl DECIMAL(15,2) DEFAULT 0,
      ADD COLUMN unrealized_invest_pnl DECIMAL(15,2) DEFAULT 0,
      ADD COLUMN unrealized_all_pnl DECIMAL(15,2) DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove new value fields
    await queryRunner.query(`
      ALTER TABLE portfolios 
      DROP COLUMN total_asset_value,
      DROP COLUMN total_invest_value,
      DROP COLUMN total_all_value
    `);

    // Remove new realized P&L fields
    await queryRunner.query(`
      ALTER TABLE portfolios 
      DROP COLUMN realized_asset_pnl,
      DROP COLUMN realized_invest_pnl,
      DROP COLUMN realized_all_pnl
    `);

    // Remove new unrealized P&L fields
    await queryRunner.query(`
      ALTER TABLE portfolios 
      DROP COLUMN unrealized_asset_pnl,
      DROP COLUMN unrealized_invest_pnl,
      DROP COLUMN unrealized_all_pnl
    `);
  }
}
