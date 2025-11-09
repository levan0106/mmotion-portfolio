import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateDemoAccountId1737000000002 implements MigrationInterface {
  name = 'UpdateDemoAccountId1737000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if required tables exist
    const accountsExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'accounts'
      )
    `);

    if (!accountsExists[0]?.exists) {
      console.log('⚠️ accounts table does not exist, skipping demo account ID update');
      return;
    }

    // Update demo account ID from invalid UUID to valid UUID v4
    // Old ID: 00000000-0000-0000-0000-000000000001 (invalid UUID v4)
    // New ID: ffffffff-ffff-4fff-bfff-ffffffffffff (valid UUID v4)
    const oldDemoAccountId = '00000000-0000-0000-0000-000000000001';
    const newDemoAccountId = 'ffffffff-ffff-4fff-bfff-ffffffffffff';

    // Check if old demo account exists
    const existingDemoAccount = await queryRunner.query(`
      SELECT account_id FROM "accounts" 
      WHERE "account_id" = $1 AND "is_demo_account" = true
    `, [oldDemoAccountId]);

    if (existingDemoAccount.length > 0) {
      // Check if new demo account ID already exists
      const newAccountExists = await queryRunner.query(`
        SELECT account_id FROM "accounts" 
        WHERE "account_id" = $1
      `, [newDemoAccountId]);

      if (newAccountExists.length === 0) {
        // Check if tables exist before updating
        const portfoliosExists = await queryRunner.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'portfolios'
          )
        `);

        const investorHoldingsExists = await queryRunner.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'investor_holdings'
          )
        `);

        const portfolioPermissionsExists = await queryRunner.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'portfolio_permissions'
          )
        `);

        // Update all foreign key references first (portfolios, investor_holdings, etc.)
        // Update portfolios
        if (portfoliosExists[0]?.exists) {
          await queryRunner.query(`
            UPDATE "portfolios" 
            SET "account_id" = $1 
            WHERE "account_id" = $2
          `, [newDemoAccountId, oldDemoAccountId]);
        }

        // Update investor_holdings
        if (investorHoldingsExists[0]?.exists) {
          await queryRunner.query(`
            UPDATE "investor_holdings" 
            SET "account_id" = $1 
            WHERE "account_id" = $2
          `, [newDemoAccountId, oldDemoAccountId]);
        }

        // Update portfolio_permissions
        if (portfolioPermissionsExists[0]?.exists) {
          await queryRunner.query(`
            UPDATE "portfolio_permissions" 
            SET "account_id" = $1 
            WHERE "account_id" = $2
          `, [newDemoAccountId, oldDemoAccountId]);
        }

        // Finally, update the account ID itself
        await queryRunner.query(`
          UPDATE "accounts" 
          SET "account_id" = $1 
          WHERE "account_id" = $2
        `, [newDemoAccountId, oldDemoAccountId]);
      } else {
        // If new account already exists, just delete the old one and update references
        // This shouldn't happen in normal cases
        const portfoliosExists = await queryRunner.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'portfolios'
          )
        `);
        const investorHoldingsExists = await queryRunner.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'investor_holdings'
          )
        `);
        const portfolioPermissionsExists = await queryRunner.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'portfolio_permissions'
          )
        `);

        if (portfoliosExists[0]?.exists) {
          await queryRunner.query(`
            UPDATE "portfolios" 
            SET "account_id" = $1 
            WHERE "account_id" = $2
          `, [newDemoAccountId, oldDemoAccountId]);
        }

        if (investorHoldingsExists[0]?.exists) {
          await queryRunner.query(`
            UPDATE "investor_holdings" 
            SET "account_id" = $1 
            WHERE "account_id" = $2
          `, [newDemoAccountId, oldDemoAccountId]);
        }

        if (portfolioPermissionsExists[0]?.exists) {
          await queryRunner.query(`
            UPDATE "portfolio_permissions" 
            SET "account_id" = $1 
            WHERE "account_id" = $2
          `, [newDemoAccountId, oldDemoAccountId]);
        }

        await queryRunner.query(`
          DELETE FROM "accounts" 
          WHERE "account_id" = $1
        `, [oldDemoAccountId]);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert: Update demo account ID back to old invalid UUID
    // This is not recommended but included for migration rollback support
    const oldDemoAccountId = '00000000-0000-0000-0000-000000000001';
    const newDemoAccountId = 'ffffffff-ffff-4fff-bfff-ffffffffffff';

    // Check if new demo account exists
    const existingDemoAccount = await queryRunner.query(`
      SELECT account_id FROM "accounts" 
      WHERE "account_id" = $1 AND "is_demo_account" = true
    `, [newDemoAccountId]);

    if (existingDemoAccount.length > 0) {
      // Update all foreign key references back
      await queryRunner.query(`
        UPDATE "portfolios" 
        SET "account_id" = $1 
        WHERE "account_id" = $2
      `, [oldDemoAccountId, newDemoAccountId]);

      await queryRunner.query(`
        UPDATE "investor_holdings" 
        SET "account_id" = $1 
        WHERE "account_id" = $2
      `, [oldDemoAccountId, newDemoAccountId]);

      await queryRunner.query(`
        UPDATE "portfolio_permissions" 
        SET "account_id" = $1 
        WHERE "account_id" = $2
      `, [oldDemoAccountId, newDemoAccountId]);

      // Update the account ID back
      await queryRunner.query(`
        UPDATE "accounts" 
        SET "account_id" = $1 
        WHERE "account_id" = $2
      `, [oldDemoAccountId, newDemoAccountId]);
    }
  }
}

