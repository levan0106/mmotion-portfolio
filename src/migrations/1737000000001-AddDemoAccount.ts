import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDemoAccount1737000000001 implements MigrationInterface {
  name = 'AddDemoAccount1737000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add is_demo_account column to accounts table
    await queryRunner.query(`
      ALTER TABLE "accounts" 
      ADD COLUMN IF NOT EXISTS "is_demo_account" boolean NOT NULL DEFAULT false
    `);

    // Create index for is_demo_account
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_accounts_is_demo_account" 
      ON "accounts" ("is_demo_account")
    `);

    // Create demo account (accessible by all users)
    // Use a fixed valid UUID v4 for the demo account so it can be easily identified
    // Format: ffffffff-ffff-4fff-bfff-ffffffffffff (valid UUID v4 pattern)
    const demoAccountId = 'ffffffff-ffff-4fff-bfff-ffffffffffff';
    const oldDemoAccountId = '00000000-0000-0000-0000-000000000001';
    
    // Check if demo account with new ID already exists
    const existingDemoAccount = await queryRunner.query(`
      SELECT account_id FROM "accounts" 
      WHERE "account_id" = $1
    `, [demoAccountId]);

    // Check if demo account with old ID exists (will be migrated by Migration 2)
    // Note: Don't check is_demo_account flag here since column was just added
    const oldDemoAccountExists = await queryRunner.query(`
      SELECT account_id FROM "accounts" 
      WHERE "account_id" = $1
    `, [oldDemoAccountId]);

    // Only create new demo account if both new and old don't exist
    if (existingDemoAccount.length === 0 && oldDemoAccountExists.length === 0) {
      // Insert demo account
      await queryRunner.query(`
        INSERT INTO "accounts" (
          "account_id",
          "name",
          "email",
          "base_currency",
          "is_investor",
          "is_main_account",
          "is_demo_account",
          "user_id",
          "created_at",
          "updated_at"
        ) VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          NULL,
          NOW(),
          NOW()
        )
      `, [
        demoAccountId,
        'Demo Account',
        'demo@mmotion.cloud',
        'VND',
        true, // isInvestor
        false, // isMainAccount
        true, // isDemoAccount
      ]);
    } else {
      // Update existing account to be demo account
      await queryRunner.query(`
        UPDATE "accounts" 
        SET 
          "is_demo_account" = true,
          "user_id" = NULL,
          "updated_at" = NOW()
        WHERE "account_id" = $1
      `, [demoAccountId]);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove demo account
    await queryRunner.query(`
      DELETE FROM "accounts" 
      WHERE "account_id" = 'ffffffff-ffff-4fff-bfff-ffffffffffff'
    `);

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

