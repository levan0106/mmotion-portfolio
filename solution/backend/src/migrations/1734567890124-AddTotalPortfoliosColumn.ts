import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTotalPortfoliosColumn1734567890124 implements MigrationInterface {
  name = 'AddTotalPortfoliosColumn1734567890124';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if snapshot_tracking table exists
    const tableExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'snapshot_tracking'
      )
    `);

    if (!tableExists[0]?.exists) {
      console.log('⚠️ snapshot_tracking table does not exist, skipping total_portfolios column addition');
      return;
    }

    // Check if column already exists
    const columnExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'snapshot_tracking' 
        AND column_name = 'total_portfolios'
      )
    `);

    if (!columnExists[0]?.exists) {
      await queryRunner.query(`
        ALTER TABLE snapshot_tracking 
        ADD COLUMN total_portfolios INTEGER DEFAULT 0
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE snapshot_tracking 
      DROP COLUMN total_portfolios
    `);
  }
}
