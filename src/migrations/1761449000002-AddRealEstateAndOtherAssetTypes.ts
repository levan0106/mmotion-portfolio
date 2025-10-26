import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRealEstateAndOtherAssetTypes1761449000002 implements MigrationInterface {
  name = 'AddRealEstateAndOtherAssetTypes1761449000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new asset types to assets table enum
    await queryRunner.query(`ALTER TYPE "public"."assets_type_enum" ADD VALUE 'REALESTATE'`);
    await queryRunner.query(`ALTER TYPE "public"."assets_type_enum" ADD VALUE 'OTHER'`);

    // Add new asset types to global_assets table enum
    await queryRunner.query(`ALTER TYPE "public"."global_assets_type_enum" ADD VALUE 'REALESTATE'`);
    await queryRunner.query(`ALTER TYPE "public"."global_assets_type_enum" ADD VALUE 'OTHER'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Note: PostgreSQL doesn't support removing enum values directly
    // This would require recreating the enum types, which is complex
    // For now, we'll leave the enum values in place
    // In production, you might want to create a more sophisticated rollback
    console.log('Warning: Cannot remove enum values in PostgreSQL. Manual cleanup may be required.');
  }
}
