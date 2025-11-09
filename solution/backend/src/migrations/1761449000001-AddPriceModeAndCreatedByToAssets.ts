import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPriceModeAndCreatedByToAssets1761449000001 implements MigrationInterface {
    name = 'AddPriceModeAndCreatedByToAssets1761449000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if assets table exists
        const assetsExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'assets'
            )
        `);

        if (assetsExists[0]?.exists) {
            // Create enum for assets price_mode (only if it doesn't exist)
            await queryRunner.query(`
                DO $$ BEGIN
                    CREATE TYPE "public"."assets_price_mode_enum" AS ENUM('AUTOMATIC', 'MANUAL');
                EXCEPTION
                    WHEN duplicate_object THEN null;
                END $$;
            `);
            
            // Add price_mode column to assets table with enum type (only if it doesn't exist)
            await queryRunner.query(`
                DO $$ BEGIN
                    ALTER TABLE "assets" 
                    ADD COLUMN "price_mode" "public"."assets_price_mode_enum" NOT NULL DEFAULT 'AUTOMATIC';
                EXCEPTION
                    WHEN duplicate_column THEN null;
                END $$;
            `);
        }

        // Check if global_assets table exists
        const globalAssetsExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'global_assets'
            )
        `);

        if (globalAssetsExists[0]?.exists) {
            // Create enum for global_assets price_mode (only if it doesn't exist)
            await queryRunner.query(`
                DO $$ BEGIN
                    CREATE TYPE "public"."global_assets_price_mode_enum" AS ENUM('AUTOMATIC', 'MANUAL');
                EXCEPTION
                    WHEN duplicate_object THEN null;
                END $$;
            `);
            
            // Add price_mode column to global_assets table with enum type (only if it doesn't exist)
            await queryRunner.query(`
                DO $$ BEGIN
                    ALTER TABLE "global_assets" 
                    ADD COLUMN "price_mode" "public"."global_assets_price_mode_enum" NOT NULL DEFAULT 'AUTOMATIC';
                EXCEPTION
                    WHEN duplicate_column THEN null;
                END $$;
            `);

            // Add created_by column to global_assets table (only if it doesn't exist)
            await queryRunner.query(`
                DO $$ BEGIN
                    ALTER TABLE "global_assets" ADD "created_by" uuid;
                    COMMENT ON COLUMN "global_assets"."created_by" IS 'User ID who created this global asset';
                EXCEPTION
                    WHEN duplicate_column THEN null;
                END $$;
            `);
        }
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
