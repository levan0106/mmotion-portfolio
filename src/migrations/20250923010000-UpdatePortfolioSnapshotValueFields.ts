import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdatePortfolioSnapshotValueFields20250923010000 implements MigrationInterface {
  name = 'UpdatePortfolioSnapshotValueFields20250923010000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Rename existing value columns to asset-specific value
    await queryRunner.query(`
      ALTER TABLE portfolio_snapshots
      RENAME COLUMN total_value TO total_asset_value;
    `);
    await queryRunner.query(`
      ALTER TABLE portfolio_snapshots
      RENAME COLUMN invested_value TO total_asset_invested;
    `);

    // Add new columns for combined portfolio value (Assets + Deposits)
    await queryRunner.query(`
      ALTER TABLE portfolio_snapshots
      ADD COLUMN total_portfolio_value DECIMAL(20,8) NOT NULL DEFAULT 0,
      ADD COLUMN total_portfolio_invested DECIMAL(20,8) NOT NULL DEFAULT 0;
    `);

    // Update new columns with combined values from existing asset and deposit data
    await queryRunner.query(`
      UPDATE portfolio_snapshots
      SET
        total_portfolio_value = total_asset_value + total_deposit_value,
        total_portfolio_invested = total_asset_invested + total_deposit_principal;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert column renames
    await queryRunner.query(`
      ALTER TABLE portfolio_snapshots
      RENAME COLUMN total_asset_value TO total_value;
    `);
    await queryRunner.query(`
      ALTER TABLE portfolio_snapshots
      RENAME COLUMN total_asset_invested TO invested_value;
    `);

    // Drop new columns
    await queryRunner.query(`
      ALTER TABLE portfolio_snapshots
      DROP COLUMN total_portfolio_value,
      DROP COLUMN total_portfolio_invested;
    `);
  }
}
