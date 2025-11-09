import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPortfolioVisibilityFields1736400000000 implements MigrationInterface {
    name = 'AddPortfolioVisibilityFields1736400000000'

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
            console.log('⚠️ portfolios table does not exist, skipping visibility fields addition');
            return;
        }

        // Add visibility field if not exists
        const visibilityExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'portfolios' 
                AND column_name = 'visibility'
            )
        `);
        if (!visibilityExists[0]?.exists) {
            await queryRunner.query(`
                ALTER TABLE "portfolios" 
                ADD COLUMN "visibility" character varying NOT NULL DEFAULT 'PRIVATE'
            `);
        }
        
        // Add template_name field if not exists
        const templateNameExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'portfolios' 
                AND column_name = 'template_name'
            )
        `);
        if (!templateNameExists[0]?.exists) {
            await queryRunner.query(`
                ALTER TABLE "portfolios" 
                ADD COLUMN "template_name" character varying(100)
            `);
        }
        
        // Add description field if not exists
        const descriptionExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'portfolios' 
                AND column_name = 'description'
            )
        `);
        if (!descriptionExists[0]?.exists) {
            await queryRunner.query(`
                ALTER TABLE "portfolios" 
                ADD COLUMN "description" text
            `);
        }
        
        // Add index for visibility field if not exists
        const indexExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT FROM pg_indexes 
                WHERE schemaname = 'public' 
                AND tablename = 'portfolios' 
                AND indexname = 'IDX_PORTFOLIO_VISIBILITY'
            )
        `);
        if (!indexExists[0]?.exists) {
            await queryRunner.query(`
                CREATE INDEX "IDX_PORTFOLIO_VISIBILITY" ON "portfolios" ("visibility")
            `);
        }
        
        // Add constraint for visibility enum if not exists
        const constraintExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.table_constraints 
                WHERE constraint_schema = 'public' 
                AND table_name = 'portfolios' 
                AND constraint_name = 'CHK_PORTFOLIO_VISIBILITY'
            )
        `);
        if (!constraintExists[0]?.exists) {
            await queryRunner.query(`
                ALTER TABLE "portfolios" 
                ADD CONSTRAINT "CHK_PORTFOLIO_VISIBILITY" 
                CHECK ("visibility" IN ('PRIVATE', 'PUBLIC'))
            `);
        }
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
