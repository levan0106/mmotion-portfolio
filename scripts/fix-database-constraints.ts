import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Load environment variables
config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'portfolio_db',
  entities: [__dirname + '/../src/modules/**/*.entity{.ts,.js}'],
  synchronize: false, // Don't auto-sync
  logging: true,
});

async function fixDatabaseConstraints() {
  try {
    console.log('🔌 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Database connected successfully');

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      console.log('🔍 Checking for orphaned trades...');
      
      // Find trades with invalid asset_id
      const orphanedTrades = await queryRunner.query(`
        SELECT t.id, t.assetId, t.symbol, t.quantity, t.price
        FROM trades t
        LEFT JOIN asset_instances ai ON t.assetId = ai.id
        WHERE ai.id IS NULL
      `);

      console.log(`Found ${orphanedTrades.length} orphaned trades:`, orphanedTrades);

      if (orphanedTrades.length > 0) {
        console.log('🗑️ Deleting orphaned trades...');
        
        // Delete orphaned trades
        await queryRunner.query(`
          DELETE FROM trades 
          WHERE id IN (
            SELECT t.id 
            FROM trades t
            LEFT JOIN asset_instances ai ON t.assetId = ai.id
            WHERE ai.id IS NULL
          )
        `);

        console.log('✅ Orphaned trades deleted successfully');
      }

      // Check for orphaned trade_details
      console.log('🔍 Checking for orphaned trade_details...');
      const orphanedTradeDetails = await queryRunner.query(`
        SELECT td.id, td.trade_id
        FROM trade_details td
        LEFT JOIN trades t ON td.trade_id = t.id
        WHERE t.id IS NULL
      `);

      console.log(`Found ${orphanedTradeDetails.length} orphaned trade_details:`, orphanedTradeDetails);

      if (orphanedTradeDetails.length > 0) {
        console.log('🗑️ Deleting orphaned trade_details...');
        
        await queryRunner.query(`
          DELETE FROM trade_details 
          WHERE id IN (
            SELECT td.id 
            FROM trade_details td
            LEFT JOIN trades t ON td.trade_id = t.id
            WHERE t.id IS NULL
          )
        `);

        console.log('✅ Orphaned trade_details deleted successfully');
      }

      // Check for orphaned asset_targets
      console.log('🔍 Checking for orphaned asset_targets...');
      const orphanedAssetTargets = await queryRunner.query(`
        SELECT at.id, at.assetId
        FROM asset_targets at
        LEFT JOIN asset_instances ai ON at.assetId = ai.id
        WHERE ai.id IS NULL
      `);

      console.log(`Found ${orphanedAssetTargets.length} orphaned asset_targets:`, orphanedAssetTargets);

      if (orphanedAssetTargets.length > 0) {
        console.log('🗑️ Deleting orphaned asset_targets...');
        
        await queryRunner.query(`
          DELETE FROM asset_targets 
          WHERE id IN (
            SELECT at.id 
            FROM asset_targets at
            LEFT JOIN asset_instances ai ON at.assetId = ai.id
            WHERE ai.id IS NULL
          )
        `);

        console.log('✅ Orphaned asset_targets deleted successfully');
      }

      await queryRunner.commitTransaction();
      console.log('✅ Database constraints fixed successfully');

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

  } catch (error) {
    console.error('❌ Error fixing database constraints:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

// Run the fix
fixDatabaseConstraints();
