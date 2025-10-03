import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportController } from './controllers/report.controller';
import { ReportService } from './services/report.service';
import { Portfolio } from '../portfolio/entities/portfolio.entity';
import { Deposit } from '../portfolio/entities/deposit.entity';
import { Asset } from '../asset/entities/asset.entity';
import { Trade } from '../trading/entities/trade.entity';
import { CashFlow } from '../portfolio/entities/cash-flow.entity';
import { AssetModule } from '../asset/asset.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Portfolio,
      Deposit,
      Asset,
      Trade,
      CashFlow,
    ]),
    AssetModule,
  ],
  controllers: [ReportController],
  providers: [ReportService],
  exports: [ReportService],
})
export class ReportModule {}
