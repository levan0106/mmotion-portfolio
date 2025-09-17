import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAssetPriceHistoryTable1758085598428 implements MigrationInterface {
    name = 'CreateAssetPriceHistoryTable1758085598428'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Note: Assets table modifications were already handled in previous migrations
        await queryRunner.query(`CREATE TYPE "public"."asset_price_history_price_type_enum" AS ENUM('MANUAL', 'MARKET_DATA', 'EXTERNAL', 'CALCULATED')`);
        await queryRunner.query(`CREATE TYPE "public"."asset_price_history_price_source_enum" AS ENUM('USER', 'MARKET_DATA_SERVICE', 'EXTERNAL_API', 'CALCULATED')`);
        await queryRunner.query(`CREATE TABLE "asset_price_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "asset_id" uuid NOT NULL, "price" numeric(15,2) NOT NULL, "price_type" "public"."asset_price_history_price_type_enum" NOT NULL DEFAULT 'MANUAL', "price_source" "public"."asset_price_history_price_source_enum" NOT NULL DEFAULT 'USER', "change_reason" character varying(255), "metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "CHK_ASSET_PRICE_HISTORY_SOURCE_VALID" CHECK (price_source IN ('USER', 'MARKET_DATA_SERVICE', 'EXTERNAL_API', 'CALCULATED')), CONSTRAINT "CHK_ASSET_PRICE_HISTORY_TYPE_VALID" CHECK (price_type IN ('MANUAL', 'MARKET_DATA', 'EXTERNAL', 'CALCULATED')), CONSTRAINT "CHK_ASSET_PRICE_HISTORY_POSITIVE" CHECK (price > 0), CONSTRAINT "PK_26d98c4a4679bbe91a268302cd7" PRIMARY KEY ("id")); COMMENT ON COLUMN "asset_price_history"."created_at" IS 'Price history record creation timestamp'`);
        await queryRunner.query(`CREATE INDEX "IDX_ASSET_PRICE_HISTORY_PRICE_SOURCE" ON "asset_price_history" ("price_source") `);
        await queryRunner.query(`CREATE INDEX "IDX_ASSET_PRICE_HISTORY_PRICE_TYPE" ON "asset_price_history" ("price_type") `);
        await queryRunner.query(`CREATE INDEX "IDX_ASSET_PRICE_HISTORY_CREATED_AT" ON "asset_price_history" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_ASSET_PRICE_HISTORY_ASSET_ID" ON "asset_price_history" ("asset_id") `);
        // Note: Assets table modifications were already handled in previous migrations
        await queryRunner.query(`ALTER TABLE "asset_price_history" ADD CONSTRAINT "FK_e070cfd7bb86654c8c2d07a3337" FOREIGN KEY ("asset_id") REFERENCES "global_assets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop asset_price_history table and related indexes
        await queryRunner.query(`ALTER TABLE "asset_price_history" DROP CONSTRAINT "FK_e070cfd7bb86654c8c2d07a3337"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ASSET_PRICE_HISTORY_ASSET_ID"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ASSET_PRICE_HISTORY_CREATED_AT"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ASSET_PRICE_HISTORY_PRICE_TYPE"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ASSET_PRICE_HISTORY_PRICE_SOURCE"`);
        await queryRunner.query(`DROP TABLE "asset_price_history"`);
        await queryRunner.query(`DROP TYPE "public"."asset_price_history_price_source_enum"`);
        await queryRunner.query(`DROP TYPE "public"."asset_price_history_price_type_enum"`);
        // Note: Assets table modifications were already handled in previous migrations
    }

}
