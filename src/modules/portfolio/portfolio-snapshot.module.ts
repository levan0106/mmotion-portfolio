import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PortfolioSnapshot } from './entities/portfolio-snapshot.entity';
import { AssetAllocationSnapshot } from './entities/asset-allocation-snapshot.entity';
import { Portfolio } from './entities/portfolio.entity';
import { Deposit } from './entities/deposit.entity';
import { PortfolioSnapshotRepository } from './repositories/portfolio-snapshot.repository';
import { DepositRepository } from './repositories/deposit.repository';
import { PortfolioSnapshotService } from './services/portfolio-snapshot.service';
import { PortfolioSnapshotController } from './controllers/portfolio-snapshot.controller';
import { SnapshotModule } from './snapshot.module';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PortfolioSnapshot,
      AssetAllocationSnapshot,
      Portfolio,
      Deposit,
    ]),
    forwardRef(() => SnapshotModule),
    SharedModule,
  ],
  providers: [
    PortfolioSnapshotRepository,
    DepositRepository,
    PortfolioSnapshotService,
  ],
  controllers: [PortfolioSnapshotController],
  exports: [
    PortfolioSnapshotService,
    PortfolioSnapshotRepository,
  ],
})
export class PortfolioSnapshotModule {}
