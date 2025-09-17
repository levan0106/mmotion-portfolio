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
  synchronize: false,
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
      console.log('🔍 Checking current state...');
      
      // Check trades count
      const tradesCount = await queryRunner.query(`SELECT COUNT(*) as count FROM trades`);
      console.log(`Trades count: ${tradesCount[0].count}`);

      // Check asset_instances count
      const assetInstancesCount = await queryRunner.query(`SELECT COUNT(*) as count FROM asset_instances`);
      console.log(`Asset instances count: ${assetInstancesCount[0].count}`);

      if (parseInt(tradesCount[0].count) > 0 && parseInt(assetInstancesCount[0].count) === 0) {
        console.log('⚠️ Found trades but no asset_instances. This will cause foreign key constraint violations.');
        console.log('🛠️ Solution: Clear trades data to allow schema synchronization...');
        
        // Clear all trades data
        console.log('🗑️ Clearing trades data...');
        await queryRunner.query(`DELETE FROM trade_details`);
        await queryRunner.query(`DELETE FROM trades`);
        console.log('✅ Trades data cleared');

        // Clear asset_targets as well
        console.log('🗑️ Clearing asset_targets data...');
        await queryRunner.query(`DELETE FROM asset_targets`);
        console.log('✅ Asset targets data cleared');

        // Clear portfolio_assets as well
        console.log('🗑️ Clearing portfolio_assets data...');
        await queryRunner.query(`DELETE FROM portfolio_assets`);
        console.log('✅ Portfolio assets data cleared');

        // Clear other related data
        console.log('🗑️ Clearing other related data...');
        await queryRunner.query(`DELETE FROM nav_snapshots`);
        await queryRunner.query(`DELETE FROM cash_flows`);
        console.log('✅ Other related data cleared');

        console.log('✅ Database cleaned successfully. Schema synchronization should now work.');
      } else {
        console.log('✅ Database state looks good. No cleanup needed.');
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
