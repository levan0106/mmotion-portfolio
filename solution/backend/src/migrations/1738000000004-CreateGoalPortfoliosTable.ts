import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGoalPortfoliosTable1738000000004 implements MigrationInterface {
  name = 'CreateGoalPortfoliosTable1738000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create goal_portfolios table for many-to-many relationship
    await queryRunner.query(`
      CREATE TABLE "goal_portfolios" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "goal_id" uuid NOT NULL,
        "portfolio_id" uuid NOT NULL,
        "weight" decimal(5,4) NOT NULL DEFAULT '1.0',
        "is_primary" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_goal_portfolios" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_goal_portfolios_goal_portfolio" UNIQUE ("goal_id", "portfolio_id"),
        CONSTRAINT "CHK_weight" CHECK ("weight" >= 0 AND "weight" <= 1)
      )
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX "IDX_goal_portfolios_goal_id" ON "goal_portfolios" ("goal_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_goal_portfolios_portfolio_id" ON "goal_portfolios" ("portfolio_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_goal_portfolios_is_primary" ON "goal_portfolios" ("is_primary")`);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "goal_portfolios" 
      ADD CONSTRAINT "FK_goal_portfolios_goal_id" 
      FOREIGN KEY ("goal_id") REFERENCES "portfolio_goals"("id") ON DELETE CASCADE
    `);
    
    await queryRunner.query(`
      ALTER TABLE "goal_portfolios" 
      ADD CONSTRAINT "FK_goal_portfolios_portfolio_id" 
      FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("portfolio_id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "goal_portfolios" DROP CONSTRAINT "FK_goal_portfolios_portfolio_id"`);
    await queryRunner.query(`ALTER TABLE "goal_portfolios" DROP CONSTRAINT "FK_goal_portfolios_goal_id"`);

    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_goal_portfolios_is_primary"`);
    await queryRunner.query(`DROP INDEX "IDX_goal_portfolios_portfolio_id"`);
    await queryRunner.query(`DROP INDEX "IDX_goal_portfolios_goal_id"`);

    // Drop table
    await queryRunner.query(`DROP TABLE "goal_portfolios"`);
  }
}
