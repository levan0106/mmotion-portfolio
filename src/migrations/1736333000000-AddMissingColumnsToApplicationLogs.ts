import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingColumnsToApplicationLogs1736333000000 implements MigrationInterface {
  name = 'AddMissingColumnsToApplicationLogs1736333000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if portfolioId column exists before adding it
    const portfolioIdExists = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'application_logs' AND column_name = 'portfolioId'
    `);

    if (portfolioIdExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "application_logs" 
        ADD COLUMN "portfolioId" uuid
      `);
    }

    // Check if trade_id column exists before adding it
    const tradeIdExists = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'application_logs' AND column_name = 'trade_id'
    `);

    if (tradeIdExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "application_logs" 
        ADD COLUMN "trade_id" uuid
      `);
    }

    // Add foreign key constraint for portfolioId if it doesn't exist
    const portfolioFkExists = await queryRunner.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'application_logs' AND constraint_name = 'FK_application_logs_portfolioId'
    `);

    if (portfolioFkExists.length === 0 && portfolioIdExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "application_logs" 
        ADD CONSTRAINT "FK_application_logs_portfolio_id" 
        FOREIGN KEY ("portfolioId") 
        REFERENCES "portfolios"("id") 
        ON DELETE SET NULL ON UPDATE CASCADE
      `);
    }

    // Add foreign key constraint for trade_id if it doesn't exist
    const tradeFkExists = await queryRunner.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'application_logs' AND constraint_name = 'FK_application_logs_trade_id'
    `);

    if (tradeFkExists.length === 0 && tradeIdExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "application_logs" 
        ADD CONSTRAINT "FK_application_logs_trade_id" 
        FOREIGN KEY ("trade_id") 
        REFERENCES "trades"("id") 
        ON DELETE SET NULL ON UPDATE CASCADE
      `);
    }

    // Add indexes for the new foreign key columns if they don't exist
    const portfolioIndexExists = await queryRunner.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'application_logs' AND indexname = 'idx_app_logs_portfolioId'
    `);

    if (portfolioIndexExists.length === 0 && portfolioIdExists.length === 0) {
      await queryRunner.query(`
        CREATE INDEX "idx_app_logs_portfolio_id" ON "application_logs" ("portfolioId")
      `);
    }

    const tradeIndexExists = await queryRunner.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'application_logs' AND indexname = 'idx_app_logs_trade_id'
    `);

    if (tradeIndexExists.length === 0 && tradeIdExists.length === 0) {
      await queryRunner.query(`
        CREATE INDEX "idx_app_logs_trade_id" ON "application_logs" ("trade_id")
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "idx_app_logs_trade_id"`);
    await queryRunner.query(`DROP INDEX "idx_app_logs_portfolio_id"`);

    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "application_logs" DROP CONSTRAINT "FK_application_logs_trade_id"`);
    await queryRunner.query(`ALTER TABLE "application_logs" DROP CONSTRAINT "FK_application_logs_portfolio_id"`);

    // Drop columns
    await queryRunner.query(`ALTER TABLE "application_logs" DROP COLUMN "trade_id"`);
    await queryRunner.query(`ALTER TABLE "application_logs" DROP COLUMN "portfolioId"`);
  }
}
