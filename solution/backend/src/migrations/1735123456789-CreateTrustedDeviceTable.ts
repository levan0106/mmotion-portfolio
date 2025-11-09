import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class CreateTrustedDeviceTable1735123456789 implements MigrationInterface {
  name = 'CreateTrustedDeviceTable1735123456789';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if users table exists
    const usersTableExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      )
    `);

    const hasUsersTable = usersTableExists[0]?.exists;

    // Create table without foreign key if users table doesn't exist
    // Foreign key will be added later when users table is created
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
        foreignKeys: hasUsersTable
          ? [
              {
                columnNames: ['user_id'],
                referencedTableName: 'users',
                referencedColumnNames: ['user_id'],
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
              },
            ]
          : [],
      }),
      true,
    );

    // Add foreign key later if users table exists now
    if (hasUsersTable) {
      // Check if foreign key already exists
      const fkExists = await queryRunner.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'FK_d80738022e4cedca17a9fc25982' 
          AND table_name = 'trusted_devices'
        )
      `);

      if (!fkExists[0]?.exists) {
        await queryRunner.query(`
          ALTER TABLE "trusted_devices" 
          ADD CONSTRAINT "FK_d80738022e4cedca17a9fc25982" 
          FOREIGN KEY ("user_id") REFERENCES "users"("user_id") 
          ON DELETE CASCADE ON UPDATE CASCADE
        `);
      }
    } else {
      console.log('⚠️ users table does not exist, creating trusted_devices without foreign key');
      console.log('   Foreign key will be added when users table is created');
    }

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
