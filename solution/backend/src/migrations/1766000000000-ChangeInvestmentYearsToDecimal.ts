import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeInvestmentYearsToDecimal1766000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Change investment_years from integer to decimal(10,2) to allow decimal values
    await queryRunner.query(`
      ALTER TABLE financial_freedom_plans 
      ALTER COLUMN investment_years TYPE numeric(10,2) USING investment_years::numeric(10,2)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert back to integer (round values)
    await queryRunner.query(`
      ALTER TABLE financial_freedom_plans 
      ALTER COLUMN investment_years TYPE integer USING ROUND(investment_years)::integer
    `);
  }
}

