import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetAllocationSnapshot } from './entities/asset-allocation-snapshot.entity';
import { SnapshotRepository } from './repositories/snapshot.repository';
import { SnapshotService } from './services/snapshot.service';
import { SnapshotController } from './controllers/snapshot.controller';
import { AssetModule } from '../asset/asset.module';
import { LoggingModule } from '../logging/logging.module';
import { Trade } from '../trading/entities/trade.entity';
import { TradeDetail } from '../trading/entities/trade-detail.entity';
import { AssetGlobalSyncService } from '../asset/services/asset-global-sync.service';
import { MarketDataService } from '../asset/services/market-data.service';
import { AssetValueCalculatorService } from '../asset/services/asset-value-calculator.service';
import { PortfolioSnapshotModule } from './portfolio-snapshot.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AssetAllocationSnapshot, Trade, TradeDetail]),
    AssetModule,
    LoggingModule,
    forwardRef(() => PortfolioSnapshotModule),
  ],
  providers: [
    SnapshotRepository,
    SnapshotService,
    AssetGlobalSyncService,
    MarketDataService,
    AssetValueCalculatorService,
  ],
  controllers: [SnapshotController],
  exports: [
    SnapshotService,
    SnapshotRepository,
  ],
})
export class SnapshotModule {}
