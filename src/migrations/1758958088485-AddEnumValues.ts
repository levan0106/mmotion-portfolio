import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEnumValues1758958088485 implements MigrationInterface {
    name = 'AddEnumValues1758958088485'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add USER_INPUT to enum if it doesn't exist
        try {
            await queryRunner.query(`ALTER TYPE "public"."asset_prices_price_source_enum" ADD VALUE 'USER_INPUT'`);
        } catch (error) {
            // Ignore if already exists
        }

        try {
            await queryRunner.query(`ALTER TYPE "public"."asset_price_history_price_source_enum" ADD VALUE 'USER_INPUT'`);
        } catch (error) {
            // Ignore if already exists
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Cannot remove enum values in PostgreSQL
    }
}
