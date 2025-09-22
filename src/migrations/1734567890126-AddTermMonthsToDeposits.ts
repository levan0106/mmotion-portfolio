import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTermMonthsToDeposits1734567890126 implements MigrationInterface {
  name = 'AddTermMonthsToDeposits1734567890126';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE deposits 
      ADD COLUMN term_months INTEGER
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE deposits 
      DROP COLUMN IF EXISTS term_months
    `);
  }
}
