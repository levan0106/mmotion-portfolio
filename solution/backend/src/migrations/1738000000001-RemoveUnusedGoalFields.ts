import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveUnusedGoalFields1738000000001 implements MigrationInterface {
  name = 'RemoveUnusedGoalFields1738000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Remove unused columns from portfolio_goals table
    await queryRunner.query(`
      ALTER TABLE "portfolio_goals" 
      DROP COLUMN IF EXISTS "goal_type",
      DROP COLUMN IF EXISTS "category",
      DROP COLUMN IF EXISTS "target_percentage"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Add back the columns if needed to rollback
    await queryRunner.query(`
      ALTER TABLE "portfolio_goals" 
      ADD COLUMN "goal_type" VARCHAR(50) DEFAULT 'FINANCIAL',
      ADD COLUMN "category" VARCHAR(50) DEFAULT 'VALUE',
      ADD COLUMN "target_percentage" DECIMAL(8,4) NULL
    `);
  }
}
