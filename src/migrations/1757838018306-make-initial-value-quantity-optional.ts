import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeInitialValueQuantityOptional1757838018306 implements MigrationInterface {
    name = 'MakeInitialValueQuantityOptional1757838018306'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assets" ALTER COLUMN "initialValue" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "assets" ALTER COLUMN "initialQuantity" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assets" ALTER COLUMN "initialQuantity" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "assets" ALTER COLUMN "initialValue" SET NOT NULL`);
    }

}
