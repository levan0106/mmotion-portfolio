import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateCurrencyPrecisionTo3Decimals1758733000000 implements MigrationInterface {
    name = 'UpdateCurrencyPrecisionTo3Decimals1758733000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Update investor_holdings table currency fields
        await queryRunner.query(`ALTER TABLE "investor_holdings" ALTER COLUMN "total_investment" TYPE numeric(20,3)`);
        await queryRunner.query(`ALTER TABLE "investor_holdings" ALTER COLUMN "current_value" TYPE numeric(20,3)`);
        await queryRunner.query(`ALTER TABLE "investor_holdings" ALTER COLUMN "unrealized_pnl" TYPE numeric(20,3)`);
        await queryRunner.query(`ALTER TABLE "investor_holdings" ALTER COLUMN "realized_pnl" TYPE numeric(20,3)`);
        
        // Update fund_unit_transactions table amount field
        await queryRunner.query(`ALTER TABLE "fund_unit_transactions" ALTER COLUMN "amount" TYPE numeric(20,3)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert investor_holdings table currency fields
        await queryRunner.query(`ALTER TABLE "investor_holdings" ALTER COLUMN "total_investment" TYPE numeric(20,8)`);
        await queryRunner.query(`ALTER TABLE "investor_holdings" ALTER COLUMN "current_value" TYPE numeric(20,8)`);
        await queryRunner.query(`ALTER TABLE "investor_holdings" ALTER COLUMN "unrealized_pnl" TYPE numeric(20,8)`);
        await queryRunner.query(`ALTER TABLE "investor_holdings" ALTER COLUMN "realized_pnl" TYPE numeric(20,8)`);
        
        // Revert fund_unit_transactions table amount field
        await queryRunner.query(`ALTER TABLE "fund_unit_transactions" ALTER COLUMN "amount" TYPE numeric(20,2)`);
    }
}
