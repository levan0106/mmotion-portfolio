import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTargetMethodAndExpensesToFinancialFreedomPlans1739000001000 implements MigrationInterface {
  name = 'AddTargetMethodAndExpensesToFinancialFreedomPlans1739000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add target_method column
    await queryRunner.query(`
      ALTER TABLE "financial_freedom_plans"
      ADD COLUMN IF NOT EXISTS "target_method" character varying(20)
    `);

    // Add monthly_expenses column
    await queryRunner.query(`
      ALTER TABLE "financial_freedom_plans"
      ADD COLUMN IF NOT EXISTS "monthly_expenses" numeric(20,2)
    `);

    // Add withdrawal_rate column
    await queryRunner.query(`
      ALTER TABLE "financial_freedom_plans"
      ADD COLUMN IF NOT EXISTS "withdrawal_rate" numeric(6,4)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove columns
    await queryRunner.query(`
      ALTER TABLE "financial_freedom_plans"
      DROP COLUMN IF EXISTS "withdrawal_rate"
    `);

    await queryRunner.query(`
      ALTER TABLE "financial_freedom_plans"
      DROP COLUMN IF EXISTS "monthly_expenses"
    `);

    await queryRunner.query(`
      ALTER TABLE "financial_freedom_plans"
      DROP COLUMN IF EXISTS "target_method"
    `);
  }
}

