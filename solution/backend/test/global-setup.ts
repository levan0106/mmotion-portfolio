// Global Setup for Docker Integration Tests

import { execSync } from 'child_process';
import { Client } from 'pg';

export default async function globalSetup() {
  console.log('🚀 Starting global setup for Docker integration tests...');

  try {
    // Check if Docker is running
    execSync('docker ps', { stdio: 'pipe' });
    console.log('✅ Docker is running');

    // Check if the application is running
    const response = await fetch('http://localhost:3000/health');
    if (response.ok) {
      console.log('✅ Application is running on port 3000');
    } else {
      throw new Error('Application is not responding on port 3000');
    }

    // Test database connection
    const client = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      user: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'portfolio_test',
    });

    await client.connect();
    console.log('✅ Database connection successful');
    await client.end();

    console.log('🎉 Global setup completed successfully');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  }
}
