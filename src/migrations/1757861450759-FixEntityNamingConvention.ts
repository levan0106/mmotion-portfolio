import { MigrationInterface, QueryRunner } from "typeorm";

export class FixEntityNamingConvention1757861450759 implements MigrationInterface {
    name = 'FixEntityNamingConvention1757861450759'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "trade_details" DROP CONSTRAINT "FK_11a235d81b4f4ed4624ecac703a"`);
        await queryRunner.query(`ALTER TABLE "trades" DROP CONSTRAINT "FK_5fd93524af719fe21ff3c579b4b"`);
        await queryRunner.query(`ALTER TABLE "trades" DROP CONSTRAINT "FK_59e03129c502f9b0e32a9b9f3b8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e111dca732e710c55205e9422c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ASSET_CREATED_BY"`);
        await queryRunner.query(`ALTER TABLE "portfolios" RENAME COLUMN "portfolioId" TO "portfolio_id"`);
        await queryRunner.query(`ALTER TABLE "portfolios" RENAME CONSTRAINT "PK_05d03f0c3410108f2c3d5cd9fdf" TO "PK_9303b853b1d0672da696dc70a10"`);
        await queryRunner.query(`ALTER TABLE "cash_flows" DROP CONSTRAINT "PK_6ff8b45512a7d3d435439c7aff1"`);
        await queryRunner.query(`ALTER TABLE "cash_flows" DROP COLUMN "cashflow_id"`);
        await queryRunner.query(`ALTER TABLE "cash_flows" DROP COLUMN "flow_date"`);
        await queryRunner.query(`ALTER TABLE "cash_flows" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "createdBy"`);
        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "updatedBy"`);
        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "cash_flows" ADD "cashflowId" uuid NOT NULL DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "cash_flows" ADD CONSTRAINT "PK_db0c703ef02751841e1f7d55eb8" PRIMARY KEY ("cashflowId")`);
        await queryRunner.query(`ALTER TABLE "cash_flows" ADD "flowDate" TIMESTAMP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "cash_flows" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "assets" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "assets" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "assets" ADD "created_by" uuid`);
        await queryRunner.query(`ALTER TABLE "assets" ADD "updated_by" uuid`);
        // Update existing records with default values
        await queryRunner.query(`UPDATE "assets" SET "created_by" = '00000000-0000-0000-0000-000000000000' WHERE "created_by" IS NULL`);
        await queryRunner.query(`UPDATE "assets" SET "updated_by" = '00000000-0000-0000-0000-000000000000' WHERE "updated_by" IS NULL`);
        // Now make them NOT NULL
        await queryRunner.query(`ALTER TABLE "assets" ALTER COLUMN "created_by" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "assets" ALTER COLUMN "updated_by" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "trade_details" ADD "asset_id" uuid`);
        await queryRunner.query(`ALTER TABLE "trades" ADD "portfolio_id" uuid`);
        await queryRunner.query(`ALTER TABLE "trades" ADD "asset_id" uuid`);
        await queryRunner.query(`CREATE INDEX "IDX_231231001c80e264a3cfc2876d" ON "cash_flows" ("flowDate") `);
        await queryRunner.query(`CREATE INDEX "IDX_ASSET_CREATED_BY" ON "assets" ("created_by") `);
        await queryRunner.query(`ALTER TABLE "trade_details" ADD CONSTRAINT "FK_9ee6b8fecc23ad130ba7efebd07" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "trades" ADD CONSTRAINT "FK_2a46262bf5530d16b2722935d15" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("portfolio_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "trades" ADD CONSTRAINT "FK_1628a75c483742377ebcf53f539" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "trades" DROP CONSTRAINT "FK_1628a75c483742377ebcf53f539"`);
        await queryRunner.query(`ALTER TABLE "trades" DROP CONSTRAINT "FK_2a46262bf5530d16b2722935d15"`);
        await queryRunner.query(`ALTER TABLE "trade_details" DROP CONSTRAINT "FK_9ee6b8fecc23ad130ba7efebd07"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ASSET_CREATED_BY"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_231231001c80e264a3cfc2876d"`);
        await queryRunner.query(`ALTER TABLE "trades" DROP COLUMN "asset_id"`);
        await queryRunner.query(`ALTER TABLE "trades" DROP COLUMN "portfolio_id"`);
        await queryRunner.query(`ALTER TABLE "trade_details" DROP COLUMN "asset_id"`);
        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "updated_by"`);
        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "created_by"`);
        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "cash_flows" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "cash_flows" DROP COLUMN "flowDate"`);
        await queryRunner.query(`ALTER TABLE "cash_flows" DROP CONSTRAINT "PK_db0c703ef02751841e1f7d55eb8"`);
        await queryRunner.query(`ALTER TABLE "cash_flows" DROP COLUMN "cashflowId"`);
        await queryRunner.query(`ALTER TABLE "assets" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "assets" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "assets" ADD "updatedBy" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "assets" ADD "createdBy" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "cash_flows" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "cash_flows" ADD "flow_date" TIMESTAMP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "cash_flows" ADD "cashflow_id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "cash_flows" ADD CONSTRAINT "PK_6ff8b45512a7d3d435439c7aff1" PRIMARY KEY ("cashflow_id")`);
        await queryRunner.query(`ALTER TABLE "portfolios" RENAME CONSTRAINT "PK_9303b853b1d0672da696dc70a10" TO "PK_05d03f0c3410108f2c3d5cd9fdf"`);
        await queryRunner.query(`ALTER TABLE "portfolios" RENAME COLUMN "portfolio_id" TO "portfolioId"`);
        await queryRunner.query(`CREATE INDEX "IDX_ASSET_CREATED_BY" ON "assets" ("createdBy") `);
        await queryRunner.query(`CREATE INDEX "IDX_e111dca732e710c55205e9422c" ON "cash_flows" ("flow_date") `);
        await queryRunner.query(`ALTER TABLE "trades" ADD CONSTRAINT "FK_59e03129c502f9b0e32a9b9f3b8" FOREIGN KEY ("portfolioId") REFERENCES "portfolios"("portfolioId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "trades" ADD CONSTRAINT "FK_5fd93524af719fe21ff3c579b4b" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "trade_details" ADD CONSTRAINT "FK_11a235d81b4f4ed4624ecac703a" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
