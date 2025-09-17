import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to make portfolioId nullable in assets table.
 * This allows assets to be created without being tied to a specific portfolio.
 */
export class MakePortfolioIdNullableInAssets20250914070000 implements MigrationInterface {
  name = 'MakePortfolioIdNullableInAssets20250914070000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Make portfolioId column nullable in assets table
    await queryRunner.query(`
      ALTER TABLE "assets" 
      ALTER COLUMN "portfolioId" DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert portfolioId column to NOT NULL
    // Note: This will fail if there are any NULL values in portfolioId
    await queryRunner.query(`
      ALTER TABLE "assets" 
      ALTER COLUMN "portfolioId" SET NOT NULL
    `);
  }
}
