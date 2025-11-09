import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateSnapshotTrackingTable1734567890123 implements MigrationInterface {
  name = 'CreateSnapshotTrackingTable1734567890123';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'snapshot_tracking',
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
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'portfolio_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'portfolio_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['started', 'in_progress', 'completed', 'failed', 'cancelled'],
            default: "'started'",
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['automated', 'manual', 'test'],
            default: "'automated'",
          },
          {
            name: 'started_at',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'completed_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'total_snapshots',
            type: 'int',
            default: 0,
          },
          {
            name: 'successful_snapshots',
            type: 'int',
            default: 0,
          },
          {
            name: 'failed_snapshots',
            type: 'int',
            default: 0,
          },
          {
            name: 'execution_time_ms',
            type: 'int',
            default: 0,
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'created_by',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'cron_expression',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'timezone',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Create indexes
    await queryRunner.createIndex(
      'snapshot_tracking',
      new TableIndex({
        name: 'IDX_snapshot_tracking_execution_id',
        columnNames: ['execution_id']
      })
    );

    await queryRunner.createIndex(
      'snapshot_tracking',
      new TableIndex({
        name: 'IDX_snapshot_tracking_status',
        columnNames: ['status']
      })
    );

    await queryRunner.createIndex(
      'snapshot_tracking',
      new TableIndex({
        name: 'IDX_snapshot_tracking_type',
        columnNames: ['type']
      })
    );

    await queryRunner.createIndex(
      'snapshot_tracking',
      new TableIndex({
        name: 'IDX_snapshot_tracking_created_at',
        columnNames: ['created_at']
      })
    );

    await queryRunner.createIndex(
      'snapshot_tracking',
      new TableIndex({
        name: 'IDX_snapshot_tracking_portfolio_id',
        columnNames: ['portfolio_id']
      })
    );

    // Create composite index for common queries
    await queryRunner.createIndex(
      'snapshot_tracking',
      new TableIndex({
        name: 'IDX_snapshot_tracking_status_type_created',
        columnNames: ['status', 'type', 'created_at']
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('snapshot_tracking');
  }
}
