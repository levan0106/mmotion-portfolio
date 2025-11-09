import { DataSource } from 'typeorm';
import { GlobalAssetsSeeder } from '../src/seeders/global-assets.seeder';
import { AppModule } from '../src/app.module';
import { NestFactory } from '@nestjs/core';

/**
 * Script to seed global assets data
 */
async function seedGlobalAssets() {
  console.log('🚀 Starting Global Assets seeding script...');

  let app;
  try {
    // Create NestJS application
    app = await NestFactory.createApplicationContext(AppModule);
    
    // Get DataSource
    const dataSource = app.get(DataSource);
    
    // Run seeder
    const seeder = new GlobalAssetsSeeder(dataSource);
    await seeder.seed();
    
    console.log('✅ Global Assets seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding global assets:', error);
    process.exit(1);
  } finally {
    if (app) {
      await app.close();
    }
  }
}

// Run the seeder
seedGlobalAssets();
