import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProductionPermissionsUpdate1736337000000 implements MigrationInterface {
  name = 'ProductionPermissionsUpdate1736337000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if permissions and roles tables exist
    const permissionsExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'permissions'
      )
    `);

    const rolesExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'roles'
      )
    `);

    if (!permissionsExists[0]?.exists || !rolesExists[0]?.exists) {
      console.log('⚠️ permissions or roles tables do not exist, skipping production permissions update');
      return;
    }

    // Add roles.manage_users permission
    await queryRunner.query(`
      INSERT INTO "permissions" ("name", "display_name", "description", "category", "is_system_permission", "priority") VALUES
      ('roles.manage_users', 'Manage Role Users', 'Assign and remove users from roles', 'user_management', true, 100)
      ON CONFLICT (name) DO NOTHING
    `);

    // Add Financial Data Snapshot Management permissions
    await queryRunner.query(`
      INSERT INTO "permissions" ("name", "display_name", "description", "category", "is_system_permission", "priority") VALUES
      ('financial.snapshots.create', 'Create Financial Snapshots', 'Create new financial data snapshots', 'financial_data', true, 100),
      ('financial.snapshots.read', 'View Financial Snapshots', 'View financial snapshot data and history', 'financial_data', true, 90),
      ('financial.snapshots.update', 'Update Financial Snapshots', 'Update financial snapshot data and settings', 'financial_data', true, 80),
      ('financial.snapshots.delete', 'Delete Financial Snapshots', 'Delete financial snapshots and related data', 'financial_data', true, 70),
      ('financial.snapshots.manage', 'Manage Financial Snapshots', 'Full management of financial snapshots', 'financial_data', true, 100),
      ('financial.snapshots.export', 'Export Financial Snapshots', 'Export financial snapshot data and reports', 'financial_data', true, 85),
      ('financial.snapshots.compare', 'Compare Financial Snapshots', 'Compare different financial snapshots', 'financial_data', true, 75),
      ('financial.snapshots.restore', 'Restore Financial Snapshots', 'Restore from previous financial snapshots', 'financial_data', true, 95)
      ON CONFLICT (name) DO NOTHING
    `);

    // Add Global Assets Management permissions
    await queryRunner.query(`
      INSERT INTO "permissions" ("name", "display_name", "description", "category", "is_system_permission", "priority") VALUES
      ('global_assets.create', 'Create Global Assets', 'Create new global assets in the system', 'global_assets', true, 100),
      ('global_assets.read', 'View Global Assets', 'View global asset information and data', 'global_assets', true, 90),
      ('global_assets.update', 'Update Global Assets', 'Update global asset data and settings', 'global_assets', true, 80),
      ('global_assets.delete', 'Delete Global Assets', 'Delete global assets from the system', 'global_assets', true, 70),
      ('global_assets.manage', 'Manage Global Assets', 'Full management of global assets', 'global_assets', true, 100),
      ('global_assets.prices', 'Manage Global Asset Prices', 'Update and manage global asset prices', 'global_assets', true, 90),
      ('global_assets.categories', 'Manage Asset Categories', 'Manage global asset categories and classifications', 'global_assets', true, 85),
      ('global_assets.import', 'Import Global Assets', 'Import global assets from external sources', 'global_assets', true, 95),
      ('global_assets.export', 'Export Global Assets', 'Export global asset data and reports', 'global_assets', true, 85),
      ('global_assets.sync', 'Sync Global Assets', 'Synchronize global assets with external data sources', 'global_assets', true, 90)
      ON CONFLICT (name) DO NOTHING
    `);

    // Assign roles.manage_users permission to super_admin and admin roles
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r.role_id, p.permission_id
      FROM "roles" r, "permissions" p
      WHERE r.name IN ('super_admin', 'admin') AND p.name = 'roles.manage_users'
      ON CONFLICT (role_id, permission_id) DO NOTHING
    `);

    // Assign Financial Snapshot permissions to super_admin role
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r.role_id, p.permission_id
      FROM "roles" r, "permissions" p
      WHERE r.name = 'super_admin' 
      AND p.name IN (
        'financial.snapshots.create',
        'financial.snapshots.read',
        'financial.snapshots.update',
        'financial.snapshots.delete',
        'financial.snapshots.manage',
        'financial.snapshots.export',
        'financial.snapshots.compare',
        'financial.snapshots.restore'
      )
      ON CONFLICT (role_id, permission_id) DO NOTHING
    `);

    // Assign Global Assets permissions to super_admin role
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r.role_id, p.permission_id
      FROM "roles" r, "permissions" p
      WHERE r.name = 'super_admin' 
      AND p.name IN (
        'global_assets.create',
        'global_assets.read',
        'global_assets.update',
        'global_assets.delete',
        'global_assets.manage',
        'global_assets.prices',
        'global_assets.categories',
        'global_assets.import',
        'global_assets.export',
        'global_assets.sync'
      )
      ON CONFLICT (role_id, permission_id) DO NOTHING
    `);

    // Assign Financial Snapshot permissions to admin role (except restore)
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r.role_id, p.permission_id
      FROM "roles" r, "permissions" p
      WHERE r.name = 'admin' 
      AND p.name IN (
        'financial.snapshots.create',
        'financial.snapshots.read',
        'financial.snapshots.update',
        'financial.snapshots.delete',
        'financial.snapshots.manage',
        'financial.snapshots.export',
        'financial.snapshots.compare'
      )
      ON CONFLICT (role_id, permission_id) DO NOTHING
    `);

    // Assign Global Assets permissions to admin role
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r.role_id, p.permission_id
      FROM "roles" r, "permissions" p
      WHERE r.name = 'admin' 
      AND p.name IN (
        'global_assets.create',
        'global_assets.read',
        'global_assets.update',
        'global_assets.delete',
        'global_assets.manage',
        'global_assets.prices',
        'global_assets.categories',
        'global_assets.import',
        'global_assets.export',
        'global_assets.sync'
      )
      ON CONFLICT (role_id, permission_id) DO NOTHING
    `);

    // Assign read-only permissions to manager role
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r.role_id, p.permission_id
      FROM "roles" r, "permissions" p
      WHERE r.name = 'manager' 
      AND p.name IN (
        'financial.snapshots.read',
        'financial.snapshots.export',
        'financial.snapshots.compare',
        'global_assets.read',
        'global_assets.export'
      )
      ON CONFLICT (role_id, permission_id) DO NOTHING
    `);

    // Assign read-only permissions to analyst role
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r.role_id, p.permission_id
      FROM "roles" r, "permissions" p
      WHERE r.name = 'analyst' 
      AND p.name IN (
        'financial.snapshots.read',
        'financial.snapshots.export',
        'financial.snapshots.compare',
        'global_assets.read',
        'global_assets.export'
      )
      ON CONFLICT (role_id, permission_id) DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove permissions from role_permissions first
    await queryRunner.query(`
      DELETE FROM "role_permissions" 
      WHERE "permission_id" IN (
        SELECT "permission_id" FROM "permissions" 
        WHERE "name" IN (
          'roles.manage_users',
          'financial.snapshots.create',
          'financial.snapshots.read',
          'financial.snapshots.update',
          'financial.snapshots.delete',
          'financial.snapshots.manage',
          'financial.snapshots.export',
          'financial.snapshots.compare',
          'financial.snapshots.restore',
          'global_assets.create',
          'global_assets.read',
          'global_assets.update',
          'global_assets.delete',
          'global_assets.manage',
          'global_assets.prices',
          'global_assets.categories',
          'global_assets.import',
          'global_assets.export',
          'global_assets.sync'
        )
      )
    `);

    // Remove the permissions
    await queryRunner.query(`
      DELETE FROM "permissions" 
      WHERE "name" IN (
        'roles.manage_users',
        'financial.snapshots.create',
        'financial.snapshots.read',
        'financial.snapshots.update',
        'financial.snapshots.delete',
        'financial.snapshots.manage',
        'financial.snapshots.export',
        'financial.snapshots.compare',
        'financial.snapshots.restore',
        'global_assets.create',
        'global_assets.read',
        'global_assets.update',
        'global_assets.delete',
        'global_assets.manage',
        'global_assets.prices',
        'global_assets.categories',
        'global_assets.import',
        'global_assets.export',
        'global_assets.sync'
      )
    `);
  }
}
