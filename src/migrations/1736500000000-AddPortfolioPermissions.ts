import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPortfolioPermissions1736500000000 implements MigrationInterface {
  name = 'AddPortfolioPermissions1736500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create portfolio_permissions table
    await queryRunner.query(`
      CREATE TABLE portfolio_permissions (
        permission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        portfolio_id UUID NOT NULL,
        account_id UUID NOT NULL,
        permission_type VARCHAR(20) NOT NULL CHECK (permission_type IN ('OWNER', 'UPDATE', 'VIEW')),
        granted_by UUID NOT NULL,
        granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT FK_portfolio_permissions_portfolio 
          FOREIGN KEY (portfolio_id) REFERENCES portfolios(portfolio_id) ON DELETE CASCADE,
        CONSTRAINT FK_portfolio_permissions_account 
          FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE,
        CONSTRAINT FK_portfolio_permissions_granted_by 
          FOREIGN KEY (granted_by) REFERENCES accounts(account_id) ON DELETE CASCADE,
        CONSTRAINT UQ_portfolio_permissions_portfolio_account 
          UNIQUE (portfolio_id, account_id)
      )
    `);

    // Create indexes for better performance
    await queryRunner.query(`
      CREATE INDEX IDX_portfolio_permissions_portfolio_id ON portfolio_permissions(portfolio_id)
    `);
    
    await queryRunner.query(`
      CREATE INDEX IDX_portfolio_permissions_account_id ON portfolio_permissions(account_id)
    `);
    
    await queryRunner.query(`
      CREATE INDEX IDX_portfolio_permissions_permission_type ON portfolio_permissions(permission_type)
    `);

    // Migrate existing portfolios to have OWNER permission for their current account
    await queryRunner.query(`
      INSERT INTO portfolio_permissions (portfolio_id, account_id, permission_type, granted_by, granted_at)
      SELECT 
        portfolio_id, 
        account_id, 
        'OWNER' as permission_type,
        account_id as granted_by,
        created_at as granted_at
      FROM portfolios
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_portfolio_permissions_permission_type`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_portfolio_permissions_account_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_portfolio_permissions_portfolio_id`);
    
    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS portfolio_permissions`);
  }
}
