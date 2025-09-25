import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNumberOfInvestorsToPortfolioSnapshots1758785000000 implements MigrationInterface {
    name = 'AddNumberOfInvestorsToPortfolioSnapshots1758785000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "portfolio_snapshots" ADD "number_of_investors" integer NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "portfolio_snapshots" DROP COLUMN "number_of_investors"`);
    }
}
