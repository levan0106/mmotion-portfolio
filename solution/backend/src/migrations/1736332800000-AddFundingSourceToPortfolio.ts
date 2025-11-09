import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFundingSourceToPortfolio1736332800000 implements MigrationInterface {
    name = 'AddFundingSourceToPortfolio1736332800000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if portfolios table exists
        const portfoliosExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'portfolios'
            )
        `);

        if (!portfoliosExists[0]?.exists) {
            console.log('⚠️ portfolios table does not exist, skipping funding_source column addition');
            return;
        }

        // Check if column already exists
        const columnExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'portfolios' 
                AND column_name = 'funding_source'
            )
        `);

        if (!columnExists[0]?.exists) {
            await queryRunner.query(`
                ALTER TABLE "portfolios" 
                ADD COLUMN "funding_source" varchar(100) NULL
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "portfolios" 
            DROP COLUMN "funding_source"
        `);
    }
}
