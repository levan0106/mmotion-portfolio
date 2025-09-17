import { MigrationInterface, QueryRunner } from "typeorm";

export class FixTradeDetailsAssetColumn1757863771351 implements MigrationInterface {
    name = 'FixTradeDetailsAssetColumn1757863771351'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // First, copy data from assetId to asset_id
        await queryRunner.query(`UPDATE "trade_details" SET "asset_id" = "assetId" WHERE "assetId" IS NOT NULL`);
        
        // Drop the old index
        await queryRunner.query(`DROP INDEX "public"."IDX_11a235d81b4f4ed4624ecac703"`);
        
        // Drop the old column
        await queryRunner.query(`ALTER TABLE "trade_details" DROP COLUMN "assetId"`);
        
        // Drop the old foreign key constraint
        await queryRunner.query(`ALTER TABLE "trade_details" DROP CONSTRAINT "FK_9ee6b8fecc23ad130ba7efebd07"`);
        
        // Set asset_id as NOT NULL
        await queryRunner.query(`ALTER TABLE "trade_details" ALTER COLUMN "asset_id" SET NOT NULL`);
        
        // Create new index
        await queryRunner.query(`CREATE INDEX "IDX_9ee6b8fecc23ad130ba7efebd0" ON "trade_details" ("asset_id") `);
        
        // Add new foreign key constraint
        await queryRunner.query(`ALTER TABLE "trade_details" ADD CONSTRAINT "FK_9ee6b8fecc23ad130ba7efebd07" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "trade_details" DROP CONSTRAINT "FK_9ee6b8fecc23ad130ba7efebd07"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9ee6b8fecc23ad130ba7efebd0"`);
        await queryRunner.query(`ALTER TABLE "trade_details" ALTER COLUMN "asset_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "trade_details" ADD CONSTRAINT "FK_9ee6b8fecc23ad130ba7efebd07" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "trade_details" ADD "assetId" uuid NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_11a235d81b4f4ed4624ecac703" ON "trade_details" ("assetId") `);
    }

}
