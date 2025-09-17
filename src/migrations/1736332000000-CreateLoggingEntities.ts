import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateLoggingEntities1736332000000 implements MigrationInterface {
  name = 'CreateLoggingEntities1736332000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create application_logs table
    await queryRunner.createTable(
      new Table({
        name: 'application_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'timestamp',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'level',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'message',
            type: 'text',
          },
          {
            name: 'context',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'request_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'service_name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'module_name',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'function_name',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'error_code',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'stack_trace',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create indexes for application_logs table
    await queryRunner.query(`
      CREATE INDEX "idx_app_logs_timestamp" ON "application_logs" ("timestamp")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_app_logs_level" ON "application_logs" ("level")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_app_logs_request_id" ON "application_logs" ("request_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_app_logs_user_id" ON "application_logs" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_app_logs_service" ON "application_logs" ("service_name")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_app_logs_context" ON "application_logs" USING gin ("context")
    `);

    // Create request_logs table
    await queryRunner.createTable(
      new Table({
        name: 'request_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'request_id',
            type: 'uuid',
            isUnique: true,
          },
          {
            name: 'timestamp',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'method',
            type: 'varchar',
            length: '10',
          },
          {
            name: 'url',
            type: 'text',
          },
          {
            name: 'headers',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'body',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'query_params',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'ip_address',
            type: 'inet',
            isNullable: true,
          },
          {
            name: 'user_agent',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'response_status',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'response_time_ms',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'response_size_bytes',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create indexes for request_logs table
    await queryRunner.query(`
      CREATE INDEX "idx_req_logs_timestamp" ON "request_logs" ("timestamp")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_req_logs_user_id" ON "request_logs" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_req_logs_response_status" ON "request_logs" ("response_status")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_req_logs_method" ON "request_logs" ("method")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_req_logs_url" ON "request_logs" ("url")
    `);

    // Create business_event_logs table
    await queryRunner.createTable(
      new Table({
        name: 'business_event_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'event_id',
            type: 'uuid',
            isUnique: true,
          },
          {
            name: 'timestamp',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'event_type',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'entity_type',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'entity_id',
            type: 'uuid',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'action',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'old_values',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'new_values',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create indexes for business_event_logs table
    await queryRunner.query(`
      CREATE INDEX "idx_biz_logs_timestamp" ON "business_event_logs" ("timestamp")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_biz_logs_event_type" ON "business_event_logs" ("event_type")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_biz_logs_entity_type" ON "business_event_logs" ("entity_type")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_biz_logs_user_id" ON "business_event_logs" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_biz_logs_action" ON "business_event_logs" ("action")
    `);

    // Create performance_logs table
    await queryRunner.createTable(
      new Table({
        name: 'performance_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'timestamp',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'operation_name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'operation_type',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'duration_ms',
            type: 'integer',
          },
          {
            name: 'memory_usage_mb',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'cpu_usage_percent',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'database_queries',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'cache_hits',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'cache_misses',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'external_api_calls',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create indexes for performance_logs table
    await queryRunner.query(`
      CREATE INDEX "idx_perf_logs_timestamp" ON "performance_logs" ("timestamp")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_perf_logs_operation_name" ON "performance_logs" ("operation_name")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_perf_logs_duration_ms" ON "performance_logs" ("duration_ms")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_perf_logs_operation_type" ON "performance_logs" ("operation_type")
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "application_logs" 
      ADD CONSTRAINT "FK_application_logs_user_id" 
      FOREIGN KEY ("user_id") REFERENCES "accounts"("account_id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "request_logs" 
      ADD CONSTRAINT "FK_request_logs_user_id" 
      FOREIGN KEY ("user_id") REFERENCES "accounts"("account_id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "business_event_logs" 
      ADD CONSTRAINT "FK_business_event_logs_user_id" 
      FOREIGN KEY ("user_id") REFERENCES "accounts"("account_id") ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "business_event_logs" 
      DROP CONSTRAINT IF EXISTS "FK_business_event_logs_user_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "request_logs" 
      DROP CONSTRAINT IF EXISTS "FK_request_logs_user_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "application_logs" 
      DROP CONSTRAINT IF EXISTS "FK_application_logs_user_id"
    `);

    // Drop indexes for performance_logs
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_perf_logs_operation_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_perf_logs_duration_ms"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_perf_logs_operation_name"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_perf_logs_timestamp"`);

    // Drop indexes for business_event_logs
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_biz_logs_action"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_biz_logs_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_biz_logs_entity_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_biz_logs_event_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_biz_logs_timestamp"`);

    // Drop indexes for request_logs
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_req_logs_url"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_req_logs_method"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_req_logs_response_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_req_logs_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_req_logs_timestamp"`);

    // Drop indexes for application_logs
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_app_logs_context"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_app_logs_service"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_app_logs_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_app_logs_request_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_app_logs_level"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_app_logs_timestamp"`);

    // Drop tables
    await queryRunner.dropTable('performance_logs');
    await queryRunner.dropTable('business_event_logs');
    await queryRunner.dropTable('request_logs');
    await queryRunner.dropTable('application_logs');
  }
}
