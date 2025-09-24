import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNavPerUnitToNavSnapshotsSimple1758722000000 implements MigrationInterface {
    name = 'AddNavPerUnitToNavSnapshotsSimple1758722000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add columns to nav_snapshots table
        await queryRunner.query(`ALTER TABLE "nav_snapshots" ADD "total_outstanding_units" numeric(20,8) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "nav_snapshots" ADD "nav_per_unit" numeric(20,8) NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove columns from nav_snapshots table
        await queryRunner.query(`ALTER TABLE "nav_snapshots" DROP COLUMN "nav_per_unit"`);
        await queryRunner.query(`ALTER TABLE "nav_snapshots" DROP COLUMN "total_outstanding_units"`);
    }
}
