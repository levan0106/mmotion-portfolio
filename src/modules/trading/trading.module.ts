import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
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
    ]),
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
