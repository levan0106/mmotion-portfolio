import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPortfolioUniqueConstraint1738000000002 implements MigrationInterface {
  name = 'AddPortfolioUniqueConstraint1738000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, remove duplicate entries, keeping only the first occurrence of each portfolio_id
    await queryRunner.query(`
      DELETE FROM "goal_portfolios" 
      WHERE id NOT IN (
        SELECT DISTINCT ON ("portfolio_id") id
        FROM "goal_portfolios" 
        ORDER BY "portfolio_id", "created_at" ASC
      )
    `);

    // Add unique constraint on portfolio_id to ensure each portfolio can only be linked to one goal
    await queryRunner.query(`
      ALTER TABLE "goal_portfolios"
      ADD CONSTRAINT "UQ_goal_portfolios_portfolio_id" UNIQUE ("portfolio_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the unique constraint
    await queryRunner.query(`
      ALTER TABLE "goal_portfolios"
      DROP CONSTRAINT "UQ_goal_portfolios_portfolio_id"
    `);
  }
}
