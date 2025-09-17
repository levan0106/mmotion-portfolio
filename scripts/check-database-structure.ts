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

async function checkDatabaseStructure() {
  try {
    console.log('🔌 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Database connected successfully');

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      // Check all tables
      console.log('📋 Checking all tables...');
      const tables = await queryRunner.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
      console.log('Tables:', tables.map(t => t.table_name));

      // Check trades table structure
      console.log('🔍 Checking trades table structure...');
      const tradesColumns = await queryRunner.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'trades' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);
      console.log('Trades columns:', tradesColumns);

      // Check asset_instances table structure
      console.log('🔍 Checking asset_instances table structure...');
      const assetInstancesColumns = await queryRunner.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'asset_instances' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);
      console.log('Asset instances columns:', assetInstancesColumns);

      // Check if there are any trades
      console.log('🔍 Checking trades data...');
      const tradesCount = await queryRunner.query(`SELECT COUNT(*) as count FROM trades`);
      console.log('Trades count:', tradesCount[0].count);

      if (tradesCount[0].count > 0) {
        const sampleTrades = await queryRunner.query(`SELECT * FROM trades LIMIT 5`);
        console.log('Sample trades:', sampleTrades);
      }

      // Check if there are any asset_instances
      console.log('🔍 Checking asset_instances data...');
      const assetInstancesCount = await queryRunner.query(`SELECT COUNT(*) as count FROM asset_instances`);
      console.log('Asset instances count:', assetInstancesCount[0].count);

      if (assetInstancesCount[0].count > 0) {
        const sampleAssetInstances = await queryRunner.query(`SELECT * FROM asset_instances LIMIT 5`);
        console.log('Sample asset instances:', sampleAssetInstances);
      }

    } finally {
      await queryRunner.release();
    }

  } catch (error) {
    console.error('❌ Error checking database structure:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

// Run the check
checkDatabaseStructure();
