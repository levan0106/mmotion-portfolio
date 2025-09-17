import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { Portfolio } from './entities/portfolio.entity';
// PortfolioAsset entity has been removed - Portfolio is now linked to Assets through Trades only
import { NavSnapshot } from './entities/nav-snapshot.entity';
import { CashFlow } from './entities/cash-flow.entity';
import { Account } from '../shared/entities/account.entity';
import { Asset } from '../asset/entities/asset.entity';
import { Trade } from '../trading/entities/trade.entity';
import { TradeDetail } from '../trading/entities/trade-detail.entity';
import { PortfolioRepository } from './repositories/portfolio.repository';
import { PortfolioService } from './services/portfolio.service';
import { PortfolioAnalyticsService } from './services/portfolio-analytics.service';
import { PositionManagerService } from './services/position-manager.service';
import { PortfolioCalculationService } from './services/portfolio-calculation.service';
import { PortfolioController } from './controllers/portfolio.controller';
import { PortfolioAnalyticsController } from './controllers/portfolio-analytics.controller';
import { MarketDataModule } from '../market-data/market-data.module';

/**
 * Portfolio module for managing investment portfolios.
 * Provides CRUD operations, analytics, and position management.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Portfolio,
      NavSnapshot,
      CashFlow,
      Account,
      Asset,
      Trade,
      TradeDetail,
    ]),
    CacheModule.register({
      ttl: 5 * 60 * 1000, // 5 minutes
      max: 1000, // Maximum number of items in cache
    }),
    MarketDataModule,
  ],
  controllers: [
    PortfolioController,
    PortfolioAnalyticsController,
  ],
  providers: [
    PortfolioRepository,
    PortfolioService,
    PortfolioAnalyticsService,
    PositionManagerService,
    PortfolioCalculationService,
  ],
  exports: [
    PortfolioService,
    PortfolioAnalyticsService,
    PositionManagerService,
    PortfolioRepository,
  ],
})
export class PortfolioModule {}
