import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemovePortfolioUniqueConstraint1738000000003 implements MigrationInterface {
  name = 'RemovePortfolioUniqueConstraint1738000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Remove the unique constraint to allow portfolios to be linked to multiple goals
    await queryRunner.query(`
      ALTER TABLE "goal_portfolios"
      DROP CONSTRAINT IF EXISTS "UQ_goal_portfolios_portfolio_id"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Add back the unique constraint if needed to rollback
    await queryRunner.query(`
      ALTER TABLE "goal_portfolios"
      ADD CONSTRAINT "UQ_goal_portfolios_portfolio_id" UNIQUE ("portfolio_id")
    `);
  }
}
