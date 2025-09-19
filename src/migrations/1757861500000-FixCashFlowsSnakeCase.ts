import { MigrationInterface, QueryRunner } from "typeorm";

export class FixCashFlowsSnakeCase1757861500000 implements MigrationInterface {
    name = 'FixCashFlowsSnakeCase1757861500000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop existing indexes that reference the columns we're renaming
        await queryRunner.query(`DROP INDEX "IDX_231231001c80e264a3cfc2876d"`);
        await queryRunner.query(`DROP INDEX "IDX_b73407fdd16dc4e906b2a92693"`);
        
        // Drop foreign key constraint
        await queryRunner.query(`ALTER TABLE "cash_flows" DROP CONSTRAINT "FK_b73407fdd16dc4e906b2a926939"`);
        
        // Drop primary key constraint
        await queryRunner.query(`ALTER TABLE "cash_flows" DROP CONSTRAINT "PK_db0c703ef02751841e1f7d55eb8"`);
        
        // Rename columns to snake_case
        await queryRunner.query(`ALTER TABLE "cash_flows" RENAME COLUMN "cashflowId" TO "cash_flow_id"`);
        await queryRunner.query(`ALTER TABLE "cash_flows" RENAME COLUMN "portfolioId" TO "portfolio_id"`);
        await queryRunner.query(`ALTER TABLE "cash_flows" RENAME COLUMN "flowDate" TO "flow_date"`);
        await queryRunner.query(`ALTER TABLE "cash_flows" RENAME COLUMN "createdAt" TO "created_at"`);
        // trade_id already exists in snake_case, no need to rename
        
        // Recreate primary key constraint
        await queryRunner.query(`ALTER TABLE "cash_flows" ADD CONSTRAINT "PK_cash_flows_cash_flow_id" PRIMARY KEY ("cash_flow_id")`);
        
        // Recreate foreign key constraint
        await queryRunner.query(`ALTER TABLE "cash_flows" ADD CONSTRAINT "FK_cash_flows_portfolio_id" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("portfolio_id") ON DELETE CASCADE`);
        
        // Recreate indexes
        await queryRunner.query(`CREATE INDEX "IDX_cash_flows_flow_date" ON "cash_flows" ("flow_date")`);
        await queryRunner.query(`CREATE INDEX "IDX_cash_flows_portfolio_id" ON "cash_flows" ("portfolio_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX "IDX_cash_flows_portfolio_id"`);
        await queryRunner.query(`DROP INDEX "IDX_cash_flows_flow_date"`);
        
        // Drop foreign key constraint
        await queryRunner.query(`ALTER TABLE "cash_flows" DROP CONSTRAINT "FK_cash_flows_portfolio_id"`);
        
        // Drop primary key constraint
        await queryRunner.query(`ALTER TABLE "cash_flows" DROP CONSTRAINT "PK_cash_flows_cash_flow_id"`);
        
        // Rename columns back to camelCase
        await queryRunner.query(`ALTER TABLE "cash_flows" RENAME COLUMN "cash_flow_id" TO "cashflowId"`);
        await queryRunner.query(`ALTER TABLE "cash_flows" RENAME COLUMN "portfolio_id" TO "portfolioId"`);
        await queryRunner.query(`ALTER TABLE "cash_flows" RENAME COLUMN "flow_date" TO "flowDate"`);
        await queryRunner.query(`ALTER TABLE "cash_flows" RENAME COLUMN "created_at" TO "createdAt"`);
        // trade_id stays as is
        
        // Recreate primary key constraint
        await queryRunner.query(`ALTER TABLE "cash_flows" ADD CONSTRAINT "PK_db0c703ef02751841e1f7d55eb8" PRIMARY KEY ("cashflowId")`);
        
        // Recreate foreign key constraint
        await queryRunner.query(`ALTER TABLE "cash_flows" ADD CONSTRAINT "FK_b73407fdd16dc4e906b2a926939" FOREIGN KEY ("portfolioId") REFERENCES "portfolios"("portfolio_id") ON DELETE CASCADE`);
        
        // Recreate indexes
        await queryRunner.query(`CREATE INDEX "IDX_b73407fdd16dc4e906b2a92693" ON "cash_flows" ("portfolioId")`);
        await queryRunner.query(`CREATE INDEX "IDX_231231001c80e264a3cfc2876d" ON "cash_flows" ("flowDate")`);
    }
}
