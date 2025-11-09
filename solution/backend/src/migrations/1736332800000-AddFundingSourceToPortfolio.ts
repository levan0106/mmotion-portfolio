import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFundingSourceToPortfolio1736332800000 implements MigrationInterface {
    name = 'AddFundingSourceToPortfolio1736332800000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "portfolios" 
            ADD COLUMN "funding_source" varchar(100) NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "portfolios" 
            DROP COLUMN "funding_source"
        `);
    }
}
