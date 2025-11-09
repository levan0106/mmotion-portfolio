import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateNotificationsTable1760425876302 implements MigrationInterface {
    name = 'CreateNotificationsTable1760425876302'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop existing table if exists
        await queryRunner.query(`DROP TABLE IF EXISTS "notifications" CASCADE`);
        
        // Create notifications table with proper snake_case schema
        await queryRunner.query(`CREATE TABLE "notifications" (
            "id" SERIAL PRIMARY KEY,
            "user_id" character varying NOT NULL,
            "type" character varying NOT NULL,
            "title" character varying NOT NULL,
            "message" character varying NOT NULL,
            "is_read" boolean NOT NULL DEFAULT false,
            "action_url" character varying,
            "metadata" json,
            "created_at" TIMESTAMP NOT NULL DEFAULT now()
        )`);
        
        // Create indexes
        await queryRunner.query(`CREATE INDEX "IDX_notifications_user_id" ON "notifications" ("user_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_notifications_type" ON "notifications" ("type")`);
        await queryRunner.query(`CREATE INDEX "IDX_notifications_is_read" ON "notifications" ("is_read")`);
        await queryRunner.query(`CREATE INDEX "IDX_notifications_created_at" ON "notifications" ("created_at")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notifications_created_at"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notifications_is_read"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notifications_type"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notifications_user_id"`);
        
        // Drop table
        await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
    }
}
