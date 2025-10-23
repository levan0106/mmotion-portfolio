import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class CreateTrustedDeviceTable1735123456789 implements MigrationInterface {
  name = 'CreateTrustedDeviceTable1735123456789';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'trusted_devices',
        columns: [
          {
            name: 'device_id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'device_fingerprint',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'device_name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'browser_info',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'ip_address',
            type: 'varchar',
            length: '45',
            isNullable: false,
          },
          {
            name: 'location',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'is_trusted',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'trust_level',
            type: 'enum',
            enum: ['LOW', 'MEDIUM', 'HIGH'],
            default: "'MEDIUM'",
            isNullable: false,
          },
          {
            name: 'last_used',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            isNullable: false,
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
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['user_id'],
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create indexes using raw SQL
    await queryRunner.query(`CREATE INDEX "IDX_trusted_devices_user_id" ON "trusted_devices" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_trusted_devices_device_fingerprint" ON "trusted_devices" ("device_fingerprint")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_trusted_devices_user_device" ON "trusted_devices" ("user_id", "device_fingerprint")`);
    await queryRunner.query(`CREATE INDEX "IDX_trusted_devices_last_used" ON "trusted_devices" ("last_used")`);
    await queryRunner.query(`CREATE INDEX "IDX_trusted_devices_expires_at" ON "trusted_devices" ("expires_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_trusted_devices_is_trusted" ON "trusted_devices" ("is_trusted")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('trusted_devices');
  }
}
