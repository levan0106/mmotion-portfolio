import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPortfolioVisibilityPermission1736400001000 implements MigrationInterface {
  name = 'AddPortfolioVisibilityPermission1736400001000';

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
      console.log('⚠️ permissions or roles tables do not exist, skipping portfolio visibility permission');
      return;
    }

    // Add portfolio.visibility.manage permission
    await queryRunner.query(`
      INSERT INTO "permissions" ("name", "display_name", "description", "category", "is_system_permission", "priority") VALUES
      ('portfolio.visibility.manage', 'Manage Portfolio Visibility', 'Manage portfolio visibility settings (public/private)', 'portfolio_management', true, 100)
      ON CONFLICT (name) DO NOTHING
    `);

    // Assign portfolio.visibility.manage permission to super_admin and admin roles
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r.role_id, p.permission_id
      FROM "roles" r, "permissions" p
      WHERE r.name IN ('super_admin', 'admin') AND p.name = 'portfolio.visibility.manage'
      ON CONFLICT (role_id, permission_id) DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove role_permissions assignments
    await queryRunner.query(`
      DELETE FROM "role_permissions" 
      WHERE permission_id IN (
        SELECT permission_id FROM "permissions" 
        WHERE name = 'portfolio.visibility.manage'
      )
    `);

    // Remove the permission
    await queryRunner.query(`
      DELETE FROM "permissions" 
      WHERE name = 'portfolio.visibility.manage'
    `);
  }
}
