import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDepositPnLFields20250922070000 implements MigrationInterface {
  name = 'AddDepositPnLFields20250922070000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add deposit P&L fields to portfolio_snapshots
    await queryRunner.query(`
      ALTER TABLE portfolio_snapshots 
      ADD COLUMN unrealized_deposit_pnl DECIMAL(20,8) DEFAULT 0,
      ADD COLUMN realized_deposit_pnl DECIMAL(20,8) DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove deposit P&L fields from portfolio_snapshots
    await queryRunner.query(`
      ALTER TABLE portfolio_snapshots 
      DROP COLUMN unrealized_deposit_pnl,
      DROP COLUMN realized_deposit_pnl
    `);
  }
}
