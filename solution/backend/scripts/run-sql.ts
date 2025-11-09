import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
config();

async function runSQL() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'portfolio_management',
    entities: [],
    synchronize: false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('Database connection established');

    // Read SQL file
    const sqlPath = path.join(__dirname, 'insert-simple-data.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute SQL
    console.log('Executing SQL...');
    await dataSource.query(sql);
    
    console.log('✅ SQL executed successfully!');

  } catch (error) {
    console.error('❌ Error executing SQL:', error);
  } finally {
    await dataSource.destroy();
  }
}

// Run the script
runSQL();
