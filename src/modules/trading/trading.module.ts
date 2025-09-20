import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule, CACHE_MANAGER } from '@nestjs/cache-manager';
import { TradingController } from './controllers/trading.controller';
import { PositionController } from './controllers/position.controller';
import { RiskManagementController } from './controllers/risk-management.controller';
import { TradingService } from './services/trading.service';
import { PositionService } from './services/position.service';
import { RiskManagementService } from './services/risk-management.service';
import { TradeRepository } from './repositories/trade.repository';
import { TradeDetailRepository } from './repositories/trade-detail.repository';
import { FIFOEngine } from './engines/fifo-engine';
import { LIFOEngine } from './engines/lifo-engine';
import { PositionManager } from './managers/position-manager';
import { RiskManager } from './managers/risk-manager';
import { Trade } from './entities/trade.entity';
import { TradeDetail } from './entities/trade-detail.entity';
import { AssetTarget } from './entities/asset-target.entity';
// PortfolioAsset entity has been removed - Portfolio is now linked to Assets through Trades only
import { Portfolio } from '../portfolio/entities/portfolio.entity';
import { CashFlow } from '../portfolio/entities/cash-flow.entity';
import { Asset } from '../asset/entities/asset.entity';
import { Account } from '../shared/entities/account.entity';
import { AssetCacheService } from '../asset/services/asset-cache.service';
import { CashFlowService } from '../portfolio/services/cash-flow.service';
import { PortfolioCalculationService } from '../portfolio/services/portfolio-calculation.service';
import { PortfolioValueCalculatorService } from '../portfolio/services/portfolio-value-calculator.service';
import { GlobalAsset } from '../asset/entities/global-asset.entity';
import { AssetPrice } from '../asset/entities/asset-price.entity';
import { AssetValueCalculatorService } from '../asset/services/asset-value-calculator.service';
import { MarketDataModule } from '../market-data/market-data.module';

/**
 * Trading module for managing trades, positions, and risk management.
 * Provides comprehensive trading functionality including FIFO/LIFO matching,
 * position tracking, and risk target management.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Trade,
      TradeDetail,
      AssetTarget,
      Portfolio,
      CashFlow,
      Asset,
      Account,
      GlobalAsset,
      AssetPrice,
    ]),
    MarketDataModule,
    // Import CacheModule conditionally
    ...(process.env.CACHE_ENABLED === 'true' ? [CacheModule.register({
      ttl: parseInt(process.env.CACHE_TTL) || 300000,
      max: parseInt(process.env.CACHE_MAX_ITEMS) || 1000,
    })] : []),
  ],
  controllers: [
    TradingController,
    PositionController,
    RiskManagementController,
  ],
  providers: [
    TradingService,
    PositionService,
    RiskManagementService,
    TradeRepository,
    TradeDetailRepository,
    FIFOEngine,
    LIFOEngine,
    PositionManager,
    RiskManager,
    AssetCacheService,
    CashFlowService,
    PortfolioCalculationService,
    PortfolioValueCalculatorService,
    AssetValueCalculatorService,
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
    TradingService,
    PositionService,
    RiskManagementService,
    TradeRepository,
    TradeDetailRepository,
    FIFOEngine,
    LIFOEngine,
    PositionManager,
    RiskManager,
    CashFlowService,
  ],
})
export class TradingModule {}
