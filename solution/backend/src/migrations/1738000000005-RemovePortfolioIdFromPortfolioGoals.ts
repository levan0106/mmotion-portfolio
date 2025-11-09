import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemovePortfolioIdFromPortfolioGoals1738000000005 implements MigrationInterface {
  name = 'RemovePortfolioIdFromPortfolioGoals1738000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if portfolio_goals table exists
    const tableExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'portfolio_goals'
      )
    `);

    if (!tableExists[0]?.exists) {
      console.log('⚠️ portfolio_goals table does not exist, skipping portfolio_id removal');
      return;
    }

    // Remove portfolio_id column from portfolio_goals table
    // The relationship between goals and portfolios is managed through goal_portfolios table
    await queryRunner.query(`
      ALTER TABLE "portfolio_goals" 
      DROP COLUMN IF EXISTS "portfolio_id"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Add back the portfolio_id column if needed to rollback
    await queryRunner.query(`
      ALTER TABLE "portfolio_goals" 
      ADD COLUMN "portfolio_id" uuid
    `);
  }
}
