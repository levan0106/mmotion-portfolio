import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PortfolioSnapshot } from './entities/portfolio-snapshot.entity';
import { AssetAllocationSnapshot } from './entities/asset-allocation-snapshot.entity';
import { PortfolioPerformanceSnapshot } from './entities/portfolio-performance-snapshot.entity';
import { AssetPerformanceSnapshot } from './entities/asset-performance-snapshot.entity';
import { AssetGroupPerformanceSnapshot } from './entities/asset-group-performance-snapshot.entity';
import { BenchmarkData } from './entities/benchmark-data.entity';
import { Portfolio } from './entities/portfolio.entity';
import { Deposit } from './entities/deposit.entity';
import { CashFlow } from './entities/cash-flow.entity';
import { Trade } from '../trading/entities/trade.entity';
import { PortfolioSnapshotRepository } from './repositories/portfolio-snapshot.repository';
import { DepositRepository } from './repositories/deposit.repository';
import { PortfolioSnapshotService } from './services/portfolio-snapshot.service';
import { PerformanceSnapshotService } from './services/performance-snapshot.service';
import { TWRCalculationService } from './services/twr-calculation.service';
import { MWRIRRCalculationService } from './services/mwr-irr-calculation.service';
import { AlphaBetaCalculationService } from './services/alpha-beta-calculation.service';
import { RiskMetricsCalculationService } from './services/risk-metrics-calculation.service';
import { CashFlowService } from './services/cash-flow.service';
import { BenchmarkMockService } from './services/benchmark-mock.service';
import { PortfolioSnapshotController } from './controllers/portfolio-snapshot.controller';
import { BenchmarkMockController } from './controllers/benchmark-mock.controller';
import { SnapshotController } from './controllers/snapshot.controller';
import { SnapshotModule } from './snapshot.module';
import { SharedModule } from '../shared/shared.module';
import { AssetModule } from '../asset/asset.module';
import { PortfolioModule } from './portfolio.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PortfolioSnapshot,
      AssetAllocationSnapshot,
      PortfolioPerformanceSnapshot,
      AssetPerformanceSnapshot,
      AssetGroupPerformanceSnapshot,
      BenchmarkData,
      Portfolio,
      Deposit,
      CashFlow,
      Trade,
    ]),
    forwardRef(() => SnapshotModule),
    forwardRef(() => PortfolioModule),
    SharedModule,
    AssetModule,
  ],
  providers: [
    PortfolioSnapshotRepository,
    DepositRepository,
    PortfolioSnapshotService,
    PerformanceSnapshotService,
    TWRCalculationService,
    MWRIRRCalculationService,
    AlphaBetaCalculationService,
    RiskMetricsCalculationService,
    CashFlowService,
    BenchmarkMockService,
  ],
  controllers: [PortfolioSnapshotController, SnapshotController, BenchmarkMockController],
  exports: [
    PortfolioSnapshotService,
    PortfolioSnapshotRepository,
    PerformanceSnapshotService,
  ],
})
export class PortfolioSnapshotModule {}
