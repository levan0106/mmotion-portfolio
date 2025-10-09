import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixNamingConventionToSnakeCase1734567890200 implements MigrationInterface {
  name = 'FixNamingConventionToSnakeCase1734567890200';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Fix portfolios table - rename portfolioId to portfolio_id
    await queryRunner.query(`ALTER TABLE portfolios RENAME COLUMN "portfolioId" TO "portfolio_id"`);
    
    // Fix portfolio_assets table - rename all camelCase columns to snake_case
    await queryRunner.query(`ALTER TABLE portfolio_assets RENAME COLUMN "portfolioId" TO "portfolio_id"`);
    await queryRunner.query(`ALTER TABLE portfolio_assets RENAME COLUMN "assetId" TO "asset_id"`);
    await queryRunner.query(`ALTER TABLE portfolio_assets RENAME COLUMN "initialValue" TO "initial_value"`);
    await queryRunner.query(`ALTER TABLE portfolio_assets RENAME COLUMN "initialQuantity" TO "initial_quantity"`);
    await queryRunner.query(`ALTER TABLE portfolio_assets RENAME COLUMN "currentValue" TO "current_value"`);
    await queryRunner.query(`ALTER TABLE portfolio_assets RENAME COLUMN "currentQuantity" TO "current_quantity"`);
    await queryRunner.query(`ALTER TABLE portfolio_assets RENAME COLUMN "createdAt" TO "created_at"`);
    await queryRunner.query(`ALTER TABLE portfolio_assets RENAME COLUMN "updatedAt" TO "updated_at"`);
    await queryRunner.query(`ALTER TABLE portfolio_assets RENAME COLUMN "createdBy" TO "created_by"`);
    await queryRunner.query(`ALTER TABLE portfolio_assets RENAME COLUMN "updatedBy" TO "updated_by"`);

    // Drop and recreate foreign key constraints with correct column names
    await queryRunner.query(`ALTER TABLE portfolio_assets DROP CONSTRAINT IF EXISTS "FK_portfolio_assets_portfolio_id"`);
    await queryRunner.query(`ALTER TABLE portfolio_assets DROP CONSTRAINT IF EXISTS "FK_portfolio_assets_asset_id"`);
    
    await queryRunner.query(`ALTER TABLE portfolio_assets ADD CONSTRAINT "FK_portfolio_assets_portfolio_id" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("portfolio_id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE portfolio_assets ADD CONSTRAINT "FK_portfolio_assets_asset_id" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE`);

    // Fix any other tables that might have camelCase columns
    // Check if trades table has camelCase columns
    const tradesColumns = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'trades' 
      AND column_name ~ '[a-z][A-Z]'
    `);
    
    for (const column of tradesColumns) {
      const snakeCaseName = column.column_name.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (snakeCaseName !== column.column_name) {
        await queryRunner.query(`ALTER TABLE trades RENAME COLUMN "${column.column_name}" TO "${snakeCaseName}"`);
      }
    }

    // Check if cash_flows table has camelCase columns
    const cashFlowsColumns = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'cash_flows' 
      AND column_name ~ '[a-z][A-Z]'
    `);
    
    for (const column of cashFlowsColumns) {
      const snakeCaseName = column.column_name.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (snakeCaseName !== column.column_name) {
        await queryRunner.query(`ALTER TABLE cash_flows RENAME COLUMN "${column.column_name}" TO "${snakeCaseName}"`);
      }
    }

    // Update all foreign key references to use portfolio_id instead of portfolioId
    await queryRunner.query(`ALTER TABLE deposits DROP CONSTRAINT IF EXISTS "fk_deposits_portfolio"`);
    await queryRunner.query(`ALTER TABLE deposits ADD CONSTRAINT "fk_deposits_portfolio" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("portfolio_id") ON DELETE CASCADE`);
    
    await queryRunner.query(`ALTER TABLE portfolio_snapshots DROP CONSTRAINT IF EXISTS "FK_portfolio_snapshots_portfolio_id"`);
    await queryRunner.query(`ALTER TABLE portfolio_snapshots ADD CONSTRAINT "FK_portfolio_snapshots_portfolio_id" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("portfolio_id") ON DELETE CASCADE`);
    
    await queryRunner.query(`ALTER TABLE asset_allocation_snapshots DROP CONSTRAINT IF EXISTS "FK_asset_allocation_snapshots_portfolio_id"`);
    await queryRunner.query(`ALTER TABLE asset_allocation_snapshots ADD CONSTRAINT "FK_asset_allocation_snapshots_portfolio_id" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("portfolio_id") ON DELETE CASCADE`);
    
    await queryRunner.query(`ALTER TABLE cash_flows DROP CONSTRAINT IF EXISTS "FK_cash_flows_portfolio_id"`);
    await queryRunner.query(`ALTER TABLE cash_flows ADD CONSTRAINT "FK_cash_flows_portfolio_id" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("portfolio_id") ON DELETE CASCADE`);
    
    await queryRunner.query(`ALTER TABLE trades DROP CONSTRAINT IF EXISTS "FK_2a46262bf5530d16b2722935d15"`);
    await queryRunner.query(`ALTER TABLE trades ADD CONSTRAINT "FK_2a46262bf5530d16b2722935d15" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("portfolio_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert portfolios table
    await queryRunner.query(`ALTER TABLE portfolios RENAME COLUMN "portfolio_id" TO "portfolioId"`);
    
    // Revert portfolio_assets table
    await queryRunner.query(`ALTER TABLE portfolio_assets RENAME COLUMN "portfolio_id" TO "portfolioId"`);
    await queryRunner.query(`ALTER TABLE portfolio_assets RENAME COLUMN "asset_id" TO "assetId"`);
    await queryRunner.query(`ALTER TABLE portfolio_assets RENAME COLUMN "initial_value" TO "initialValue"`);
    await queryRunner.query(`ALTER TABLE portfolio_assets RENAME COLUMN "initial_quantity" TO "initialQuantity"`);
    await queryRunner.query(`ALTER TABLE portfolio_assets RENAME COLUMN "current_value" TO "currentValue"`);
    await queryRunner.query(`ALTER TABLE portfolio_assets RENAME COLUMN "current_quantity" TO "currentQuantity"`);
    await queryRunner.query(`ALTER TABLE portfolio_assets RENAME COLUMN "created_at" TO "createdAt"`);
    await queryRunner.query(`ALTER TABLE portfolio_assets RENAME COLUMN "updated_at" TO "updatedAt"`);
    await queryRunner.query(`ALTER TABLE portfolio_assets RENAME COLUMN "created_by" TO "createdBy"`);
    await queryRunner.query(`ALTER TABLE portfolio_assets RENAME COLUMN "updated_by" TO "updatedBy"`);

    // Revert foreign key constraints
    await queryRunner.query(`ALTER TABLE portfolio_assets DROP CONSTRAINT IF EXISTS "FK_portfolio_assets_portfolio_id"`);
    await queryRunner.query(`ALTER TABLE portfolio_assets DROP CONSTRAINT IF EXISTS "FK_portfolio_assets_asset_id"`);
    
    await queryRunner.query(`ALTER TABLE portfolio_assets ADD CONSTRAINT "FK_portfolio_assets_portfolio_id" FOREIGN KEY ("portfolioId") REFERENCES "portfolios"("portfolio_id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE portfolio_assets ADD CONSTRAINT "FK_portfolio_assets_asset_id" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE`);

    // Revert other foreign key constraints
    await queryRunner.query(`ALTER TABLE deposits DROP CONSTRAINT IF EXISTS "fk_deposits_portfolio"`);
    await queryRunner.query(`ALTER TABLE deposits ADD CONSTRAINT "fk_deposits_portfolio" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("portfolio_id") ON DELETE CASCADE`);
    
    await queryRunner.query(`ALTER TABLE portfolio_snapshots DROP CONSTRAINT IF EXISTS "FK_portfolio_snapshots_portfolio_id"`);
    await queryRunner.query(`ALTER TABLE portfolio_snapshots ADD CONSTRAINT "FK_portfolio_snapshots_portfolio_id" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("portfolio_id") ON DELETE CASCADE`);
    
    await queryRunner.query(`ALTER TABLE asset_allocation_snapshots DROP CONSTRAINT IF EXISTS "FK_asset_allocation_snapshots_portfolio_id"`);
    await queryRunner.query(`ALTER TABLE asset_allocation_snapshots ADD CONSTRAINT "FK_asset_allocation_snapshots_portfolio_id" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("portfolio_id") ON DELETE CASCADE`);
    
    await queryRunner.query(`ALTER TABLE cash_flows DROP CONSTRAINT IF EXISTS "FK_cash_flows_portfolio_id"`);
    await queryRunner.query(`ALTER TABLE cash_flows ADD CONSTRAINT "FK_cash_flows_portfolio_id" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("portfolio_id") ON DELETE CASCADE`);
    
    await queryRunner.query(`ALTER TABLE trades DROP CONSTRAINT IF EXISTS "FK_2a46262bf5530d16b2722935d15"`);
    await queryRunner.query(`ALTER TABLE trades ADD CONSTRAINT "FK_2a46262bf5530d16b2722935d15" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("portfolio_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
  }
}
