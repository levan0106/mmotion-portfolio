import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNavUnitSystem1734567890123 implements MigrationInterface {
  name = 'AddNavUnitSystem1734567890123';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Extend portfolios table
    await queryRunner.query(`
      ALTER TABLE portfolios 
      ADD COLUMN is_fund BOOLEAN DEFAULT false,
      ADD COLUMN total_outstanding_units DECIMAL(20,8) DEFAULT 0,
      ADD COLUMN nav_per_unit DECIMAL(20,8) DEFAULT 0
    `);

    // 2. Extend accounts table
    await queryRunner.query(`
      ALTER TABLE accounts 
      ADD COLUMN is_investor BOOLEAN DEFAULT false
    `);

    // 3. Create investor_holdings table
    await queryRunner.query(`
      CREATE TABLE investor_holdings (
        holding_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        account_id UUID NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
        portfolio_id UUID NOT NULL REFERENCES portfolios(portfolio_id) ON DELETE CASCADE,
        total_units DECIMAL(20,8) DEFAULT 0,
        avg_cost_per_unit DECIMAL(20,8) DEFAULT 0,
        total_investment DECIMAL(20,8) DEFAULT 0,
        current_value DECIMAL(20,8) DEFAULT 0,
        unrealized_pnl DECIMAL(20,8) DEFAULT 0,
        realized_pnl DECIMAL(20,8) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(account_id, portfolio_id)
      )
    `);

    // 4. Create indexes for investor_holdings
    await queryRunner.query(`
      CREATE INDEX IDX_investor_holdings_account_id ON investor_holdings(account_id)
    `);
    await queryRunner.query(`
      CREATE INDEX IDX_investor_holdings_portfolio_id ON investor_holdings(portfolio_id)
    `);
    await queryRunner.query(`
      CREATE INDEX IDX_investor_holdings_created_at ON investor_holdings(created_at)
    `);

    // 5. Extend portfolio_snapshots table
    await queryRunner.query(`
      ALTER TABLE portfolio_snapshots 
      ADD COLUMN total_outstanding_units DECIMAL(20,8) DEFAULT 0,
      ADD COLUMN nav_per_unit DECIMAL(20,8) DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Remove portfolio_snapshots extensions
    await queryRunner.query(`
      ALTER TABLE portfolio_snapshots 
      DROP COLUMN IF EXISTS total_outstanding_units,
      DROP COLUMN IF EXISTS nav_per_unit
    `);

    // 2. Drop investor_holdings table
    await queryRunner.query(`DROP TABLE IF EXISTS investor_holdings`);

    // 3. Remove accounts extensions
    await queryRunner.query(`
      ALTER TABLE accounts 
      DROP COLUMN IF EXISTS is_investor
    `);

    // 4. Remove portfolios extensions
    await queryRunner.query(`
      ALTER TABLE portfolios 
      DROP COLUMN IF EXISTS is_fund,
      DROP COLUMN IF EXISTS total_outstanding_units,
      DROP COLUMN IF EXISTS nav_per_unit
    `);
  }
}
