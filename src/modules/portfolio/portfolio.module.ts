import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Portfolio } from './entities/portfolio.entity';
// PortfolioAsset entity has been removed - Portfolio is now linked to Assets through Trades only
import { NavSnapshot } from './entities/nav-snapshot.entity';
import { CashFlow } from './entities/cash-flow.entity';
import { AssetAllocationSnapshot } from './entities/asset-allocation-snapshot.entity';
import { PortfolioSnapshot } from './entities/portfolio-snapshot.entity';
import { Deposit } from './entities/deposit.entity';
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
import { CashFlowService } from './services/cash-flow.service';
import { SnapshotService } from './services/snapshot.service';
import { PortfolioSnapshotService } from './services/portfolio-snapshot.service';
import { PortfolioController } from './controllers/portfolio.controller';
import { PortfolioAnalyticsController } from './controllers/portfolio-analytics.controller';
import { CashFlowController } from './controllers/cash-flow.controller';
import { SnapshotController } from './controllers/snapshot.controller';
import { TradeRepository } from '../trading/repositories/trade.repository';
import { SnapshotRepository } from './repositories/snapshot.repository';
import { PortfolioSnapshotRepository } from './repositories/portfolio-snapshot.repository';
import { DepositRepository } from './repositories/deposit.repository';
import { MarketDataModule } from '../market-data/market-data.module';
import { AssetModule } from '../asset/asset.module';
import { DepositModule } from './deposit.module';

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
      AssetAllocationSnapshot,
      PortfolioSnapshot,
      Deposit,
      Account,
      Asset,
      GlobalAsset,
      AssetPrice,
      Trade,
      TradeDetail,
    ]),
    // Import CacheModule conditionally
    ...(process.env.CACHE_ENABLED === 'true' ? [CacheModule.register({
      ttl: parseInt(process.env.CACHE_TTL) || 300000,
      max: parseInt(process.env.CACHE_MAX_ITEMS) || 1000,
    })] : []),
    MarketDataModule,
    AssetModule,
    DepositModule,
  ],
  controllers: [
    PortfolioController,
    PortfolioAnalyticsController,
    CashFlowController,
    SnapshotController,
  ],
  providers: [
    PortfolioRepository,
    PortfolioService,
    PortfolioAnalyticsService,
    PositionManagerService,
    PortfolioCalculationService,
    PortfolioValueCalculatorService,
    CashFlowService,
    SnapshotService,
    PortfolioSnapshotService,
    SnapshotRepository,
    PortfolioSnapshotRepository,
    DepositRepository,
    TradeRepository,
    // Mock cache manager when cache is disabled
    ...(process.env.CACHE_ENABLED !== 'true' ? [{
      provide: CACHE_MANAGER,
      useValue: {
        get: () => null,
        set: () => Promise.resolve(),
        del: () => Promise.resolve(),
        reset: () => Promise.resolve(),
      },
    }] : []),
  ],
  exports: [
    PortfolioService,
    PortfolioAnalyticsService,
    PositionManagerService,
    PortfolioValueCalculatorService,
    CashFlowService,
    PortfolioRepository,
  ],
})
export class PortfolioModule {}
