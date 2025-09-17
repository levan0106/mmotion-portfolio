import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateGlobalAssetsTable1758083477719 implements MigrationInterface {
    name = 'CreateGlobalAssetsTable1758083477719'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Note: IDX_ASSET_CODE and IDX_ASSET_NAME were already dropped in previous migrations
        await queryRunner.query(`CREATE TYPE "public"."global_assets_type_enum" AS ENUM('STOCK', 'BOND', 'GOLD', 'COMMODITY', 'DEPOSIT', 'CASH')`);
        await queryRunner.query(`CREATE TABLE "global_assets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "symbol" character varying(50) NOT NULL, "name" character varying(255) NOT NULL, "type" "public"."global_assets_type_enum" NOT NULL DEFAULT 'STOCK', "nation" character varying(2) NOT NULL, "market_code" character varying(20) NOT NULL, "currency" character varying(3) NOT NULL, "timezone" character varying(50) NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "description" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_GLOBAL_ASSET_SYMBOL_NATION" UNIQUE ("symbol", "nation"), CONSTRAINT "CHK_GLOBAL_ASSET_TIMEZONE_FORMAT" CHECK (timezone ~ '^[A-Za-z_/]+$'), CONSTRAINT "CHK_GLOBAL_ASSET_CURRENCY_FORMAT" CHECK (currency ~ '^[A-Z]{3}$'), CONSTRAINT "CHK_GLOBAL_ASSET_MARKET_CODE_FORMAT" CHECK (market_code ~ '^[A-Z0-9-]+$'), CONSTRAINT "CHK_GLOBAL_ASSET_NATION_FORMAT" CHECK (nation ~ '^[A-Z]{2}$'), CONSTRAINT "CHK_GLOBAL_ASSET_SYMBOL_FORMAT" CHECK (symbol ~ '^[A-Z0-9-]+$'), CONSTRAINT "PK_88f08f8eb972f5ef716eb2cd4f3" PRIMARY KEY ("id")); COMMENT ON COLUMN "global_assets"."symbol" IS 'Asset symbol for trading - uppercase alphanumeric with dashes'; COMMENT ON COLUMN "global_assets"."name" IS 'Asset name'; COMMENT ON COLUMN "global_assets"."type" IS 'Asset type'; COMMENT ON COLUMN "global_assets"."nation" IS 'Nation code - 2-letter ISO country code'; COMMENT ON COLUMN "global_assets"."market_code" IS 'Market code where asset is traded'; COMMENT ON COLUMN "global_assets"."currency" IS 'Currency code - 3-letter ISO currency code'; COMMENT ON COLUMN "global_assets"."timezone" IS 'Timezone for asset market'; COMMENT ON COLUMN "global_assets"."is_active" IS 'Asset active status'; COMMENT ON COLUMN "global_assets"."description" IS 'Asset description'; COMMENT ON COLUMN "global_assets"."created_at" IS 'Asset creation timestamp'; COMMENT ON COLUMN "global_assets"."updated_at" IS 'Asset last update timestamp'`);
        await queryRunner.query(`CREATE INDEX "IDX_GLOBAL_ASSET_SYMBOL_NATION" ON "global_assets" ("symbol", "nation") `);
        await queryRunner.query(`CREATE INDEX "IDX_GLOBAL_ASSET_ACTIVE" ON "global_assets" ("is_active") `);
        await queryRunner.query(`CREATE INDEX "IDX_GLOBAL_ASSET_TYPE" ON "global_assets" ("type") `);
        await queryRunner.query(`CREATE INDEX "IDX_GLOBAL_ASSET_NATION" ON "global_assets" ("nation") `);
        await queryRunner.query(`CREATE INDEX "IDX_GLOBAL_ASSET_SYMBOL" ON "global_assets" ("symbol") `);
        // Note: Assets table modifications were already handled in previous migrations
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop global_assets table and related indexes
        await queryRunner.query(`DROP INDEX "public"."IDX_GLOBAL_ASSET_SYMBOL"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_GLOBAL_ASSET_NATION"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_GLOBAL_ASSET_TYPE"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_GLOBAL_ASSET_ACTIVE"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_GLOBAL_ASSET_SYMBOL_NATION"`);
        await queryRunner.query(`DROP TABLE "global_assets"`);
        await queryRunner.query(`DROP TYPE "public"."global_assets_type_enum"`);
    }

}
