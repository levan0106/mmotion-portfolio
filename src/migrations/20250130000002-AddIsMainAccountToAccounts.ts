import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsMainAccountToAccounts20250130000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if accounts table exists
    const tableExists = await queryRunner.hasTable('accounts');
    if (!tableExists) {
      console.log('Accounts table does not exist, skipping is_main_account column addition');
      return;
    }

    // Add is_main_account column
    await queryRunner.query(`
      ALTER TABLE accounts 
      ADD COLUMN is_main_account BOOLEAN DEFAULT FALSE
    `);

    // Update existing main account
    await queryRunner.query(`
      UPDATE accounts 
      SET is_main_account = TRUE 
      WHERE account_id = '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove is_main_account column
    await queryRunner.query(`
      ALTER TABLE accounts 
      DROP COLUMN is_main_account
    `);
  }
}
