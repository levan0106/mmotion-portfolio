import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePersonalFinancialAnalysesTable1765634347000 implements MigrationInterface {
  name = 'CreatePersonalFinancialAnalysesTable1765634347000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for analysis status
    await queryRunner.query(`
      CREATE TYPE "analysis_status_enum" AS ENUM ('draft', 'final')
    `);

    // Create personal_financial_analyses table
    await queryRunner.query(`
      CREATE TABLE "personal_financial_analyses" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "account_id" uuid NOT NULL,
        "name" character varying(255),
        "analysis_date" date,
        "base_currency" character varying(10) NOT NULL DEFAULT 'VND',
        "status" analysis_status_enum NOT NULL DEFAULT 'draft',
        "is_active" boolean NOT NULL DEFAULT true,
        
        -- JSONB data fields
        "assets" jsonb DEFAULT '[]',
        "income" jsonb DEFAULT '[]',
        "expenses" jsonb DEFAULT '[]',
        "debts" jsonb DEFAULT '[]',
        "summary_metrics" jsonb,
        "income_expense_breakdown" jsonb,
        "scenarios" jsonb DEFAULT '[]',
        
        -- Array fields
        "linked_portfolio_ids" uuid[] NOT NULL DEFAULT '{}',
        
        -- Foreign keys
        "linked_financial_freedom_plan_id" uuid,
        
        -- Notes
        "notes" text,
        
        -- Timestamps
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        
        CONSTRAINT "PK_personal_financial_analyses" PRIMARY KEY ("id"),
        CONSTRAINT "FK_personal_financial_analyses_account" FOREIGN KEY ("account_id") 
          REFERENCES "accounts"("account_id") ON DELETE CASCADE,
        CONSTRAINT "FK_personal_financial_analyses_plan" FOREIGN KEY ("linked_financial_freedom_plan_id") 
          REFERENCES "financial_freedom_plans"("id") ON DELETE SET NULL
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_personal_financial_analyses_account_id" 
      ON "personal_financial_analyses" ("account_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_personal_financial_analyses_account_id_is_active" 
      ON "personal_financial_analyses" ("account_id", "is_active")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_personal_financial_analyses_analysis_date" 
      ON "personal_financial_analyses" ("analysis_date")
    `);

    // Create GIN index for linked_portfolio_ids array (for efficient array queries)
    await queryRunner.query(`
      CREATE INDEX "IDX_personal_financial_analyses_linked_portfolio_ids" 
      ON "personal_financial_analyses" USING GIN ("linked_portfolio_ids")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_personal_financial_analyses_linked_portfolio_ids"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_personal_financial_analyses_analysis_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_personal_financial_analyses_account_id_is_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_personal_financial_analyses_account_id"`);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "personal_financial_analyses"`);

    // Drop enum type
    await queryRunner.query(`DROP TYPE IF EXISTS "analysis_status_enum"`);
  }
}

