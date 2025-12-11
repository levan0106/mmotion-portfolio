import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDescriptionAndStartDateToFinancialFreedomPlans1767000000000 implements MigrationInterface {
  name = 'AddDescriptionAndStartDateToFinancialFreedomPlans1767000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add description column
    await queryRunner.query(`
      ALTER TABLE "financial_freedom_plans"
      ADD COLUMN IF NOT EXISTS "description" text
    `);

    // Add start_date column
    await queryRunner.query(`
      ALTER TABLE "financial_freedom_plans"
      ADD COLUMN IF NOT EXISTS "start_date" date
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove columns
    await queryRunner.query(`
      ALTER TABLE "financial_freedom_plans"
      DROP COLUMN IF EXISTS "start_date"
    `);

    await queryRunner.query(`
      ALTER TABLE "financial_freedom_plans"
      DROP COLUMN IF EXISTS "description"
    `);
  }
}

