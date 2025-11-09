import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFundingSourceToPortfolio1760000000001 implements MigrationInterface {
  name = 'AddFundingSourceToPortfolio1760000000001';

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
      console.log('⚠️ portfolios table does not exist, skipping funding_source column addition');
      return;
    }

    // Check if funding_source column already exists
    const columnExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'portfolios' 
        AND column_name = 'funding_source'
      )
    `);

    if (columnExists[0]?.exists) {
      console.log('✅ funding_source column already exists, skipping');
      return;
    }

    // Add funding_source column to portfolios table
    console.log('Adding funding_source column to portfolios table...');
    await queryRunner.query(`
      ALTER TABLE "portfolios" 
      ADD COLUMN "funding_source" character varying(100) NULL
    `);

    console.log('✅ funding_source column added successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove funding_source column
    await queryRunner.query(`
      ALTER TABLE "portfolios" 
      DROP COLUMN IF EXISTS "funding_source"
    `);
  }
}

