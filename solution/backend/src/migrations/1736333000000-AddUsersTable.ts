import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUsersTable1736333000000 implements MigrationInterface {
  name = 'AddUsersTable1736333000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "user_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "username" character varying(255) NOT NULL,
        "email" character varying(255),
        "password_hash" character varying(255),
        "full_name" character varying(255),
        "phone" character varying(20),
        "date_of_birth" date,
        "address" text,
        "avatar_text" character varying(10),
        "is_email_verified" boolean NOT NULL DEFAULT false,
        "is_profile_complete" boolean NOT NULL DEFAULT false,
        "is_password_set" boolean NOT NULL DEFAULT false,
        "email_verification_token" character varying(255),
        "last_login" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("user_id"),
        CONSTRAINT "UQ_users_username" UNIQUE ("username"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX "IDX_users_username" ON "users" ("username")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email")`);

    // Add user_id column to accounts table
    await queryRunner.query(`
      ALTER TABLE "accounts" 
      ADD COLUMN "user_id" uuid
    `);

    // Add foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "accounts" 
      ADD CONSTRAINT "FK_accounts_user_id" 
      FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE SET NULL
    `);

    // Create index for user_id in accounts
    await queryRunner.query(`CREATE INDEX "IDX_accounts_user_id" ON "accounts" ("user_id")`);

    // Add foreign key to trusted_devices table if it exists (created earlier)
    const trustedDevicesExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'trusted_devices'
      )
    `);

    if (trustedDevicesExists[0]?.exists) {
      // Check if foreign key already exists
      const fkExists = await queryRunner.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'FK_d80738022e4cedca17a9fc25982' 
          AND table_name = 'trusted_devices'
        )
      `);

      if (!fkExists[0]?.exists) {
        await queryRunner.query(`
          ALTER TABLE "trusted_devices" 
          ADD CONSTRAINT "FK_d80738022e4cedca17a9fc25982" 
          FOREIGN KEY ("user_id") REFERENCES "users"("user_id") 
          ON DELETE CASCADE ON UPDATE CASCADE
        `);
        console.log('✅ Added foreign key constraint to trusted_devices table');
      }
    }

    // Add foreign keys to user_roles table if it exists (created earlier)
    const userRolesExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_roles'
      )
    `);

    if (userRolesExists[0]?.exists) {
      // Check if foreign key already exists
      const fkUserIdExists = await queryRunner.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'FK_user_roles_user_id' 
          AND table_name = 'user_roles'
        )
      `);

      if (!fkUserIdExists[0]?.exists) {
        await queryRunner.query(`
          ALTER TABLE "user_roles" 
          ADD CONSTRAINT "FK_user_roles_user_id" 
          FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE
        `);
        console.log('✅ Added foreign key constraint FK_user_roles_user_id');
      }

      const fkAssignedByExists = await queryRunner.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'FK_user_roles_assigned_by' 
          AND table_name = 'user_roles'
        )
      `);

      if (!fkAssignedByExists[0]?.exists) {
        await queryRunner.query(`
          ALTER TABLE "user_roles" 
          ADD CONSTRAINT "FK_user_roles_assigned_by" 
          FOREIGN KEY ("assigned_by") REFERENCES "users"("user_id") ON DELETE SET NULL
        `);
        console.log('✅ Added foreign key constraint FK_user_roles_assigned_by');
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove foreign key constraint
    await queryRunner.query(`ALTER TABLE "accounts" DROP CONSTRAINT "FK_accounts_user_id"`);
    
    // Remove user_id column from accounts
    await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "user_id"`);
    
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_accounts_user_id"`);
    await queryRunner.query(`DROP INDEX "IDX_users_email"`);
    await queryRunner.query(`DROP INDEX "IDX_users_username"`);
    
    // Drop users table
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
