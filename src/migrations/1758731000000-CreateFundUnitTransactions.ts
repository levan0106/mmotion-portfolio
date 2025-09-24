import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateFundUnitTransactions1758731000000 implements MigrationInterface {
    name = 'CreateFundUnitTransactions1758731000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enum for holding type
        await queryRunner.query(`CREATE TYPE "public"."fund_unit_transactions_holdingtype_enum" AS ENUM('SUBSCRIBE', 'REDEEM')`);
        
        // Create fund_unit_transactions table
        await queryRunner.query(`
            CREATE TABLE "fund_unit_transactions" (
                "transaction_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "holding_id" uuid NOT NULL,
                "cash_flow_id" uuid,
                "holding_type" "public"."fund_unit_transactions_holdingtype_enum" NOT NULL,
                "units" numeric(20,8) NOT NULL,
                "nav_per_unit" numeric(20,8) NOT NULL,
                "amount" numeric(20,2) NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_fund_unit_transactions" PRIMARY KEY ("transaction_id"),
                CONSTRAINT "UQ_fund_unit_transactions_cash_flow" UNIQUE ("cash_flow_id")
            )
        `);

        // Add foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "fund_unit_transactions" 
            ADD CONSTRAINT "FK_fund_unit_transactions_holding" 
            FOREIGN KEY ("holding_id") REFERENCES "investor_holdings"("holding_id") 
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "fund_unit_transactions" 
            ADD CONSTRAINT "FK_fund_unit_transactions_cash_flow" 
            FOREIGN KEY ("cash_flow_id") REFERENCES "cash_flows"("cash_flow_id") 
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // Create indexes
        await queryRunner.query(`CREATE INDEX "IDX_fund_unit_transactions_holding_id" ON "fund_unit_transactions" ("holding_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_fund_unit_transactions_holding_type" ON "fund_unit_transactions" ("holding_type")`);
        await queryRunner.query(`CREATE INDEX "IDX_fund_unit_transactions_created_at" ON "fund_unit_transactions" ("created_at")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX "public"."IDX_fund_unit_transactions_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fund_unit_transactions_holding_type"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fund_unit_transactions_holding_id"`);

        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "fund_unit_transactions" DROP CONSTRAINT "FK_fund_unit_transactions_cash_flow"`);
        await queryRunner.query(`ALTER TABLE "fund_unit_transactions" DROP CONSTRAINT "FK_fund_unit_transactions_holding"`);

        // Drop table
        await queryRunner.query(`DROP TABLE "fund_unit_transactions"`);

        // Drop enum
        await queryRunner.query(`DROP TYPE "public"."fund_unit_transactions_holdingtype_enum"`);
    }
}
