import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFinancialFreedomPlansTable1739000000000 implements MigrationInterface {
  name = 'CreateFinancialFreedomPlansTable1739000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE "payment_frequency_enum" AS ENUM ('monthly', 'quarterly', 'yearly')
    `);

    await queryRunner.query(`
      CREATE TYPE "payment_type_enum" AS ENUM ('contribution', 'withdrawal')
    `);

    await queryRunner.query(`
      CREATE TYPE "risk_tolerance_enum" AS ENUM ('conservative', 'moderate', 'aggressive')
    `);

    await queryRunner.query(`
      CREATE TYPE "plan_status_enum" AS ENUM ('active', 'paused', 'completed')
    `);

    // Create financial_freedom_plans table
    await queryRunner.query(`
      CREATE TABLE "financial_freedom_plans" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "account_id" uuid NOT NULL,
        "name" character varying(255) NOT NULL,
        
        -- Step 1: Goals & Investment Info
        "target_present_value" numeric(20,2) NOT NULL,
        "future_value_required" numeric(20,2) NOT NULL,
        "initial_investment" numeric(20,2),
        "periodic_payment" numeric(20,2),
        "payment_frequency" payment_frequency_enum NOT NULL DEFAULT 'monthly',
        "payment_type" payment_type_enum NOT NULL DEFAULT 'contribution',
        "investment_years" integer,
        "required_return_rate" numeric(8,4),
        "inflation_rate" numeric(6,4) NOT NULL DEFAULT 4.5,
        "risk_tolerance" risk_tolerance_enum NOT NULL DEFAULT 'moderate',
        
        -- Step 2: Asset Allocation
        "suggested_allocation" jsonb,
        
        -- Step 3: Consolidated Plan
        "yearly_projections" jsonb,
        "scenarios" jsonb,
        
        -- Tracking
        "linked_portfolio_ids" uuid[] NOT NULL DEFAULT '{}',
        "linked_goal_ids" uuid[] NOT NULL DEFAULT '{}',
        "current_portfolio_value" numeric(20,2),
        "current_progress_percentage" numeric(8,4),
        "milestones" jsonb,
        
        -- Metadata
        "status" plan_status_enum NOT NULL DEFAULT 'active',
        "base_currency" character varying(10) NOT NULL DEFAULT 'VND',
        "template_id" uuid,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        
        CONSTRAINT "PK_financial_freedom_plans" PRIMARY KEY ("id"),
        CONSTRAINT "FK_financial_freedom_plans_account" FOREIGN KEY ("account_id") 
          REFERENCES "accounts"("account_id") ON DELETE CASCADE
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_financial_freedom_plans_account_id_is_active" 
      ON "financial_freedom_plans" ("account_id", "is_active")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_financial_freedom_plans_account_id" 
      ON "financial_freedom_plans" ("account_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_financial_freedom_plans_is_active" 
      ON "financial_freedom_plans" ("is_active")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_financial_freedom_plans_is_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_financial_freedom_plans_account_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_financial_freedom_plans_account_id_is_active"`);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "financial_freedom_plans"`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS "plan_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "risk_tolerance_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "payment_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "payment_frequency_enum"`);
  }
}

