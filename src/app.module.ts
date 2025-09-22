import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
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
        __dirname + '/modules/**/*.entity{.ts,.js}',
        __dirname + '/modules/shared/entities/*.entity{.ts,.js}',
      ],
      migrations: [__dirname + '/migrations/*{.ts,.js}'],
      synchronize: false, // Disable synchronize, use migrations only
      logging: process.env.NODE_ENV === 'development',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    }),

    // Cache module - conditionally enabled
    ...(process.env.CACHE_ENABLED === 'true' ? [CacheModule.register({
      isGlobal: true,
      ttl: parseInt(process.env.CACHE_TTL) || 300000, // 5 minutes
      max: parseInt(process.env.CACHE_MAX_ITEMS) || 1000,
    })] : []),

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
  ],
  controllers: [AppController, TestLoggingController],
  providers: [AppService],
})
export class AppModule {}
