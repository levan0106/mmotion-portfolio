import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Portfolio } from './entities/portfolio.entity';
// PortfolioAsset entity has been removed - Portfolio is now linked to Assets through Trades only
import { NavSnapshot } from './entities/nav-snapshot.entity';
import { CashFlow } from './entities/cash-flow.entity';
import { AssetAllocationSnapshot } from './entities/asset-allocation-snapshot.entity';
import { PortfolioSnapshot } from './entities/portfolio-snapshot.entity';
import { PortfolioPerformanceSnapshot } from './entities/portfolio-performance-snapshot.entity';
import { AssetPerformanceSnapshot } from './entities/asset-performance-snapshot.entity';
import { AssetGroupPerformanceSnapshot } from './entities/asset-group-performance-snapshot.entity';
import { BenchmarkData } from './entities/benchmark-data.entity';
import { Deposit } from './entities/deposit.entity';
import { InvestorHolding } from './entities/investor-holding.entity';
import { FundUnitTransaction } from './entities/fund-unit-transaction.entity';
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
import { InvestorHoldingService } from './services/investor-holding.service';
import { NavUtilsService } from './services/nav-utils.service';
import { SnapshotService } from './services/snapshot.service';
import { PortfolioSnapshotService } from './services/portfolio-snapshot.service';
import { PerformanceSnapshotService } from './services/performance-snapshot.service';
import { AutomatedSnapshotService } from './services/automated-snapshot.service';
import { SnapshotTrackingService } from './services/snapshot-tracking.service';
import { TWRCalculationService } from './services/twr-calculation.service';
import { MWRIRRCalculationService } from './services/mwr-irr-calculation.service';
import { AlphaBetaCalculationService } from './services/alpha-beta-calculation.service';
import { RiskMetricsCalculationService } from './services/risk-metrics-calculation.service';
import { PortfolioController } from './controllers/portfolio.controller';
import { PortfolioAnalyticsController } from './controllers/portfolio-analytics.controller';
import { CashFlowController } from './controllers/cash-flow.controller';
import { InvestorHoldingController } from './controllers/investor-holding.controller';
import { PerformanceSnapshotController } from './controllers/performance-snapshot.controller';
import { AutomatedSnapshotController } from './controllers/automated-snapshot.controller';
import { SnapshotTrackingController } from './controllers/snapshot-tracking.controller';
import { SnapshotTracking } from './entities/snapshot-tracking.entity';
import { TradeRepository } from '../trading/repositories/trade.repository';
import { SnapshotRepository } from './repositories/snapshot.repository';
import { PortfolioSnapshotRepository } from './repositories/portfolio-snapshot.repository';
import { DepositRepository } from './repositories/deposit.repository';
import { MarketDataModule } from '../market-data/market-data.module';
import { AssetModule } from '../asset/asset.module';
import { DepositModule } from './deposit.module';
import { PortfolioSnapshotModule } from './portfolio-snapshot.module';
import { SharedModule } from '../shared/shared.module';

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
      PortfolioPerformanceSnapshot,
      AssetPerformanceSnapshot,
      AssetGroupPerformanceSnapshot,
      BenchmarkData,
      Deposit,
      InvestorHolding,
      FundUnitTransaction,
      Account,
      Asset,
      GlobalAsset,
      AssetPrice,
      Trade,
      TradeDetail,
      SnapshotTracking,
    ]),
    // Import CacheModule conditionally
    ...(process.env.CACHE_ENABLED === 'true' ? [CacheModule.register({
      ttl: parseInt(process.env.CACHE_TTL) || 300000,
      max: parseInt(process.env.CACHE_MAX_ITEMS) || 1000,
    })] : []),
    MarketDataModule,
    AssetModule,
    DepositModule,
    PortfolioSnapshotModule,
    SharedModule,
  ],
  controllers: [
    PortfolioController,
    PortfolioAnalyticsController,
    CashFlowController,
    InvestorHoldingController,
    PerformanceSnapshotController,
    AutomatedSnapshotController,
    SnapshotTrackingController,
  ],
  providers: [
    PortfolioRepository,
    PortfolioService,
    PortfolioAnalyticsService,
    PositionManagerService,
    PortfolioCalculationService,
    PortfolioValueCalculatorService,
    CashFlowService,
    InvestorHoldingService,
    NavUtilsService,
    SnapshotService,
    PortfolioSnapshotService,
    PerformanceSnapshotService,
    AutomatedSnapshotService,
    SnapshotTrackingService,
    TWRCalculationService,
    MWRIRRCalculationService,
    AlphaBetaCalculationService,
    RiskMetricsCalculationService,
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
    PortfolioCalculationService,
    PortfolioValueCalculatorService,
    CashFlowService,
    InvestorHoldingService,
    PerformanceSnapshotService,
    AutomatedSnapshotService,
    SnapshotTrackingService,
    TWRCalculationService,
    MWRIRRCalculationService,
    AlphaBetaCalculationService,
    RiskMetricsCalculationService,
    PortfolioRepository,
  ],
})
export class PortfolioModule {}
