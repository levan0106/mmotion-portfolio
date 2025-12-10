import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { join } from 'path';
import { PortfolioModule } from './modules/portfolio/portfolio.module';
import { TradingModule } from './modules/trading/trading.module';
import { AssetModule } from './modules/asset/asset.module';
import { SharedModule } from './modules/shared/shared.module';
import { LoggingModule } from './modules/logging/logging.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { MarketDataModule } from './modules/market-data/market-data.module';
import { SnapshotModule } from './modules/portfolio/snapshot.module';
import { PortfolioSnapshotModule } from './modules/portfolio/portfolio-snapshot.module';
import { DepositModule } from './modules/portfolio/deposit.module';
import { ReportModule } from './modules/report/report.module';
import { GoalModule } from './modules/goal/goal.module';
import { NotesModule } from './modules/notes/notes.module';
import { NotificationModule } from './notification/notification.module';
import { FinancialFreedomModule } from './modules/financial-freedom/financial-freedom.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TestLoggingController } from './test-logging.controller';

/**
 * Root application module.
 * Configures database, cache, and imports all feature modules.
 */
@Module({
  imports: [
    // Configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Database module
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'portfolio_db',
      entities: [
        // Handle both development (src/) and production (dist/) paths
        // In production: __dirname = /app/dist, entities are at /app/dist/modules/**/*.entity.js
        // In development: __dirname = /app/src, entities are at /app/src/modules/**/*.entity.ts
        // Both cases: entities are relative to __dirname
        join(__dirname, 'modules', '**', '*.entity{.ts,.js}'),
        join(__dirname, 'modules', 'shared', 'entities', '*.entity{.ts,.js}'),
        join(__dirname, 'notification', '*.entity{.ts,.js}'),
      ],
      migrations: [join(__dirname, 'migrations', '*.{.ts,.js}')],
      synchronize: false, // Disable synchronize, use migrations only
      logging: process.env.NODE_ENV === 'development',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    }),

    // Cache module - conditionally enabled
    ...(process.env.CACHE_ENABLED === 'true' ? [CacheModule.register({
      isGlobal: true,
      ttl: parseInt(process.env.CACHE_TTL) || 300000, // 5 minutes
      max: parseInt(process.env.CACHE_MAX_ITEMS) || 1000,
    })] : []),

    // Schedule module for cron jobs
    ScheduleModule.forRoot(),

    // Event emitter module for event-driven architecture
    EventEmitterModule.forRoot(),

    // Feature modules
      PortfolioModule,
      TradingModule,
      AssetModule,
      SharedModule,
      LoggingModule,
      MetricsModule,
      MarketDataModule,
      SnapshotModule,
      PortfolioSnapshotModule,
      DepositModule,
      ReportModule,
      GoalModule,
      NotesModule,
      NotificationModule,
      FinancialFreedomModule,
  ],
  controllers: [AppController, TestLoggingController],
  providers: [AppService],
})
export class AppModule {}
