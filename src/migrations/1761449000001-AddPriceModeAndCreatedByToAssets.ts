import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPriceModeAndCreatedByToAssets1761449000001 implements MigrationInterface {
    name = 'AddPriceModeAndCreatedByToAssets1761449000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enum for assets price_mode
        await queryRunner.query(`
            CREATE TYPE "public"."assets_price_mode_enum" AS ENUM('AUTOMATIC', 'MANUAL')
        `);
        
        // Add price_mode column to assets table with enum type
        await queryRunner.query(`
            ALTER TABLE "assets" 
            ADD COLUMN "price_mode" "public"."assets_price_mode_enum" NOT NULL DEFAULT 'AUTOMATIC'
        `);

        // Create enum for global_assets price_mode
        await queryRunner.query(`
            CREATE TYPE "public"."global_assets_price_mode_enum" AS ENUM('AUTOMATIC', 'MANUAL')
        `);
        
        // Add price_mode column to global_assets table with enum type
        await queryRunner.query(`
            ALTER TABLE "global_assets" 
            ADD COLUMN "price_mode" "public"."global_assets_price_mode_enum" NOT NULL DEFAULT 'AUTOMATIC'
        `);

        // Add created_by column to global_assets table
        await queryRunner.query(`ALTER TABLE "global_assets" ADD "created_by" uuid`);
        await queryRunner.query(`COMMENT ON COLUMN "global_assets"."created_by" IS 'User ID who created this global asset'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove created_by column from global_assets
        await queryRunner.query(`ALTER TABLE "global_assets" DROP COLUMN "created_by"`);

        // Remove price_mode column from global_assets
        await queryRunner.query(`
            ALTER TABLE "global_assets" 
            DROP COLUMN "price_mode"
        `);
        
        // Drop the global_assets price_mode enum type
        await queryRunner.query(`
            DROP TYPE "public"."global_assets_price_mode_enum"
        `);

        // Remove price_mode column from assets
        await queryRunner.query(`
            ALTER TABLE "assets" 
            DROP COLUMN "price_mode"
        `);
        
        // Drop the assets price_mode enum type
        await queryRunner.query(`
            DROP TYPE "public"."assets_price_mode_enum"
        `);
    }
}
