import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCommodityToAssetType1757931238784 implements MigrationInterface {
    name = 'AddCommodityToAssetType1757931238784'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."assets_type_enum" RENAME TO "assets_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."assets_type_enum" AS ENUM('STOCK', 'BOND', 'GOLD', 'COMMODITY', 'DEPOSIT', 'CASH')`);
        await queryRunner.query(`ALTER TABLE "assets" ALTER COLUMN "type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "assets" ALTER COLUMN "type" TYPE "public"."assets_type_enum" USING "type"::"text"::"public"."assets_type_enum"`);
        await queryRunner.query(`ALTER TABLE "assets" ALTER COLUMN "type" SET DEFAULT 'STOCK'`);
        await queryRunner.query(`DROP TYPE "public"."assets_type_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."assets_type_enum_old" AS ENUM('STOCK', 'BOND', 'GOLD', 'DEPOSIT', 'CASH')`);
        await queryRunner.query(`ALTER TABLE "assets" ALTER COLUMN "type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "assets" ALTER COLUMN "type" TYPE "public"."assets_type_enum_old" USING "type"::"text"::"public"."assets_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "assets" ALTER COLUMN "type" SET DEFAULT 'STOCK'`);
        await queryRunner.query(`DROP TYPE "public"."assets_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."assets_type_enum_old" RENAME TO "assets_type_enum"`);
    }

}
