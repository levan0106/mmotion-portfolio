import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLastNavDateToPortfolio1758723000000 implements MigrationInterface {
    name = 'AddLastNavDateToPortfolio1758723000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "portfolios" ADD "last_nav_date" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "portfolios" DROP COLUMN "last_nav_date"`);
    }
}
