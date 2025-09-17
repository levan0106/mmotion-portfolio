import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAssetPricesTable1758083645545 implements MigrationInterface {
    name = 'CreateAssetPricesTable1758083645545'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Note: Assets table indexes were already handled in previous migrations
        await queryRunner.query(`CREATE TYPE "public"."asset_prices_price_type_enum" AS ENUM('MANUAL', 'MARKET_DATA', 'EXTERNAL', 'CALCULATED')`);
        await queryRunner.query(`CREATE TYPE "public"."asset_prices_price_source_enum" AS ENUM('USER', 'MARKET_DATA_SERVICE', 'EXTERNAL_API', 'CALCULATED')`);
        await queryRunner.query(`CREATE TABLE "asset_prices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "asset_id" uuid NOT NULL, "current_price" numeric(15,2) NOT NULL, "price_type" "public"."asset_prices_price_type_enum" NOT NULL DEFAULT 'MANUAL', "price_source" "public"."asset_prices_price_source_enum" NOT NULL DEFAULT 'USER', "last_price_update" TIMESTAMP NOT NULL, "metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_ASSET_PRICE_ASSET_ID" UNIQUE ("asset_id"), CONSTRAINT "REL_5fa729bf053c3810d2a0bbad00" UNIQUE ("asset_id"), CONSTRAINT "CHK_ASSET_PRICE_SOURCE_VALID" CHECK (price_source IN ('USER', 'MARKET_DATA_SERVICE', 'EXTERNAL_API', 'CALCULATED')), CONSTRAINT "CHK_ASSET_PRICE_TYPE_VALID" CHECK (price_type IN ('MANUAL', 'MARKET_DATA', 'EXTERNAL', 'CALCULATED')), CONSTRAINT "CHK_ASSET_PRICE_POSITIVE" CHECK (current_price > 0), CONSTRAINT "PK_86982518bff41e3f51974a444cd" PRIMARY KEY ("id")); COMMENT ON COLUMN "asset_prices"."asset_id" IS 'Foreign key to global_assets table'; COMMENT ON COLUMN "asset_prices"."current_price" IS 'Current price of the asset'; COMMENT ON COLUMN "asset_prices"."price_type" IS 'Type of the price'; COMMENT ON COLUMN "asset_prices"."price_source" IS 'Source of the price'; COMMENT ON COLUMN "asset_prices"."last_price_update" IS 'Timestamp when price was last updated'; COMMENT ON COLUMN "asset_prices"."metadata" IS 'Optional metadata about the price'; COMMENT ON COLUMN "asset_prices"."created_at" IS 'Price record creation timestamp'; COMMENT ON COLUMN "asset_prices"."updated_at" IS 'Price record last update timestamp'`);
        await queryRunner.query(`CREATE INDEX "IDX_ASSET_PRICE_UPDATE" ON "asset_prices" ("last_price_update") `);
        await queryRunner.query(`CREATE INDEX "IDX_ASSET_PRICE_SOURCE" ON "asset_prices" ("price_source") `);
        await queryRunner.query(`CREATE INDEX "IDX_ASSET_PRICE_TYPE" ON "asset_prices" ("price_type") `);
        await queryRunner.query(`CREATE INDEX "IDX_ASSET_PRICE_ASSET_ID" ON "asset_prices" ("asset_id") `);
        // Note: Assets table modifications were already handled in previous migrations
        await queryRunner.query(`ALTER TABLE "asset_prices" ADD CONSTRAINT "FK_5fa729bf053c3810d2a0bbad00d" FOREIGN KEY ("asset_id") REFERENCES "global_assets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop asset_prices table and related indexes
        await queryRunner.query(`ALTER TABLE "asset_prices" DROP CONSTRAINT "FK_5fa729bf053c3810d2a0bbad00d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ASSET_PRICE_ASSET_ID"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ASSET_PRICE_TYPE"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ASSET_PRICE_SOURCE"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ASSET_PRICE_UPDATE"`);
        await queryRunner.query(`DROP TABLE "asset_prices"`);
        await queryRunner.query(`DROP TYPE "public"."asset_prices_price_source_enum"`);
        await queryRunner.query(`DROP TYPE "public"."asset_prices_price_type_enum"`);
    }

}
