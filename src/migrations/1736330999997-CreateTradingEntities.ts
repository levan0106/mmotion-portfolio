import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTradingEntities1736330999997 implements MigrationInterface {
  name = 'CreateTradingEntities1736330999997';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create trades table
    await queryRunner.query(`
      CREATE TABLE "trades" (
        "trade_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "portfolioId" uuid NOT NULL,
        "assetId" uuid NOT NULL,
        "trade_date" TIMESTAMP NOT NULL,
        "side" character varying NOT NULL,
        "quantity" numeric(18,8) NOT NULL,
        "price" numeric(18,8) NOT NULL,
        "fee" numeric(18,8) NOT NULL DEFAULT '0',
        "tax" numeric(18,8) NOT NULL DEFAULT '0',
        "trade_type" character varying NOT NULL DEFAULT 'NORMAL',
        "source" character varying(100),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_trades" PRIMARY KEY ("trade_id")
      )
    `);

    // Create trade_details table
    await queryRunner.query(`
      CREATE TABLE "trade_details" (
        "detail_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "sell_trade_id" uuid NOT NULL,
        "buy_trade_id" uuid NOT NULL,
        "assetId" uuid NOT NULL,
        "matched_qty" numeric(18,8) NOT NULL,
        "buy_price" numeric(18,8) NOT NULL,
        "sell_price" numeric(18,8) NOT NULL,
        "fee_tax" numeric(18,8) NOT NULL DEFAULT '0',
        "pnl" numeric(18,8) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_trade_details" PRIMARY KEY ("detail_id")
      )
    `);

    // Create asset_targets table
    await queryRunner.query(`
      CREATE TABLE "asset_targets" (
        "assetId" uuid NOT NULL,
        "stop_loss" numeric(18,8),
        "take_profit" numeric(18,8),
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_asset_targets" PRIMARY KEY ("assetId")
      )
    `);

    // Create indexes for trades table
    await queryRunner.query(`CREATE INDEX "IDX_trades_portfolio_id" ON "trades" ("portfolioId")`);
    await queryRunner.query(`CREATE INDEX "IDX_trades_asset_id" ON "trades" ("assetId")`);
    await queryRunner.query(`CREATE INDEX "IDX_trades_trade_date" ON "trades" ("trade_date")`);
    await queryRunner.query(`CREATE INDEX "IDX_trades_side" ON "trades" ("side")`);

    // Create indexes for trade_details table
    await queryRunner.query(`CREATE INDEX "IDX_trade_details_sell_trade_id" ON "trade_details" ("sell_trade_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_trade_details_buy_trade_id" ON "trade_details" ("buy_trade_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_trade_details_asset_id" ON "trade_details" ("assetId")`);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "trades" 
      ADD CONSTRAINT "FK_trades_portfolio_id" 
      FOREIGN KEY ("portfolioId") REFERENCES "portfolios"("portfolioId") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "trades" 
      ADD CONSTRAINT "FK_trades_asset_id" 
      FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "trade_details" 
      ADD CONSTRAINT "FK_trade_details_sell_trade_id" 
      FOREIGN KEY ("sell_trade_id") REFERENCES "trades"("trade_id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "trade_details" 
      ADD CONSTRAINT "FK_trade_details_buy_trade_id" 
      FOREIGN KEY ("buy_trade_id") REFERENCES "trades"("trade_id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "trade_details" 
      ADD CONSTRAINT "FK_trade_details_asset_id" 
      FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "asset_targets" 
      ADD CONSTRAINT "FK_asset_targets_asset_id" 
      FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "asset_targets" DROP CONSTRAINT "FK_asset_targets_asset_id"`);
    await queryRunner.query(`ALTER TABLE "trade_details" DROP CONSTRAINT "FK_trade_details_asset_id"`);
    await queryRunner.query(`ALTER TABLE "trade_details" DROP CONSTRAINT "FK_trade_details_buy_trade_id"`);
    await queryRunner.query(`ALTER TABLE "trade_details" DROP CONSTRAINT "FK_trade_details_sell_trade_id"`);
    await queryRunner.query(`ALTER TABLE "trades" DROP CONSTRAINT "FK_trades_asset_id"`);
    await queryRunner.query(`ALTER TABLE "trades" DROP CONSTRAINT "FK_trades_portfolio_id"`);

    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_trade_details_asset_id"`);
    await queryRunner.query(`DROP INDEX "IDX_trade_details_buy_trade_id"`);
    await queryRunner.query(`DROP INDEX "IDX_trade_details_sell_trade_id"`);
    await queryRunner.query(`DROP INDEX "IDX_trades_side"`);
    await queryRunner.query(`DROP INDEX "IDX_trades_trade_date"`);
    await queryRunner.query(`DROP INDEX "IDX_trades_asset_id"`);
    await queryRunner.query(`DROP INDEX "IDX_trades_portfolio_id"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "asset_targets"`);
    await queryRunner.query(`DROP TABLE "trade_details"`);
    await queryRunner.query(`DROP TABLE "trades"`);
  }
}
