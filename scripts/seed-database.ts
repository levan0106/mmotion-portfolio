import { AppDataSource } from '../src/config/database.config';
import { PortfolioSeeder } from '../src/seeders/portfolio.seeder';

/**
 * Database seeding script.
 * Run with: npx ts-node scripts/seed-database.ts
 */
async function seedDatabase() {
  try {
    console.log('🔌 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const seeder = new PortfolioSeeder(AppDataSource);
    await seeder.seed();

    console.log('🎉 Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('🔌 Database connection closed');
    }
  }
}

seedDatabase();
