import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateDepositsTable1734567890125 implements MigrationInterface {
  name = 'CreateDepositsTable1734567890125';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create deposits table
    await queryRunner.createTable(
      new Table({
        name: 'deposits',
        columns: [
          {
            name: 'deposit_id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'portfolio_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'bank_name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'account_number',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'principal',
            type: 'decimal',
            precision: 20,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'interest_rate',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'start_date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'end_date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'ACTIVE'",
            isNullable: false,
          },
          {
            name: 'actual_interest',
            type: 'decimal',
            precision: 20,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'settled_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create indexes for performance
    await queryRunner.createIndex('deposits', new TableIndex({
      name: 'idx_deposits_portfolio_id',
      columnNames: ['portfolio_id'],
    }));

    await queryRunner.createIndex('deposits', new TableIndex({
      name: 'idx_deposits_status',
      columnNames: ['status'],
    }));

    await queryRunner.createIndex('deposits', new TableIndex({
      name: 'idx_deposits_start_date',
      columnNames: ['start_date'],
    }));

    await queryRunner.createIndex('deposits', new TableIndex({
      name: 'idx_deposits_end_date',
      columnNames: ['end_date'],
    }));

    // Create foreign key constraint
    await queryRunner.createForeignKey('deposits', new TableForeignKey({
      name: 'fk_deposits_portfolio',
      columnNames: ['portfolio_id'],
      referencedColumnNames: ['portfolio_id'],
      referencedTableName: 'portfolios',
      onDelete: 'CASCADE',
    }));

    // Add deposit fields to portfolio_snapshots table
    await queryRunner.query(`
      ALTER TABLE portfolio_snapshots 
      ADD COLUMN total_deposit_principal DECIMAL(20,8) DEFAULT 0,
      ADD COLUMN total_deposit_interest DECIMAL(20,8) DEFAULT 0,
      ADD COLUMN total_deposit_value DECIMAL(20,8) DEFAULT 0,
      ADD COLUMN total_deposit_count INTEGER DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove deposit fields from portfolio_snapshots table
    await queryRunner.query(`
      ALTER TABLE portfolio_snapshots 
      DROP COLUMN IF EXISTS total_deposit_principal,
      DROP COLUMN IF EXISTS total_deposit_interest,
      DROP COLUMN IF EXISTS total_deposit_value,
      DROP COLUMN IF EXISTS total_deposit_count
    `);

    // Drop foreign key constraint
    await queryRunner.dropForeignKey('deposits', 'fk_deposits_portfolio');

    // Drop indexes
    await queryRunner.dropIndex('deposits', 'idx_deposits_portfolio_id');
    await queryRunner.dropIndex('deposits', 'idx_deposits_status');
    await queryRunner.dropIndex('deposits', 'idx_deposits_start_date');
    await queryRunner.dropIndex('deposits', 'idx_deposits_end_date');

    // Drop deposits table
    await queryRunner.dropTable('deposits');
  }
}
