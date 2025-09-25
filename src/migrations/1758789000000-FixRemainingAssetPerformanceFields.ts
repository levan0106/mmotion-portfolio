import { MigrationInterface, QueryRunner } from "typeorm";

export class FixRemainingAssetPerformanceFields1758789000000 implements MigrationInterface {
    name = 'FixRemainingAssetPerformanceFields1758789000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Fix remaining asset_performance_snapshots fields that still have precision 8,4
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_sharpe_ratio_1m" TYPE numeric(15,6)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_sharpe_ratio_3m" TYPE numeric(15,6)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_sharpe_ratio_1y" TYPE numeric(15,6)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_max_drawdown_1m" TYPE numeric(15,6)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_max_drawdown_3m" TYPE numeric(15,6)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_max_drawdown_1y" TYPE numeric(15,6)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_risk_adjusted_return_1m" TYPE numeric(15,6)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_risk_adjusted_return_3m" TYPE numeric(15,6)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_risk_adjusted_return_1y" TYPE numeric(15,6)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_alpha_1m" TYPE numeric(15,6)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_alpha_3m" TYPE numeric(15,6)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_alpha_6m" TYPE numeric(15,6)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_alpha_1y" TYPE numeric(15,6)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_alpha_ytd" TYPE numeric(15,6)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_beta_1m" TYPE numeric(15,6)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_beta_3m" TYPE numeric(15,6)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_beta_6m" TYPE numeric(15,6)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_beta_1y" TYPE numeric(15,6)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_beta_ytd" TYPE numeric(15,6)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert changes back to numeric(8,4)
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_sharpe_ratio_1m" TYPE numeric(8,4)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_sharpe_ratio_3m" TYPE numeric(8,4)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_sharpe_ratio_1y" TYPE numeric(8,4)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_max_drawdown_1m" TYPE numeric(8,4)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_max_drawdown_3m" TYPE numeric(8,4)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_max_drawdown_1y" TYPE numeric(8,4)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_risk_adjusted_return_1m" TYPE numeric(8,4)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_risk_adjusted_return_3m" TYPE numeric(8,4)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_risk_adjusted_return_1y" TYPE numeric(8,4)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_alpha_1m" TYPE numeric(8,4)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_alpha_3m" TYPE numeric(8,4)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_alpha_6m" TYPE numeric(8,4)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_alpha_1y" TYPE numeric(8,4)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_alpha_ytd" TYPE numeric(8,4)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_beta_1m" TYPE numeric(8,4)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_beta_3m" TYPE numeric(8,4)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_beta_6m" TYPE numeric(8,4)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_beta_1y" TYPE numeric(8,4)`);
        await queryRunner.query(`ALTER TABLE "asset_performance_snapshots" ALTER COLUMN "asset_beta_ytd" TYPE numeric(8,4)`);
    }
}
