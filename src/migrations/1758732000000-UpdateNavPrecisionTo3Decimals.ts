import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateNavPrecisionTo3Decimals1758732000000 implements MigrationInterface {
    name = 'UpdateNavPrecisionTo3Decimals1758732000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Update fund_unit_transactions table
        await queryRunner.query(`ALTER TABLE "fund_unit_transactions" ALTER COLUMN "units" TYPE numeric(20,3)`);
        await queryRunner.query(`ALTER TABLE "fund_unit_transactions" ALTER COLUMN "nav_per_unit" TYPE numeric(20,3)`);
        
        // Update investor_holdings table
        await queryRunner.query(`ALTER TABLE "investor_holdings" ALTER COLUMN "total_units" TYPE numeric(20,3)`);
        await queryRunner.query(`ALTER TABLE "investor_holdings" ALTER COLUMN "avg_cost_per_unit" TYPE numeric(20,3)`);
        
        // Update portfolios table
        await queryRunner.query(`ALTER TABLE "portfolios" ALTER COLUMN "total_outstanding_units" TYPE numeric(20,3)`);
        await queryRunner.query(`ALTER TABLE "portfolios" ALTER COLUMN "nav_per_unit" TYPE numeric(20,3)`);
        
        // Update nav_snapshots table
        await queryRunner.query(`ALTER TABLE "nav_snapshots" ALTER COLUMN "total_outstanding_units" TYPE numeric(20,3)`);
        await queryRunner.query(`ALTER TABLE "nav_snapshots" ALTER COLUMN "nav_per_unit" TYPE numeric(20,3)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert fund_unit_transactions table
        await queryRunner.query(`ALTER TABLE "fund_unit_transactions" ALTER COLUMN "units" TYPE numeric(20,8)`);
        await queryRunner.query(`ALTER TABLE "fund_unit_transactions" ALTER COLUMN "nav_per_unit" TYPE numeric(20,8)`);
        
        // Revert investor_holdings table
        await queryRunner.query(`ALTER TABLE "investor_holdings" ALTER COLUMN "total_units" TYPE numeric(20,8)`);
        await queryRunner.query(`ALTER TABLE "investor_holdings" ALTER COLUMN "avg_cost_per_unit" TYPE numeric(20,8)`);
        
        // Revert portfolios table
        await queryRunner.query(`ALTER TABLE "portfolios" ALTER COLUMN "total_outstanding_units" TYPE numeric(20,8)`);
        await queryRunner.query(`ALTER TABLE "portfolios" ALTER COLUMN "nav_per_unit" TYPE numeric(20,8)`);
        
        // Revert nav_snapshots table
        await queryRunner.query(`ALTER TABLE "nav_snapshots" ALTER COLUMN "total_outstanding_units" TYPE numeric(20,8)`);
        await queryRunner.query(`ALTER TABLE "nav_snapshots" ALTER COLUMN "nav_per_unit" TYPE numeric(20,8)`);
    }
}
