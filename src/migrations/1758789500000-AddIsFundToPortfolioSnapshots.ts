import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsFundToPortfolioSnapshots1758789500000 implements MigrationInterface {
    name = 'AddIsFundToPortfolioSnapshots1758789500000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "portfolio_snapshots" ADD "is_fund" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "portfolio_snapshots" DROP COLUMN "is_fund"`);
    }
}
