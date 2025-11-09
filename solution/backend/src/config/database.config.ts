import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

config();

// Determine base path for entities and migrations
// In production: __dirname = /app/dist/config, basePath should be /app/dist
// In development: __dirname = /app/src/config, basePath should be /app/src
const basePath = join(__dirname, '..');

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || process.env.DB_DATABASE || 'portfolio_db',
  entities: [join(basePath, '**', '*.entity{.ts,.js}')],
  migrations: [
    // Primary path: dist/migrations/*.js in production, src/migrations/*.ts in development
    join(basePath, 'migrations', '*.{.ts,.js}'),
  ],
  synchronize: false, // Disable synchronize, use migrations only
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  extra: {
    max: 10, // connection pool size
    connectionTimeoutMillis: 30000, // 30 seconds
    idleTimeoutMillis: 30000,
  },
});

// Export default for TypeORM CLI and application code
// TypeORM CLI expects default export
// Application code can import as: import AppDataSource from './config/database.config'
export default AppDataSource;
