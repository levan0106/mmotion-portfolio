import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUnrealizedAndRealizedPlToPortfolioSnapshots1758340080435 implements MigrationInterface {
    name = 'AddUnrealizedAndRealizedPlToPortfolioSnapshots1758340080435'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "portfolio_snapshots" ADD "unrealized_pl" numeric(20,8) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "portfolio_snapshots" ADD "realized_pl" numeric(20,8) NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "portfolio_snapshots" DROP COLUMN "realized_pl"`);
        await queryRunner.query(`ALTER TABLE "portfolio_snapshots" DROP COLUMN "unrealized_pl"`);
    }
}
