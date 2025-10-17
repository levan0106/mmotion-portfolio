import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTotalPortfoliosColumn1734567890124 implements MigrationInterface {
  name = 'AddTotalPortfoliosColumn1734567890124';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE snapshot_tracking 
      ADD COLUMN total_portfolios INTEGER DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE snapshot_tracking 
      DROP COLUMN total_portfolios
    `);
  }
}
