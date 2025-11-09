import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMTDFieldsToPerformanceSnapshots1761500000000 implements MigrationInterface {
    name = 'AddMTDFieldsToPerformanceSnapshots1761500000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if tables exist
        const portfolioPerfExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'portfolio_performance_snapshots'
            )
        `);
        const assetPerfExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'asset_performance_snapshots'
            )
        `);
        const assetGroupPerfExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'asset_group_performance_snapshots'
            )
        `);

        // Add MTD fields to portfolio_performance_snapshots table
        if (portfolioPerfExists[0]?.exists) {
            await queryRunner.query(`ALTER TABLE "portfolio_performance_snapshots" ADD COLUMN IF NOT EXISTS "portfolio_twr_mtd" numeric(15,6) NOT NULL DEFAULT '0'`);
            await queryRunner.query(`ALTER TABLE "portfolio_performance_snapshots" ADD COLUMN IF NOT EXISTS "portfolio_mwr_mtd" numeric(15,6) NOT NULL DEFAULT '0'`);
            await queryRunner.query(`ALTER TABLE "portfolio_performance_snapshots" ADD COLUMN IF NOT EXISTS "portfolio_irr_mtd" numeric(15,6) NOT NULL DEFAULT '0'`);
        }

        // Add MTD fields to asset_performance_snapshots table
        if (assetPerfExists[0]?.exists) {
            await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ADD COLUMN IF NOT EXISTS "asset_twr_mtd" numeric(15,6) NOT NULL DEFAULT '0'`);
            await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ADD COLUMN IF NOT EXISTS "asset_irr_mtd" numeric(15,6) NOT NULL DEFAULT '0'`);
        }

        // Add MTD fields to asset_group_performance_snapshots table
        if (assetGroupPerfExists[0]?.exists) {
            await queryRunner.query(`ALTER TABLE "asset_group_performance_snapshots" ADD COLUMN IF NOT EXISTS "group_twr_mtd" numeric(15,6) NOT NULL DEFAULT '0'`);
            await queryRunner.query(`ALTER TABLE "asset_group_performance_snapshots" ADD COLUMN IF NOT EXISTS "group_irr_mtd" numeric(15,6) NOT NULL DEFAULT '0'`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove MTD fields from asset_group_performance_snapshots table
        await queryRunner.query(`ALTER TABLE "asset_group_performance_snapshots" DROP COLUMN IF EXISTS "group_irr_mtd"`);
        await queryRunner.query(`ALTER TABLE "asset_group_performance_snapshots" DROP COLUMN IF EXISTS "group_twr_mtd"`);

        // Remove MTD fields from asset_performance_snapshots table
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" DROP COLUMN IF EXISTS "asset_irr_mtd"`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" DROP COLUMN IF EXISTS "asset_twr_mtd"`);

        // Remove MTD fields from portfolio_performance_snapshots table
        await queryRunner.query(`ALTER TABLE "portfolio_performance_snapshots" DROP COLUMN IF EXISTS "portfolio_irr_mtd"`);
        await queryRunner.query(`ALTER TABLE "portfolio_performance_snapshots" DROP COLUMN IF EXISTS "portfolio_mwr_mtd"`);
        await queryRunner.query(`ALTER TABLE "portfolio_performance_snapshots" DROP COLUMN IF EXISTS "portfolio_twr_mtd"`);
    }
}
