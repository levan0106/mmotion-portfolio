import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCryptoToAssetType1758084000000 implements MigrationInterface {
    name = 'AddCryptoToAssetType1758084000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add CRYPTO to assets_type_enum
        await queryRunner.query(`ALTER TYPE "public"."assets_type_enum" ADD VALUE 'CRYPTO'`);
        
        // Add CRYPTO to global_assets_type_enum
        await queryRunner.query(`ALTER TYPE "public"."global_assets_type_enum" ADD VALUE 'CRYPTO'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Note: PostgreSQL doesn't support removing enum values directly
        // This would require recreating the enum type and updating all references
        // For now, we'll leave CRYPTO in the enum as it's safe to have extra values
        console.log('Note: CRYPTO enum value cannot be easily removed. Consider manual cleanup if needed.');
    }
}
