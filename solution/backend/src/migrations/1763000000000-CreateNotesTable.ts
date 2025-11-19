import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotesTable1763000000000 implements MigrationInterface {
  name = 'CreateNotesTable1763000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if portfolios table exists
    const portfoliosExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'portfolios'
      )
    `);

    if (!portfoliosExists[0]?.exists) {
      console.log('⚠️ portfolios table does not exist, skipping notes table creation');
      return;
    }

    // Check if notes table already exists
    const notesExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notes'
      )
    `);

    if (notesExists[0]?.exists) {
      console.log('✅ notes table already exists, skipping');
      return;
    }

    // Create notes table
    console.log('Creating notes table...');
    await queryRunner.query(`
      CREATE TABLE "notes" (
        "note_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "portfolio_id" uuid NOT NULL,
        "asset_id" uuid NULL,
        "note_date" TIMESTAMP NOT NULL,
        "content" text NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notes" PRIMARY KEY ("note_id"),
        CONSTRAINT "FK_notes_portfolio" FOREIGN KEY ("portfolio_id") 
          REFERENCES "portfolios"("portfolio_id") ON DELETE CASCADE,
        CONSTRAINT "FK_notes_asset" FOREIGN KEY ("asset_id") 
          REFERENCES "assets"("id") ON DELETE CASCADE
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_notes_portfolio_id" ON "notes" ("portfolio_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_notes_asset_id" ON "notes" ("asset_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_notes_portfolio_asset" ON "notes" ("portfolio_id", "asset_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_notes_created_at" ON "notes" ("created_at")
    `);

    console.log('✅ notes table created successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_notes_created_at"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_notes_portfolio_asset"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_notes_asset_id"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_notes_portfolio_id"
    `);

    // Drop table
    await queryRunner.query(`
      DROP TABLE IF EXISTS "notes"
    `);
  }
}

