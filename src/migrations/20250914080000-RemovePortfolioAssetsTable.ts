import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to remove portfolio_assets table.
 * Portfolio is now linked to Assets through Trades only.
 */
export class RemovePortfolioAssetsTable20250914080000 implements MigrationInterface {
  name = 'RemovePortfolioAssetsTable20250914080000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints first
    const table = await queryRunner.getTable('portfolio_assets');
    if (table) {
      const foreignKeys = table.foreignKeys;
      for (const foreignKey of foreignKeys) {
        await queryRunner.dropForeignKey('portfolio_assets', foreignKey);
      }
    }

    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_portfolio_assets_portfolio_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_portfolio_assets_asset_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_portfolio_assets_portfolio_asset"`);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "portfolio_assets"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate portfolio_assets table
    await queryRunner.query(`
      CREATE TABLE "portfolio_assets" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "portfolioId" uuid NOT NULL,
        "assetId" uuid NOT NULL,
        "quantity" numeric(15,4) NOT NULL DEFAULT 0,
        "avg_cost" numeric(15,2) NOT NULL DEFAULT 0,
        "market_value" numeric(15,2) NOT NULL DEFAULT 0,
        "unrealized_pl" numeric(15,2) NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_portfolio_assets_id" PRIMARY KEY ("id")
      )
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX "IDX_portfolio_assets_portfolio_id" ON "portfolio_assets" ("portfolioId")`);
    await queryRunner.query(`CREATE INDEX "IDX_portfolio_assets_asset_id" ON "portfolio_assets" ("assetId")`);
    await queryRunner.query(`CREATE INDEX "IDX_portfolio_assets_portfolio_asset" ON "portfolio_assets" ("portfolioId", "assetId")`);

    // Add foreign key constraints
    await queryRunner.query(`ALTER TABLE "portfolio_assets" ADD CONSTRAINT "FK_portfolio_assets_portfolio_id" FOREIGN KEY ("portfolioId") REFERENCES "portfolios"("portfolioId") ON DELETE CASCADE ON UPDATE CASCADE`);
    await queryRunner.query(`ALTER TABLE "portfolio_assets" ADD CONSTRAINT "FK_portfolio_assets_asset_id" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
  }
}
