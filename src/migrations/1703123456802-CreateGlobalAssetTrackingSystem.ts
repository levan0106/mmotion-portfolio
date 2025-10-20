import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateGlobalAssetTrackingSystem1703123456802 implements MigrationInterface {
  name = 'CreateGlobalAssetTrackingSystem1703123456802';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if global_asset_tracking table already exists
    const globalAssetTrackingExists = await queryRunner.hasTable('global_asset_tracking');
    if (globalAssetTrackingExists) {
      console.log('Table global_asset_tracking already exists, skipping creation');
    } else {
      // Create global_asset_tracking table
      await queryRunner.createTable(
        new Table({
          name: 'global_asset_tracking',
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
              isUnique: true,
              isNullable: false,
              comment: 'Unique execution ID for this sync operation',
            },
            {
              name: 'status',
              type: 'enum',
              enum: ['started', 'in_progress', 'completed', 'failed', 'cancelled'],
              default: "'started'",
              isNullable: false,
              comment: 'Current status of the sync operation',
            },
            {
              name: 'type',
              type: 'enum',
              enum: ['scheduled', 'manual', 'triggered'],
              default: "'scheduled'",
              isNullable: false,
              comment: 'Type of sync operation',
            },
            {
              name: 'source',
              type: 'enum',
              enum: ['cron_job', 'api_trigger', 'manual_trigger', 'system_recovery'],
              default: "'cron_job'",
              isNullable: false,
              comment: 'Source that triggered the sync',
            },
            {
              name: 'started_at',
              type: 'timestamp with time zone',
              isNullable: true,
              comment: 'When the sync operation started',
            },
            {
              name: 'completed_at',
              type: 'timestamp with time zone',
              isNullable: true,
              comment: 'When the sync operation completed',
            },
            {
              name: 'execution_time_ms',
              type: 'bigint',
              default: 0,
              isNullable: false,
              comment: 'Total execution time in milliseconds',
            },
            {
              name: 'total_symbols',
              type: 'int',
              default: 0,
              isNullable: false,
              comment: 'Total number of symbols processed',
            },
            {
              name: 'successful_updates',
              type: 'int',
              default: 0,
              isNullable: false,
              comment: 'Number of symbols successfully updated',
            },
            {
              name: 'failed_updates',
              type: 'int',
              default: 0,
              isNullable: false,
              comment: 'Number of symbols that failed to update',
            },
            {
              name: 'success_rate',
              type: 'decimal',
              precision: 5,
              scale: 2,
              default: 0,
              isNullable: false,
              comment: 'Success rate percentage',
            },
            {
              name: 'total_apis',
              type: 'int',
              default: 0,
              isNullable: false,
              comment: 'Number of external APIs used',
            },
            {
              name: 'successful_apis',
              type: 'int',
              default: 0,
              isNullable: false,
              comment: 'Number of APIs that succeeded',
            },
            {
              name: 'failed_apis',
              type: 'int',
              default: 0,
              isNullable: false,
              comment: 'Number of APIs that failed',
            },
            {
              name: 'failed_symbols',
              type: 'jsonb',
              isNullable: true,
              comment: 'List of symbols that failed to sync',
            },
            {
              name: 'error_message',
              type: 'text',
              isNullable: true,
              comment: 'Error message if sync failed',
            },
            {
              name: 'error_code',
              type: 'varchar',
              length: '50',
              isNullable: true,
              comment: 'Error code if sync failed',
            },
            {
              name: 'stack_trace',
              type: 'text',
              isNullable: true,
              comment: 'Stack trace if sync failed',
            },
            {
              name: 'cron_expression',
              type: 'varchar',
              length: '100',
              isNullable: true,
              comment: 'Cron expression used for scheduled syncs',
            },
            {
              name: 'timezone',
              type: 'varchar',
              length: '50',
              isNullable: true,
              comment: 'Timezone used for the sync',
            },
            {
              name: 'auto_sync_enabled',
              type: 'boolean',
              default: true,
              isNullable: false,
              comment: 'Whether auto sync was enabled at the time of execution',
            },
            {
              name: 'triggered_by',
              type: 'varchar',
              length: '100',
              isNullable: true,
              comment: 'User who triggered the sync (if manual)',
            },
            {
              name: 'trigger_ip',
              type: 'varchar',
              length: '45',
              isNullable: true,
              comment: 'IP address that triggered the sync',
            },
            {
              name: 'metadata',
              type: 'jsonb',
              isNullable: true,
              comment: 'Additional metadata about the sync operation',
            },
            {
              name: 'created_at',
              type: 'timestamp with time zone',
              default: 'CURRENT_TIMESTAMP',
              isNullable: false,
              comment: 'When the record was created',
            },
            {
              name: 'updated_at',
              type: 'timestamp with time zone',
              default: 'CURRENT_TIMESTAMP',
              isNullable: false,
              comment: 'When the record was last updated',
            },
          ],
        }),
        true,
      );

      // Create indexes for global_asset_tracking table using raw SQL
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_global_asset_tracking_execution_id" ON "global_asset_tracking" ("execution_id")`);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_global_asset_tracking_status" ON "global_asset_tracking" ("status")`);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_global_asset_tracking_type" ON "global_asset_tracking" ("type")`);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_global_asset_tracking_source" ON "global_asset_tracking" ("source")`);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_global_asset_tracking_created_at" ON "global_asset_tracking" ("created_at")`);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_global_asset_tracking_started_at" ON "global_asset_tracking" ("started_at")`);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_global_asset_tracking_completed_at" ON "global_asset_tracking" ("completed_at")`);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_global_asset_tracking_status_type" ON "global_asset_tracking" ("status", "type")`);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_global_asset_tracking_created_status" ON "global_asset_tracking" ("created_at", "status")`);
    }

    // Check if api_call_details table already exists
    const apiCallDetailsExists = await queryRunner.hasTable('api_call_details');
    if (apiCallDetailsExists) {
      console.log('Table api_call_details already exists, skipping creation');
    } else {
      // Create api_call_details table
      await queryRunner.createTable(
        new Table({
          name: 'api_call_details',
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
              comment: 'Execution ID this API call belongs to',
            },
            {
              name: 'provider',
              type: 'varchar',
              length: '100',
              isNullable: false,
              comment: 'API provider name',
            },
            {
              name: 'endpoint',
              type: 'text',
              isNullable: false,
              comment: 'API endpoint URL',
            },
            {
              name: 'method',
              type: 'varchar',
              length: '10',
              isNullable: false,
              comment: 'HTTP method used',
            },
            {
              name: 'status',
              type: 'enum',
              enum: ['pending', 'success', 'failed', 'timeout'],
              default: "'pending'",
              isNullable: false,
              comment: 'API call status',
            },
            {
              name: 'response_time',
              type: 'int',
              default: 0,
              isNullable: false,
              comment: 'Response time in milliseconds',
            },
            {
              name: 'status_code',
              type: 'int',
              isNullable: true,
              comment: 'HTTP status code',
            },
            {
              name: 'error_message',
              type: 'text',
              isNullable: true,
              comment: 'Error message if call failed',
            },
            {
              name: 'symbols_processed',
              type: 'int',
              default: 0,
              isNullable: false,
              comment: 'Number of symbols processed',
            },
            {
              name: 'successful_symbols',
              type: 'int',
              default: 0,
              isNullable: false,
              comment: 'Number of successful symbols',
            },
            {
              name: 'failed_symbols',
              type: 'int',
              default: 0,
              isNullable: false,
              comment: 'Number of failed symbols',
            },
            {
              name: 'request_data',
              type: 'jsonb',
              isNullable: true,
              comment: 'Request data sent to API',
            },
            {
              name: 'response_data',
              type: 'jsonb',
              isNullable: true,
              comment: 'Response data from API',
            },
            {
              name: 'started_at',
              type: 'timestamp with time zone',
              default: 'CURRENT_TIMESTAMP',
              isNullable: false,
              comment: 'When the API call started',
            },
            {
              name: 'completed_at',
              type: 'timestamp with time zone',
              isNullable: true,
              comment: 'When the API call completed',
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

      // Create indexes for api_call_details table using raw SQL
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_api_call_details_execution_id" ON "api_call_details" ("execution_id")`);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_api_call_details_provider" ON "api_call_details" ("provider")`);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_api_call_details_status" ON "api_call_details" ("status")`);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_api_call_details_started_at" ON "api_call_details" ("started_at")`);
    }

    // Check if failed_symbols table already exists
    const failedSymbolsExists = await queryRunner.hasTable('failed_symbols');
    if (failedSymbolsExists) {
      console.log('Table failed_symbols already exists, skipping creation');
    } else {
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

      // Create indexes for failed_symbols table using raw SQL
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_failed_symbols_execution_id" ON "failed_symbols" ("execution_id")`);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_failed_symbols_symbol" ON "failed_symbols" ("symbol")`);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_failed_symbols_provider" ON "failed_symbols" ("provider")`);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_failed_symbols_created_at" ON "failed_symbols" ("created_at")`);
    }

    // Check and add foreign key constraints if they don't exist
    const apiCallDetailsConstraintExists = await queryRunner.query(`
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'FK_api_call_details_execution_id' 
      AND table_name = 'api_call_details'
    `);

    if (apiCallDetailsConstraintExists.length === 0) {
      try {
        await queryRunner.query(`ALTER TABLE "api_call_details" ADD CONSTRAINT "FK_api_call_details_execution_id" FOREIGN KEY ("execution_id") REFERENCES "global_asset_tracking"("execution_id") ON DELETE CASCADE`);
        console.log('Created foreign key constraint FK_api_call_details_execution_id');
      } catch (error) {
        console.log('Failed to create foreign key constraint FK_api_call_details_execution_id:', error.message);
      }
    } else {
      console.log('Foreign key constraint FK_api_call_details_execution_id already exists');
    }

    const failedSymbolsConstraintExists = await queryRunner.query(`
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'FK_failed_symbols_execution_id' 
      AND table_name = 'failed_symbols'
    `);

    if (failedSymbolsConstraintExists.length === 0) {
      try {
        await queryRunner.query(`ALTER TABLE "failed_symbols" ADD CONSTRAINT "FK_failed_symbols_execution_id" FOREIGN KEY ("execution_id") REFERENCES "global_asset_tracking"("execution_id") ON DELETE CASCADE`);
        console.log('Created foreign key constraint FK_failed_symbols_execution_id');
      } catch (error) {
        console.log('Failed to create foreign key constraint FK_failed_symbols_execution_id:', error.message);
      }
    } else {
      console.log('Foreign key constraint FK_failed_symbols_execution_id already exists');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "api_call_details" DROP CONSTRAINT IF EXISTS "FK_api_call_details_execution_id"`);
    await queryRunner.query(`ALTER TABLE "failed_symbols" DROP CONSTRAINT IF EXISTS "FK_failed_symbols_execution_id"`);

    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_global_asset_tracking_execution_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_global_asset_tracking_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_global_asset_tracking_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_global_asset_tracking_source"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_global_asset_tracking_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_global_asset_tracking_started_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_global_asset_tracking_completed_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_global_asset_tracking_status_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_global_asset_tracking_created_status"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_api_call_details_execution_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_api_call_details_provider"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_api_call_details_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_api_call_details_started_at"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_failed_symbols_execution_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_failed_symbols_symbol"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_failed_symbols_provider"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_failed_symbols_created_at"`);

    // Drop tables
    await queryRunner.dropTable('failed_symbols');
    await queryRunner.dropTable('api_call_details');
    await queryRunner.dropTable('global_asset_tracking');
  }
}
