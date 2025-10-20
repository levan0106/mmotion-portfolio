import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateFailedSymbolsTable1703123456801 implements MigrationInterface {
  name = 'CreateFailedSymbolsTable1703123456801';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if table already exists
    const tableExists = await queryRunner.hasTable('failed_symbols');
    if (tableExists) {
      console.log('Table failed_symbols already exists, skipping creation');
      return;
    }

    // Create failed_symbols table
    await queryRunner.createTable(
      new Table({
        name: 'failed_symbols',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'execution_id',
            type: 'varchar',
            length: '100',
            isNullable: false,
            comment: 'Execution ID this failed symbol belongs to',
          },
          {
            name: 'symbol',
            type: 'varchar',
            length: '50',
            isNullable: false,
            comment: 'Symbol that failed',
          },
          {
            name: 'provider',
            type: 'varchar',
            length: '100',
            isNullable: false,
            comment: 'API provider that failed',
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
            comment: 'Error message for this symbol',
          },
          {
            name: 'error_code',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'Error code for this symbol',
          },
          {
            name: 'retry_count',
            type: 'int',
            default: 0,
            isNullable: false,
            comment: 'Number of retry attempts',
          },
          {
            name: 'last_retry_at',
            type: 'timestamp with time zone',
            isNullable: true,
            comment: 'When this symbol was last retried',
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
            comment: 'When this record was created',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
            comment: 'When this record was last updated',
          },
        ],
      }),
      true,
    );

    // Create indexes using raw SQL
    await queryRunner.query(`CREATE INDEX "IDX_failed_symbols_execution_id" ON "failed_symbols" ("execution_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_failed_symbols_symbol" ON "failed_symbols" ("symbol")`);
    await queryRunner.query(`CREATE INDEX "IDX_failed_symbols_provider" ON "failed_symbols" ("provider")`);
    await queryRunner.query(`CREATE INDEX "IDX_failed_symbols_created_at" ON "failed_symbols" ("created_at")`);

    // Add foreign key constraint only if global_asset_tracking table exists
    const globalAssetTrackingExists = await queryRunner.hasTable('global_asset_tracking');
    if (globalAssetTrackingExists) {
      try {
        await queryRunner.query(`ALTER TABLE "failed_symbols" ADD CONSTRAINT "FK_failed_symbols_execution_id" FOREIGN KEY ("execution_id") REFERENCES "global_asset_tracking"("execution_id") ON DELETE CASCADE`);
        console.log('Created foreign key constraint FK_failed_symbols_execution_id');
      } catch (error) {
        console.log('Failed to create foreign key constraint FK_failed_symbols_execution_id:', error.message);
      }
    } else {
      console.log('Table global_asset_tracking does not exist yet, skipping foreign key constraint creation');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraint
    await queryRunner.query(`ALTER TABLE "failed_symbols" DROP CONSTRAINT IF EXISTS "FK_failed_symbols_execution_id"`);

    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_failed_symbols_execution_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_failed_symbols_symbol"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_failed_symbols_provider"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_failed_symbols_created_at"`);

    // Drop table
    await queryRunner.dropTable('failed_symbols');
  }
}
