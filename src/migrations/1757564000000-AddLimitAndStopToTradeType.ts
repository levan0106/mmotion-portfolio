import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLimitAndStopToTradeType1757564000000 implements MigrationInterface {
  name = 'AddLimitAndStopToTradeType1757564000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if LIMIT value already exists
    const limitExists = await queryRunner.query(`
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'LIMIT' 
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'trades_trade_type_enum')
    `);

    if (limitExists.length === 0) {
      await queryRunner.query(`ALTER TYPE "public"."trades_trade_type_enum" ADD VALUE 'LIMIT'`);
    }

    // Check if STOP value already exists
    const stopExists = await queryRunner.query(`
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'STOP' 
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'trades_trade_type_enum')
    `);

    if (stopExists.length === 0) {
      await queryRunner.query(`ALTER TYPE "public"."trades_trade_type_enum" ADD VALUE 'STOP'`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Note: PostgreSQL doesn't support removing enum values directly
    // This would require recreating the enum type and updating all references
    // For now, we'll leave the values in place as they don't cause issues
    console.log('Warning: Cannot remove enum values in PostgreSQL. LIMIT and STOP values will remain in the enum.');
  }
}
