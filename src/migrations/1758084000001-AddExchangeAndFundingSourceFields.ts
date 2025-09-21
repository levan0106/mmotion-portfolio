import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExchangeAndFundingSourceFields1758084000001 implements MigrationInterface {
  name = 'AddExchangeAndFundingSourceFields1758084000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add exchange and funding_source fields to trades table
    await queryRunner.query(`
      ALTER TABLE "trades" 
      ADD COLUMN "exchange" varchar(100) NULL,
      ADD COLUMN "funding_source" varchar(100) NULL
    `);

    // Add funding_source field to cash_flows table
    await queryRunner.query(`
      ALTER TABLE "cash_flows" 
      ADD COLUMN "funding_source" varchar(100) NULL
    `);

    // Add indexes for better performance
    await queryRunner.query(`
      CREATE INDEX "IDX_trades_exchange" ON "trades" ("exchange")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_trades_funding_source" ON "trades" ("funding_source")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_cash_flows_funding_source" ON "cash_flows" ("funding_source")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_cash_flows_funding_source"`);
    await queryRunner.query(`DROP INDEX "IDX_trades_funding_source"`);
    await queryRunner.query(`DROP INDEX "IDX_trades_exchange"`);

    // Drop columns
    await queryRunner.query(`
      ALTER TABLE "cash_flows" 
      DROP COLUMN "funding_source"
    `);

    await queryRunner.query(`
      ALTER TABLE "trades" 
      DROP COLUMN "funding_source",
      DROP COLUMN "exchange"
    `);
  }
}
