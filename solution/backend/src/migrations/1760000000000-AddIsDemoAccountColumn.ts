import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsDemoAccountColumn1760000000000 implements MigrationInterface {
  name = 'AddIsDemoAccountColumn1760000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if accounts table exists
    const accountsExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'accounts'
      )
    `);

    if (!accountsExists[0]?.exists) {
      console.log('⚠️ accounts table does not exist, skipping is_demo_account column addition');
      return;
    }

    // Check if is_demo_account column already exists
    const columnExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'accounts' 
        AND column_name = 'is_demo_account'
      )
    `);

    if (columnExists[0]?.exists) {
      console.log('✅ is_demo_account column already exists, skipping');
      return;
    }

    // Add is_demo_account column to accounts table
    console.log('Adding is_demo_account column to accounts table...');
    await queryRunner.query(`
      ALTER TABLE "accounts" 
      ADD COLUMN "is_demo_account" boolean NOT NULL DEFAULT false
    `);

    // Create index for is_demo_account
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_accounts_is_demo_account" 
      ON "accounts" ("is_demo_account")
    `);

    console.log('✅ is_demo_account column added successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_accounts_is_demo_account"
    `);

    // Remove is_demo_account column
    await queryRunner.query(`
      ALTER TABLE "accounts" 
      DROP COLUMN IF EXISTS "is_demo_account"
    `);
  }
}

