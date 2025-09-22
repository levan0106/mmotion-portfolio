import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeAccountNumberOptionalSimple1758463300000 implements MigrationInterface {
    name = 'MakeAccountNumberOptionalSimple1758463300000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "deposits" ALTER COLUMN "account_number" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "deposits" ALTER COLUMN "account_number" SET NOT NULL`);
    }
}
