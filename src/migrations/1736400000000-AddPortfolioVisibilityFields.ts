import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPortfolioVisibilityFields1736400000000 implements MigrationInterface {
    name = 'AddPortfolioVisibilityFields1736400000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add visibility field
        await queryRunner.query(`
            ALTER TABLE "portfolios" 
            ADD COLUMN "visibility" character varying NOT NULL DEFAULT 'PRIVATE'
        `);
        
        // Add template_name field
        await queryRunner.query(`
            ALTER TABLE "portfolios" 
            ADD COLUMN "template_name" character varying(100)
        `);
        
        // Add description field
        await queryRunner.query(`
            ALTER TABLE "portfolios" 
            ADD COLUMN "description" text
        `);
        
        // Add index for visibility field
        await queryRunner.query(`
            CREATE INDEX "IDX_PORTFOLIO_VISIBILITY" ON "portfolios" ("visibility")
        `);
        
        // Add constraint for visibility enum
        await queryRunner.query(`
            ALTER TABLE "portfolios" 
            ADD CONSTRAINT "CHK_PORTFOLIO_VISIBILITY" 
            CHECK ("visibility" IN ('PRIVATE', 'PUBLIC'))
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove constraint
        await queryRunner.query(`
            ALTER TABLE "portfolios" 
            DROP CONSTRAINT "CHK_PORTFOLIO_VISIBILITY"
        `);
        
        // Remove index
        await queryRunner.query(`
            DROP INDEX "IDX_PORTFOLIO_VISIBILITY"
        `);
        
        // Remove columns
        await queryRunner.query(`
            ALTER TABLE "portfolios" 
            DROP COLUMN "description"
        `);
        
        await queryRunner.query(`
            ALTER TABLE "portfolios" 
            DROP COLUMN "template_name"
        `);
        
        await queryRunner.query(`
            ALTER TABLE "portfolios" 
            DROP COLUMN "visibility"
        `);
    }
}
