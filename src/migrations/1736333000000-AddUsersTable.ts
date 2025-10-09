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
