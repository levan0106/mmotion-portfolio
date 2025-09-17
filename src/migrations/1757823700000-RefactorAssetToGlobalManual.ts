import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorAssetToGlobalManual1757823700000 implements MigrationInterface {
    name = 'RefactorAssetToGlobalManual1757823700000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Add new columns to existing assets table
        await queryRunner.query(`ALTER TABLE "assets" ADD "code" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "assets" ADD "description" text`);
        await queryRunner.query(`ALTER TABLE "assets" ADD "initialValue" numeric(15,2) NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "assets" ADD "initialQuantity" numeric(15,4) NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "assets" ADD "currentValue" numeric(15,2)`);
        await queryRunner.query(`ALTER TABLE "assets" ADD "currentQuantity" numeric(15,4)`);
        await queryRunner.query(`ALTER TABLE "assets" ADD "createdBy" uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'`);
        await queryRunner.query(`ALTER TABLE "assets" ADD "updatedBy" uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'`);

        // 2. Create new indexes
        await queryRunner.query(`CREATE INDEX "IDX_ASSET_TYPE" ON "assets" ("type")`);
        await queryRunner.query(`CREATE INDEX "IDX_ASSET_CODE" ON "assets" ("code")`);
        await queryRunner.query(`CREATE INDEX "IDX_ASSET_NAME" ON "assets" ("name")`);
        await queryRunner.query(`CREATE INDEX "IDX_ASSET_CREATED_BY" ON "assets" ("createdBy")`);

        // 3. Migrate data from asset_instances to assets if asset_instances exists
        const assetInstancesExists = await queryRunner.hasTable("asset_instances");
        if (assetInstancesExists) {
            // First, drop foreign key constraints that reference asset_instances
            await queryRunner.query(`ALTER TABLE "trades" DROP CONSTRAINT IF EXISTS "FK_1628a75c483742377ebcf53f539"`);
            await queryRunner.query(`ALTER TABLE "portfolio_assets" DROP CONSTRAINT IF EXISTS "FK_96e4f24a6ef0f4c4811296c1aae"`);
            await queryRunner.query(`ALTER TABLE "asset_targets" DROP CONSTRAINT IF EXISTS "FK_89e1e884480ed2010047509c862"`);
            await queryRunner.query(`ALTER TABLE "trade_details" DROP CONSTRAINT IF EXISTS "FK_9ee6b8fecc23ad130ba7efebd07"`);

            await queryRunner.query(`
                INSERT INTO "assets" (
                    "id", "name", "code", "type", "description", 
                    "initialValue", "initialQuantity", "currentValue", "currentQuantity",
                    "created_at", "updated_at", "createdBy", "updatedBy"
                )
                SELECT 
                    "id", "name", "code", "type", "description",
                    "initialValue", "initialQuantity", "currentValue", "currentQuantity",
                    "createdAt", "updatedAt", "createdBy", "updatedBy"
                FROM "asset_instances"
                ON CONFLICT (id) DO NOTHING
            `);

            // 4. Drop old asset_instances table
            await queryRunner.query(`DROP TABLE "asset_instances"`);
        }

        // 5. Update foreign key constraints to ensure they reference assets table
        await queryRunner.query(`ALTER TABLE "portfolio_assets" DROP CONSTRAINT IF EXISTS "FK_portfolio_assets_asset_id"`);
        await queryRunner.query(`ALTER TABLE "portfolio_assets" ADD CONSTRAINT "FK_portfolio_assets_asset_id" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE`);

        await queryRunner.query(`ALTER TABLE "trades" DROP CONSTRAINT IF EXISTS "FK_trades_asset_id"`);
        await queryRunner.query(`ALTER TABLE "trades" ADD CONSTRAINT "FK_trades_asset_id" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 1. Recreate asset_instances table
        await queryRunner.query(`
            CREATE TABLE "asset_instances" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "portfolioId" uuid NOT NULL,
                "name" character varying(255) NOT NULL,
                "code" character varying(50),
                "type" character varying(50) NOT NULL DEFAULT 'STOCK',
                "description" text,
                "initialValue" numeric(15,2) NOT NULL,
                "initialQuantity" numeric(15,4) NOT NULL,
                "currentValue" numeric(15,2),
                "currentQuantity" numeric(15,4),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "createdBy" uuid NOT NULL,
                "updatedBy" uuid NOT NULL,
                CONSTRAINT "PK_asset_instances_id" PRIMARY KEY ("id")
            )
        `);

        // 2. Create indexes for asset_instances table
        await queryRunner.query(`CREATE INDEX "IDX_ASSET_INSTANCE_PORTFOLIO_ID" ON "asset_instances" ("portfolioId")`);
        await queryRunner.query(`CREATE INDEX "IDX_ASSET_INSTANCE_TYPE" ON "asset_instances" ("type")`);
        await queryRunner.query(`CREATE INDEX "IDX_ASSET_INSTANCE_CODE" ON "asset_instances" ("code")`);
        await queryRunner.query(`CREATE INDEX "IDX_ASSET_INSTANCE_NAME" ON "asset_instances" ("name")`);

        // 3. Migrate data back from assets to asset_instances
        // Note: This is a simplified migration - in practice, you'd need to determine portfolioId
        await queryRunner.query(`
            INSERT INTO "asset_instances" (
                "id", "portfolioId", "name", "code", "type", "description",
                "initialValue", "initialQuantity", "currentValue", "currentQuantity",
                "createdAt", "updatedAt", "createdBy", "updatedBy"
            )
            SELECT 
                "id", 
                (SELECT "portfolioId" FROM "portfolio_assets" WHERE "assetId" = "assets"."id" LIMIT 1) as "portfolioId",
                "name", "code", "type", "description",
                "initialValue", "initialQuantity", "currentValue", "currentQuantity",
                "createdAt", "updatedAt", "createdBy", "updatedBy"
            FROM "assets"
        `);

        // 4. Update foreign key constraints
        await queryRunner.query(`ALTER TABLE "portfolio_assets" DROP CONSTRAINT IF EXISTS "FK_portfolio_assets_asset_id"`);
        await queryRunner.query(`ALTER TABLE "portfolio_assets" ADD CONSTRAINT "FK_portfolio_assets_asset_id" FOREIGN KEY ("assetId") REFERENCES "asset_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE`);

        await queryRunner.query(`ALTER TABLE "trades" DROP CONSTRAINT IF EXISTS "FK_trades_asset_id"`);
        await queryRunner.query(`ALTER TABLE "trades" ADD CONSTRAINT "FK_trades_asset_id" FOREIGN KEY ("assetId") REFERENCES "asset_instances"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

        // 5. Drop new assets table
        await queryRunner.query(`DROP TABLE "assets"`);
    }
}
