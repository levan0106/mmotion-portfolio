import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateAccountsEmailConstraints1736336000000 implements MigrationInterface {
  name = 'UpdateAccountsEmailConstraints1736336000000';

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
      console.log('⚠️ accounts table does not exist, skipping email constraints update');
      return;
    }

    // Remove unique constraint from email column
    await queryRunner.query(`
      ALTER TABLE "accounts" 
      DROP CONSTRAINT IF EXISTS "UQ_ee66de6cdc53993296d1ceb8aa0"
    `);
    
    // Allow NULL values in email column
    await queryRunner.query(`
      ALTER TABLE "accounts" 
      ALTER COLUMN "email" DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert: Add back NOT NULL constraint
    await queryRunner.query(`
      ALTER TABLE "accounts" 
      ALTER COLUMN "email" SET NOT NULL
    `);
    
    // Revert: Add back unique constraint
    await queryRunner.query(`
      ALTER TABLE "accounts" 
      ADD CONSTRAINT "UQ_ee66de6cdc53993296d1ceb8aa0" UNIQUE ("email")
    `);
  }
}
