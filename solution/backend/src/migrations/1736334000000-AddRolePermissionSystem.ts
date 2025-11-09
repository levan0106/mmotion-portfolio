import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRolePermissionSystem1736334000000 implements MigrationInterface {
  name = 'AddRolePermissionSystem1736334000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create roles table
    await queryRunner.query(`
      CREATE TABLE "roles" (
        "role_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(50) NOT NULL,
        "display_name" character varying(100) NOT NULL,
        "description" text,
        "is_system_role" boolean NOT NULL DEFAULT false,
        "priority" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_roles" PRIMARY KEY ("role_id"),
        CONSTRAINT "UQ_roles_name" UNIQUE ("name")
      )
    `);

    // Create permissions table
    await queryRunner.query(`
      CREATE TABLE "permissions" (
        "permission_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "display_name" character varying(150) NOT NULL,
        "description" text,
        "category" character varying(50) NOT NULL,
        "is_system_permission" boolean NOT NULL DEFAULT false,
        "priority" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_permissions" PRIMARY KEY ("permission_id"),
        CONSTRAINT "UQ_permissions_name" UNIQUE ("name")
      )
    `);

    // Create user_roles table
    await queryRunner.query(`
      CREATE TABLE "user_roles" (
        "user_role_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "role_id" uuid NOT NULL,
        "assigned_by" uuid,
        "assigned_at" TIMESTAMP NOT NULL DEFAULT now(),
        "expires_at" TIMESTAMP,
        "is_active" boolean NOT NULL DEFAULT true,
        "metadata" jsonb,
        CONSTRAINT "PK_user_roles" PRIMARY KEY ("user_role_id"),
        CONSTRAINT "UQ_user_roles_user_role" UNIQUE ("user_id", "role_id")
      )
    `);

    // Create role_permissions table
    await queryRunner.query(`
      CREATE TABLE "role_permissions" (
        "role_permission_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "role_id" uuid NOT NULL,
        "permission_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_role_permissions" PRIMARY KEY ("role_permission_id"),
        CONSTRAINT "UQ_role_permissions_role_permission" UNIQUE ("role_id", "permission_id")
      )
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX "IDX_roles_name" ON "roles" ("name")`);
    await queryRunner.query(`CREATE INDEX "IDX_roles_is_system_role" ON "roles" ("is_system_role")`);
    await queryRunner.query(`CREATE INDEX "IDX_permissions_name" ON "permissions" ("name")`);
    await queryRunner.query(`CREATE INDEX "IDX_permissions_category" ON "permissions" ("category")`);
    await queryRunner.query(`CREATE INDEX "IDX_user_roles_user_id" ON "user_roles" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_user_roles_role_id" ON "user_roles" ("role_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_user_roles_is_active" ON "user_roles" ("is_active")`);
    await queryRunner.query(`CREATE INDEX "IDX_user_roles_expires_at" ON "user_roles" ("expires_at")`);

    // Add foreign key constraints (only if users table exists)
    const usersExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      )
    `);

    if (usersExists[0]?.exists) {
      await queryRunner.query(`
        ALTER TABLE "user_roles" 
        ADD CONSTRAINT "FK_user_roles_user_id" 
        FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE
      `);

      await queryRunner.query(`
        ALTER TABLE "user_roles" 
        ADD CONSTRAINT "FK_user_roles_assigned_by" 
        FOREIGN KEY ("assigned_by") REFERENCES "users"("user_id") ON DELETE SET NULL
      `);
    } else {
      console.log('⚠️ users table does not exist, creating user_roles without foreign keys');
      console.log('   Foreign keys will be added when users table is created');
    }

    await queryRunner.query(`
      ALTER TABLE "user_roles" 
      ADD CONSTRAINT "FK_user_roles_role_id" 
      FOREIGN KEY ("role_id") REFERENCES "roles"("role_id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "role_permissions" 
      ADD CONSTRAINT "FK_role_permissions_role_id" 
      FOREIGN KEY ("role_id") REFERENCES "roles"("role_id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "role_permissions" 
      ADD CONSTRAINT "FK_role_permissions_permission_id" 
      FOREIGN KEY ("permission_id") REFERENCES "permissions"("permission_id") ON DELETE CASCADE
    `);

    // Seed default roles
    await queryRunner.query(`
      INSERT INTO "roles" ("name", "display_name", "description", "is_system_role", "priority") VALUES
      ('super_admin', 'Super Administrator', 'Full system access with all permissions', true, 100),
      ('admin', 'Administrator', 'System administration with user and role management', true, 90),
      ('manager', 'Manager', 'Portfolio and user management within scope', true, 80),
      ('analyst', 'Analyst', 'Data analysis and reporting capabilities', true, 70),
      ('investor', 'Investor', 'Portfolio management and trading capabilities', true, 60),
      ('viewer', 'Viewer', 'Read-only access to assigned data', true, 50)
    `);

    // Seed default permissions
    await queryRunner.query(`
      INSERT INTO "permissions" ("name", "display_name", "description", "category", "is_system_permission", "priority") VALUES
      -- User Management
      ('users.create', 'Create Users', 'Create new user accounts', 'user_management', true, 100),
      ('users.read', 'View Users', 'View user information and profiles', 'user_management', true, 90),
      ('users.update', 'Update Users', 'Update user profiles and settings', 'user_management', true, 80),
      ('users.delete', 'Delete Users', 'Delete user accounts', 'user_management', true, 70),
      ('users.manage_roles', 'Manage User Roles', 'Assign and remove roles from users', 'user_management', true, 100),
      
      -- Portfolio Management
      ('portfolios.create', 'Create Portfolios', 'Create new portfolios', 'portfolio_management', true, 100),
      ('portfolios.read', 'View Portfolios', 'View portfolio data and analytics', 'portfolio_management', true, 90),
      ('portfolios.update', 'Update Portfolios', 'Update portfolio settings and configuration', 'portfolio_management', true, 80),
      ('portfolios.delete', 'Delete Portfolios', 'Delete portfolios and related data', 'portfolio_management', true, 70),
      ('portfolios.manage_users', 'Manage Portfolio Users', 'Assign users to portfolios', 'portfolio_management', true, 90),
      
      -- Trading Operations
      ('trades.create', 'Execute Trades', 'Execute buy and sell orders', 'trading_operations', true, 100),
      ('trades.read', 'View Trades', 'View trade history and details', 'trading_operations', true, 90),
      ('trades.update', 'Update Trades', 'Modify pending trades and orders', 'trading_operations', true, 80),
      ('trades.delete', 'Cancel Trades', 'Cancel pending trades and orders', 'trading_operations', true, 70),
      ('trades.approve', 'Approve Trades', 'Approve large or sensitive trades', 'trading_operations', true, 100),
      
      -- Asset Management
      ('assets.create', 'Create Assets', 'Add new assets to the system', 'asset_management', true, 100),
      ('assets.read', 'View Assets', 'View asset information and prices', 'asset_management', true, 90),
      ('assets.update', 'Update Assets', 'Update asset data and settings', 'asset_management', true, 80),
      ('assets.delete', 'Delete Assets', 'Remove assets from the system', 'asset_management', true, 70),
      ('assets.manage_prices', 'Manage Asset Prices', 'Update and manage asset prices', 'asset_management', true, 90),
      
      -- Financial Data
      ('financial.read', 'View Financial Data', 'Access financial reports and data', 'financial_data', true, 90),
      ('financial.export', 'Export Financial Data', 'Export financial data and reports', 'financial_data', true, 80),
      ('financial.audit', 'Audit Financial Data', 'Access audit logs and financial history', 'financial_data', true, 100),
      ('financial.reconcile', 'Reconcile Accounts', 'Reconcile financial accounts and transactions', 'financial_data', true, 100),
      
      -- System Administration
      ('system.settings', 'System Settings', 'Configure system settings and parameters', 'system_administration', true, 100),
      ('system.logs', 'View System Logs', 'Access system logs and monitoring data', 'system_administration', true, 90),
      ('system.backup', 'System Backup', 'Perform system backup and restore operations', 'system_administration', true, 100),
      ('system.monitor', 'System Monitoring', 'Monitor system health and performance', 'system_administration', true, 90),
      
      -- Role Management
      ('roles.create', 'Create Roles', 'Create new user roles', 'user_management', true, 100),
      ('roles.read', 'View Roles', 'View role information and assignments', 'user_management', true, 90),
      ('roles.update', 'Update Roles', 'Update role properties and settings', 'user_management', true, 80),
      ('roles.delete', 'Delete Roles', 'Delete user roles', 'user_management', true, 70),
      ('roles.manage_permissions', 'Manage Role Permissions', 'Assign and remove permissions from roles', 'user_management', true, 100),
      
      -- Permission Management
      ('permissions.create', 'Create Permissions', 'Create new system permissions', 'user_management', true, 100),
      ('permissions.read', 'View Permissions', 'View permission information and assignments', 'user_management', true, 90),
      ('permissions.update', 'Update Permissions', 'Update permission properties and settings', 'user_management', true, 80),
      ('permissions.delete', 'Delete Permissions', 'Delete system permissions', 'user_management', true, 70)
    `);

    // Assign permissions to roles
    // Super Admin gets all permissions
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r.role_id, p.permission_id
      FROM "roles" r, "permissions" p
      WHERE r.name = 'super_admin'
    `);

    // Admin gets most permissions except super admin specific ones
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r.role_id, p.permission_id
      FROM "roles" r, "permissions" p
      WHERE r.name = 'admin' 
      AND p.name NOT IN ('system.backup', 'system.settings')
    `);

    // Manager gets portfolio and user management permissions
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r.role_id, p.permission_id
      FROM "roles" r, "permissions" p
      WHERE r.name = 'manager' 
      AND p.category IN ('user_management', 'portfolio_management', 'trading_operations', 'asset_management', 'financial_data')
      AND p.name NOT IN ('users.delete', 'portfolios.delete', 'trades.delete', 'assets.delete')
    `);

    // Analyst gets read and analysis permissions
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r.role_id, p.permission_id
      FROM "roles" r, "permissions" p
      WHERE r.name = 'analyst' 
      AND p.name IN ('users.read', 'portfolios.read', 'trades.read', 'assets.read', 'financial.read', 'financial.export')
    `);

    // Investor gets portfolio and trading permissions
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r.role_id, p.permission_id
      FROM "roles" r, "permissions" p
      WHERE r.name = 'investor' 
      AND p.name IN ('portfolios.read', 'portfolios.update', 'trades.create', 'trades.read', 'trades.update', 'trades.delete', 'assets.read', 'financial.read')
    `);

    // Viewer gets read-only permissions
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r.role_id, p.permission_id
      FROM "roles" r, "permissions" p
      WHERE r.name = 'viewer' 
      AND p.name IN ('portfolios.read', 'trades.read', 'assets.read', 'financial.read')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_role_permissions_permission_id"`);
    await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_role_permissions_role_id"`);
    await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_user_roles_assigned_by"`);
    await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_user_roles_role_id"`);
    await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_user_roles_user_id"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "role_permissions"`);
    await queryRunner.query(`DROP TABLE "user_roles"`);
    await queryRunner.query(`DROP TABLE "permissions"`);
    await queryRunner.query(`DROP TABLE "roles"`);
  }
}
