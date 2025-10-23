import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGoalManagementTables1735000000000 implements MigrationInterface {
  name = 'CreateGoalManagementTables1735000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create portfolio_goals table
    await queryRunner.query(`
      CREATE TABLE "portfolio_goals" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "portfolio_id" uuid NOT NULL,
        "account_id" uuid NOT NULL,
        "name" character varying(255) NOT NULL,
        "description" text,
        "goal_type" character varying(50) NOT NULL,
        "category" character varying(50) NOT NULL,
        "target_value" numeric(20,2),
        "target_percentage" numeric(8,4),
        "target_date" date,
        "priority" integer NOT NULL DEFAULT '1',
        "status" character varying(20) NOT NULL DEFAULT 'ACTIVE',
        "is_primary" boolean NOT NULL DEFAULT false,
        "auto_track" boolean NOT NULL DEFAULT true,
        "current_value" numeric(20,2) NOT NULL DEFAULT '0',
        "achievement_percentage" numeric(8,4) NOT NULL DEFAULT '0',
        "days_remaining" integer,
        "last_updated" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "created_by" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_portfolio_goals" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_goal_type" CHECK ("goal_type" IN ('FINANCIAL', 'RISK', 'TIME_BASED')),
        CONSTRAINT "CHK_category" CHECK ("category" IN ('VALUE', 'RETURN', 'INCOME', 'RISK', 'VOLATILITY', 'DRAWDOWN', 'SHARPE_RATIO')),
        CONSTRAINT "CHK_status" CHECK ("status" IN ('ACTIVE', 'ACHIEVED', 'PAUSED', 'CANCELLED')),
        CONSTRAINT "CHK_priority" CHECK ("priority" >= 1 AND "priority" <= 5)
      )
    `);

    // Create goal_metrics table
    await queryRunner.query(`
      CREATE TABLE "goal_metrics" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "goal_id" uuid NOT NULL,
        "metric_name" character varying(100) NOT NULL,
        "metric_type" character varying(50) NOT NULL,
        "target_value" numeric(20,4),
        "current_value" numeric(20,4) NOT NULL DEFAULT '0',
        "unit" character varying(20),
        "warning_threshold" numeric(8,4),
        "critical_threshold" numeric(8,4),
        "is_positive" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_goal_metrics" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_metric_type" CHECK ("metric_type" IN ('VALUE', 'PERCENTAGE', 'RATIO', 'COUNT'))
      )
    `);

    // Create goal_asset_allocation table
    await queryRunner.query(`
      CREATE TABLE "goal_asset_allocation" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "goal_id" uuid NOT NULL,
        "asset_type" character varying(50) NOT NULL,
        "target_percentage" numeric(8,4) NOT NULL,
        "current_percentage" numeric(8,4) NOT NULL DEFAULT '0',
        "min_percentage" numeric(8,4),
        "max_percentage" numeric(8,4),
        "expected_return" numeric(8,4),
        "risk_level" character varying(20),
        "volatility" numeric(8,4),
        "rebalance_frequency" character varying(20) NOT NULL DEFAULT 'MONTHLY',
        "last_rebalanced" TIMESTAMP,
        "next_rebalance" TIMESTAMP,
        "is_active" boolean NOT NULL DEFAULT true,
        "auto_rebalance" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_goal_asset_allocation" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_asset_type" CHECK ("asset_type" IN ('STOCK', 'BOND', 'GOLD', 'DEPOSIT', 'CASH', 'REAL_ESTATE', 'CRYPTO')),
        CONSTRAINT "CHK_risk_level" CHECK ("risk_level" IN ('LOW', 'MEDIUM', 'HIGH')),
        CONSTRAINT "CHK_rebalance_frequency" CHECK ("rebalance_frequency" IN ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY')),
        CONSTRAINT "CHK_percentage" CHECK ("target_percentage" >= 0 AND "target_percentage" <= 100)
      )
    `);

    // Create goal_achievements table
    await queryRunner.query(`
      CREATE TABLE "goal_achievements" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "goal_id" uuid NOT NULL,
        "achieved_date" date NOT NULL,
        "achieved_value" numeric(20,2) NOT NULL,
        "achievement_percentage" numeric(8,4) NOT NULL,
        "days_ahead" integer,
        "notes" text,
        "celebration_type" character varying(50) NOT NULL DEFAULT 'NOTIFICATION',
        "created_by" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_goal_achievements" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_celebration_type" CHECK ("celebration_type" IN ('NONE', 'EMAIL', 'NOTIFICATION', 'REPORT', 'CUSTOM'))
      )
    `);

    // Create goal_alerts table
    await queryRunner.query(`
      CREATE TABLE "goal_alerts" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "goal_id" uuid NOT NULL,
        "alert_type" character varying(50) NOT NULL,
        "message" text NOT NULL,
        "threshold_value" numeric(20,4),
        "current_value" numeric(20,4),
        "status" character varying(20) NOT NULL DEFAULT 'PENDING',
        "sent_at" TIMESTAMP,
        "acknowledged_at" TIMESTAMP,
        "created_by" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_goal_alerts" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_alert_type" CHECK ("alert_type" IN ('WARNING', 'CRITICAL', 'ACHIEVEMENT', 'REBALANCE', 'DEADLINE')),
        CONSTRAINT "CHK_alert_status" CHECK ("status" IN ('PENDING', 'SENT', 'ACKNOWLEDGED', 'DISMISSED'))
      )
    `);

    // Create goal_allocation_strategies table
    await queryRunner.query(`
      CREATE TABLE "goal_allocation_strategies" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "goal_id" uuid NOT NULL,
        "strategy_name" character varying(100) NOT NULL,
        "strategy_type" character varying(50) NOT NULL,
        "description" text,
        "target_return" numeric(8,4),
        "max_volatility" numeric(8,4),
        "max_drawdown" numeric(8,4),
        "sharpe_ratio_target" numeric(8,4),
        "market_condition" character varying(50),
        "economic_cycle" character varying(50),
        "is_active" boolean NOT NULL DEFAULT true,
        "effective_from" date,
        "effective_to" date,
        "created_by" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_goal_allocation_strategies" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_strategy_type" CHECK ("strategy_type" IN ('CONSERVATIVE', 'MODERATE', 'AGGRESSIVE', 'CUSTOM')),
        CONSTRAINT "CHK_market_condition" CHECK ("market_condition" IN ('BULL', 'BEAR', 'SIDEWAYS', 'VOLATILE')),
        CONSTRAINT "CHK_economic_cycle" CHECK ("economic_cycle" IN ('EXPANSION', 'RECESSION', 'RECOVERY', 'PEAK'))
      )
    `);

    // Create goal_rebalancing_history table
    await queryRunner.query(`
      CREATE TABLE "goal_rebalancing_history" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "goal_id" uuid NOT NULL,
        "rebalance_date" date NOT NULL,
        "rebalance_type" character varying(50) NOT NULL,
        "trigger_reason" text,
        "old_allocation" jsonb,
        "new_allocation" jsonb,
        "changes_made" jsonb,
        "expected_improvement" numeric(8,4),
        "actual_improvement" numeric(8,4),
        "cost_of_rebalancing" numeric(20,2) NOT NULL DEFAULT '0',
        "created_by" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_goal_rebalancing_history" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_rebalance_type" CHECK ("rebalance_type" IN ('SCHEDULED', 'THRESHOLD', 'MANUAL', 'MARKET_CONDITION', 'GOAL_CHANGE'))
      )
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX "IDX_portfolio_goals_portfolio_status" ON "portfolio_goals" ("portfolio_id", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_portfolio_goals_account_status" ON "portfolio_goals" ("account_id", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_goal_metrics_goal_id" ON "goal_metrics" ("goal_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_goal_asset_allocation_goal_id" ON "goal_asset_allocation" ("goal_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_goal_asset_allocation_asset_type" ON "goal_asset_allocation" ("asset_type")`);
    await queryRunner.query(`CREATE INDEX "IDX_goal_achievements_goal_id" ON "goal_achievements" ("goal_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_goal_achievements_achieved_date" ON "goal_achievements" ("achieved_date")`);
    await queryRunner.query(`CREATE INDEX "IDX_goal_alerts_goal_id" ON "goal_alerts" ("goal_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_goal_alerts_status" ON "goal_alerts" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_goal_alerts_alert_type" ON "goal_alerts" ("alert_type")`);
    await queryRunner.query(`CREATE INDEX "IDX_goal_allocation_strategies_goal_id" ON "goal_allocation_strategies" ("goal_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_goal_allocation_strategies_strategy_type" ON "goal_allocation_strategies" ("strategy_type")`);
    await queryRunner.query(`CREATE INDEX "IDX_goal_rebalancing_history_goal_id" ON "goal_rebalancing_history" ("goal_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_goal_rebalancing_history_rebalance_date" ON "goal_rebalancing_history" ("rebalance_date")`);

    // Add foreign key constraints - temporarily commented out until portfolios and accounts tables are created
    // await queryRunner.query(`ALTER TABLE "portfolio_goals" ADD CONSTRAINT "FK_portfolio_goals_portfolio_id" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("id") ON DELETE CASCADE`);
    // await queryRunner.query(`ALTER TABLE "portfolio_goals" ADD CONSTRAINT "FK_portfolio_goals_account_id" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE`);
    // await queryRunner.query(`ALTER TABLE "portfolio_goals" ADD CONSTRAINT "FK_portfolio_goals_created_by" FOREIGN KEY ("created_by") REFERENCES "accounts"("id")`);
    // await queryRunner.query(`ALTER TABLE "goal_metrics" ADD CONSTRAINT "FK_goal_metrics_goal_id" FOREIGN KEY ("goal_id") REFERENCES "portfolio_goals"("id") ON DELETE CASCADE`);
    // await queryRunner.query(`ALTER TABLE "goal_asset_allocation" ADD CONSTRAINT "FK_goal_asset_allocation_goal_id" FOREIGN KEY ("goal_id") REFERENCES "portfolio_goals"("id") ON DELETE CASCADE`);
    // await queryRunner.query(`ALTER TABLE "goal_achievements" ADD CONSTRAINT "FK_goal_achievements_goal_id" FOREIGN KEY ("goal_id") REFERENCES "portfolio_goals"("id") ON DELETE CASCADE`);
    // await queryRunner.query(`ALTER TABLE "goal_achievements" ADD CONSTRAINT "FK_goal_achievements_created_by" FOREIGN KEY ("created_by") REFERENCES "accounts"("id")`);
    // await queryRunner.query(`ALTER TABLE "goal_alerts" ADD CONSTRAINT "FK_goal_alerts_goal_id" FOREIGN KEY ("goal_id") REFERENCES "portfolio_goals"("id") ON DELETE CASCADE`);
    // await queryRunner.query(`ALTER TABLE "goal_alerts" ADD CONSTRAINT "FK_goal_alerts_created_by" FOREIGN KEY ("created_by") REFERENCES "accounts"("id")`);
    // await queryRunner.query(`ALTER TABLE "goal_allocation_strategies" ADD CONSTRAINT "FK_goal_allocation_strategies_goal_id" FOREIGN KEY ("goal_id") REFERENCES "portfolio_goals"("id") ON DELETE CASCADE`);
    // await queryRunner.query(`ALTER TABLE "goal_allocation_strategies" ADD CONSTRAINT "FK_goal_allocation_strategies_created_by" FOREIGN KEY ("created_by") REFERENCES "accounts"("id")`);
    // await queryRunner.query(`ALTER TABLE "goal_rebalancing_history" ADD CONSTRAINT "FK_goal_rebalancing_history_goal_id" FOREIGN KEY ("goal_id") REFERENCES "portfolio_goals"("id") ON DELETE CASCADE`);
    // await queryRunner.query(`ALTER TABLE "goal_rebalancing_history" ADD CONSTRAINT "FK_goal_rebalancing_history_created_by" FOREIGN KEY ("created_by") REFERENCES "accounts"("id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "goal_rebalancing_history" DROP CONSTRAINT "FK_goal_rebalancing_history_created_by"`);
    await queryRunner.query(`ALTER TABLE "goal_rebalancing_history" DROP CONSTRAINT "FK_goal_rebalancing_history_goal_id"`);
    await queryRunner.query(`ALTER TABLE "goal_allocation_strategies" DROP CONSTRAINT "FK_goal_allocation_strategies_created_by"`);
    await queryRunner.query(`ALTER TABLE "goal_allocation_strategies" DROP CONSTRAINT "FK_goal_allocation_strategies_goal_id"`);
    await queryRunner.query(`ALTER TABLE "goal_alerts" DROP CONSTRAINT "FK_goal_alerts_created_by"`);
    await queryRunner.query(`ALTER TABLE "goal_alerts" DROP CONSTRAINT "FK_goal_alerts_goal_id"`);
    await queryRunner.query(`ALTER TABLE "goal_achievements" DROP CONSTRAINT "FK_goal_achievements_created_by"`);
    await queryRunner.query(`ALTER TABLE "goal_achievements" DROP CONSTRAINT "FK_goal_achievements_goal_id"`);
    await queryRunner.query(`ALTER TABLE "goal_asset_allocation" DROP CONSTRAINT "FK_goal_asset_allocation_goal_id"`);
    await queryRunner.query(`ALTER TABLE "goal_metrics" DROP CONSTRAINT "FK_goal_metrics_goal_id"`);
    await queryRunner.query(`ALTER TABLE "portfolio_goals" DROP CONSTRAINT "FK_portfolio_goals_created_by"`);
    await queryRunner.query(`ALTER TABLE "portfolio_goals" DROP CONSTRAINT "FK_portfolio_goals_account_id"`);
    await queryRunner.query(`ALTER TABLE "portfolio_goals" DROP CONSTRAINT "FK_portfolio_goals_portfolio_id"`);

    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_goal_rebalancing_history_rebalance_date"`);
    await queryRunner.query(`DROP INDEX "IDX_goal_rebalancing_history_goal_id"`);
    await queryRunner.query(`DROP INDEX "IDX_goal_allocation_strategies_strategy_type"`);
    await queryRunner.query(`DROP INDEX "IDX_goal_allocation_strategies_goal_id"`);
    await queryRunner.query(`DROP INDEX "IDX_goal_alerts_alert_type"`);
    await queryRunner.query(`DROP INDEX "IDX_goal_alerts_status"`);
    await queryRunner.query(`DROP INDEX "IDX_goal_alerts_goal_id"`);
    await queryRunner.query(`DROP INDEX "IDX_goal_achievements_achieved_date"`);
    await queryRunner.query(`DROP INDEX "IDX_goal_achievements_goal_id"`);
    await queryRunner.query(`DROP INDEX "IDX_goal_asset_allocation_asset_type"`);
    await queryRunner.query(`DROP INDEX "IDX_goal_asset_allocation_goal_id"`);
    await queryRunner.query(`DROP INDEX "IDX_goal_metrics_goal_id"`);
    await queryRunner.query(`DROP INDEX "IDX_portfolio_goals_account_status"`);
    await queryRunner.query(`DROP INDEX "IDX_portfolio_goals_portfolio_status"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "goal_rebalancing_history"`);
    await queryRunner.query(`DROP TABLE "goal_allocation_strategies"`);
    await queryRunner.query(`DROP TABLE "goal_alerts"`);
    await queryRunner.query(`DROP TABLE "goal_achievements"`);
    await queryRunner.query(`DROP TABLE "goal_asset_allocation"`);
    await queryRunner.query(`DROP TABLE "goal_metrics"`);
    await queryRunner.query(`DROP TABLE "portfolio_goals"`);
  }
}
