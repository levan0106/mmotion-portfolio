import { MigrationInterface, QueryRunner } from "typeorm";

export class FixAssetPerformanceSnapshotPrecision1758788400000 implements MigrationInterface {
    name = 'FixAssetPerformanceSnapshotPrecision1758788400000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Fix TWR precision
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_twr_1d" TYPE numeric(15,6)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_twr_1w" TYPE numeric(15,6)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_twr_1m" TYPE numeric(15,6)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_twr_3m" TYPE numeric(15,6)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_twr_6m" TYPE numeric(15,6)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_twr_1y" TYPE numeric(15,6)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_twr_ytd" TYPE numeric(15,6)`);
        
        // Fix volatility precision
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_volatility_1m" TYPE numeric(15,6)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_volatility_3m" TYPE numeric(15,6)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_volatility_1y" TYPE numeric(15,6)`);
        
        // Fix IRR precision
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_irr_1m" TYPE numeric(15,6)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_irr_3m" TYPE numeric(15,6)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_irr_6m" TYPE numeric(15,6)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_irr_1y" TYPE numeric(15,6)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_irr_ytd" TYPE numeric(15,6)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert TWR precision
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_twr_1d" TYPE numeric(8,4)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_twr_1w" TYPE numeric(8,4)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_twr_1m" TYPE numeric(8,4)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_twr_3m" TYPE numeric(8,4)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_twr_6m" TYPE numeric(8,4)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_twr_1y" TYPE numeric(8,4)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_twr_ytd" TYPE numeric(8,4)`);
        
        // Revert volatility precision
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_volatility_1m" TYPE numeric(8,4)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_volatility_3m" TYPE numeric(8,4)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_volatility_1y" TYPE numeric(8,4)`);
        
        // Revert IRR precision
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_irr_1m" TYPE numeric(8,4)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_irr_3m" TYPE numeric(8,4)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_irr_6m" TYPE numeric(8,4)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_irr_1y" TYPE numeric(8,4)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_irr_ytd" TYPE numeric(8,4)`);
    }
}
