import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDepositPnLFields1734567890133 implements MigrationInterface {
  name = 'AddDepositPnLFields1734567890133';

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
