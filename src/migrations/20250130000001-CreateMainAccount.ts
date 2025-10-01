import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMainAccount1704067200001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if main account already exists
    const existingAccount = await queryRunner.query(
      `SELECT account_id FROM accounts WHERE account_id = '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5'`
    );

    if (existingAccount.length === 0) {
      // Create main account
      await queryRunner.query(`
        INSERT INTO accounts (
          account_id,
          name,
          email,
          base_currency,
          is_investor,
          is_main_account,
          created_at,
          updated_at
        ) VALUES (
          '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5',
          'Admin',
          'admin@example.com',
          'VND',
          true,
          true,
          NOW(),
          NOW()
        )
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove main account
    await queryRunner.query(
      `DELETE FROM accounts WHERE account_id = '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5'`
    );
  }
}
