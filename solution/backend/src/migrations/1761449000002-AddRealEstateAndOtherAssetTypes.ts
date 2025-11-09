import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRealEstateAndOtherAssetTypes1761449000002 implements MigrationInterface {
  name = 'AddRealEstateAndOtherAssetTypes1761449000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if enum types exist before modifying
    const assetsEnumExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM pg_type 
        WHERE typname = 'assets_type_enum'
      )
    `);

    const globalAssetsEnumExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM pg_type 
        WHERE typname = 'global_assets_type_enum'
      )
    `);

    // Add new asset types to assets table enum
    if (assetsEnumExists[0]?.exists) {
      try {
        await queryRunner.query(`ALTER TYPE "public"."assets_type_enum" ADD VALUE 'REALESTATE'`);
      } catch (e: any) {
        // Value might already exist, ignore error
        if (!e.message?.includes('already exists')) {
          throw e;
        }
      }
      try {
        await queryRunner.query(`ALTER TYPE "public"."assets_type_enum" ADD VALUE 'OTHER'`);
      } catch (e: any) {
        // Value might already exist, ignore error
        if (!e.message?.includes('already exists')) {
          throw e;
        }
      }
    }

    // Add new asset types to global_assets table enum
    if (globalAssetsEnumExists[0]?.exists) {
      try {
        await queryRunner.query(`ALTER TYPE "public"."global_assets_type_enum" ADD VALUE 'REALESTATE'`);
      } catch (e: any) {
        // Value might already exist, ignore error
        if (!e.message?.includes('already exists')) {
          throw e;
        }
      }
      try {
        await queryRunner.query(`ALTER TYPE "public"."global_assets_type_enum" ADD VALUE 'OTHER'`);
      } catch (e: any) {
        // Value might already exist, ignore error
        if (!e.message?.includes('already exists')) {
          throw e;
        }
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Note: PostgreSQL doesn't support removing enum values directly
    // This would require recreating the enum types, which is complex
    // For now, we'll leave the enum values in place
    // In production, you might want to create a more sophisticated rollback
    console.log('Warning: Cannot remove enum values in PostgreSQL. Manual cleanup may be required.');
  }
}
