import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFundManagementFieldsToPortfolioPerformanceSnapshots1758779500000 implements MigrationInterface {
    name = 'AddFundManagementFieldsToPortfolioPerformanceSnapshots1758779500000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "portfolio_performance_snapshots" ADD "total_outstanding_units" numeric(20,8) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "portfolio_performance_snapshots" ADD "nav_per_unit" numeric(20,8) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "portfolio_performance_snapshots" ADD "number_of_investors" integer NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "portfolio_performance_snapshots" DROP COLUMN "number_of_investors"`);
        await queryRunner.query(`ALTER TABLE "portfolio_performance_snapshots" DROP COLUMN "nav_per_unit"`);
        await queryRunner.query(`ALTER TABLE "portfolio_performance_snapshots" DROP COLUMN "total_outstanding_units"`);
    }
}
