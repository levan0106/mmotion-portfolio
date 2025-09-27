import { MigrationInterface, QueryRunner } from "typeorm";

export class FinalPriceEnumUpdate1758958088489 implements MigrationInterface {
    name = 'FinalPriceEnumUpdate1758958088489'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Step 1: Drop all constraints
        await queryRunner.query(`ALTER TABLE "asset_prices" DROP CONSTRAINT IF EXISTS "CHK_ASSET_PRICE_TYPE_VALID"`);
        await queryRunner.query(`ALTER TABLE "asset_prices" DROP CONSTRAINT IF EXISTS "CHK_ASSET_PRICE_SOURCE_VALID"`);
        await queryRunner.query(`ALTER TABLE "asset_price_history" DROP CONSTRAINT IF EXISTS "CHK_ASSET_PRICE_HISTORY_TYPE_VALID"`);
        await queryRunner.query(`ALTER TABLE "asset_price_history" DROP CONSTRAINT IF EXISTS "CHK_ASSET_PRICE_HISTORY_SOURCE_VALID"`);

        // Step 2: Update data
        await queryRunner.query(`UPDATE "asset_prices" SET "price_type" = 'EXTERNAL' WHERE "price_type" = 'MARKET_DATA'`);
        await queryRunner.query(`UPDATE "asset_prices" SET "price_type" = 'EXTERNAL' WHERE "price_type" = 'CALCULATED'`);
        await queryRunner.query(`UPDATE "asset_prices" SET "price_source" = 'USER_INPUT' WHERE "price_source" = 'USER'`);
        await queryRunner.query(`UPDATE "asset_prices" SET "price_source" = 'EXTERNAL_API' WHERE "price_source" = 'MARKET_DATA_SERVICE'`);
        await queryRunner.query(`UPDATE "asset_prices" SET "price_source" = 'EXTERNAL_API' WHERE "price_source" = 'CALCULATED'`);

        await queryRunner.query(`UPDATE "asset_price_history" SET "price_type" = 'EXTERNAL' WHERE "price_type" = 'MARKET_DATA'`);
        await queryRunner.query(`UPDATE "asset_price_history" SET "price_type" = 'EXTERNAL' WHERE "price_type" = 'CALCULATED'`);
        await queryRunner.query(`UPDATE "asset_price_history" SET "price_source" = 'USER_INPUT' WHERE "price_source" = 'USER'`);
        await queryRunner.query(`UPDATE "asset_price_history" SET "price_source" = 'EXTERNAL_API' WHERE "price_source" = 'MARKET_DATA_SERVICE'`);
        await queryRunner.query(`UPDATE "asset_price_history" SET "price_source" = 'EXTERNAL_API' WHERE "price_source" = 'CALCULATED'`);

        // Step 3: Add new constraints
        await queryRunner.query(`ALTER TABLE "asset_prices" ADD CONSTRAINT "CHK_ASSET_PRICE_TYPE_VALID" CHECK (price_type IN ('MANUAL', 'EXTERNAL'))`);
        await queryRunner.query(`ALTER TABLE "asset_prices" ADD CONSTRAINT "CHK_ASSET_PRICE_SOURCE_VALID" CHECK (price_source IN ('USER_INPUT', 'EXTERNAL_API'))`);
        await queryRunner.query(`ALTER TABLE "asset_price_history" ADD CONSTRAINT "CHK_ASSET_PRICE_HISTORY_TYPE_VALID" CHECK (price_type IN ('MANUAL', 'EXTERNAL'))`);
        await queryRunner.query(`ALTER TABLE "asset_price_history" ADD CONSTRAINT "CHK_ASSET_PRICE_HISTORY_SOURCE_VALID" CHECK (price_source IN ('USER_INPUT', 'EXTERNAL_API'))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop new constraints
        await queryRunner.query(`ALTER TABLE "asset_prices" DROP CONSTRAINT IF EXISTS "CHK_ASSET_PRICE_TYPE_VALID"`);
        await queryRunner.query(`ALTER TABLE "asset_prices" DROP CONSTRAINT IF EXISTS "CHK_ASSET_PRICE_SOURCE_VALID"`);
        await queryRunner.query(`ALTER TABLE "asset_price_history" DROP CONSTRAINT IF EXISTS "CHK_ASSET_PRICE_HISTORY_TYPE_VALID"`);
        await queryRunner.query(`ALTER TABLE "asset_price_history" DROP CONSTRAINT IF EXISTS "CHK_ASSET_PRICE_HISTORY_SOURCE_VALID"`);

        // Revert data changes
        await queryRunner.query(`UPDATE "asset_prices" SET "price_type" = 'MARKET_DATA' WHERE "price_type" = 'EXTERNAL' AND "price_source" = 'EXTERNAL_API'`);
        await queryRunner.query(`UPDATE "asset_prices" SET "price_source" = 'MARKET_DATA_SERVICE' WHERE "price_source" = 'EXTERNAL_API'`);
        await queryRunner.query(`UPDATE "asset_prices" SET "price_source" = 'USER' WHERE "price_source" = 'USER_INPUT'`);

        await queryRunner.query(`UPDATE "asset_price_history" SET "price_type" = 'MARKET_DATA' WHERE "price_type" = 'EXTERNAL' AND "price_source" = 'EXTERNAL_API'`);
        await queryRunner.query(`UPDATE "asset_price_history" SET "price_source" = 'MARKET_DATA_SERVICE' WHERE "price_source" = 'EXTERNAL_API'`);
        await queryRunner.query(`UPDATE "asset_price_history" SET "price_source" = 'USER' WHERE "price_source" = 'USER_INPUT'`);

        // Restore old constraints
        await queryRunner.query(`ALTER TABLE "asset_prices" ADD CONSTRAINT "CHK_ASSET_PRICE_TYPE_VALID" CHECK (price_type IN ('MANUAL', 'MARKET_DATA', 'EXTERNAL', 'CALCULATED'))`);
        await queryRunner.query(`ALTER TABLE "asset_prices" ADD CONSTRAINT "CHK_ASSET_PRICE_SOURCE_VALID" CHECK (price_source IN ('USER', 'MARKET_DATA_SERVICE', 'EXTERNAL_API', 'CALCULATED'))`);
        await queryRunner.query(`ALTER TABLE "asset_price_history" ADD CONSTRAINT "CHK_ASSET_PRICE_HISTORY_TYPE_VALID" CHECK (price_type IN ('MANUAL', 'MARKET_DATA', 'EXTERNAL', 'CALCULATED'))`);
        await queryRunner.query(`ALTER TABLE "asset_price_history" ADD CONSTRAINT "CHK_ASSET_PRICE_HISTORY_SOURCE_VALID" CHECK (price_source IN ('USER', 'MARKET_DATA_SERVICE', 'EXTERNAL_API', 'CALCULATED'))`);
    }
}
