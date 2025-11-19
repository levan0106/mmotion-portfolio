import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to change note_date column from date to timestamp
 * This allows storing date and time instead of just date
 */
export class ChangeNoteDateToTimestamp1765000000000 implements MigrationInterface {
  name = 'ChangeNoteDateToTimestamp1765000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if notes table exists
    const notesExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notes'
      )
    `);

    if (!notesExists[0]?.exists) {
      console.log('⚠️ notes table does not exist, skipping migration');
      return;
    }

    // Check current column type
    const columnInfo = await queryRunner.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'notes' 
      AND column_name = 'note_date'
    `);

    if (columnInfo.length === 0) {
      console.log('⚠️ note_date column does not exist, skipping migration');
      return;
    }

    const currentType = columnInfo[0]?.data_type;

    if (currentType === 'timestamp without time zone' || currentType === 'timestamp') {
      console.log('✅ note_date is already timestamp, skipping migration');
      return;
    }

    // Change column type from date to timestamp
    console.log('Changing note_date column from date to timestamp...');
    await queryRunner.query(`
      ALTER TABLE "notes" 
      ALTER COLUMN "note_date" TYPE TIMESTAMP USING "note_date"::timestamp
    `);

    console.log('✅ note_date column changed to timestamp successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Check if notes table exists
    const notesExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notes'
      )
    `);

    if (!notesExists[0]?.exists) {
      console.log('⚠️ notes table does not exist, skipping rollback');
      return;
    }

    // Revert column type from timestamp to date
    console.log('Reverting note_date column from timestamp to date...');
    await queryRunner.query(`
      ALTER TABLE "notes" 
      ALTER COLUMN "note_date" TYPE date USING "note_date"::date
    `);

    console.log('✅ note_date column reverted to date successfully');
  }
}

