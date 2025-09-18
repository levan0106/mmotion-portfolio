import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { Portfolio } from './entities/portfolio.entity';
// PortfolioAsset entity has been removed - Portfolio is now linked to Assets through Trades only
import { NavSnapshot } from './entities/nav-snapshot.entity';
import { CashFlow } from './entities/cash-flow.entity';
import { Account } from '../shared/entities/account.entity';
import { Asset } from '../asset/entities/asset.entity';
import { GlobalAsset } from '../asset/entities/global-asset.entity';
import { AssetPrice } from '../asset/entities/asset-price.entity';
import { Trade } from '../trading/entities/trade.entity';
import { TradeDetail } from '../trading/entities/trade-detail.entity';
import { PortfolioRepository } from './repositories/portfolio.repository';
import { PortfolioService } from './services/portfolio.service';
import { PortfolioAnalyticsService } from './services/portfolio-analytics.service';
import { PositionManagerService } from './services/position-manager.service';
import { PortfolioCalculationService } from './services/portfolio-calculation.service';
import { PortfolioValueCalculatorService } from './services/portfolio-value-calculator.service';
import { PortfolioController } from './controllers/portfolio.controller';
import { PortfolioAnalyticsController } from './controllers/portfolio-analytics.controller';
import { MarketDataModule } from '../market-data/market-data.module';
import { AssetModule } from '../asset/asset.module';

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
      GlobalAsset,
      AssetPrice,
      Trade,
      TradeDetail,
    ]),
    CacheModule.register({
      ttl: 5 * 60 * 1000, // 5 minutes
      max: 1000, // Maximum number of items in cache
    }),
    MarketDataModule,
    AssetModule,
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
    PortfolioValueCalculatorService,
  ],
  exports: [
    PortfolioService,
    PortfolioAnalyticsService,
    PositionManagerService,
    PortfolioValueCalculatorService,
    PortfolioRepository,
  ],
})
export class PortfolioModule {}
