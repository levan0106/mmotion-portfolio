const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function createSnapshotTrackingTable() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'portfolio_db',
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Read SQL file
    const sqlPath = path.join(__dirname, 'create-snapshot-tracking-table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute SQL
    await client.query(sql);
    console.log('✅ snapshot_tracking table created successfully');

    // Verify table exists
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'snapshot_tracking'
    `);

    if (result.rows.length > 0) {
      console.log('✅ Table verification successful');
    } else {
      console.log('❌ Table verification failed');
    }

  } catch (error) {
    console.error('❌ Error creating table:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createSnapshotTrackingTable();
