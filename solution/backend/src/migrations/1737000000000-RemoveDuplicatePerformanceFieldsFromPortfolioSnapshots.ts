import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveDuplicatePerformanceFieldsFromPortfolioSnapshots1737000000000 implements MigrationInterface {
    name = 'RemoveDuplicatePerformanceFieldsFromPortfolioSnapshots1737000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if portfolio_snapshots table exists
        const tableExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'portfolio_snapshots'
            )
        `);

        if (!tableExists[0]?.exists) {
            console.log('⚠️ portfolio_snapshots table does not exist, skipping duplicate fields removal');
            return;
        }

        // Remove duplicate performance fields from portfolio_snapshots table
        // These fields are now handled by portfolio_performance_snapshots table
        
        // Drop asset performance columns
        await queryRunner.query(`ALTER TABLE "portfolio_snapshots" DROP COLUMN IF EXISTS "asset_daily_return"`);
        await queryRunner.query(`ALTER TABLE "portfolio_snapshots" DROP COLUMN IF EXISTS "asset_weekly_return"`);
        await queryRunner.query(`ALTER TABLE "portfolio_snapshots" DROP COLUMN IF EXISTS "asset_monthly_return"`);
        await queryRunner.query(`ALTER TABLE "portfolio_snapshots" DROP COLUMN IF EXISTS "asset_ytd_return"`);
        await queryRunner.query(`ALTER TABLE "portfolio_snapshots" DROP COLUMN IF EXISTS "asset_volatility"`);
        await queryRunner.query(`ALTER TABLE "portfolio_snapshots" DROP COLUMN IF EXISTS "asset_max_drawdown"`);
        
        // Drop portfolio performance columns
        await queryRunner.query(`ALTER TABLE "portfolio_snapshots" DROP COLUMN IF EXISTS "portfolio_daily_return"`);
        await queryRunner.query(`ALTER TABLE "portfolio_snapshots" DROP COLUMN IF EXISTS "portfolio_weekly_return"`);
        await queryRunner.query(`ALTER TABLE "portfolio_snapshots" DROP COLUMN IF EXISTS "portfolio_monthly_return"`);
        await queryRunner.query(`ALTER TABLE "portfolio_snapshots" DROP COLUMN IF EXISTS "portfolio_ytd_return"`);
        await queryRunner.query(`ALTER TABLE "portfolio_snapshots" DROP COLUMN IF EXISTS "portfolio_volatility"`);
        await queryRunner.query(`ALTER TABLE "portfolio_snapshots" DROP COLUMN IF EXISTS "portfolio_max_drawdown"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Restore the dropped columns (for rollback)
        await queryRunner.query(`ALTER TABLE "portfolio_snapshots" ADD "asset_daily_return" numeric(15,6) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "portfolio_snapshots" ADD "asset_weekly_return" numeric(15,6) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "portfolio_snapshots" ADD "asset_monthly_return" numeric(15,6) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "portfolio_snapshots" ADD "asset_ytd_return" numeric(15,6) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "portfolio_snapshots" ADD "asset_volatility" numeric(15,6) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "portfolio_snapshots" ADD "asset_max_drawdown" numeric(15,6) NOT NULL DEFAULT '0'`);
        
        await queryRunner.query(`ALTER TABLE "portfolio_snapshots" ADD "portfolio_daily_return" numeric(15,6) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "portfolio_snapshots" ADD "portfolio_weekly_return" numeric(15,6) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "portfolio_snapshots" ADD "portfolio_monthly_return" numeric(15,6) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "portfolio_snapshots" ADD "portfolio_ytd_return" numeric(15,6) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "portfolio_snapshots" ADD "portfolio_volatility" numeric(15,6) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "portfolio_snapshots" ADD "portfolio_max_drawdown" numeric(15,6) NOT NULL DEFAULT '0'`);
    }
}
