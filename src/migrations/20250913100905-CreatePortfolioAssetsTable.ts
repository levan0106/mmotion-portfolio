import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

/**
 * Migration to create asset_instances table for asset management.
 * This table stores asset instances that belong to specific portfolios.
 */
export class CreatePortfolioAssetsTable20250913100905 implements MigrationInterface {
  name = 'CreatePortfolioAssetsTable20250913100905';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create asset_instances table
    await queryRunner.createTable(
      new Table({
        name: 'asset_instances',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'portfolioId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'code',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['STOCK', 'BOND', 'GOLD', 'DEPOSIT', 'CASH'],
            default: "'STOCK'",
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'initialValue',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'initialQuantity',
            type: 'decimal',
            precision: 15,
            scale: 4,
            isNullable: false,
          },
          {
            name: 'currentValue',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'currentQuantity',
            type: 'decimal',
            precision: 15,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'createdBy',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'updatedBy',
            type: 'uuid',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create indexes for performance optimization
    await queryRunner.createIndex(
      'asset_instances',
      new TableIndex({
        name: 'IDX_ASSET_INSTANCE_PORTFOLIO_ID',
        columnNames: ['portfolioId']
      })
    );

    await queryRunner.createIndex(
      'asset_instances',
      new TableIndex({
        name: 'IDX_ASSET_INSTANCE_TYPE',
        columnNames: ['type']
      })
    );

    await queryRunner.createIndex(
      'asset_instances',
      new TableIndex({
        name: 'IDX_ASSET_INSTANCE_CODE',
        columnNames: ['code']
      })
    );

    await queryRunner.createIndex(
      'asset_instances',
      new TableIndex({
        name: 'IDX_ASSET_INSTANCE_NAME',
        columnNames: ['name']
      })
    );

    // Create composite index for portfolio and type queries
    await queryRunner.createIndex(
      'asset_instances',
      new TableIndex({
        name: 'IDX_ASSET_INSTANCE_PORTFOLIO_TYPE',
        columnNames: ['portfolioId', 'type']
      })
    );

    // Create composite index for portfolio and name queries
    await queryRunner.createIndex(
      'asset_instances',
      new TableIndex({
        name: 'IDX_ASSET_INSTANCE_PORTFOLIO_NAME',
        columnNames: ['portfolioId', 'name']
      })
    );

    // Add foreign key constraint to portfolios table
    await queryRunner.createForeignKey(
      'asset_instances',
      new TableForeignKey({
        columnNames: ['portfolioId'],
        referencedColumnNames: ['portfolioId'],
        referencedTableName: 'portfolios',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      })
    );

    // Add unique constraint for asset name within portfolio
    await queryRunner.createIndex(
      'asset_instances',
      new TableIndex({
        name: 'IDX_ASSET_INSTANCE_UNIQUE_NAME',
        columnNames: ['portfolioId', 'name'],
        isUnique: true,
      })
    );

    // Add unique constraint for asset code globally (if not null)
    await queryRunner.createIndex(
      'asset_instances',
      new TableIndex({
        name: 'IDX_ASSET_INSTANCE_UNIQUE_CODE',
        columnNames: ['code'],
        isUnique: true,
        where: 'code IS NOT NULL',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints first
    const table = await queryRunner.getTable('asset_instances');
    if (table) {
      const foreignKey = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('portfolioId') !== -1
      );
      if (foreignKey) {
        await queryRunner.dropForeignKey('asset_instances', foreignKey);
      }
    }

    // Drop indexes
    await queryRunner.dropIndex('asset_instances', 'IDX_ASSET_INSTANCE_UNIQUE_CODE');
    await queryRunner.dropIndex('asset_instances', 'IDX_ASSET_INSTANCE_UNIQUE_NAME');
    await queryRunner.dropIndex('asset_instances', 'IDX_ASSET_INSTANCE_PORTFOLIO_NAME');
    await queryRunner.dropIndex('asset_instances', 'IDX_ASSET_INSTANCE_PORTFOLIO_TYPE');
    await queryRunner.dropIndex('asset_instances', 'IDX_ASSET_INSTANCE_NAME');
    await queryRunner.dropIndex('asset_instances', 'IDX_ASSET_INSTANCE_CODE');
    await queryRunner.dropIndex('asset_instances', 'IDX_ASSET_INSTANCE_TYPE');
    await queryRunner.dropIndex('asset_instances', 'IDX_ASSET_INSTANCE_PORTFOLIO_ID');

    // Drop table
    await queryRunner.dropTable('asset_instances');
  }
}