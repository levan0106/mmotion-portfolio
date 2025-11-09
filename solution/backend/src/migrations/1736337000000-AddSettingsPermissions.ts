import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSettingsPermissions1736337000000 implements MigrationInterface {
  name = 'AddSettingsPermissions1736337000000';

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
      console.log('⚠️ permissions or roles tables do not exist, skipping settings permissions');
      return;
    }

    // Add settings permissions
    await queryRunner.query(`
      INSERT INTO permissions (permission_id, name, display_name, description, category, created_at, updated_at)
      VALUES 
        (uuid_generate_v4(), 'settings.read', 'Read Settings', 'View system settings', 'SYSTEM', NOW(), NOW()),
        (uuid_generate_v4(), 'settings.update', 'Update Settings', 'Modify system settings', 'SYSTEM', NOW(), NOW())
      ON CONFLICT (name) DO NOTHING
    `);

    // Assign settings permissions to super_admin role
    await queryRunner.query(`
      INSERT INTO role_permissions (role_id, permission_id, created_at)
      SELECT r.role_id, p.permission_id, NOW()
      FROM roles r, permissions p
      WHERE r.name = 'super_admin' 
        AND p.name IN ('settings.read', 'settings.update')
      ON CONFLICT (role_id, permission_id) DO NOTHING
    `);

    // Assign settings permissions to admin role
    await queryRunner.query(`
      INSERT INTO role_permissions (role_id, permission_id, created_at)
      SELECT r.role_id, p.permission_id, NOW()
      FROM roles r, permissions p
      WHERE r.name = 'admin' 
        AND p.name IN ('settings.read', 'settings.update')
      ON CONFLICT (role_id, permission_id) DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove settings permissions from roles
    await queryRunner.query(`
      DELETE FROM role_permissions 
      WHERE permission_id IN (
        SELECT permission_id FROM permissions 
        WHERE name IN ('settings.read', 'settings.update')
      )
    `);

    // Remove settings permissions
    await queryRunner.query(`
      DELETE FROM permissions 
      WHERE name IN ('settings.read', 'settings.update')
    `);
  }
}
